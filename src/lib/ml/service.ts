// ML Service: orchestrates preprocessing, training, prediction, and persistence.
// Models are trained on a synthetic dataset and metrics are stored in Supabase.

import { supabase, type PredictionInput, type ModelMetrics } from '../supabase';
import { getRiskLevel, PREDICTION_THRESHOLD } from '../constants';
import { buildPreprocessor, encode, type Preprocessor } from './preprocessing';
import {
  trainLogisticRegression,
  predictLogisticRegression,
  evaluateClassification,
  type LogisticRegressionModel,
} from './logisticRegression';
import {
  trainLinearRegression,
  predictLinearRegression,
  evaluateRegression,
  type LinearRegressionModel,
} from './linearRegression';
import { generateDataset, trainTestSplit, generateEmployeeRecord } from './dataset';
import type { DatasetRow } from './csvParser';

export type TrainedModels = {
  logisticModel: LogisticRegressionModel;
  linearModel: LinearRegressionModel;
  preprocessor: Preprocessor;
  logisticMetrics: ReturnType<typeof evaluateClassification>;
  linearMetrics: ReturnType<typeof evaluateRegression>;
  trainingSamples: number;
  trainedAt: string;
};

let cachedModels: TrainedModels | null = null;

export async function getOrTrainModels(userId: string): Promise<TrainedModels> {
  if (cachedModels) return cachedModels;

  const dataset = generateDataset(500);
  const { train, test } = trainTestSplit(dataset, 0.2);

  const trainInputs: PredictionInput[] = train.map((r) => ({
    age: r.age,
    gender: r.gender,
    education_level: r.education_level,
    department: r.department,
    job_role: r.job_role,
    years_at_company: r.years_at_company,
    years_of_experience: r.years_of_experience,
    num_companies_worked: r.num_companies_worked,
    overtime: r.overtime,
    job_satisfaction: r.job_satisfaction,
    work_life_balance: r.work_life_balance,
    performance_rating: r.performance_rating,
    monthly_income: r.monthly_income,
    previous_salary: r.previous_salary,
  }));

  const preprocessor = buildPreprocessor(trainInputs);

  const XTrain = train.map((r) => encode(r, preprocessor));
  const yAttritionTrain = train.map((r) => r.attrition);
  const ySalaryTrain = train.map((r) => r.actualSalary);

  const XTest = test.map((r) => encode(r, preprocessor));
  const yAttritionTest = test.map((r) => r.attrition);
  const ySalaryTest = test.map((r) => r.actualSalary);

  const logisticModel = trainLogisticRegression(XTrain, yAttritionTrain, {
    learningRate: 0.05,
    iterations: 1200,
  });

  const linearModel = trainLinearRegression(XTrain, ySalaryTrain, {
    learningRate: 0.005,
    iterations: 2000,
  });

  const logisticMetrics = evaluateClassification(logisticModel, XTest, yAttritionTest);
  const linearMetrics = evaluateRegression(linearModel, XTest, ySalaryTest);

  const trainedAt = new Date().toISOString();
  const trainingSamples = train.length;

  // Persist metrics to Supabase
  try {
    // Delete old metrics for this user
    await supabase.from('model_metrics').delete().eq('user_id', userId);

    await supabase.from('model_metrics').insert([
      {
        user_id: userId,
        model_type: 'Logistic Regression',
        metrics: {
          accuracy: logisticMetrics.accuracy,
          precision: logisticMetrics.precision,
          recall: logisticMetrics.recall,
          f1Score: logisticMetrics.f1Score,
          confusionMatrix: logisticMetrics.confusionMatrix,
        },
        trained_at: trainedAt,
        training_samples: trainingSamples,
      },
      {
        user_id: userId,
        model_type: 'Multiple Linear Regression',
        metrics: {
          mae: linearMetrics.mae,
          mse: linearMetrics.mse,
          rmse: linearMetrics.rmse,
          r2: linearMetrics.r2,
        },
        trained_at: trainedAt,
        training_samples: trainingSamples,
      },
    ]);
  } catch (e) {
    // Metrics persistence is non-critical — models still work
    console.warn('Failed to persist model metrics:', e);
  }

  cachedModels = {
    logisticModel,
    linearModel,
    preprocessor,
    logisticMetrics,
    linearMetrics,
    trainingSamples,
    trainedAt,
  };

  return cachedModels;
}

export type PredictionResult = {
  attritionProbability: number;
  prediction: string;
  predictedSalary: number;
  threshold: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  modelType: string;
};

export function runPrediction(models: TrainedModels, input: PredictionInput): PredictionResult {
  const features = encode(input, models.preprocessor);

  const { probability } = predictLogisticRegression(models.logisticModel, features);
  const predictedSalary = predictLinearRegression(models.linearModel, features);

  const prediction = probability >= PREDICTION_THRESHOLD ? 'Leave' : 'Stay';
  const riskLevel = getRiskLevel(probability);

  return {
    attritionProbability: probability,
    prediction,
    predictedSalary: Math.round(Math.max(0, predictedSalary)),
    threshold: PREDICTION_THRESHOLD,
    riskLevel,
    modelType: 'Logistic Regression + Multiple Linear Regression',
  };
}

export async function fetchModelMetrics(userId: string): Promise<ModelMetrics[]> {
  const { data, error } = await supabase
    .from('model_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('trained_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function clearModelCache() {
  cachedModels = null;
}

// Train models from an uploaded dataset (CSV rows).
// If rows contain attrition/actualSalary labels, they're used as training targets.
// Otherwise, synthetic labels are generated based on heuristics.
export async function trainFromDataset(userId: string, datasetRows: DatasetRow[]): Promise<TrainedModels> {
  // Pad very small datasets with synthetic records so train/test split is viable
  let augmented = [...datasetRows];
  while (augmented.length < 20) {
    augmented.push(generateEmployeeRecord() as unknown as DatasetRow);
  }

  // Ensure each row has attrition and actualSalary labels
  const labeledRows = augmented.map((r) => {
    let attrition = r.attrition;
    if (attrition === undefined) {
      // Heuristic: low satisfaction, overtime, low income, short tenure → likely attrition
      let score = 0;
      if (r.job_satisfaction <= 2) score += 0.25;
      if (r.work_life_balance <= 2) score += 0.15;
      if (r.overtime) score += 0.15;
      if (r.years_at_company < 2) score += 0.12;
      if (r.monthly_income < 40000) score += 0.1;
      attrition = score > 0.4 ? 1 : 0;
    }
    const actualSalary = r.actualSalary ?? r.monthly_income;
    return { ...r, attrition, actualSalary };
  });

  const { train, test } = trainTestSplit(labeledRows, 0.2);

  // Seed preprocessor with a synthetic sample covering all known categories,
  // so unseen values from the CSV don't collapse to zero vectors
  const syntheticSeed = generateDataset(50);
  const allTrainInputs: PredictionInput[] = [
    ...syntheticSeed,
    ...train.map((r) => ({
      age: r.age, gender: r.gender, education_level: r.education_level,
      department: r.department, job_role: r.job_role,
      years_at_company: r.years_at_company, years_of_experience: r.years_of_experience,
      num_companies_worked: r.num_companies_worked, overtime: r.overtime,
      job_satisfaction: r.job_satisfaction, work_life_balance: r.work_life_balance,
      performance_rating: r.performance_rating, monthly_income: r.monthly_income,
      previous_salary: r.previous_salary,
    })),
  ];

  const trainInputs: PredictionInput[] = train.map((r) => ({
    age: r.age,
    gender: r.gender,
    education_level: r.education_level,
    department: r.department,
    job_role: r.job_role,
    years_at_company: r.years_at_company,
    years_of_experience: r.years_of_experience,
    num_companies_worked: r.num_companies_worked,
    overtime: r.overtime,
    job_satisfaction: r.job_satisfaction,
    work_life_balance: r.work_life_balance,
    performance_rating: r.performance_rating,
    monthly_income: r.monthly_income,
    previous_salary: r.previous_salary,
  }));

  const preprocessor = buildPreprocessor(allTrainInputs);

  const XTrain = train.map((r) => encode(r, preprocessor));
  const yAttritionTrain = train.map((r) => r.attrition!);
  const ySalaryTrain = train.map((r) => r.actualSalary!);

  const safeTest = test.length > 0 ? test : train.slice(0, Math.max(1, Math.floor(train.length * 0.2)));
  const XTest = safeTest.map((r) => encode(r, preprocessor));
  const yAttritionTest = safeTest.map((r) => r.attrition!);
  const ySalaryTest = safeTest.map((r) => r.actualSalary!);

  const logisticModel = trainLogisticRegression(XTrain, yAttritionTrain, {
    learningRate: 0.05,
    iterations: 1200,
  });

  const linearModel = trainLinearRegression(XTrain, ySalaryTrain, {
    learningRate: 0.005,
    iterations: 2000,
  });

  const logisticMetrics = evaluateClassification(logisticModel, XTest, yAttritionTest);
  const linearMetrics = evaluateRegression(linearModel, XTest, ySalaryTest);

  const trainedAt = new Date().toISOString();
  const trainingSamples = train.length;

  try {
    await supabase.from('model_metrics').delete().eq('user_id', userId);
    await supabase.from('model_metrics').insert([
      {
        user_id: userId,
        model_type: 'Logistic Regression',
        metrics: {
          accuracy: logisticMetrics.accuracy,
          precision: logisticMetrics.precision,
          recall: logisticMetrics.recall,
          f1Score: logisticMetrics.f1Score,
          confusionMatrix: logisticMetrics.confusionMatrix,
        },
        trained_at: trainedAt,
        training_samples: trainingSamples,
      },
      {
        user_id: userId,
        model_type: 'Multiple Linear Regression',
        metrics: { mae: linearMetrics.mae, mse: linearMetrics.mse, rmse: linearMetrics.rmse, r2: linearMetrics.r2 },
        trained_at: trainedAt,
        training_samples: trainingSamples,
      },
    ]);
  } catch (e) {
    console.warn('Failed to persist model metrics:', e);
  }

  cachedModels = {
    logisticModel,
    linearModel,
    preprocessor,
    logisticMetrics,
    linearMetrics,
    trainingSamples,
    trainedAt,
  };

  return cachedModels;
}

// Run batch predictions on a dataset and return results
export function runBatchPredictions(
  models: TrainedModels,
  rows: DatasetRow[]
): Array<{ row: DatasetRow; result: PredictionResult }> {
  return rows.map((row) => {
    const input: PredictionInput = {
      age: row.age,
      gender: row.gender,
      education_level: row.education_level,
      department: row.department,
      job_role: row.job_role,
      years_at_company: row.years_at_company,
      years_of_experience: row.years_of_experience,
      num_companies_worked: row.num_companies_worked,
      overtime: row.overtime,
      job_satisfaction: row.job_satisfaction,
      work_life_balance: row.work_life_balance,
      performance_rating: row.performance_rating,
      monthly_income: row.monthly_income,
      previous_salary: row.previous_salary,
    };
    return { row, result: runPrediction(models, input) };
  });
}
