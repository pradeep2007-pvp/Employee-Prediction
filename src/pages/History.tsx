import { useState, useMemo } from 'react';
import { History, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Select } from '@/components/ui/Select';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { usePredictions } from '@/hooks/useData';
import { DEPARTMENTS, formatCurrency, formatPercent, formatDate, getRiskLevel } from '@/lib/constants';
import type { Prediction } from '@/lib/api';
import toast from 'react-hot-toast';

export function HistoryPage() {
  const { predictions, loading, deletePrediction } = usePredictions();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [predFilter, setPredFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [page, setPage] = useState(0);
  const [deleteItem, setDeleteItem] = useState<Prediction | null>(null);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let result = [...predictions];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.employee_name.toLowerCase().includes(q) || p.employee_id.toLowerCase().includes(q));
    }
    if (deptFilter) result = result.filter((p) => p.department === deptFilter);
    if (predFilter) result = result.filter((p) => p.prediction === predFilter);
    if (riskFilter) result = result.filter((p) => p.risk_level === riskFilter);
    return result;
  }, [predictions, search, deptFilter, predFilter, riskFilter]);

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deletePrediction(deleteItem.id);
      toast.success('Prediction record deleted.');
      setDeleteItem(null);
    } catch {
      toast.error('Failed to delete record.');
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Prediction History</h1>
        <p className="text-sm text-slate-500 mt-1">View all previous predictions recorded in the system.</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search employee..."
              className="input-base pl-10"
            />
          </div>
          <Select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(0); }}
            options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            placeholder="All Departments"
          />
          <Select
            value={predFilter}
            onChange={(e) => { setPredFilter(e.target.value); setPage(0); }}
            options={[{ value: 'Leave', label: 'Leave' }, { value: 'Stay', label: 'Stay' }]}
            placeholder="All Predictions"
          />
          <Select
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setPage(0); }}
            options={[{ value: 'Low', label: 'Low Risk' }, { value: 'Medium', label: 'Medium Risk' }, { value: 'High', label: 'High Risk' }]}
            placeholder="All Risk Levels"
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={History}
            title="No prediction history"
            description="Run predictions from the Prediction page to build your history."
          />
        ) : (
          <>
            <div className="overflow-x-auto hidden lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {['Employee', 'Date', 'Attrition Prob.', 'Prediction', 'Predicted Salary', 'Model', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-navy-900">{p.employee_name}</p>
                        <p className="text-xs text-slate-400">{p.employee_id} · {p.department}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-navy-700">{formatPercent(p.attrition_probability)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${p.prediction === 'Leave' ? 'text-red-600' : 'text-green-600'}`}>
                          {p.prediction}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-navy-700">{formatCurrency(p.predicted_salary)}</td>
                      <td className="px-4 py-3">
                        <RiskBadge level={p.risk_level as 'Low' | 'Medium' | 'High'} />
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setDeleteItem(p)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-slate-100">
              {paginated.map((p) => (
                <div key={p.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{p.employee_name}</p>
                      <p className="text-xs text-slate-400">{p.employee_id} · {formatDate(p.created_at)}</p>
                    </div>
                    <RiskBadge level={p.risk_level as 'Low' | 'Medium' | 'High'} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div><span className="text-slate-400">Prediction:</span> <span className={p.prediction === 'Leave' ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>{p.prediction}</span></div>
                    <div><span className="text-slate-400">Probability:</span> <span className="text-navy-700 font-medium">{formatPercent(p.attrition_probability)}</span></div>
                    <div><span className="text-slate-400">Salary:</span> <span className="text-navy-700 font-medium">{formatCurrency(p.predicted_salary)}</span></div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="danger" size="sm" onClick={() => setDeleteItem(p)}><Trash2 size={14} /> Delete</Button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="p-1.5 text-slate-400 hover:text-navy-600 disabled:opacity-30">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-xs text-slate-500">{page + 1} / {totalPages}</span>
                  <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="p-1.5 text-slate-400 hover:text-navy-600 disabled:opacity-30">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Delete Prediction" size="sm">
        {deleteItem && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this prediction record for <strong>{deleteItem.employee_name}</strong>?
            </p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
              <Button variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
