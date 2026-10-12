import { useMemo } from 'react';
import {
  BarChart3, Users, Clock, IndianRupee, TrendingDown,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ChartCard } from '@/components/ui/StatCard';
import { ChartSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEmployees } from '@/hooks/useData';
import { DEPARTMENTS, SATISFACTION_LABELS, formatCurrency } from '@/lib/constants';

const JOB_ROLES_FLAT = [
  'Software Developer', 'Sales Executive', 'HR Analyst', 'Financial Analyst',
  'Research Scientist', 'Marketing Analyst', 'Operations Analyst', 'IT Support Specialist',
];

export function Analytics() {
  const { employees, loading } = useEmployees();

  const workforceStats = useMemo(() => {
    const total = employees.length;
    const avgExp = total > 0 ? employees.reduce((a, e) => a + e.years_of_experience, 0) / total : 0;
    const avgSal = total > 0 ? employees.reduce((a, e) => a + (e.predicted_salary || e.monthly_income), 0) / total : 0;
    const leaveCount = employees.filter((e) => e.prediction === 'Leave').length;
    const attritionPct = total > 0 ? (leaveCount / total) * 100 : 0;
    return { total, avgExp, avgSal, attritionPct };
  }, [employees]);

  const attritionByDept = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const emps = employees.filter((e) => e.department === dept);
      const leave = emps.filter((e) => e.prediction === 'Leave').length;
      const rate = emps.length > 0 ? (leave / emps.length) * 100 : 0;
      return { department: dept.length > 12 ? dept.substring(0, 10) + '..' : dept, rate: Math.round(rate) };
    }).filter((d) => d.rate > 0 || employees.some((e) => e.department === d.department));
  }, [employees]);

  const attritionByRole = useMemo(() => {
    return JOB_ROLES_FLAT.map((role) => {
      const emps = employees.filter((e) => e.job_role === role);
      const leave = emps.filter((e) => e.prediction === 'Leave').length;
      const rate = emps.length > 0 ? (leave / emps.length) * 100 : 0;
      return { role: role.length > 15 ? role.substring(0, 13) + '..' : role, rate: Math.round(rate) };
    }).filter((d) => employees.some((e) => e.job_role === d.role));
  }, [employees]);

  const attritionByOvertime = useMemo(() => [
    { name: 'Overtime', value: employees.filter((e) => e.overtime && e.prediction === 'Leave').length, color: '#ef4444' },
    { name: 'No Overtime', value: employees.filter((e) => !e.overtime && e.prediction === 'Leave').length, color: '#3b82f6' },
  ], [employees]);

  const attritionBySatisfaction = useMemo(() => {
    return [1, 2, 3, 4].map((level) => {
      const emps = employees.filter((e) => e.job_satisfaction === level);
      const leave = emps.filter((e) => e.prediction === 'Leave').length;
      return { level: SATISFACTION_LABELS[level], leave, stay: emps.length - leave };
    });
  }, [employees]);

  const salaryByExp = useMemo(() => {
    const buckets = [
      { range: '0-5', min: 0, max: 5 },
      { range: '6-10', min: 6, max: 10 },
      { range: '11-15', min: 11, max: 15 },
      { range: '16-20', min: 16, max: 20 },
      { range: '20+', min: 21, max: 100 },
    ];
    return buckets.map((b) => {
      const emps = employees.filter((e) => e.years_of_experience >= b.min && e.years_of_experience <= b.max);
      const avgSal = emps.length > 0 ? emps.reduce((a, e) => a + (e.predicted_salary || e.monthly_income), 0) / emps.length : 0;
      return { range: b.range, salary: Math.round(avgSal / 1000) };
    });
  }, [employees]);

  const salaryByDept = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const emps = employees.filter((e) => e.department === dept);
      const avgSal = emps.length > 0 ? emps.reduce((a, e) => a + (e.predicted_salary || e.monthly_income), 0) / emps.length : 0;
      return { department: dept.length > 12 ? dept.substring(0, 10) + '..' : dept, salary: Math.round(avgSal / 1000) };
    }).filter((d) => d.salary > 0);
  }, [employees]);

  const satisfactionRadar = useMemo(() => {
    return [1, 2, 3, 4].map((level) => ({
      level: SATISFACTION_LABELS[level],
      count: employees.filter((e) => e.job_satisfaction === level).length,
    }));
  }, [employees]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Advanced HR analytics and insights.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton /><ChartSkeleton /><ChartSkeleton /><ChartSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (employees.length === 0) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Advanced HR analytics and insights.</p>
        </div>
        <div className="card p-6">
          <EmptyState icon={BarChart3} title="No data to analyze" description="Add employee records and run predictions to see analytics." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Advanced HR analytics and insights.</p>
      </div>

      {/* Workforce Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, label: 'Total Employees', value: workforceStats.total.toString(), color: 'text-navy-700 bg-navy-50' },
          { icon: Clock, label: 'Avg Experience', value: `${workforceStats.avgExp.toFixed(1)} yrs`, color: 'text-brand-600 bg-brand-50' },
          { icon: IndianRupee, label: 'Avg Salary', value: formatCurrency(workforceStats.avgSal), color: 'text-green-600 bg-green-50' },
          { icon: TrendingDown, label: 'Attrition Rate', value: `${workforceStats.attritionPct.toFixed(1)}%`, color: 'text-red-600 bg-red-50' },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${stat.color} mb-3`}>
              <stat.icon size={20} />
            </div>
            <p className="text-xl font-bold text-navy-900">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Attrition by Department" description="Leave rate percentage by department">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attritionByDept} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" unit="%" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis dataKey="department" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={100} />
              <Tooltip />
              <Bar dataKey="rate" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attrition by Job Role" description="Leave rate percentage by job role">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attritionByRole} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" unit="%" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis dataKey="role" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={110} />
              <Tooltip />
              <Bar dataKey="rate" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attrition by Overtime" description="Leave count by overtime status">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={attritionByOvertime} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                {attritionByOvertime.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attrition by Satisfaction" description="Leave vs Stay by satisfaction level">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attritionBySatisfaction}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="level" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="stay" fill="#22c55e" radius={[8, 8, 0, 0]} />
              <Bar dataKey="leave" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Salary by Experience" description="Average salary (₹K) by experience range">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salaryByExp}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" unit="K" />
              <Tooltip />
              <Line type="monotone" dataKey="salary" stroke="#3b82f6" strokeWidth={2} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Salary by Department" description="Average salary (₹K) by department">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salaryByDept}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="department" tick={{ fontSize: 10 }} stroke="#94a3b8" angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" unit="K" />
              <Tooltip />
              <Bar dataKey="salary" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Satisfaction Distribution" description="Employee count by satisfaction level">
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={satisfactionRadar}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="level" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis tick={{ fontSize: 10 }} />
              <Radar dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </DashboardLayout>
  );
}
