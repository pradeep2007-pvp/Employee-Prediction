export const DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Human Resources',
  'Finance',
  'Research & Development',
  'Marketing',
  'Operations',
  'IT Support',
] as const;

export const JOB_ROLES: Record<string, string[]> = {
  Engineering: ['Software Developer', 'Senior Engineer', 'Technical Lead', 'QA Engineer', 'DevOps Engineer'],
  Sales: ['Sales Executive', 'Sales Representative', 'Account Manager', 'Sales Manager'],
  'Human Resources': ['HR Analyst', 'HR Specialist', 'HR Manager', 'Recruiter'],
  Finance: ['Financial Analyst', 'Accountant', 'Finance Manager', 'Auditor'],
  'Research & Development': ['Research Scientist', 'Research Analyst', 'R&D Manager', 'Lab Technician'],
  Marketing: ['Marketing Analyst', 'Marketing Specialist', 'Content Strategist', 'Marketing Manager'],
  Operations: ['Operations Analyst', 'Operations Manager', 'Logistics Coordinator', 'Supply Chain Analyst'],
  'IT Support': ['IT Support Specialist', 'System Administrator', 'Network Engineer', 'Help Desk Technician'],
};

export const EDUCATION_LEVELS = ['High School', 'Diploma', 'Bachelor', 'Master', 'Doctorate'] as const;

export const GENDERS = ['Male', 'Female', 'Non-binary'] as const;

export const SATISFACTION_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Very High',
};

export const RISK_THRESHOLDS = {
  LOW: 0.35,
  MEDIUM: 0.65,
} as const;

export const PREDICTION_THRESHOLD = 0.5;

export function getRiskLevel(probability: number): 'Low' | 'Medium' | 'High' {
  if (probability < RISK_THRESHOLDS.LOW) return 'Low';
  if (probability < RISK_THRESHOLDS.MEDIUM) return 'Medium';
  return 'High';
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
