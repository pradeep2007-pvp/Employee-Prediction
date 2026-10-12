// Data preprocessing pipeline: encoding, scaling, missing values

import type { PredictionInput } from '../supabase';
import { DEPARTMENTS, EDUCATION_LEVELS, GENDERS, JOB_ROLES } from '../constants';
import { mean, std } from './linalg';

export const CATEGORICAL_KEYS = ['gender', 'education_level', 'department', 'job_role'] as const;

export const NUMERICAL_KEYS = [
  'age',
  'years_at_company',
  'years_of_experience',
  'num_companies_worked',
  'job_satisfaction',
  'work_life_balance',
  'performance_rating',
  'monthly_income',
  'previous_salary',
] as const;

export type FeatureVector = number[];

export type Preprocessor = {
  categoricalMappings: Record<string, Record<string, number>>;
  numericalStats: Record<string, { mean: number; std: number }>;
  featureOrder: string[];
  overtimeIndex: number;
};

export function buildPreprocessor(samples: PredictionInput[]): Preprocessor {
  const categoricalMappings: Record<string, Record<string, number>> = {};

  for (const key of CATEGORICAL_KEYS) {
    const allValues = new Set<string>();
    for (const s of samples) {
      allValues.add(String(s[key]));
    }
    const mapping: Record<string, number> = {};
    let idx = 0;
    for (const v of allValues) {
      mapping[v] = idx;
      idx++;
    }
    categoricalMappings[key] = mapping;
  }

  const numericalStats: Record<string, { mean: number; std: number }> = {};
  for (const key of NUMERICAL_KEYS) {
    const values = samples.map((s) => Number(s[key]));
    const m = mean(values);
    const s = std(values);
    numericalStats[key] = { mean: m, std: s === 0 ? 1 : s };
  }

  const featureOrder: string[] = [];
  for (const key of CATEGORICAL_KEYS) {
    const values = Object.keys(categoricalMappings[key]);
    for (const v of values) {
      featureOrder.push(`${key}=${v}`);
    }
  }
  for (const key of NUMERICAL_KEYS) {
    featureOrder.push(key);
  }
  featureOrder.push('overtime');

  return {
    categoricalMappings,
    numericalStats,
    featureOrder,
    overtimeIndex: featureOrder.length - 1,
  };
}

export function encode(input: PredictionInput, preprocessor: Preprocessor): FeatureVector {
  const features: number[] = new Array(preprocessor.featureOrder.length).fill(0);

  let idx = 0;
  for (const key of CATEGORICAL_KEYS) {
    const mapping = preprocessor.categoricalMappings[key];
    const values = Object.keys(mapping).sort((a, b) => mapping[a] - mapping[b]);
    for (const v of values) {
      if (String(input[key]) === v) {
        features[idx] = 1;
      }
      idx++;
    }
  }

  for (const key of NUMERICAL_KEYS) {
    const stats = preprocessor.numericalStats[key];
    const raw = Number(input[key]);
    features[idx] = stats.std === 0 ? 0 : (raw - stats.mean) / stats.std;
    idx++;
  }

  features[idx] = input.overtime ? 1 : 0;

  return features;
}

export function getAllJobRoles(): string[] {
  const roles: string[] = [];
  for (const dept of DEPARTMENTS) {
    for (const role of JOB_ROLES[dept] || []) {
      if (!roles.includes(role)) roles.push(role);
    }
  }
  return roles;
}

export function getAllCategories(): Record<string, string[]> {
  return {
    gender: [...GENDERS],
    education_level: [...EDUCATION_LEVELS],
    department: [...DEPARTMENTS],
    job_role: getAllJobRoles(),
  };
}
