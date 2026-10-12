import { useState, useRef, useCallback } from 'react';
import {
  UploadCloud, FileSpreadsheet, Download, Brain, Trash2,
  CheckCircle2, Play, Save, Eye, EyeOff,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { useEmployees, usePredictions } from '@/hooks/useData';
import { parseCSV, generateSampleCSV, generateCSVTemplate, type DatasetRow, type ParseResult } from '@/lib/ml/csvParser';
import { getOrTrainModels, trainFromDataset, runBatchPredictions, type TrainedModels, type PredictionResult } from '@/lib/ml/service';
import { formatCurrency, formatPercent, formatDateTime } from '@/lib/constants';
import toast from 'react-hot-toast';

type BatchResult = { row: DatasetRow; result: PredictionResult };
type Tab = 'upload' | 'preview' | 'results';

export function Dataset() {
  const { user } = useAuth();
  const { addEmployee, employees } = useEmployees();
  const { addPrediction } = usePredictions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [models, setModels] = useState<TrainedModels | null>(null);
  const [training, setTraining] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file.');
      return;
    }

    try {
      const text = await file.text();
      const result = parseCSV(text);
      setParseResult(result);
      setFileName(file.name);
      setActiveTab('preview');

      if (result.errors.length > 0) {
        toast.error(`Parsed with ${result.errors.length} errors`);
      } else {
        toast.success(`Loaded ${result.rows.length} records from ${file.name}`);
      }
    } catch {
      toast.error('Failed to read file. Please check the format.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSampleData = () => {
    const csv = generateSampleCSV();
    const result = parseCSV(csv);
    setParseResult(result);
    setFileName('sample_dataset.csv');
    setActiveTab('preview');
    toast.success(`Loaded ${result.rows.length} sample records`);
  };

  const handleDownloadTemplate = () => {
    const csv = generateCSVTemplate() + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hr_dataminer_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded.');
  };

  const handleTrain = async () => {
    if (!parseResult || parseResult.rows.length === 0 || !user) return;
    setTraining(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      const mdl = await trainFromDataset(user.id, parseResult.rows);
      setModels(mdl);
      toast.success(`Models trained on ${parseResult.rows.length} records!`);
    } catch {
      toast.error('Training failed. Please try again.');
    } finally {
      setTraining(false);
    }
  };

  const handleBatchPredict = async () => {
    if (!parseResult || parseResult.rows.length === 0) return;
    if (!user) { toast.error('Please log in to run predictions.'); return; }

    setPredicting(true);
    try {
      let mdl = models;
      if (!mdl) {
        mdl = await getOrTrainModels(user.id);
        setModels(mdl);
      }

      await new Promise((r) => setTimeout(r, 500));
      const results = runBatchPredictions(mdl, parseResult.rows);
      setBatchResults(results);
      setActiveTab('results');
      toast.success(`Generated ${results.length} predictions!`);
    } catch (err) {
      console.error('Batch prediction error:', err);
      toast.error('Batch prediction failed. Please try again.');
    } finally {
      setPredicting(false);
    }
  };

  const handleSaveAll = async () => {
    if (!user || batchResults.length === 0) return;
    try {
      let empCount = employees.length;
      for (const { row, result } of batchResults) {
        empCount++;
        const empId = `EMP${String(empCount).padStart(3, '0')}`;
        await addEmployee({
          employee_id: empId,
          name: row.name,
          age: row.age,
          gender: row.gender,
          education_level: row.education_level,
          department: row.department,
          job_role: row.job_role,
          years_at_company: row.years_at_company,
          years_of_experience: row.years_of_experience,
          num_companies_worked: row.num_companies_worked,
          overtime: row.overtime,
          job_satisfaction: row.job_satisfaction,
          work_life_balance: row.work_life_balance,
          performance_rating: row.performance_rating,
          monthly_income: row.monthly_income,
          previous_salary: row.previous_salary,
          attrition_probability: result.attritionProbability,
          prediction: result.prediction,
          predicted_salary: result.predictedSalary,
        });
        await addPrediction({
          employee_id: empId,
          employee_name: row.name,
          department: row.department,
          attrition_probability: result.attritionProbability,
          prediction: result.prediction,
          predicted_salary: result.predictedSalary,
          threshold: result.threshold,
          model_type: result.modelType,
          risk_level: result.riskLevel,
        });
      }
      toast.success(`Saved ${batchResults.length} employee records with predictions!`);
      setBatchResults([]);
      setParseResult(null);
      setActiveTab('upload');
      setFileName('');
    } catch {
      toast.error('Failed to save records. Please try again.');
    }
  };

  const handleClear = () => {
    setParseResult(null);
    setBatchResults([]);
    setFileName('');
    setModels(null);
    setActiveTab('upload');
  };

  const rowCount = parseResult?.rows.length ?? 0;
  const leaveCount = batchResults.filter((r) => r.result.prediction === 'Leave').length;
  const stayCount = batchResults.filter((r) => r.result.prediction === 'Stay').length;
  const avgSalary = batchResults.length > 0
    ? batchResults.reduce((a, r) => a + r.result.predictedSalary, 0) / batchResults.length
    : 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Dataset & Batch Prediction</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload an employee dataset (CSV), train models, and run batch predictions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-slate-200">
        {[
          { key: 'upload' as Tab, label: 'Upload', icon: UploadCloud },
          { key: 'preview' as Tab, label: 'Preview Data', icon: FileSpreadsheet, disabled: rowCount === 0 },
          { key: 'results' as Tab, label: 'Predictions', icon: Brain, disabled: batchResults.length === 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => !tab.disabled && setActiveTab(tab.key)}
            disabled={tab.disabled}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-brand-600 text-brand-600'
                : tab.disabled
                ? 'border-transparent text-slate-300 cursor-not-allowed'
                : 'border-transparent text-slate-500 hover:text-navy-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`card p-10 border-2 border-dashed transition-all ${
              dragOver ? 'border-brand-500 bg-brand-50/30' : 'border-slate-300'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`flex items-center justify-center w-16 h-16 rounded-2xl mb-4 transition-colors ${
                dragOver ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400'
              }`}>
                <UploadCloud size={28} />
              </div>
              <h3 className="text-base font-semibold text-navy-900">Upload Employee Dataset</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                Drag and drop a CSV file here, or click to browse. The file should contain
                employee features like age, department, job role, income, etc.
              </p>
              <div className="flex gap-3 mt-5">
                <Button onClick={() => fileInputRef.current?.click()} variant="primary">
                  <UploadCloud size={18} />
                  Choose File
                </Button>
                <Button onClick={handleSampleData} variant="outline">
                  <FileSpreadsheet size={18} />
                  Use Sample Data
                </Button>
                <Button onClick={handleDownloadTemplate} variant="ghost">
                  <Download size={18} />
                  Download Template
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          </div>

          {/* CSV Format Guide */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-navy-900 mb-3">Supported CSV Columns</h3>
            <p className="text-xs text-slate-500 mb-3">
              All columns are optional — missing fields use sensible defaults. Headers are case-insensitive and accept common aliases (e.g. "income" for monthly_income, "dept" for department):
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 font-medium text-slate-500">Column</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500">Type</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500">Example</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500">Required?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { col: 'name', type: 'text', ex: 'John Doe' },
                    { col: 'age', type: 'number', ex: '30' },
                    { col: 'gender', type: 'text', ex: 'Male/Female/Non-binary' },
                    { col: 'education_level', type: 'text', ex: 'Bachelor/Master/...' },
                    { col: 'department', type: 'text', ex: 'Engineering/Sales/...' },
                    { col: 'job_role', type: 'text', ex: 'Software Developer' },
                    { col: 'years_at_company', type: 'number', ex: '5' },
                    { col: 'years_of_experience', type: 'number', ex: '7' },
                    { col: 'num_companies_worked', type: 'number', ex: '2' },
                    { col: 'overtime', type: 'boolean', ex: 'Yes/No' },
                    { col: 'job_satisfaction', type: 'number 1-4', ex: '3' },
                    { col: 'work_life_balance', type: 'number 1-4', ex: '3' },
                    { col: 'performance_rating', type: 'number 1-4', ex: '4' },
                    { col: 'monthly_income', type: 'number', ex: '55000' },
                    { col: 'previous_salary', type: 'number', ex: '48000' },
                    { col: 'attrition', type: 'text', ex: 'Yes/No or Leave/Stay' },
                    { col: 'actual_salary', type: 'number', ex: '56000' },
                  ].map((r) => (
                    <tr key={r.col} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-mono text-navy-700">{r.col}</td>
                      <td className="py-2 px-3 text-slate-500">{r.type}</td>
                      <td className="py-2 px-3 text-slate-500">{r.ex}</td>
                      <td className="py-2 px-3 text-slate-400 text-xs">Optional</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && parseResult && (
        <div className="space-y-5">
          {/* Summary bar */}
          <div className="card p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-brand-600" />
                <div>
                  <p className="text-sm font-medium text-navy-900">{fileName}</p>
                  <p className="text-xs text-slate-400">{rowCount} records loaded</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRawData(!showRawData)}>
                {showRawData ? <EyeOff size={16} /> : <Eye size={16} />}
                {showRawData ? 'Hide Raw' : 'Show Raw'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <Trash2 size={16} /> Clear
              </Button>
            </div>
          </div>

          {/* Data table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {['#', 'Name', 'Age', 'Gender', 'Department', 'Job Role', 'Exp', 'Overtime', 'Income', 'Satisfaction'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {parseResult.rows.slice(0, showRawData ? parseResult.rows.length : 20).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2.5 text-xs text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2.5 text-sm font-medium text-navy-900 whitespace-nowrap">{row.name}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-600">{row.age}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{row.gender}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{row.department}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{row.job_role}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-600">{row.years_of_experience}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded ${row.overtime ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                          {row.overtime ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{formatCurrency(row.monthly_income)}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-600">{row.job_satisfaction}/4</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!showRawData && parseResult.rows.length > 20 && (
              <div className="px-4 py-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">Showing 20 of {parseResult.rows.length} rows. Click "Show Raw" to see all.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleTrain} loading={training} variant="primary" size="lg">
              <Brain size={18} />
              Train Models on Dataset
            </Button>
            <Button onClick={handleBatchPredict} loading={predicting} variant="secondary" size="lg">
              <Play size={18} />
              Run Batch Predictions
            </Button>
          </div>

          {models && (
            <div className="card p-4 bg-green-50/40 border-green-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-600" />
                <p className="text-sm text-green-700">
                  Models trained on <strong>{models.trainingSamples}</strong> samples at {formatDateTime(models.trainedAt)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-5">
          {batchResults.length === 0 ? (
            <div className="card p-6">
              <EmptyState
                icon={Brain}
                title="No predictions yet"
                description="Upload a dataset and run batch predictions to see results here."
              />
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                  <p className="text-xs text-slate-400">Total Predictions</p>
                  <p className="text-2xl font-bold text-navy-900 mt-1">{batchResults.length}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-slate-400">Predicted to Leave</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{leaveCount}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-slate-400">Predicted to Stay</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stayCount}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-slate-400">Avg Predicted Salary</p>
                  <p className="text-xl font-bold text-navy-900 mt-1">{formatCurrency(avgSalary)}</p>
                </div>
              </div>

              {/* Results table */}
              <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        {['#', 'Name', 'Department', 'Attrition Prob.', 'Prediction', 'Risk', 'Predicted Salary'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {batchResults.map(({ row, result }, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-navy-900 whitespace-nowrap">{row.name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{row.department}</td>
                          <td className="px-4 py-3 text-sm font-medium text-navy-700">{formatPercent(result.attritionProbability)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-semibold ${result.prediction === 'Leave' ? 'text-red-600' : 'text-green-600'}`}>
                              {result.prediction}
                            </span>
                          </td>
                          <td className="px-4 py-3"><RiskBadge level={result.riskLevel} /></td>
                          <td className="px-4 py-3 text-sm font-medium text-navy-700 whitespace-nowrap">{formatCurrency(result.predictedSalary)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save action */}
              <div className="flex gap-3">
                <Button onClick={handleSaveAll} variant="secondary" size="lg">
                  <Save size={18} />
                  Save All to Employee Records
                </Button>
                <Button onClick={handleClear} variant="outline" size="lg">
                  <Trash2 size={18} />
                  Clear & Start Over
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
