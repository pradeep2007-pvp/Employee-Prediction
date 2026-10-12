import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Search, Eye, Pencil, Trash2, Plus, ChevronLeft, ChevronRight,
  AlertTriangle, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { RiskBadge } from '@/components/ui/RiskBadge';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEmployees } from '@/hooks/useData';
import { DEPARTMENTS, formatCurrency, formatPercent, getRiskLevel } from '@/lib/constants';
import type { Employee } from '@/lib/supabase';
import toast from 'react-hot-toast';

type SortField = 'name' | 'department' | 'years_of_experience' | 'attrition_probability' | 'predicted_salary';
type SortDir = 'asc' | 'desc';

export function Employees() {
  const { employees, loading, deleteEmployee, updateEmployee } = useEmployees();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [viewEmp, setViewEmp] = useState<Employee | null>(null);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [deleteEmp, setDeleteEmp] = useState<Employee | null>(null);
  const pageSize = 8;

  const filtered = useMemo(() => {
    let result = [...employees];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) =>
        e.name.toLowerCase().includes(q) || e.employee_id.toLowerCase().includes(q)
      );
    }
    if (deptFilter) result = result.filter((e) => e.department === deptFilter);
    if (riskFilter) {
      result = result.filter((e) => {
        if (!e.attrition_probability) return false;
        return getRiskLevel(e.attrition_probability) === riskFilter;
      });
    }

    result.sort((a, b) => {
      let aVal: string | number = a[sortField] ?? 0;
      let bVal: string | number = b[sortField] ?? 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [employees, search, deptFilter, riskFilter, sortField, sortDir]);

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleDelete = async () => {
    if (!deleteEmp) return;
    try {
      await deleteEmployee(deleteEmp.id);
      toast.success('Employee deleted successfully.');
      setDeleteEmp(null);
    } catch {
      toast.error('Failed to delete employee.');
    }
  };

  const handleEditSave = async () => {
    if (!editEmp) return;
    try {
      await updateEmployee(editEmp.id, {
        name: editEmp.name,
        department: editEmp.department,
        job_role: editEmp.job_role,
        years_of_experience: editEmp.years_of_experience,
      });
      toast.success('Employee updated successfully.');
      setEditEmp(null);
    } catch {
      toast.error('Failed to update employee.');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Employee Records</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and view all employee records.</p>
        </div>
        <Link to="/predict">
          <Button variant="secondary">
            <Plus size={18} />
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search by name or ID..."
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
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setPage(0); }}
            options={[
              { value: 'Low', label: 'Low Risk' },
              { value: 'Medium', label: 'Medium Risk' },
              { value: 'High', label: 'High Risk' },
            ]}
            placeholder="All Risk Levels"
          />
        </div>
      </div>

      {/* Table / Cards */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees found"
            description={employees.length === 0 ? "Add employees by running a prediction." : "Try adjusting your filters."}
            action={employees.length === 0 ? <Link to="/predict"><Button variant="secondary"><Plus size={16} /> New Prediction</Button></Link> : undefined}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {[
                      { label: 'Employee ID', field: null },
                      { label: 'Name', field: 'name' as SortField },
                      { label: 'Department', field: 'department' as SortField },
                      { label: 'Experience', field: 'years_of_experience' as SortField },
                      { label: 'Attrition Risk', field: 'attrition_probability' as SortField },
                      { label: 'Predicted Salary', field: 'predicted_salary' as SortField },
                      { label: 'Actions', field: null },
                    ].map((col) => (
                      <th
                        key={col.label}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-navy-700"
                        onClick={() => col.field && handleSort(col.field)}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {col.field && sortField === col.field && (
                            <span className="text-brand-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map((emp) => {
                    const risk = emp.attrition_probability ? getRiskLevel(emp.attrition_probability) : null;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-navy-700">{emp.employee_id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-navy-900">{emp.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{emp.department}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{emp.years_of_experience} yrs</td>
                        <td className="px-4 py-3">
                          {risk ? (
                            <div className="flex items-center gap-2">
                              <RiskBadge level={risk} />
                              <span className="text-xs text-slate-400">{formatPercent(emp.attrition_probability!)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">Not predicted</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-navy-700">
                          {emp.predicted_salary ? formatCurrency(emp.predicted_salary) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setViewEmp(emp)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => setEditEmp(emp)} className="p-1.5 text-slate-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-colors">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => setDeleteEmp(emp)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-slate-100">
              {paginated.map((emp) => {
                const risk = emp.attrition_probability ? getRiskLevel(emp.attrition_probability) : null;
                return (
                  <div key={emp.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-navy-900">{emp.name}</p>
                        <p className="text-xs text-slate-400">{emp.employee_id} · {emp.department}</p>
                      </div>
                      {risk && <RiskBadge level={risk} />}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                      <div>
                        <span className="text-slate-400">Experience:</span>{' '}
                        <span className="text-navy-700 font-medium">{emp.years_of_experience} yrs</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Salary:</span>{' '}
                        <span className="text-navy-700 font-medium">{emp.predicted_salary ? formatCurrency(emp.predicted_salary) : '—'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => setViewEmp(emp)}><Eye size={14} /> View</Button>
                      <Button variant="outline" size="sm" onClick={() => setEditEmp(emp)}><Pencil size={14} /> Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteEmp(emp)}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="p-1.5 text-slate-400 hover:text-navy-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-xs text-slate-500">{page + 1} / {totalPages}</span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-1.5 text-slate-400 hover:text-navy-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Modal */}
      <Modal open={!!viewEmp} onClose={() => setViewEmp(null)} title="Employee Details" size="md">
        {viewEmp && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Employee ID', value: viewEmp.employee_id },
                { label: 'Name', value: viewEmp.name },
                { label: 'Age', value: viewEmp.age },
                { label: 'Gender', value: viewEmp.gender },
                { label: 'Education', value: viewEmp.education_level },
                { label: 'Department', value: viewEmp.department },
                { label: 'Job Role', value: viewEmp.job_role },
                { label: 'Years at Company', value: viewEmp.years_at_company },
                { label: 'Total Experience', value: viewEmp.years_of_experience },
                { label: 'Companies Worked', value: viewEmp.num_companies_worked },
                { label: 'Overtime', value: viewEmp.overtime ? 'Yes' : 'No' },
                { label: 'Job Satisfaction', value: `${viewEmp.job_satisfaction}/4` },
                { label: 'Work-Life Balance', value: `${viewEmp.work_life_balance}/4` },
                { label: 'Performance Rating', value: `${viewEmp.performance_rating}/4` },
                { label: 'Monthly Income', value: formatCurrency(viewEmp.monthly_income) },
                { label: 'Previous Salary', value: formatCurrency(viewEmp.previous_salary) },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="text-sm font-medium text-navy-800">{item.value}</p>
                </div>
              ))}
            </div>
            {viewEmp.attrition_probability !== null && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2">Prediction Results</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Attrition</p>
                    <p className={`text-sm font-semibold ${viewEmp.prediction === 'Leave' ? 'text-red-600' : 'text-green-600'}`}>
                      {viewEmp.prediction}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Probability</p>
                    <p className="text-sm font-semibold text-navy-800">{formatPercent(viewEmp.attrition_probability!)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Predicted Salary</p>
                    <p className="text-sm font-semibold text-navy-800">{viewEmp.predicted_salary ? formatCurrency(viewEmp.predicted_salary) : '—'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editEmp} onClose={() => setEditEmp(null)} title="Edit Employee" size="md">
        {editEmp && (
          <div className="space-y-4">
            <Input
              label="Name"
              value={editEmp.name}
              onChange={(e) => setEditEmp({ ...editEmp, name: e.target.value })}
            />
            <Select
              label="Department"
              value={editEmp.department}
              onChange={(e) => setEditEmp({ ...editEmp, department: e.target.value })}
              options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            />
            <Input
              label="Job Role"
              value={editEmp.job_role}
              onChange={(e) => setEditEmp({ ...editEmp, job_role: e.target.value })}
            />
            <Input
              label="Years of Experience"
              type="number"
              value={editEmp.years_of_experience}
              onChange={(e) => setEditEmp({ ...editEmp, years_of_experience: Number(e.target.value) })}
              min={0}
            />
            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={handleEditSave} className="flex-1">Save Changes</Button>
              <Button variant="outline" onClick={() => setEditEmp(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteEmp} onClose={() => setDeleteEmp(null)} title="Delete Employee" size="sm">
        {deleteEmp && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle size={24} />
              <p className="text-sm">Are you sure you want to delete <strong>{deleteEmp.name}</strong> ({deleteEmp.employee_id})?</p>
            </div>
            <p className="text-xs text-slate-500">This action cannot be undone.</p>
            <div className="flex gap-3 pt-2">
              <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
              <Button variant="outline" onClick={() => setDeleteEmp(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
