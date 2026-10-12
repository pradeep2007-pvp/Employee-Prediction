import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, ShieldCheck, Info, Save, RotateCcw } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Toggle } from '@/components/ui/Toggle';
import { ChartCard } from '@/components/ui/StatCard';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { useAuth } from '@/context/AuthContext';
import { useEmployees, usePredictions } from '@/hooks/useData';
import { getOrTrainModels, runPrediction, type PredictionResult, type TrainedModels } from '@/lib/ml/service';
import { DEPARTMENTS, JOB_ROLES, EDUCATION_LEVELS, GENDERS, SATISFACTION_LABELS, formatCurrency, formatPercent, PREDICTION_THRESHOLD } from '@/lib/constants';
import type { PredictionInput } from '@/lib/supabase';
import toast from 'react-hot-toast';

const initialForm: PredictionInput & { name: string } = {
  name: '',
  age: 30,
  gender: 'Male',
  education_level: 'Bachelor',
  department: 'Engineering',
  job_role: 'Software Developer',
  years_at_company: 5,
  years_of_experience: 5,
  num_companies_worked: 1,
  overtime: false,
  job_satisfaction: 3,
  work_life_balance: 3,
  performance_rating: 3,
  monthly_income: 50000,
  previous_salary: 45000,
};

export function Prediction() {
  const { user } = useAuth();
  const { addEmployee, employees } = useEmployees();
  const { addPrediction } = usePredictions();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<TrainedModels | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [modelLoading, setModelLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getOrTrainModels(user.id)
        .then(setModels)
        .finally(() => setModelLoading(false));
    }
  }, [user]);

  const update = (key: keyof typeof form, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Employee name is required';
    if (form.age < 18 || form.age > 70) e.age = 'Age must be between 18 and 70';
    if (form.years_at_company < 0) e.years_at_company = 'Cannot be negative';
    if (form.years_of_experience < 0) e.years_of_experience = 'Cannot be negative';
    if (form.monthly_income <= 0) e.monthly_income = 'Must be greater than 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePredict = async () => {
    if (!validate() || !models || !user) {
      if (!models) toast.error('Model is still loading, please wait...');
      return;
    }

    setLoading(true);
    try {
      // Simulate processing time for UX
      await new Promise((r) => setTimeout(r, 800));
      const input: PredictionInput = {
        age: form.age,
        gender: form.gender,
        education_level: form.education_level,
        department: form.department,
        job_role: form.job_role,
        years_at_company: form.years_at_company,
        years_of_experience: form.years_of_experience,
        num_companies_worked: form.num_companies_worked,
        overtime: form.overtime,
        job_satisfaction: form.job_satisfaction,
        work_life_balance: form.work_life_balance,
        performance_rating: form.performance_rating,
        monthly_income: form.monthly_income,
        previous_salary: form.previous_salary,
      };

      const prediction = runPrediction(models, input);
      setResult(prediction);
      toast.success('Prediction completed successfully!');
    } catch (err) {
      toast.error('Prediction failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;

    try {
      const empId = `EMP${String(employees.length + 1).padStart(3, '0')}`;

      await addEmployee({
        employee_id: empId,
        name: form.name,
        age: form.age,
        gender: form.gender,
        education_level: form.education_level,
        department: form.department,
        job_role: form.job_role,
        years_at_company: form.years_at_company,
        years_of_experience: form.years_of_experience,
        num_companies_worked: form.num_companies_worked,
        overtime: form.overtime,
        job_satisfaction: form.job_satisfaction,
        work_life_balance: form.work_life_balance,
        performance_rating: form.performance_rating,
        monthly_income: form.monthly_income,
        previous_salary: form.previous_salary,
        attrition_probability: result.attritionProbability,
        prediction: result.prediction,
        predicted_salary: result.predictedSalary,
      });

      await addPrediction({
        employee_id: empId,
        employee_name: form.name,
        department: form.department,
        attrition_probability: result.attritionProbability,
        prediction: result.prediction,
        predicted_salary: result.predictedSalary,
        threshold: result.threshold,
        model_type: result.modelType,
        risk_level: result.riskLevel,
      });

      toast.success('Employee record and prediction saved!');
      setResult(null);
      setForm(initialForm);
    } catch (err) {
      toast.error('Failed to save record. Please try again.');
      console.error(err);
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setResult(null);
    setErrors({});
  };

  const riskConfig = result ? {
    Low: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: ShieldCheck, label: 'LOW RISK' },
    Medium: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, label: 'MEDIUM RISK' },
    High: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, label: 'HIGH RISK' },
  }[result.riskLevel] : null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Employee Prediction</h1>
        <p className="text-sm text-slate-500 mt-1">
          Analyze employee information to estimate attrition risk and expected salary.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal Information */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-navy-50 text-navy-700 text-xs font-bold">1</span>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Employee Name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                error={errors.name}
                placeholder="John Doe"
              />
              <Input
                label="Age"
                type="number"
                value={form.age}
                onChange={(e) => update('age', Number(e.target.value))}
                error={errors.age}
                min={18}
                max={70}
              />
              <Select
                label="Gender"
                value={form.gender}
                onChange={(e) => update('gender', e.target.value)}
                options={GENDERS.map((g) => ({ value: g, label: g }))}
              />
              <Select
                label="Education Level"
                value={form.education_level}
                onChange={(e) => update('education_level', e.target.value)}
                options={EDUCATION_LEVELS.map((e) => ({ value: e, label: e }))}
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-navy-50 text-navy-700 text-xs font-bold">2</span>
              Employment Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Department"
                value={form.department}
                onChange={(e) => {
                  const dept = e.target.value;
                  const roles = JOB_ROLES[dept] || [];
                  setForm((prev) => ({ ...prev, department: dept, job_role: roles[0] || '' }));
                }}
                options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
              />
              <Select
                label="Job Role"
                value={form.job_role}
                onChange={(e) => update('job_role', e.target.value)}
                options={(JOB_ROLES[form.department] || []).map((r) => ({ value: r, label: r }))}
              />
              <Input
                label="Years at Company"
                type="number"
                value={form.years_at_company}
                onChange={(e) => update('years_at_company', Number(e.target.value))}
                error={errors.years_at_company}
                min={0}
              />
              <Input
                label="Years of Experience"
                type="number"
                value={form.years_of_experience}
                onChange={(e) => update('years_of_experience', Number(e.target.value))}
                error={errors.years_of_experience}
                min={0}
              />
              <Input
                label="Companies Worked"
                type="number"
                value={form.num_companies_worked}
                onChange={(e) => update('num_companies_worked', Number(e.target.value))}
                min={0}
              />
            </div>
          </div>

          {/* Work Information */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-navy-50 text-navy-700 text-xs font-bold">3</span>
              Work Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-navy-700">Overtime</label>
                <div className="flex items-center h-[42px]">
                  <Toggle
                    checked={form.overtime}
                    onChange={(v) => update('overtime', v)}
                    label={form.overtime ? 'Works overtime' : 'No overtime'}
                  />
                </div>
              </div>
              <Select
                label="Job Satisfaction"
                value={String(form.job_satisfaction)}
                onChange={(e) => update('job_satisfaction', Number(e.target.value))}
                options={[1, 2, 3, 4].map((v) => ({ value: String(v), label: SATISFACTION_LABELS[v] }))}
              />
              <Select
                label="Work-Life Balance"
                value={String(form.work_life_balance)}
                onChange={(e) => update('work_life_balance', Number(e.target.value))}
                options={[1, 2, 3, 4].map((v) => ({ value: String(v), label: SATISFACTION_LABELS[v] }))}
              />
              <Select
                label="Performance Rating"
                value={String(form.performance_rating)}
                onChange={(e) => update('performance_rating', Number(e.target.value))}
                options={[1, 2, 3, 4].map((v) => ({ value: String(v), label: SATISFACTION_LABELS[v] }))}
              />
              <Input
                label="Monthly Income (₹)"
                type="number"
                value={form.monthly_income}
                onChange={(e) => update('monthly_income', Number(e.target.value))}
                error={errors.monthly_income}
                min={0}
              />
              <Input
                label="Previous Salary (₹)"
                type="number"
                value={form.previous_salary}
                onChange={(e) => update('previous_salary', Number(e.target.value))}
                min={0}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handlePredict} loading={loading || modelLoading} size="lg" className="flex-1">
              <Brain size={18} />
              Predict Employee
            </Button>
            <Button variant="outline" size="lg" onClick={handleReset}>
              <RotateCcw size={18} />
              Reset
            </Button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-5">
          {loading && !result ? (
            <div className="card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full" />
                <p className="text-sm text-navy-700">Running model prediction...</p>
              </div>
              <div className="space-y-3">
                <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            </div>
          ) : result && riskConfig ? (
            <div className="space-y-4 animate-slide-up">
              {/* Attrition Result */}
              <div className={`card p-6 border-2 ${riskConfig.border} ${riskConfig.bg}`}>
                <div className="flex items-center gap-2 mb-4">
                  <riskConfig.icon size={20} className={riskConfig.color} />
                  <h3 className="text-sm font-semibold text-navy-900">Attrition Risk</h3>
                </div>

                <div className="text-center py-2">
                  <p className={`text-5xl font-bold ${riskConfig.color}`}>
                    {formatPercent(result.attritionProbability)}
                  </p>
                  <p className={`text-sm font-semibold mt-2 ${riskConfig.color}`}>{riskConfig.label}</p>
                </div>

                {/* Risk progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>0%</span>
                    <span>Threshold: {formatPercent(PREDICTION_THRESHOLD)}</span>
                    <span>100%</span>
                  </div>
                  <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        result.riskLevel === 'Low' ? 'bg-green-500' :
                        result.riskLevel === 'Medium' ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.attritionProbability * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Prediction</span>
                    <span className={`font-semibold ${result.prediction === 'Leave' ? 'text-red-600' : 'text-green-600'}`}>
                      {result.prediction}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Risk Level</span>
                    <RiskBadge level={result.riskLevel} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Threshold</span>
                    <span className="font-medium text-navy-700">{formatPercent(result.threshold)}</span>
                  </div>
                </div>
              </div>

              {/* Salary Result */}
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-brand-600" />
                  <h3 className="text-sm font-semibold text-navy-900">Salary Prediction</h3>
                </div>
                <div className="text-center py-2">
                  <p className="text-4xl font-bold text-navy-900">
                    {formatCurrency(result.predictedSalary)}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">Estimated Monthly Salary</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200/60">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Model</span>
                    <span className="font-medium text-navy-700 text-xs text-right">Multiple Linear Regression</span>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="card p-5 bg-brand-50/50 border-brand-100">
                <div className="flex gap-3">
                  <Info size={18} className="text-brand-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Estimated probability based on the trained model.</strong> These
                    predictions are generated using Logistic Regression (attrition) and
                    Multiple Linear Regression (salary) trained on employee data. They are
                    estimates, not guarantees.
                  </p>
                </div>
              </div>

              {/* Save button */}
              <Button onClick={handleSave} variant="secondary" size="lg" className="w-full">
                <Save size={18} />
                Save Employee & Prediction
              </Button>
            </div>
          ) : (
            <div className="card p-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-navy-50 text-navy-400 mb-4">
                  <Brain size={28} />
                </div>
                <h3 className="text-sm font-semibold text-navy-800">Ready to Predict</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Fill in the employee details and click "Predict Employee" to see
                  attrition risk and salary estimation.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Logistic Regression for attrition
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-brand-400" />
                  Linear Regression for salary
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  Results are estimates, not guarantees
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
