'use client';

import React from 'react';
import { Utensils, Timer, Activity, TrendingDown } from 'lucide-react';
import { UserStats } from '@/app/types';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  goal?: string | number;
  change?: string;
  icon: React.ReactNode;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  goal,
  change,
  icon,
  iconBg,
}) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value}
            {unit && <span className="text-base font-normal text-gray-500 ml-1">{unit}</span>}
          </p>
          {goal && <p className="text-sm text-gray-600">Goal: {goal}</p>}
          {change && <p className="text-sm font-medium text-amber-500">{change}</p>}
        </div>
        <div className={`${iconBg} p-3 rounded-lg flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface StatsGridProps {
  stats: UserStats;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  const fastingHours = Math.floor(stats.fastingProgress);
  const fastingMinutes = Math.floor((stats.fastingProgress % 1) * 60);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-4">
      <StatCard
        label="Calories Today"
        value={stats.caloriesConsumed.toLocaleString()}
        goal={stats.caloriesGoal.toLocaleString()}
        icon={<Utensils className="w-6 h-6 text-white" />}
        iconBg="bg-emerald-500"
      />
      <StatCard
        label="Fast Progress"
        value={`${fastingHours}h ${fastingMinutes}m`}
        goal={`${stats.fastingGoal}h`}
        icon={<Timer className="w-6 h-6 text-white" />}
        iconBg="bg-blue-500"
      />
      <StatCard
        label="Workouts This Week"
        value={stats.workoutsThisWeek}
        goal={stats.workoutGoal}
        icon={<Activity className="w-6 h-6 text-white" />}
        iconBg="bg-purple-500"
      />
      <StatCard
        label="Current Weight"
        value={stats.currentWeight}
        unit="lbs"
        change={`${stats.weightChange} lbs this month`}
        icon={<TrendingDown className="w-6 h-6 text-white" />}
        iconBg="bg-amber-500"
      />
    </div>
  );
};
