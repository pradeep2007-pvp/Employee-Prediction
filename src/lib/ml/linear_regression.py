"""
Multiple Linear Regression — gradient descent with L2 regularization.

Python equivalent of src/lib/ml/linearRegression.ts.
Uses the same algorithm and default hyperparameters:
  learning_rate = 0.001, iterations = 1500, l2 = 0.0001
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Optional
import math


# ── helpers ──────────────────────────────────────────────────────────────────

def dot(a: List[float], b: List[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


# ── model ────────────────────────────────────────────────────────────────────

@dataclass
class LinearRegressionModel:
    weights: List[float] = field(default_factory=list)
    bias: float = 0.0
    iterations: int = 0
    learning_rate: float = 0.0


def train_linear_regression(
    X: List[List[float]],
    y: List[float],
    *,
    learning_rate: float = 0.001,
    iterations: int = 1500,
    l2: float = 0.0001,
) -> LinearRegressionModel:
    n = len(X)
    d = len(X[0]) if n > 0 else 0

    weights = [0.0] * d
    bias = 0.0

    for _ in range(iterations):
        grad_w = [0.0] * d
        grad_b = 0.0

        for i in range(n):
            pred = dot(weights, X[i]) + bias
            error = pred - y[i]

            for j in range(d):
                grad_w[j] += error * X[i][j]
            grad_b += error

        for j in range(d):
            grad_w[j] = (grad_w[j] / n) + l2 * weights[j]
            weights[j] -= learning_rate * grad_w[j]
        bias -= learning_rate * (grad_b / n)

    return LinearRegressionModel(
        weights=weights, bias=bias,
        iterations=iterations, learning_rate=learning_rate,
    )


def predict_linear_regression(model: LinearRegressionModel, features: List[float]) -> float:
    return dot(model.weights, features) + model.bias


# ── evaluation ───────────────────────────────────────────────────────────────

@dataclass
class RegressionMetrics:
    mae: float
    mse: float
    rmse: float
    r2: float


def evaluate_regression(
    model: LinearRegressionModel,
    X: List[List[float]],
    y: List[float],
) -> RegressionMetrics:
    predictions = [predict_linear_regression(model, x) for x in X]
    n = len(y)
    y_mean = sum(y) / n

    sum_abs_error = 0.0
    sum_sq_error = 0.0
    sum_sq_total = 0.0

    for i in range(n):
        error = y[i] - predictions[i]
        sum_abs_error += abs(error)
        sum_sq_error += error * error
        sum_sq_total += (y[i] - y_mean) ** 2

    mae = sum_abs_error / n
    mse = sum_sq_error / n
    rmse = math.sqrt(mse)
    r2 = (1 - sum_sq_error / sum_sq_total) if sum_sq_total > 0 else 0.0

    return RegressionMetrics(mae=mae, mse=mse, rmse=rmse, r2=r2)


# ── demo / quick test ────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Simple sanity check — y = 3x + 2
    X = [[1], [2], [3], [4], [5]]
    y = [5.0, 8.0, 11.0, 14.0, 17.0]

    model = train_linear_regression(X, y, learning_rate=0.01, iterations=5000)
    metrics = evaluate_regression(model, X, y)

    print(f"Weights: {model.weights}")
    print(f"Bias:    {model.bias:.4f}")
    print(f"R²:      {metrics.r2:.4f}")
    print(f"RMSE:    {metrics.rmse:.4f}")
