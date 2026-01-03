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
        <ActivityGraph 
          title="Weekly Calorie Burn Progress" 
          metricType="calories"
          userId={currentUser?.email}
        />
      </div>

      {/* Stats Overview */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-4">Quick Stats</h3>
        <StatsGrid stats={stats} />
      </div>
    </div>
  );
};

