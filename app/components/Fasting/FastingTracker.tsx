'use client';

import React, { useState, useEffect } from 'react';
import { FastingState } from '@/app/types';
import { Clock } from 'lucide-react';

interface FastingTrackerProps {
  onFastingUpdate: (state: FastingState, progress: number) => void;
}

interface FormState {
  protocol: '16' | '18' | '20' | '24' | 'custom';
  customHours: number;
  startTime: string;
}

export const FastingTracker: React.FC<FastingTrackerProps> = ({ onFastingUpdate }) => {
  const [formState, setFormState] = useState<FormState>({
    protocol: '16',
    customHours: 16,
    startTime: '',
  });

  const [fastingState, setFastingState] = useState<FastingState>({
    isActive: false,
    startTime: null,
    endTime: null,
    protocol: '16',
    customHours: null,
  });

  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Timer effect
  useEffect(() => {
    if (!fastingState.isActive || !fastingState.startTime || !fastingState.endTime) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const startTime = new Date(fastingState.startTime!);
      const endTime = new Date(fastingState.endTime!);

      const totalDuration = endTime.getTime() - startTime.getTime();
      const elapsed = now.getTime() - startTime.getTime();
      const remaining = endTime.getTime() - now.getTime();

      if (remaining <= 0) {
        setFastingState((prev) => ({
          ...prev,
          isActive: false,
        }));
        setTimeRemaining('🎉 Fasting complete!');
        setProgressPercent(100);
        return;
      }

      const progressP = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
      setProgressPercent(progressP);

      const hrs = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeRemaining(`⏳ Time remaining: ${hrs}h ${mins}m ${secs}s`);

      // Update parent with progress
      const hoursElapsed = elapsed / (1000 * 60 * 60);
      onFastingUpdate(fastingState, hoursElapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [fastingState, onFastingUpdate]);

  const handleStartFast = (e: React.FormEvent) => {
    e.preventDefault();

    const hours =
      formState.protocol === 'custom' ? formState.customHours : parseInt(formState.protocol);

    const startTime = new Date(formState.startTime);
    if (isNaN(startTime.getTime())) {
      alert('Please enter a valid start time.');
      return;
    }

    const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

    setFastingState({
      isActive: true,
      startTime,
      endTime,
      protocol: formState.protocol,
      customHours: formState.protocol === 'custom' ? formState.customHours : null,
    });

    setTimeRemaining('');
    setProgressPercent(0);
  };

  const handleEndFast = () => {
    setFastingState({
      isActive: false,
      startTime: null,
      endTime: null,
      protocol: formState.protocol,
      customHours: null,
    });
    setTimeRemaining('');
    setProgressPercent(0);
    setFormState({ ...formState, startTime: '' });
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-gray-700" />
          <h3 className="text-2xl font-semibold text-gray-900">
            Intermittent Fasting Tracker
          </h3>
        </div>

        {!fastingState.isActive ? (
          <form onSubmit={handleStartFast} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fasting Protocol
                </label>
                <select
                  value={formState.protocol}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      protocol: e.target.value as '16' | '18' | '20' | '24' | 'custom',
                    })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="16">16:8 (16 hours fast)</option>
                  <option value="18">18:6 (18 hours fast)</option>
                  <option value="20">20:4 (20 hours fast)</option>
                  <option value="24">24 Hours Fast</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {formState.protocol === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Fasting Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={formState.customHours}
                    onChange={(e) =>
                      setFormState({ ...formState, customHours: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Enter hours"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formState.startTime}
                onChange={(e) => setFormState({ ...formState, startTime: e.target.value })}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all"
            >
              Start Fast
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded">
              <p className="text-emerald-700 font-medium">
                ✅ Fasting started! Ends at{' '}
                <strong>{fastingState.endTime?.toLocaleString()}</strong>
              </p>
            </div>

            <div>
              <div className="bg-gray-200 rounded-lg h-4 overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-center text-lg font-semibold text-gray-900">{timeRemaining}</p>
            </div>

            <button
              onClick={handleEndFast}
              className="w-full px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
            >
              End Fast Early
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
