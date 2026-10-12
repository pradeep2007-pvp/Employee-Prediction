// Synthetic employee dataset generator for model training.
// In a real project, this would come from a CSV/FastAPI backend.
// The generator produces realistic employee records with correlated
// attrition and salary patterns so the models learn meaningful relationships.

import type { PredictionInput } from '../supabase';
import { DEPARTMENTS, EDUCATION_LEVELS, GENDERS, JOB_ROLES } from '../constants';

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function generateEmployeeRecord(): PredictionInput & { attrition: number; actualSalary: number } {
  const department = randomChoice(DEPARTMENTS);
  const jobRole = randomChoice(JOB_ROLES[department] || ['Software Developer']);
  const age = randomInt(22, 60);
  const gender = randomChoice(GENDERS);
  const educationLevel = randomChoice(EDUCATION_LEVELS);
  const yearsOfExperience = randomInt(0, Math.min(age - 22, 38));
  const yearsAtCompany = randomInt(0, Math.min(yearsOfExperience + 1, 30));
  const numCompaniesWorked = randomInt(0, 8);
  const overtime = Math.random() > 0.7;
  const jobSatisfaction = randomInt(1, 4);
  const workLifeBalance = randomInt(1, 4);
  const performanceRating = randomInt(1, 4);

  const eduBonus: Record<string, number> = {
    'High School': 0,
    Diploma: 3000,
    Bachelor: 8000,
    Master: 14000,
    Doctorate: 20000,
  };
  const deptBase: Record<string, number> = {
    Engineering: 55000,
    Sales: 45000,
    'Human Resources': 42000,
    Finance: 50000,
    'Research & Development': 52000,
    Marketing: 48000,
    Operations: 46000,
    'IT Support': 44000,
  };

  const baseSalary = deptBase[department] || 45000;
  const monthlyIncome = Math.round(
    baseSalary +
      eduBonus[educationLevel] +
      yearsOfExperience * 1800 +
      performanceRating * 2500 +
      (overtime ? 4000 : 0) +
      randomFloat(-5000, 5000)
  );
  const previousSalary = Math.round(monthlyIncome * randomFloat(0.7, 0.95));

  // Attrition probability based on realistic factors
  let attritionScore = 0;
  if (jobSatisfaction <= 2) attritionScore += 0.2;
  if (workLifeBalance <= 2) attritionScore += 0.15;
  if (overtime) attritionScore += 0.15;
  if (yearsAtCompany < 2) attritionScore += 0.12;
  if (numCompaniesWorked > 5) attritionScore += 0.1;
  if (monthlyIncome < 40000) attritionScore += 0.1;
  if (age < 30) attritionScore += 0.08;
  if (performanceRating <= 2) attritionScore += 0.08;
  attritionScore += randomFloat(-0.1, 0.1);

  const attritionProbability = Math.min(0.95, Math.max(0.05, attritionScore));
  const attrition = attritionProbability > 0.5 ? 1 : 0;

  const actualSalary = monthlyIncome;

  return {
    age,
    gender,
    education_level: educationLevel,
    department,
    job_role: jobRole,
    years_at_company: yearsAtCompany,
    years_of_experience: yearsOfExperience,
    num_companies_worked: numCompaniesWorked,
    overtime,
    job_satisfaction: jobSatisfaction,
    work_life_balance: workLifeBalance,
    performance_rating: performanceRating,
    monthly_income: monthlyIncome,
    previous_salary: previousSalary,
    attrition,
    actualSalary,
  };
}

export function generateDataset(n: number): ReturnType<typeof generateEmployeeRecord>[] {
  const records: ReturnType<typeof generateEmployeeRecord>[] = [];
  for (let i = 0; i < n; i++) {
    records.push(generateEmployeeRecord());
  }
  return records;
}

export function trainTestSplit<T>(data: T[], testRatio: number = 0.2): { train: T[]; test: T[] } {
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  const splitIdx = Math.floor(data.length * (1 - testRatio));
  return {
    train: shuffled.slice(0, splitIdx),
    test: shuffled.slice(splitIdx),
  };
}
