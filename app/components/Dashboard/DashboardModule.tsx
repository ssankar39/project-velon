'use client';

import React from 'react';
import { UserStats } from '@/app/types';
import { StatsGrid } from './StatsGrid';
import { ProgressGrid } from './ProgressGrid';

interface DashboardModuleProps {
  stats: UserStats;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({ stats }) => {
  return (
    <div className="animate-fadeIn">
      <div className="text-center py-10 px-4">
        <h2 className="text-4xl font-bold text-gray-800 drop-shadow-sm">
          Your Fitness Dashboard
        </h2>
      </div>

      <StatsGrid stats={stats} />

      <div className="mb-8">
        <ProgressGrid stats={stats} />
      </div>
    </div>
  );
};
