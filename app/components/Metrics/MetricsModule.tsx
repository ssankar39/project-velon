'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, BarChart3 } from 'lucide-react';

interface Metric {
  id: string;
  weight?: number;
  bodyFat?: number;
  bmi?: number;
  bmr?: number;
  tdee?: number;
  timestamp: string;
}

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export const MetricsModule: React.FC = () => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [formState, setFormState] = useState({
    weight: '',
    bodyFat: '',
    bmi: '',
    bmr: '',
    tdee: '',
  });

  const fetchMetrics = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/metrics?userId=${encodeURIComponent(currentUser.email)}`);
      const data = await response.json();
      setMetrics(data || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchMetrics();
    }
  }, [currentUser, fetchMetrics]);

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.weight && !formState.bodyFat && !formState.bmi) {
      alert('Please fill in at least one metric');
      return;
    }

    if (!currentUser) {
      alert('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      const metricData = {
        userId: currentUser.email,
        weight: formState.weight ? parseFloat(formState.weight) : null,
        bodyFat: formState.bodyFat ? parseFloat(formState.bodyFat) : null,
        bmi: formState.bmi ? parseFloat(formState.bmi) : null,
        bmr: formState.bmr ? parseFloat(formState.bmr) : null,
        tdee: formState.tdee ? parseFloat(formState.tdee) : null,
      };
      console.log('Sending metric data:', metricData);
      const response = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metricData),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('API error response:', errorData);
        } catch {
          console.error('Failed to parse error response:', await response.text());
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error(errorData.details || errorData.error || 'Failed to add metric');
      }

      const newMetric = await response.json();
      setMetrics([newMetric, ...metrics]);
      setFormState({ weight: '', bodyFat: '', bmi: '', bmr: '', tdee: '' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error adding metric:', errorMessage);
      alert(`Failed to add metric: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const latestMetric = metrics.length > 0 ? metrics[0] : null;
  const previousMetric = metrics.length > 1 ? metrics[1] : null;

  const getWeightChange = () => {
    if (latestMetric?.weight && previousMetric?.weight) {
      return (latestMetric.weight - previousMetric.weight).toFixed(1);
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto p-4">
      {/* Log Metrics Card */}
      <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeIn">
        <div className="flex items-center gap-3 mb-6">
          <Plus className="w-6 h-6 text-purple-400" />
          <h3 className="text-2xl font-semibold text-white">Log Metrics</h3>
        </div>

        <form onSubmit={handleAddMetric} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Weight (lbs)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g., 165.5"
              value={formState.weight}
              onChange={(e) => setFormState({ ...formState, weight: e.target.value })}
              className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Body Fat %</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g., 18.5"
              value={formState.bodyFat}
              onChange={(e) => setFormState({ ...formState, bodyFat: e.target.value })}
              className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">BMI</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g., 24.8"
              value={formState.bmi}
              onChange={(e) => setFormState({ ...formState, bmi: e.target.value })}
              className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">BMR (kcal/day)</label>
            <input
              type="number"
              placeholder="e.g., 1650"
              value={formState.bmr}
              onChange={(e) => setFormState({ ...formState, bmr: e.target.value })}
              className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">TDEE (kcal/day)</label>
            <input
              type="number"
              placeholder="e.g., 2400"
              value={formState.tdee}
              onChange={(e) => setFormState({ ...formState, tdee: e.target.value })}
              className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging...
              </>
            ) : (
              'Log Metrics'
            )}
          </button>
        </form>
      </div>

      {/* Metrics History Card */}
      <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeIn">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          <h3 className="text-2xl font-semibold text-white">Your Metrics</h3>
        </div>

        {loading && metrics.length === 0 ? (
          <p className="text-gray-400 text-center py-8 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading metrics...
          </p>
        ) : !latestMetric ? (
          <p className="text-gray-400 text-center py-8">No metrics logged yet</p>
        ) : (
          <div className="space-y-4">
            {/* Current Stats */}
            <div className="glass-light border-l-4 border-purple-500 rounded-lg p-4">
              <p className="text-sm text-gray-300 mb-2">Latest Entry - {formatDate(latestMetric.timestamp)}</p>
              <div className="grid grid-cols-2 gap-3">
                {latestMetric.weight && (
                  <div>
                    <p className="text-xs text-gray-400">Weight</p>
                    <p className="text-lg font-bold text-purple-400">
                      {latestMetric.weight} lbs
                      {getWeightChange() && (
                        <span className={getWeightChange()?.startsWith('-') ? 'text-green-600' : 'text-red-600'}>
                          {' '}({getWeightChange()})
                        </span>
                      )}
                    </p>
                  </div>
                )}
                {latestMetric.bodyFat && (
                  <div>
                    <p className="text-xs text-gray-400">Body Fat</p>
                    <p className="text-lg font-bold text-purple-400">{latestMetric.bodyFat}%</p>
                  </div>
                )}
                {latestMetric.bmi && (
                  <div>
                    <p className="text-xs text-gray-400">BMI</p>
                    <p className="text-lg font-bold text-purple-400">{latestMetric.bmi}</p>
                  </div>
                )}
                {latestMetric.bmr && (
                  <div>
                    <p className="text-xs text-gray-400">BMR</p>
                    <p className="text-lg font-bold text-purple-400">{latestMetric.bmr} kcal</p>
                  </div>
                )}
              </div>
            </div>

            {/* History */}
            {metrics.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-2">History</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {metrics.slice(1, 6).map((metric) => (
                    <div key={metric.id} className="text-sm p-2 glass-light rounded">
                      <p className="text-gray-300 font-medium">{formatDate(metric.timestamp)}</p>
                      <p className="text-gray-400">
                        {metric.weight && `Weight: ${metric.weight} lbs`}
                        {metric.weight && metric.bodyFat && ' • '}
                        {metric.bodyFat && `Body Fat: ${metric.bodyFat}%`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsModule;
