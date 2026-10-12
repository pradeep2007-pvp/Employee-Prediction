// Linear Algebra helpers for ML operations

export type Vector = number[];
export type Matrix = number[][];

export function dot(a: Vector, b: Vector): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export function addVectors(a: Vector, b: Vector): Vector {
  return a.map((v, i) => v + b[i]);
}

export function scaleVector(v: Vector, s: number): Vector {
  return v.map((x) => x * s);
}

export function mean(v: number[]): number {
  if (v.length === 0) return 0;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

export function std(v: number[]): number {
  if (v.length <= 1) return 0;
  const m = mean(v);
  const variance = v.reduce((acc, x) => acc + (x - m) ** 2, 0) / (v.length - 1);
  return Math.sqrt(variance);
}

export function sigmoid(z: number): number {
  if (z < -35) return 0;
  if (z > 35) return 1;
  return 1 / (1 + Math.exp(-z));
}
