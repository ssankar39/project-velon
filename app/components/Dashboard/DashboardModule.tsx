'use client';

import React, { useState, useEffect } from 'react';
import { UserStats } from '@/app/types';
import { StatsGrid } from './StatsGrid';
import { ProgressGrid } from './ProgressGrid';
import { Loader2 } from 'lucide-react';

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
      // Refresh stats every 30 seconds
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
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
        <div className="flex items-center gap-2 text-lg text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="text-center py-10 px-4">
        <h2 className="text-4xl font-bold text-gray-800 drop-shadow-sm">
          Your Fitness Dashboard
        </h2>
        {loading && (
          <p className="text-sm text-gray-500 mt-2 flex items-center justify-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Updating...
          </p>
        )}
      </div>

      <StatsGrid stats={stats} />

      <div className="mb-8">
        <ProgressGrid stats={stats} />
      </div>
    </div>
  );
};
