const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TOKEN_KEY = 'hr_dataminer_token';
const USER_KEY = 'hr_dataminer_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): { id: string; email: string } | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: { id: string; email: string }) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Auth ----
export const api = {
  async register(email: string, password: string) {
    const data = await request<{ token: string; user: { id: string; email: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async login(email: string, password: string) {
    const data = await request<{ token: string; user: { id: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  logout() {
    clearToken();
  },

  async getMe() {
    return request<{ id: string; email: string }>('/auth/me');
  },
};

// ---- Types ----
export type Employee = {
  _id?: string;
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
  _id?: string;
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
  _id?: string;
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
  list: () => request<Employee[]>('/employees'),
  create: (data: Omit<Employee, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
    request<Employee>('/employees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, updates: Partial<Employee>) =>
    request<Employee>(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  remove: (id: string) => request<{ success: boolean }>(`/employees/${id}`, { method: 'DELETE' }),
};

// ---- Predictions ----
export const predictionApi = {
  list: () => request<Prediction[]>('/predictions'),
  create: (data: Omit<Prediction, 'id' | 'user_id' | 'created_at'>) =>
    request<Prediction>('/predictions', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: string) => request<{ success: boolean }>(`/predictions/${id}`, { method: 'DELETE' }),
};

// ---- Model Metrics ----
export const metricsApi = {
  list: () => request<ModelMetrics[]>('/metrics'),
  create: (metrics: Array<{ model_type: string; metrics: Record<string, number | number[][]>; trained_at: string; training_samples: number }>) =>
    request<{ insertedCount: number }>('/metrics', { method: 'POST', body: JSON.stringify(metrics) }),
};
