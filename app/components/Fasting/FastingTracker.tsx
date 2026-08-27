'use client';

import React, { useState, useEffect } from 'react';
import { FastingState } from '@/app/types';
import { Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/hooks/useAuth';
import { logger } from '@/lib/logger';

interface FastingTrackerProps {
  onFastingUpdate: (state: FastingState, progress: number) => void;
  onStateChange?: () => void;
}

interface FormState {
  protocol: '16' | '18' | '20' | '24' | 'custom';
  customHours: number;
  startTime: string;
}

export const FastingTracker: React.FC<FastingTrackerProps> = ({ onFastingUpdate, onStateChange }) => {
  const { user: currentUser } = useAuth();
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
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Fetch active fasting session on mount
  useEffect(() => {
    if (currentUser) {
      fetchActiveFastingSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchActiveFastingSession = async () => {
    if (!currentUser?.email) return;

    try {
      const response = await fetch(`/api/fasting?userId=${encodeURIComponent(currentUser.email)}`);
      if (!response.ok) return;

      const sessions = await response.json();
      const activeSession = sessions.find((s: { isActive: boolean; endTime: string }) => {
        if (!s.isActive) return false;
        // Check if session hasn't ended yet
        return new Date(s.endTime) > new Date();
      });

      if (activeSession) {
        setSessionId(activeSession.id);
        setFastingState({
          isActive: true,
          startTime: new Date(activeSession.startTime),
          endTime: new Date(activeSession.endTime),
          protocol: activeSession.protocol,
          customHours: null,
        });
      }
    } catch (error) {
      logger.error('Error fetching active fasting session:', error);
    }
  };

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

  const handleStartFast = async (e: React.FormEvent) => {
    e.preventDefault();

    const hours =
      formState.protocol === 'custom' ? formState.customHours : parseInt(formState.protocol);

    const startTime = new Date(formState.startTime);
    if (isNaN(startTime.getTime())) {
      alert('Please enter a valid start time.');
      return;
    }

    if (!currentUser) {
      alert('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

      // Save to database
      const response = await fetch('/api/fasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.email,
          protocol: formState.protocol === 'custom' ? `${formState.customHours}` : formState.protocol,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start fasting session');
      }

      const session = await response.json();
      setSessionId(session.id);

      const newFastingState = {
        isActive: true,
        startTime,
        endTime,
        protocol: formState.protocol,
        customHours: formState.protocol === 'custom' ? formState.customHours : null,
      };

      setFastingState(newFastingState);

      setTimeRemaining('');
      setProgressPercent(0);
      
      // Immediately notify parent of new fasting session
      onFastingUpdate(newFastingState, 0);
      // Trigger refresh of sidebar and dashboard
      onStateChange?.();
    } catch (error) {
      logger.error('Error starting fasting session:', error);
      alert('Failed to start fasting session');
    } finally {
      setLoading(false);
    }
  };

  const handleEndFast = async () => {
    if (!sessionId || !currentUser) {
      logger.error('Cannot end fast - missing session or user');
      alert('Cannot end fast: Session not found');
      return;
    }

    logger.debug('Ending fast session:', sessionId);

    try {
      setLoading(true);
      const response = await fetch(`/api/fasting/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: false,
          completedAt: new Date().toISOString(),
        }),
      });

      logger.debug('End fast response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('Error response:', errorData);
        throw new Error('Failed to end fasting session');
      }

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
      setSessionId('');
      // Trigger refresh of sidebar and dashboard
      onStateChange?.();
    } catch (error) {
      logger.error('Error ending fasting session:', error);
      alert('Failed to end fasting session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeIn">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-purple-400" />
          <h3 className="text-2xl font-semibold text-white">
            Intermittent Fasting Tracker
          </h3>
        </div>

        {!fastingState.isActive ? (
          <form onSubmit={handleStartFast} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
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
                  className="w-full px-3 py-2.5 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                    className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
                    placeholder="Enter hours"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formState.startTime}
                onChange={(e) => setFormState({ ...formState, startTime: e.target.value })}
                required
                className="w-full px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white border border-white/10"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-linear-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Fast'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="glass-light border-l-4 border-purple-500 p-4 rounded">
              <p className="text-purple-400 font-medium">
                ✅ Fasting started! Ends at{' '}
                <strong>{fastingState.endTime?.toLocaleString()}</strong>
              </p>
            </div>

            <div>
              <div className="glass-light rounded-lg h-4 overflow-hidden mb-4">
                <div
                  className="h-full bg-linear-to-r from-purple-600 to-purple-700 rounded-lg transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-center text-lg font-semibold text-white">{timeRemaining}</p>
            </div>

            <button
              onClick={handleEndFast}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ending...
                </>
              ) : (
                'End Fast Early'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
