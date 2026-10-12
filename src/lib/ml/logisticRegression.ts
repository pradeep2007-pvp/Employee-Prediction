// Logistic Regression implementation (gradient descent)

import { sigmoid, dot, addVectors, scaleVector } from './linalg';
import type { FeatureVector } from './preprocessing';

export type LogisticRegressionModel = {
  weights: number[];
  bias: number;
  iterations: number;
  learningRate: number;
};

export function trainLogisticRegression(
  X: FeatureVector[],
  y: number[],
  options: { learningRate?: number; iterations?: number; l2?: number } = {}
): LogisticRegressionModel {
  const lr = options.learningRate ?? 0.01;
  const iterations = options.iterations ?? 1000;
  const l2 = options.l2 ?? 0.001;

  const n = X.length;
  const d = X[0]?.length ?? 0;

  let weights = new Array(d).fill(0);
  let bias = 0;

  for (let iter = 0; iter < iterations; iter++) {
    const gradW = new Array(d).fill(0);
    let gradB = 0;

    for (let i = 0; i < n; i++) {
      const z = dot(weights, X[i]) + bias;
      const pred = sigmoid(z);
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

export function predictLogisticRegression(
  model: LogisticRegressionModel,
  features: FeatureVector
): { probability: number; prediction: number } {
  const z = dot(model.weights, features) + model.bias;
  const probability = sigmoid(z);
  const prediction = probability >= 0.5 ? 1 : 0;
  return { probability, prediction };
}

export type ClassificationMetrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
};

export function evaluateClassification(
  model: LogisticRegressionModel,
  X: FeatureVector[],
  y: number[]
): ClassificationMetrics {
  let tp = 0, fp = 0, tn = 0, fn = 0;

  for (let i = 0; i < X.length; i++) {
    const { prediction } = predictLogisticRegression(model, X[i]);
    if (prediction === 1 && y[i] === 1) tp++;
    else if (prediction === 1 && y[i] === 0) fp++;
    else if (prediction === 0 && y[i] === 0) tn++;
    else fn++;
  }

  const accuracy = (tp + tn) / (tp + tn + fp + fn);
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix: [[tn, fp], [fn, tp]],
  };
}
