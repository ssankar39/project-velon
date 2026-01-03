'use client';

import React, { useState, useEffect } from 'react';
import { UserStats } from '@/app/types';
import { StatsGrid } from './StatsGrid';
import { ProgressGrid } from './ProgressGrid';
import { Loader2 } from 'lucide-react';
import { ActivityGraph } from '../ActivityGraph';
import { LiveActivityCard } from '../LiveActivityCard';
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

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
        <ActivityGraph title="Daily Calorie Progress" />
      </div>

      {/* Stats Overview */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-4">Quick Stats</h3>
        <StatsGrid stats={stats} />
      </div>

      {/* Progress Grid */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-4">Goals Progress</h3>
        <ProgressGrid stats={stats} />
      </div>

      {/* Ongoing Activities */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-4">Active Sessions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LiveActivityCard
            type="workout"
            name="Morning Cardio"
            duration="25:30"
            totalTime="45:00"
            status="active"
          />
          <LiveActivityCard
            type="meal"
            name="Breakfast Logged"
            duration="08:15"
            totalTime="24:00"
            status="completed"
          />
          <LiveActivityCard
            type="fasting"
            name="Intermittent Fast"
            duration="14:30"
            totalTime="16:00"
            status="active"
          />
        </div>
      </div>
    </div>
  );
};

