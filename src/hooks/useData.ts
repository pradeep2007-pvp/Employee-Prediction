import { useEffect, useState, useCallback } from 'react';
import { supabase, type Employee, type Prediction } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useEmployees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setEmployees(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addEmployee = async (emp: Omit<Employee, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('employees')
      .insert({ ...emp, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    setEmployees((prev) => [data, ...prev]);
    return data;
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    const { data, error } = await supabase
      .from('employees')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setEmployees((prev) => prev.map((e) => (e.id === id ? data : e)));
    return data;
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
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
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setPredictions(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addPrediction = async (pred: Omit<Prediction, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('predictions')
      .insert({ ...pred, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    setPredictions((prev) => [data, ...prev]);
    return data;
  };

  const deletePrediction = async (id: string) => {
    const { error } = await supabase.from('predictions').delete().eq('id', id);
    if (error) throw error;
    setPredictions((prev) => prev.filter((p) => p.id !== id));
  };

  return { predictions, loading, error, refetch: fetch, addPrediction, deletePrediction };
}
