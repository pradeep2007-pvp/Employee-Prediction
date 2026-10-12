import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserMinus,
  UserCheck,
  IndianRupee,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ScatterChart, Scatter, Legend,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard, ChartCard } from '@/components/ui/StatCard';
import { CardSkeleton, ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEmployees, usePredictions } from '@/hooks/useData';
import { useAuth } from '@/context/AuthContext';
import { getOrTrainModels } from '@/lib/ml/service';
import { formatCurrency, formatPercent, getGreeting, DEPARTMENTS } from '@/lib/constants';
import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.email?.split('@')[0]?.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'User';
  const { employees, loading: empLoading } = useEmployees();
  const { predictions } = usePredictions();
  const [modelLoading, setModelLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getOrTrainModels(user.id).finally(() => setModelLoading(false));
    }
  }, [user]);

  const stats = useMemo(() => {
    const total = employees.length;
    const leaveCount = employees.filter((e) => e.prediction === 'Leave').length;
    const stayCount = employees.filter((e) => e.prediction === 'Stay').length;
    const salaries = employees.filter((e) => e.predicted_salary).map((e) => e.predicted_salary!);
    const avgSalary = salaries.length > 0 ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0;
    return { total, leaveCount, stayCount, avgSalary };
  }, [employees]);

  const attritionData = useMemo(() => [
    { name: 'Stay', value: stats.stayCount, color: '#22c55e' },
    { name: 'Leave', value: stats.leaveCount, color: '#ef4444' },
  ], [stats]);

  const salaryDistData = useMemo(() => {
    const ranges = [
      { range: '<30K', min: 0, max: 30000 },
      { range: '30-50K', min: 30000, max: 50000 },
      { range: '50-70K', min: 50000, max: 70000 },
      { range: '70-90K', min: 70000, max: 90000 },
      { range: '90K+', min: 90000, max: Infinity },
    ];
    return ranges.map((r) => ({
      range: r.range,
      count: employees.filter((e) => {
        const s = e.predicted_salary || e.monthly_income;
        return s >= r.min && s < r.max;
      }).length,
    }));
  }, [employees]);

  const attritionByDept = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const deptEmps = employees.filter((e) => e.department === dept);
      const leaveCount = deptEmps.filter((e) => e.prediction === 'Leave').length;
      const total = deptEmps.length;
      return {
        department: dept.length > 15 ? dept.substring(0, 12) + '...' : dept,
        leave: leaveCount,
        stay: total - leaveCount,
      };
    }).filter((d) => d.leave + d.stay > 0);
  }, [employees]);

  const salaryVsExp = useMemo(() => {
    return employees
      .filter((e) => e.predicted_salary || e.monthly_income)
      .map((e) => ({
        experience: e.years_of_experience,
        salary: (e.predicted_salary || e.monthly_income) / 1000,
        name: e.name,
      }));
  }, [employees]);

  const overtimeData = useMemo(() => {
    const otEmps = employees.filter((e) => e.overtime);
    const nonOtEmps = employees.filter((e) => !e.overtime);
    const otLeave = otEmps.filter((e) => e.prediction === 'Leave').length;
    const nonOtLeave = nonOtEmps.filter((e) => e.prediction === 'Leave').length;
    return [
      { group: 'Overtime', leave: otLeave, stay: otEmps.length - otLeave },
      { group: 'No Overtime', leave: nonOtLeave, stay: nonOtEmps.length - nonOtLeave },
    ];
  }, [employees]);

  const loading = empLoading || modelLoading;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">
          {getGreeting()}, {displayName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor employee trends, attrition risk, and salary insights from one place.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? (
          <>
            <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Employees"
              value={stats.total}
              description="Active in system"
              color="navy"
              trend={stats.total > 0 ? { value: '+100%', positive: true } : undefined}
            />
            <StatCard
              icon={UserMinus}
              label="Predicted to Leave"
              value={stats.leaveCount}
              description={`${stats.total > 0 ? formatPercent(stats.leaveCount / stats.total) : '0%'} of workforce`}
              color="red"
              trend={stats.leaveCount > 0 ? { value: 'At risk', positive: false } : undefined}
            />
            <StatCard
              icon={UserCheck}
              label="Predicted to Stay"
              value={stats.stayCount}
              description={`${stats.total > 0 ? formatPercent(stats.stayCount / stats.total) : '0%'} of workforce`}
              color="green"
              trend={stats.stayCount > 0 ? { value: 'Stable', positive: true } : undefined}
            />
            <StatCard
              icon={IndianRupee}
              label="Avg Predicted Salary"
              value={stats.avgSalary > 0 ? formatCurrency(stats.avgSalary) : '—'}
              description="Monthly estimated"
              color="brand"
            />
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton /><ChartSkeleton /><ChartSkeleton /><ChartSkeleton />
        </div>
      ) : employees.length === 0 ? (
        <div className="card p-6">
          <EmptyState
            icon={Brain}
            title="No employee data yet"
            description="Add employee records and run predictions to see analytics here."
            action={
              <Link to="/predict" className="inline-block">
                <span className="px-4 py-2 bg-navy-800 text-white rounded-xl text-sm font-medium hover:bg-navy-700 transition-colors">
                  Go to Prediction
                </span>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Attrition Distribution - Donut */}
          <ChartCard title="Attrition Distribution" description="Leave vs Stay predictions">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={attritionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {attritionData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Salary Distribution */}
          <ChartCard title="Salary Distribution" description="Employees by salary range">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={salaryDistData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Attrition by Department */}
          <ChartCard title="Attrition by Department" description="Leave vs Stay across departments">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={attritionByDept} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={90} />
                <Tooltip />
                <Legend />
                <Bar dataKey="stay" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} />
                <Bar dataKey="leave" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Salary vs Experience */}
          <ChartCard title="Salary vs Experience" description="Salary in thousands (₹K) by years of experience">
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="experience" name="Experience" unit=" yrs" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis dataKey="salary" name="Salary" unit="K" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={salaryVsExp} fill="#6366f1" />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Overtime vs Attrition */}
          <ChartCard title="Overtime vs Attrition" description="Impact of overtime on attrition" >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={overtimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="group" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="stay" fill="#22c55e" radius={[8, 8, 0, 0]} />
                <Bar dataKey="leave" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Recent predictions summary */}
          <ChartCard title="Recent Predictions" description={`${predictions.length} total predictions recorded`}>
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {predictions.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-navy-800">{p.employee_name}</p>
                    <p className="text-xs text-slate-400">{p.department} · {p.prediction}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${p.prediction === 'Leave' ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPercent(p.attrition_probability)}
                    </p>
                    <p className="text-xs text-slate-400">{formatCurrency(p.predicted_salary)}</p>
                  </div>
                </div>
              ))}
              {predictions.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">No predictions yet.</p>
              )}
            </div>
          </ChartCard>
        </div>
      )}
    </DashboardLayout>
  );
}
