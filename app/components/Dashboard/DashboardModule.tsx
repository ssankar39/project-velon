'use client';

import React, { useState, useEffect } from 'react';
import { UserStats } from '@/app/types';
import { StatsGrid } from './StatsGrid';
import { Loader2 } from 'lucide-react';
import { ActivityGraph } from '../ActivityGraph';
import { DatePicker } from '../DatePicker';

interface DashboardModuleProps {
  stats: UserStats;
}

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({ stats: initialStats }) => {
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [weightGoal, setWeightGoal] = useState<number | null>(null);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalInput, setGoalInput] = useState('');

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
      fetchStats();
      fetchWeightGoal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchWeightGoal = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/user/preferences?userId=${encodeURIComponent(currentUser.email)}`);
      if (response.ok) {
        const data = await response.json();
        setWeightGoal(data.weightGoal || null);
        setShowGoalInput(!data.weightGoal);
      }
    } catch (error) {
      console.error('Error fetching weight goal:', error);
    }
  };

  const fetchStats = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/user/stats?userId=${encodeURIComponent(currentUser.email)}`);

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWeightGoal = async () => {
    if (!currentUser || !goalInput) return;
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.email,
          weightGoal: parseFloat(goalInput),
        }),
      });
      if (response.ok) {
        setWeightGoal(parseFloat(goalInput));
        setShowGoalInput(false);
        setGoalInput('');
      }
    } catch (error) {
      console.error('Error saving weight goal:', error);
      alert('Failed to save weight goal');
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-lg text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn px-8">
      {/* Date Picker */}
      <DatePicker />

      {/* Main Analytics Graph */}
      <div className="mb-6">
        {showGoalInput || !weightGoal ? (
          <div className="glass rounded-2xl p-6 animate-fadeIn">
            <h3 className="text-xl font-bold text-white mb-4">Set Your Weight Goal</h3>
            <p className="text-gray-400 mb-4">Enter your target weight to track your progress on the graph.</p>
            <div className="flex gap-3 max-w-md">
              <input
                type="number"
                step="0.1"
                placeholder="Enter weight goal (lbs)"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="flex-1 px-4 py-2 glass-light rounded-lg focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/50 text-white placeholder-gray-400 border border-white/10"
              />
              <button
                onClick={saveWeightGoal}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              >
                Save Goal
              </button>
            </div>
          </div>
        ) : (
          <ActivityGraph 
            title="Weight Progress" 
            metricType="weight"
            userId={currentUser?.email}
            weightGoal={weightGoal}
          />
        )}
      </div>

      {/* Stats Overview */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-4">Quick Stats</h3>
        <StatsGrid stats={stats} />
      </div>
    </div>
  );
};

