'use client';

import React, { useState, useEffect } from 'react';
import { Dumbbell, Flame, TrendingUp } from 'lucide-react';
import { LiveActivityCard } from './LiveActivityCard';

interface Workout {
  id: string;
  name: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  caloriesBurned: number;
  timestamp: string;
}

interface FastingSession {
  id: string;
  protocol: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  completedAt?: string;
}


interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface RightSidebarProps {
  userId?: string;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ userId }) => {
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFasting, setActiveFasting] = useState<FastingSession | null>(null);

  useEffect(() => {
    fetchRecentWorkouts();
    fetchActiveData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchActiveData = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const user: AuthUser = JSON.parse(storedUser);
      const userEmail = userId || user.email;
      
      // Fetch today's workouts (most recent one)
      // Fetch active fasting session
      const fastingRes = await fetch(`/api/fasting?userId=${encodeURIComponent(userEmail)}`);
      const fastingSessions: FastingSession[] = await fastingRes.json();
      const active = fastingSessions.find(s => s.isActive);
      if (active) {
        setActiveFasting(active);
      }
    } catch (error) {
      console.error('Error fetching active data:', error);
    }
  };

  const fetchRecentWorkouts = async () => {
    try {
      setLoading(true);
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const user: AuthUser = JSON.parse(storedUser);
      const userEmail = userId || user.email;

      // Fetch workouts from the last 7 days
      const response = await fetch(`/api/workouts?userId=${encodeURIComponent(userEmail)}`);
      if (!response.ok) throw new Error('Failed to fetch workouts');

      const allWorkouts: Workout[] = await response.json();
      
      // Get unique recent workouts (last 5)
      const recent = allWorkouts.slice(0, 5);
      setRecentWorkouts(recent);
    } catch (error) {
      console.error('Error fetching recent workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low':
        return 'from-blue-500 to-blue-600';
      case 'medium':
        return 'from-yellow-500 to-orange-500';
      case 'high':
        return 'from-red-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const calculateFastingProgress = () => {
    if (!activeFasting) return { duration: '0h 0m', totalTime: '0h 0m' };

    const start = new Date(activeFasting.startTime).getTime();
    const now = Date.now();
    const elapsed = now - start;
    const total = parseInt(activeFasting.protocol) * 60 * 60 * 1000;

    const formatTime = (ms: number) => {
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    };

    const cappedElapsed = Math.min(Math.max(0, elapsed), total);

    return {
      duration: formatTime(cappedElapsed),
      totalTime: formatTime(total)
    };
  };

  const totalCaloriesBurned = recentWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
  const totalWorkouts = recentWorkouts.length;

  return (
    <aside className="fixed right-0 top-20 h-[calc(100vh-5rem)] w-80 xl:w-96 glass p-6 overflow-y-auto animate-slideInRight">

      {/* Fasting Sessions */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-white mb-4">Fasting Sessions</h3>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
          {activeFasting && (
            <LiveActivityCard
              type="fasting"
              name={`${activeFasting.protocol}h Fast`}
              duration={calculateFastingProgress().duration}
              totalTime={calculateFastingProgress().totalTime}
              status="active"
            />
          )}
          {!activeFasting && (
            <div className="text-center py-8 glass-light rounded-xl">
              <p className="text-gray-400 text-sm">No active fasting session</p>
              <p className="text-xs text-gray-500 mt-1">Start a session to see live data</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-purple-400" />
          <h3 className="text-lg font-bold text-white">Recent Workouts</h3>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Loading workouts...
            </div>
          ) : recentWorkouts.length > 0 ? (
            recentWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="w-full text-left p-4 rounded-lg hover:bg-white/10 transition-colors border border-white/5 animate-fadeIn"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-full bg-linear-to-br ${getIntensityColor(workout.intensity)} flex items-center justify-center`}>
                    <Dumbbell size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{workout.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{formatDate(workout.timestamp)}</span>
                      <span className="text-xs text-purple-400 capitalize">{workout.intensity}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                  {workout.caloriesBurned > 0 && (
                    <div className="flex items-center gap-1">
                      <Flame size={14} className="text-orange-400" />
                      <span className="text-xs text-gray-300 font-semibold">{workout.caloriesBurned} kcal</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              No recent workouts
            </div>
          )}
        </div>
      </div>

      {/* Workout Summary */}
      <div className="glass-light rounded-xl p-4">
        <h4 className="text-white font-semibold mb-3 text-sm">Workout Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Total Workouts</span>
            <span className="text-sm font-bold text-purple-400">{totalWorkouts}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Calories Burned</span>
            <span className="text-sm font-bold text-orange-400">{totalCaloriesBurned} kcal</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
