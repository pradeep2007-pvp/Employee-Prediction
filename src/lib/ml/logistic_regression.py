"""
Logistic Regression — gradient descent with L2 regularization.

Python equivalent of src/lib/ml/logisticRegression.ts.
Uses the same algorithm and default hyperparameters:
  learning_rate = 0.01, iterations = 1000, l2 = 0.001
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Optional
import math


# ── helpers ──────────────────────────────────────────────────────────────────

def dot(a: List[float], b: List[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


def sigmoid(z: float) -> float:
    if z < -35:
        return 0.0
    if z > 35:
        return 1.0
    return 1.0 / (1.0 + math.exp(-z))


# ── model ────────────────────────────────────────────────────────────────────

@dataclass
class LogisticRegressionModel:
    weights: List[float] = field(default_factory=list)
    bias: float = 0.0
    iterations: int = 0
    learning_rate: float = 0.0


def train_logistic_regression(
    X: List[List[float]],
    y: List[int],
    *,
    learning_rate: float = 0.01,
    iterations: int = 1000,
    l2: float = 0.001,
) -> LogisticRegressionModel:
    n = len(X)
    d = len(X[0]) if n > 0 else 0

    weights = [0.0] * d
    bias = 0.0

    for _ in range(iterations):
        grad_w = [0.0] * d
        grad_b = 0.0

        for i in range(n):
            z = dot(weights, X[i]) + bias
            pred = sigmoid(z)
            error = pred - y[i]

            for j in range(d):
                grad_w[j] += error * X[i][j]
            grad_b += error

        for j in range(d):
            grad_w[j] = (grad_w[j] / n) + l2 * weights[j]
            weights[j] -= learning_rate * grad_w[j]
        bias -= learning_rate * (grad_b / n)

    return LogisticRegressionModel(
        weights=weights, bias=bias,
        iterations=iterations, learning_rate=learning_rate,
    )


def predict_logistic_regression(
    model: LogisticRegressionModel,
    features: List[float],
    threshold: float = 0.5,
) -> Dict[str, float]:
    z = dot(model.weights, features) + model.bias
    probability = sigmoid(z)
    prediction = 1 if probability >= threshold else 0
    return {"probability": probability, "prediction": prediction}


# ── evaluation ───────────────────────────────────────────────────────────────

@dataclass
class ClassificationMetrics:
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]


def evaluate_classification(
    model: LogisticRegressionModel,
    X: List[List[float]],
    y: List[int],
    threshold: float = 0.5,
) -> ClassificationMetrics:
    tp = fp = tn = fn = 0

    for i in range(len(X)):
        result = predict_logistic_regression(model, X[i], threshold)
        pred = int(result["prediction"])

        if pred == 1 and y[i] == 1:
            tp += 1
        elif pred == 1 and y[i] == 0:
            fp += 1
        elif pred == 0 and y[i] == 0:
            tn += 1
        else:
            fn += 1

    total = tp + tn + fp + fn
    accuracy = (tp + tn) / total if total > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1_score = (
        (2 * precision * recall) / (precision + recall)
        if (precision + recall) > 0 else 0.0
    )

    return ClassificationMetrics(
        accuracy=accuracy,
        precision=precision,
        recall=recall,
        f1_score=f1_score,
        confusion_matrix=[[tn, fp], [fn, tp]],
    )


# ── demo / quick test ────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Simple sanity check — separable data
    X = [[0.1], [0.5], [1.0], [1.5], [2.0], [3.0], [3.5], [4.0]]
    y = [0,    0,    0,    0,    1,    1,    1,    1]

    model = train_logistic_regression(X, y, learning_rate=0.1, iterations=2000)
    metrics = evaluate_classification(model, X, y)

    print(f"Weights:     {model.weights}")
    print(f"Bias:        {model.bias:.4f}")
    print(f"Accuracy:    {metrics.accuracy:.4f}")
    print(f"Precision:   {metrics.precision:.4f}")
    print(f"Recall:      {metrics.recall:.4f}")
    print(f"F1 Score:    {metrics.f1_score:.4f}")
    print(f"Confusion:   {metrics.confusion_matrix}")
