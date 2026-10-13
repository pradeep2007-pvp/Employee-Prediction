// CSV parser: converts uploaded CSV text into PredictionInput rows.
// All fields are optional — missing columns use sensible defaults so any
// reasonable employee CSV can be loaded without parsing issues.

import type { PredictionInput } from '../api';
import { DEPARTMENTS, EDUCATION_LEVELS, GENDERS, JOB_ROLES } from '../constants';

export type DatasetRow = PredictionInput & {
  name: string;
  attrition?: number;
  actualSalary?: number;
};

export type ParseResult = {
  rows: DatasetRow[];
  errors: string[];
  headers: string[];
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s\-]+/g, '_');
}

const COLUMN_ALIASES: Record<string, string> = {
  employee_name: 'name', emp_name: 'name', fullname: 'name', full_name: 'name',
  name: 'name',
  age: 'age', years: 'age',
  gender: 'gender', sex: 'gender',
  education: 'education_level', education_field: 'education_level', edu_level: 'education_level',
  education_level: 'education_level',
  dept: 'department', department: 'department',
  role: 'job_role', jobtitle: 'job_role', job_title: 'job_role', jobrole: 'job_role',
  job_role: 'job_role',
  years_at_company: 'years_at_company', years_in_company: 'years_at_company', tenure: 'years_at_company',
  years_of_experience: 'years_of_experience', total_experience: 'years_of_experience', experience: 'years_of_experience',
  num_companies: 'num_companies_worked', companies_worked: 'num_companies_worked', no_companies: 'num_companies_worked',
  num_companies_worked: 'num_companies_worked',
  overtime: 'overtime', ot: 'overtime',
  job_satisfaction: 'job_satisfaction', satisfaction: 'job_satisfaction', jobsatisfaction: 'job_satisfaction',
  work_life_balance: 'work_life_balance', wlb: 'work_life_balance', worklifebalance: 'work_life_balance',
  performance_rating: 'performance_rating', performance: 'performance_rating', performancerating: 'performance_rating',
  monthly_income: 'monthly_income', income: 'monthly_income', salary: 'monthly_income', monthly_rate: 'monthly_income',
  monthlyincome: 'monthly_income',
  previous_salary: 'previous_salary', prev_salary: 'previous_salary', previoussalary: 'previous_salary',
  attrition: 'attrition', left: 'attrition', churn: 'attrition',
  actual_salary: 'actualSalary', actual_income: 'actualSalary', target_salary: 'actualSalary',
};

function detectDelimiter(line: string): string {
  const commas = (line.match(/,/g) || []).length;
  const semicolons = (line.match(/;/g) || []).length;
  const tabs = (line.match(/\t/g) || []).length;
  if (semicolons > commas && semicolons > tabs) return ';';
  if (tabs > commas && tabs > semicolons) return '\t';
  return ',';
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseBoolean(val: string): boolean {
  const v = val.trim().toLowerCase();
  return v === 'true' || v === 'yes' || v === '1' || v === 'y';
}

function parseNumber(val: string): number {
  if (!val || !val.trim()) return 0;
  const n = parseFloat(val.replace(/[,₹$\s]/g, ''));
  return isNaN(n) ? 0 : n;
}

function fuzzyMatch(value: string, options: readonly string[], fallback: string): string {
  const v = value.trim();
  if (!v) return fallback;
  const vl = v.toLowerCase();
  const exact = options.find((opt) => opt.toLowerCase() === vl);
  if (exact) return exact;
  const partial = options.find((opt) => {
    const ol = opt.toLowerCase();
    return ol.includes(vl) || vl.includes(ol);
  });
  return partial || v;
}

function getAllJobRoles(): string[] {
  const roles: string[] = [];
  for (const dept of DEPARTMENTS) {
    for (const role of JOB_ROLES[dept] || []) {
      if (!roles.includes(role)) roles.push(role);
    }
  }
  return roles;
}

// Default values used when a column is entirely missing from the CSV
const DEFAULTS: PredictionInput = {
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

function clampRating(val: string): number {
  const n = parseNumber(val);
  if (n < 1) return 1;
  if (n > 4) return 4;
  return Math.round(n);
}

export function parseCSV(csvText: string): ParseResult {
  const errors: string[] = [];
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return { rows: [], errors: ['CSV must contain a header row and at least one data row.'], headers: [] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = parseCSVLine(lines[0], delimiter);
  const headers = rawHeaders.map(normalizeHeader);
  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    const canonical = COLUMN_ALIASES[h] || h;
    if (!(canonical in headerMap)) {
      headerMap[canonical] = i;
    }
  });

  const allRoles = getAllJobRoles();
  const rows: DatasetRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i], delimiter);
    const get = (key: string): string => {
      const idx = headerMap[key];
      return idx !== undefined && idx < cells.length ? cells[idx] || '' : '';
    };

    try {
      const hasName = get('name').trim().length > 0;
      const row: DatasetRow = {
        name: get('name') || `Employee ${i}`,
        age: parseNumber(get('age')) || DEFAULTS.age,
        gender: fuzzyMatch(get('gender'), GENDERS, DEFAULTS.gender),
        education_level: fuzzyMatch(get('education_level'), EDUCATION_LEVELS, DEFAULTS.education_level),
        department: fuzzyMatch(get('department'), DEPARTMENTS, DEFAULTS.department),
        job_role: fuzzyMatch(get('job_role'), allRoles, DEFAULTS.job_role),
        years_at_company: parseNumber(get('years_at_company')) || DEFAULTS.years_at_company,
        years_of_experience: parseNumber(get('years_of_experience')) || DEFAULTS.years_of_experience,
        num_companies_worked: parseNumber(get('num_companies_worked')),
        overtime: get('overtime') ? parseBoolean(get('overtime')) : DEFAULTS.overtime,
        job_satisfaction: get('job_satisfaction') ? clampRating(get('job_satisfaction')) : DEFAULTS.job_satisfaction,
        work_life_balance: get('work_life_balance') ? clampRating(get('work_life_balance')) : DEFAULTS.work_life_balance,
        performance_rating: get('performance_rating') ? clampRating(get('performance_rating')) : DEFAULTS.performance_rating,
        monthly_income: parseNumber(get('monthly_income')) || DEFAULTS.monthly_income,
        previous_salary: parseNumber(get('previous_salary')) || parseNumber(get('monthly_income')) * 0.85 || DEFAULTS.previous_salary,
      };

      const attritionVal = get('attrition');
      if (attritionVal) {
        const v = attritionVal.trim().toLowerCase();
        if (v === 'yes' || v === '1' || v === 'true' || v === 'leave') row.attrition = 1;
        else if (v === 'no' || v === '0' || v === 'false' || v === 'stay') row.attrition = 0;
      }

      const actualSalaryVal = get('actualSalary');
      if (actualSalaryVal) row.actualSalary = parseNumber(actualSalaryVal);

      // Skip completely empty rows
      if (!hasName && !get('age') && !get('department') && cells.every((c) => !c.trim())) {
        continue;
      }

      rows.push(row);
    } catch {
      // Silently skip unparseable rows instead of reporting errors
    }
  }

  return { rows, errors, headers: rawHeaders };
}

export function generateCSVTemplate(): string {
  const headers = [
    'name', 'age', 'gender', 'education_level', 'department', 'job_role',
    'years_at_company', 'years_of_experience', 'num_companies_worked',
    'overtime', 'job_satisfaction', 'work_life_balance', 'performance_rating',
    'monthly_income', 'previous_salary', 'attrition', 'actual_salary',
  ];
  return headers.join(',');
}

export function generateSampleCSV(): string {
  const header = generateCSVTemplate();
  const sampleRows = [
    ['John Doe', '28', 'Male', 'Bachelor', 'Engineering', 'Software Developer', '3', '5', '2', 'No', '3', '3', '4', '55000', '48000', 'No', '56000'],
    ['Jane Smith', '35', 'Female', 'Master', 'Sales', 'Sales Executive', '7', '10', '3', 'Yes', '2', '2', '3', '62000', '55000', 'Yes', '60000'],
    ['Mike Johnson', '42', 'Male', 'Bachelor', 'Finance', 'Financial Analyst', '12', '15', '4', 'No', '4', '3', '4', '78000', '70000', 'No', '80000'],
    ['Sarah Wilson', '26', 'Female', 'Master', 'Engineering', 'Senior Engineer', '2', '3', '1', 'Yes', '2', '2', '3', '52000', '46000', 'Yes', '50000'],
    ['Robert Brown', '50', 'Male', 'Doctorate', 'Research & Development', 'Research Scientist', '20', '25', '5', 'No', '4', '4', '4', '95000', '88000', 'No', '98000'],
  ];
  const rows = sampleRows.map((r) => r.join(','));
  return [header, ...rows].join('\n');
}
