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
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Plus className="w-6 h-6 text-gray-700" />
          <h3 className="text-2xl font-semibold text-gray-900">Log Metrics</h3>
        </div>

        <form onSubmit={handleAddMetric} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (lbs)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g., 165.5"
              value={formState.weight}
              onChange={(e) => setFormState({ ...formState, weight: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Body Fat %</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g., 18.5"
              value={formState.bodyFat}
              onChange={(e) => setFormState({ ...formState, bodyFat: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">BMI</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g., 24.8"
              value={formState.bmi}
              onChange={(e) => setFormState({ ...formState, bmi: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">BMR (kcal/day)</label>
            <input
              type="number"
              placeholder="e.g., 1650"
              value={formState.bmr}
              onChange={(e) => setFormState({ ...formState, bmr: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">TDEE (kcal/day)</label>
            <input
              type="number"
              placeholder="e.g., 2400"
              value={formState.tdee}
              onChange={(e) => setFormState({ ...formState, tdee: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-gray-700" />
          <h3 className="text-2xl font-semibold text-gray-900">Your Metrics</h3>
        </div>

        {loading && metrics.length === 0 ? (
          <p className="text-gray-500 text-center py-8 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading metrics...
          </p>
        ) : !latestMetric ? (
          <p className="text-gray-500 text-center py-8">No metrics logged yet</p>
        ) : (
          <div className="space-y-4">
            {/* Current Stats */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Latest Entry - {formatDate(latestMetric.timestamp)}</p>
              <div className="grid grid-cols-2 gap-3">
                {latestMetric.weight && (
                  <div>
                    <p className="text-xs text-gray-600">Weight</p>
                    <p className="text-lg font-bold text-purple-700">
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
                    <p className="text-xs text-gray-600">Body Fat</p>
                    <p className="text-lg font-bold text-purple-700">{latestMetric.bodyFat}%</p>
                  </div>
                )}
                {latestMetric.bmi && (
                  <div>
                    <p className="text-xs text-gray-600">BMI</p>
                    <p className="text-lg font-bold text-purple-700">{latestMetric.bmi}</p>
                  </div>
                )}
                {latestMetric.bmr && (
                  <div>
                    <p className="text-xs text-gray-600">BMR</p>
                    <p className="text-lg font-bold text-purple-700">{latestMetric.bmr} kcal</p>
                  </div>
                )}
              </div>
            </div>

            {/* History */}
            {metrics.length > 1 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">History</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {metrics.slice(1, 6).map((metric) => (
                    <div key={metric.id} className="text-sm p-2 bg-gray-50 rounded">
                      <p className="text-gray-600 font-medium">{formatDate(metric.timestamp)}</p>
                      <p className="text-gray-500">
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
