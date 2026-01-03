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
    <div className="glass rounded-2xl p-6 hover:scale-105 transition-transform duration-300 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">
            {value}
            {unit && <span className="text-lg font-normal text-gray-400 ml-1">{unit}</span>}
          </p>
          {goal && <p className="text-sm text-gray-300 mt-2">Goal: <span className="text-purple-400 font-semibold">{goal}</span></p>}
          {change && <p className="text-sm font-medium text-yellow-400 mt-2">{change}</p>}
        </div>
        <div className={`${iconBg} p-4 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
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
  const fastingProgress = stats.fastingProgress ?? 0;
  const fastingHours = Math.floor(fastingProgress);
  const fastingMinutes = Math.floor((fastingProgress % 1) * 60);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        label="Calories Today"
        value={(stats.caloriesConsumed ?? 0).toLocaleString()}
        goal={(stats.caloriesGoal ?? 0).toLocaleString()}
        icon={<Utensils className="w-6 h-6 text-white" />}
        iconBg="bg-gradient-to-br from-purple-500 to-purple-700"
      />
      <StatCard
        label="Fast Progress"
        value={`${fastingHours}h ${fastingMinutes}m`}
        goal={`${stats.fastingGoal}h`}
        icon={<Timer className="w-6 h-6 text-white" />}
        iconBg="bg-gradient-to-br from-yellow-500 to-yellow-600"
      />
      <StatCard
        label="Workouts This Week"
        value={stats.workoutsThisWeek ?? 0}
        goal={stats.workoutGoal ?? 0}
        icon={<Activity className="w-6 h-6 text-white" />}
        iconBg="bg-gradient-to-br from-purple-600 to-pink-600"
      />
      <StatCard
        label="Current Weight"
        value={stats.currentWeight ?? 0}
        unit="lbs"
        change={`${stats.weightChange ?? 0} lbs this month`}
        icon={<TrendingDown className="w-6 h-6 text-white" />}
        iconBg="bg-gradient-to-br from-yellow-400 to-orange-500"
      />
    </div>
  );
};
