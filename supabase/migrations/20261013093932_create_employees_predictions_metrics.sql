/*
# Create employees, predictions, and model_metrics tables

1. New Tables
- `employees` — stores employee records with attrition/salary prediction fields
- `predictions` — stores prediction history records
- `model_metrics` — stores ML model evaluation metrics per user

2. Security
- RLS enabled on all three tables.
- Owner-scoped CRUD: each authenticated user can only access their own rows.
- user_id defaults to auth.uid() so inserts without explicit user_id succeed.
*/

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  name text NOT NULL,
  age int NOT NULL,
  gender text NOT NULL,
  education_level text NOT NULL,
  department text NOT NULL,
  job_role text NOT NULL,
  years_at_company int NOT NULL,
  years_of_experience int NOT NULL,
  num_companies_worked int NOT NULL,
  overtime boolean NOT NULL DEFAULT false,
  job_satisfaction int NOT NULL,
  work_life_balance int NOT NULL,
  performance_rating int NOT NULL,
  monthly_income numeric NOT NULL,
  previous_salary numeric NOT NULL,
  attrition_probability numeric,
  prediction text,
  predicted_salary numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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

CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);

CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text NOT NULL,
  employee_name text NOT NULL,
  department text NOT NULL,
  attrition_probability numeric NOT NULL,
  prediction text NOT NULL,
  predicted_salary numeric NOT NULL,
  threshold numeric NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);

CREATE TABLE IF NOT EXISTS model_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  model_type text NOT NULL,
  metrics jsonb NOT NULL,
  trained_at timestamptz DEFAULT now(),
  training_samples int NOT NULL
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

CREATE INDEX IF NOT EXISTS idx_model_metrics_user_id ON model_metrics(user_id);