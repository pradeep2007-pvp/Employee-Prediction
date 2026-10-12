// Multiple Linear Regression implementation (normal equation via gradient descent)

import { dot } from './linalg';
import type { FeatureVector } from './preprocessing';

export type LinearRegressionModel = {
  weights: number[];
  bias: number;
  iterations: number;
  learningRate: number;
};

export function trainLinearRegression(
  X: FeatureVector[],
  y: number[],
  options: { learningRate?: number; iterations?: number; l2?: number } = {}
): LinearRegressionModel {
  const lr = options.learningRate ?? 0.001;
  const iterations = options.iterations ?? 1500;
  const l2 = options.l2 ?? 0.0001;

  const n = X.length;
  const d = X[0]?.length ?? 0;

  let weights = new Array(d).fill(0);
  let bias = 0;

  for (let iter = 0; iter < iterations; iter++) {
    const gradW = new Array(d).fill(0);
    let gradB = 0;

    for (let i = 0; i < n; i++) {
      const pred = dot(weights, X[i]) + bias;
      const error = pred - y[i];

      for (let j = 0; j < d; j++) {
        gradW[j] += error * X[i][j];
      }
      gradB += error;
    }

    for (let j = 0; j < d; j++) {
      gradW[j] = (gradW[j] / n) + l2 * weights[j];
      weights[j] -= lr * gradW[j];
    }
    bias -= lr * (gradB / n);
  }

  return { weights, bias, iterations, learningRate: lr };
}

export function predictLinearRegression(
  model: LinearRegressionModel,
  features: FeatureVector
): number {
  return dot(model.weights, features) + model.bias;
}

export type RegressionMetrics = {
  mae: number;
  mse: number;
  rmse: number;
  r2: number;
};

export function evaluateRegression(
  model: LinearRegressionModel,
  X: FeatureVector[],
  y: number[]
): RegressionMetrics {
  const predictions = X.map((x) => predictLinearRegression(model, x));
  const n = y.length;

  let sumAbsError = 0;
  let sumSqError = 0;
  let sumSqTotal = 0;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  for (let i = 0; i < n; i++) {
    const error = y[i] - predictions[i];
    sumAbsError += Math.abs(error);
    sumSqError += error * error;
    sumSqTotal += (y[i] - yMean) ** 2;
  }

  const mae = sumAbsError / n;
  const mse = sumSqError / n;
  const rmse = Math.sqrt(mse);
  const r2 = sumSqTotal > 0 ? 1 - sumSqError / sumSqTotal : 0;

  return { mae, mse, rmse, r2 };
}
