import { useEffect, useState, useCallback } from 'react';
import { employeeApi, predictionApi, type Employee, type Prediction } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export function useEmployees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await employeeApi.list();
      setEmployees(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addEmployee = async (emp: Omit<Employee, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const data = await employeeApi.create(emp);
    setEmployees((prev) => [data, ...prev]);
    return data;
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    const data = await employeeApi.update(id, updates);
    setEmployees((prev) => prev.map((e) => (e.id === id ? data : e)));
    return data;
  };

  const deleteEmployee = async (id: string) => {
    await employeeApi.remove(id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  return { employees, loading, error, refetch: fetch, addEmployee, updateEmployee, deleteEmployee };
}

export function usePredictions() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await predictionApi.list();
      setPredictions(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addPrediction = async (pred: Omit<Prediction, 'id' | 'user_id' | 'created_at'>) => {
    const data = await predictionApi.create(pred);
    setPredictions((prev) => [data, ...prev]);
    return data;
  };

  const deletePrediction = async (id: string) => {
    await predictionApi.remove(id);
    setPredictions((prev) => prev.filter((p) => p.id !== id));
  };

  return { predictions, loading, error, refetch: fetch, addPrediction, deletePrediction };
}
