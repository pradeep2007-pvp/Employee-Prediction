import { useEffect, useState } from 'react';
import { Cpu, Brain, TrendingUp, Database, RefreshCw, Info } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ChartCard } from '@/components/ui/StatCard';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { fetchModelMetrics, getOrTrainModels, clearModelCache, type TrainedModels } from '@/lib/ml/service';
import type { ModelMetrics } from '@/lib/supabase';
import { formatDateTime } from '@/lib/constants';
import toast from 'react-hot-toast';

export function ModelPerformance() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ModelMetrics[]>([]);
  const [models, setModels] = useState<TrainedModels | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetchModelMetrics(user.id),
      getOrTrainModels(user.id),
    ])
      .then(([m, mdl]) => {
        setMetrics(m);
        setModels(mdl);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleRetrain = async () => {
    if (!user) return;
    setRetraining(true);
    clearModelCache();
    try {
      const mdl = await getOrTrainModels(user.id);
      setModels(mdl);
      const m = await fetchModelMetrics(user.id);
      setMetrics(m);
      toast.success('Models retrained successfully!');
    } catch {
      toast.error('Failed to retrain models.');
    } finally {
      setRetraining(false);
    }
  };

  const logisticMetrics = metrics.find((m) => m.model_type === 'Logistic Regression');
  const linearMetrics = metrics.find((m) => m.model_type === 'Multiple Linear Regression');

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-900">Model Performance</h1>
          <p className="text-sm text-slate-500 mt-1">Machine learning model evaluation metrics.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CardSkeleton /><CardSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Model Performance</h1>
          <p className="text-sm text-slate-500 mt-1">Machine learning model evaluation metrics.</p>
        </div>
        <Button variant="outline" onClick={handleRetrain} loading={retraining}>
          <RefreshCw size={18} />
          Retrain Models
        </Button>
      </div>

      {models && (
        <div className="card p-4 mb-6 bg-navy-50/30">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-navy-700">
              <Database size={16} />
              <span>Training samples: <strong>{models.trainingSamples}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-sm text-navy-700">
              <Cpu size={16} />
              <span>Trained at: <strong>{formatDateTime(models.trainedAt)}</strong></span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logistic Regression */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-red-50 text-red-600">
              <Brain size={22} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy-900">Logistic Regression</h2>
              <p className="text-xs text-slate-400">Attrition Classification Model</p>
            </div>
          </div>

          {logisticMetrics ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'Accuracy', value: logisticMetrics.metrics.accuracy, pct: true },
                  { label: 'Precision', value: logisticMetrics.metrics.precision, pct: true },
                  { label: 'Recall', value: logisticMetrics.metrics.recall, pct: true },
                  { label: 'F1 Score', value: logisticMetrics.metrics.f1Score, pct: true },
                ].map((m) => {
                  const val = m.value as number;
                  return (
                    <div key={m.label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-400">{m.label}</p>
                      <p className="text-xl font-bold text-navy-900 mt-1">
                        {m.pct ? `${(val * 100).toFixed(1)}%` : val.toFixed(4)}
                      </p>
                      <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${val * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confusion Matrix */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Confusion Matrix</p>
                <div className="grid grid-cols-3 gap-1 max-w-xs">
                  <div className="text-center text-xs text-slate-400 p-2">Actual \ Pred</div>
                  <div className="text-center text-xs font-medium text-slate-500 p-2 bg-slate-50 rounded">Stay</div>
                  <div className="text-center text-xs font-medium text-slate-500 p-2 bg-slate-50 rounded">Leave</div>

                  <div className="text-center text-xs font-medium text-slate-500 p-2 bg-slate-50 rounded">Stay</div>
                  <div className="text-center p-3 bg-green-50 rounded text-green-700 font-bold text-sm border border-green-200">
                    {(logisticMetrics.metrics.confusionMatrix as number[][])[0][0]}
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded text-red-700 font-bold text-sm border border-red-200">
                    {(logisticMetrics.metrics.confusionMatrix as number[][])[0][1]}
                  </div>

                  <div className="text-center text-xs font-medium text-slate-500 p-2 bg-slate-50 rounded">Leave</div>
                  <div className="text-center p-3 bg-red-50 rounded text-red-700 font-bold text-sm border border-red-200">
                    {(logisticMetrics.metrics.confusionMatrix as number[][])[1][0]}
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded text-green-700 font-bold text-sm border border-green-200">
                    {(logisticMetrics.metrics.confusionMatrix as number[][])[1][1]}
                  </div>
                </div>
                <div className="flex gap-4 mt-3 text-xs text-slate-400">
                  <span>TN: True Negative</span>
                  <span>FP: False Positive</span>
                  <span>FN: False Negative</span>
                  <span>TP: True Positive</span>
                </div>
              </div>
            </>
          ) : (
            <EmptyState icon={Info} title="Model metrics will appear after training." />
          )}
        </div>

        {/* Linear Regression */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600">
              <TrendingUp size={22} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy-900">Multiple Linear Regression</h2>
              <p className="text-xs text-slate-400">Salary Prediction Model</p>
            </div>
          </div>

          {linearMetrics ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'MAE', value: linearMetrics.metrics.mae as number, desc: 'Mean Absolute Error', format: 'currency' },
                  { label: 'MSE', value: linearMetrics.metrics.mse as number, desc: 'Mean Squared Error', format: 'plain' },
                  { label: 'RMSE', value: linearMetrics.metrics.rmse as number, desc: 'Root Mean Squared Error', format: 'currency' },
                  { label: 'R²', value: linearMetrics.metrics.r2 as number, desc: 'R-squared Score', format: 'pct' },
                ].map((m) => (
                  <div key={m.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400">{m.label}</p>
                    <p className="text-xl font-bold text-navy-900 mt-1">
                      {m.format === 'currency' && `₹${Math.round(m.value).toLocaleString('en-IN')}`}
                      {m.format === 'plain' && m.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      {m.format === 'pct' && `${(m.value * 100).toFixed(1)}%`}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{m.desc}</p>
                  </div>
                ))}
              </div>

              {/* R² visualization */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Model Fit (R² Score)</p>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all"
                    style={{ width: `${(linearMetrics.metrics.r2 as number) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0% (No fit)</span>
                  <span>100% (Perfect fit)</span>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  R² indicates how well the model explains salary variance. Higher is better.
                </p>
              </div>
            </>
          ) : (
            <EmptyState icon={Info} title="Model metrics will appear after training." />
          )}
        </div>
      </div>

      {/* Data pipeline visualization */}
      <div className="card p-6 mt-6">
        <h3 className="text-sm font-semibold text-navy-900 mb-4">ML Pipeline</h3>
        <div className="flex flex-wrap items-center gap-2">
          {['Data Collection', 'Data Cleaning', 'Preprocessing', 'Feature Engineering', 'Model Training', 'Model Evaluation', 'Prediction'].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <div className="px-3 py-2 bg-navy-50 text-navy-700 rounded-xl text-xs font-medium">
                {step}
              </div>
              {i < arr.length - 1 && <span className="text-slate-300">→</span>}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
