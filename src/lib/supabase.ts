import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Employee = {
  id: string;
  user_id: string;
  employee_id: string;
  name: string;
  age: number;
  gender: string;
  education_level: string;
  department: string;
  job_role: string;
  years_at_company: number;
  years_of_experience: number;
  num_companies_worked: number;
  overtime: boolean;
  job_satisfaction: number;
  work_life_balance: number;
  performance_rating: number;
  monthly_income: number;
  previous_salary: number;
  attrition_probability: number | null;
  prediction: string | null;
  predicted_salary: number | null;
  created_at: string;
  updated_at: string;
};

export type Prediction = {
  id: string;
  user_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  attrition_probability: number;
  prediction: string;
  predicted_salary: number;
  threshold: number;
  model_type: string;
  risk_level: string;
  created_at: string;
};

export type ModelMetrics = {
  id: string;
  user_id: string;
  model_type: string;
  metrics: Record<string, number | number[][]>;
  trained_at: string;
  training_samples: number;
};

export type PredictionInput = {
  age: number;
  gender: string;
  education_level: string;
  department: string;
  job_role: string;
  years_at_company: number;
  years_of_experience: number;
  num_companies_worked: number;
  overtime: boolean;
  job_satisfaction: number;
  work_life_balance: number;
  performance_rating: number;
  monthly_income: number;
  previous_salary: number;
};
