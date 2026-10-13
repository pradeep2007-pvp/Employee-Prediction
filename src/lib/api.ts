import { supabase } from './supabase';

// ---- Types ----
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

// ---- Employees ----
export const employeeApi = {
  async list(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Employee[];
  },

  async create(input: Omit<Employee, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Employee;
  },

  async update(id: string, updates: Partial<Employee>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Employee;
  },

  async remove(id: string): Promise<{ success: boolean }> {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};

// ---- Predictions ----
export const predictionApi = {
  async list(): Promise<Prediction[]> {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Prediction[];
  },

  async create(input: Omit<Prediction, 'id' | 'user_id' | 'created_at'>): Promise<Prediction> {
    const { data, error } = await supabase
      .from('predictions')
      .insert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Prediction;
  },

  async remove(id: string): Promise<{ success: boolean }> {
    const { error } = await supabase.from('predictions').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
};

// ---- Model Metrics ----
export const metricsApi = {
  async list(): Promise<ModelMetrics[]> {
    const { data, error } = await supabase
      .from('model_metrics')
      .select('*')
      .order('trained_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as ModelMetrics[];
  },

  async create(metrics: Array<{ model_type: string; metrics: Record<string, number | number[][]>; trained_at: string; training_samples: number }>): Promise<{ insertedCount: number }> {
    const { error } = await supabase.from('model_metrics').insert(metrics);
    if (error) throw new Error(error.message);
    return { insertedCount: metrics.length };
  },
};
