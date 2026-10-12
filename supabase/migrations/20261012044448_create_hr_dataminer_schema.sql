/*
# HR DataMiner Portal — Database Schema

## Overview
Creates the core tables for the HR DataMiner Portal, an HR analytics and ML prediction app.
The app requires authentication (sign-in screen), so all tables are owner-scoped with
user_id columns defaulting to auth.uid() and authenticated-only RLS policies.

## New Tables

1. **employees** — Employee records with HR attributes (age, department, job role, income, etc.)
   - id (uuid, PK)
   - user_id (uuid, FK → auth.users, defaults to auth.uid())
   - employee_id (text, unique per user) — e.g. "EMP001"
   - name (text)
   - age (int)
   - gender (text)
   - education_level (text)
   - department (text)
   - job_role (text)
   - years_at_company (int)
   - years_of_experience (int)
   - num_companies_worked (int)
   - overtime (boolean)
   - job_satisfaction (int, 1-4)
   - work_life_balance (int, 1-4)
   - performance_rating (int, 1-4)
   - monthly_income (numeric)
   - previous_salary (numeric)
   - attrition_probability (numeric, nullable) — last predicted attrition probability
   - prediction (text, nullable) — "Leave" or "Stay"
   - predicted_salary (numeric, nullable) — last predicted salary
   - created_at (timestamptz)
   - updated_at (timestamptz)

2. **predictions** — Prediction history records
   - id (uuid, PK)
   - user_id (uuid, FK → auth.users, defaults to auth.uid())
   - employee_id (text) — reference to employee
   - employee_name (text)
   - department (text)
   - attrition_probability (numeric)
   - prediction (text) — "Leave" or "Stay"
   - predicted_salary (numeric)
   - threshold (numeric, default 0.5)
   - model_type (text) — "Logistic Regression" or "Multiple Linear Regression"
   - risk_level (text) — "Low", "Medium", "High"
   - created_at (timestamptz)

3. **model_metrics** — ML model performance metrics (calculated from training)
   - id (uuid, PK)
   - user_id (uuid, FK → auth.users, defaults to auth.uid())
   - model_type (text) — "Logistic Regression" or "Multiple Linear Regression"
   - metrics (jsonb) — stores accuracy, precision, recall, f1, confusion_matrix, mae, mse, rmse, r2
   - trained_at (timestamptz)
   - training_samples (int)

## Security
- RLS enabled on all tables.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- user_id defaults to auth.uid() so inserts work even when the client omits it.
*/

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  name text NOT NULL,
  age int NOT NULL DEFAULT 30,
  gender text NOT NULL DEFAULT 'Male',
  education_level text NOT NULL DEFAULT 'Bachelor',
  department text NOT NULL DEFAULT 'Engineering',
  job_role text NOT NULL DEFAULT 'Software Developer',
  years_at_company int NOT NULL DEFAULT 5,
  years_of_experience int NOT NULL DEFAULT 5,
  num_companies_worked int NOT NULL DEFAULT 1,
  overtime boolean NOT NULL DEFAULT false,
  job_satisfaction int NOT NULL DEFAULT 3,
  work_life_balance int NOT NULL DEFAULT 3,
  performance_rating int NOT NULL DEFAULT 3,
  monthly_income numeric NOT NULL DEFAULT 50000,
  previous_salary numeric NOT NULL DEFAULT 45000,
  attrition_probability numeric,
  prediction text,
  predicted_salary numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, employee_id)
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_employees" ON employees;
CREATE POLICY "select_own_employees" ON employees FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_employees" ON employees;
CREATE POLICY "insert_own_employees" ON employees FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_employees" ON employees;
CREATE POLICY "update_own_employees" ON employees FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_employees" ON employees;
CREATE POLICY "delete_own_employees" ON employees FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  employee_name text NOT NULL,
  department text NOT NULL,
  attrition_probability numeric NOT NULL,
  prediction text NOT NULL,
  predicted_salary numeric NOT NULL,
  threshold numeric NOT NULL DEFAULT 0.5,
  model_type text NOT NULL,
  risk_level text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_predictions" ON predictions;
CREATE POLICY "select_own_predictions" ON predictions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_predictions" ON predictions;
CREATE POLICY "insert_own_predictions" ON predictions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_predictions" ON predictions;
CREATE POLICY "update_own_predictions" ON predictions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_predictions" ON predictions;
CREATE POLICY "delete_own_predictions" ON predictions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Model metrics table
CREATE TABLE IF NOT EXISTS model_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  model_type text NOT NULL,
  metrics jsonb NOT NULL DEFAULT '{}',
  trained_at timestamptz DEFAULT now(),
  training_samples int NOT NULL DEFAULT 0
);

ALTER TABLE model_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_model_metrics" ON model_metrics;
CREATE POLICY "select_own_model_metrics" ON model_metrics FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_model_metrics" ON model_metrics;
CREATE POLICY "insert_own_model_metrics" ON model_metrics FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_model_metrics" ON model_metrics;
CREATE POLICY "update_own_model_metrics" ON model_metrics FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_model_metrics" ON model_metrics;
CREATE POLICY "delete_own_model_metrics" ON model_metrics FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_metrics_user_id ON model_metrics(user_id);
