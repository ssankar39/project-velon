'use client';

import React from 'react';
import { UserStats } from '@/app/types';

interface CircularProgressProps {
  percentage: number;
  color: string;
  label: string;
  current: number | string;
  total: number | string;
  unit?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  color,
  label,
  current,
  total,
  unit = '',
}) => {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{label}</h3>
      <div className="relative w-32 h-32 mb-2">
        <svg className="w-32 h-32" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="transparent"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600">
        {current} / {total} {unit}
      </p>
    </div>
  );
};

interface ProgressGridProps {
  stats: UserStats;
}

export const ProgressGrid: React.FC<ProgressGridProps> = ({ stats }) => {
  const caloriesPercentage = stats.caloriesGoal ? (stats.caloriesConsumed / stats.caloriesGoal) * 100 : 0;
  const fastingPercentage = stats.fastingGoal ? (stats.fastingProgress / stats.fastingGoal) * 100 : 0;
  const workoutsPercentage = stats.workoutGoal ? (stats.workoutsThisWeek / stats.workoutGoal) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
      <CircularProgress
        percentage={caloriesPercentage}
        color="#10b981"
        label="Daily Calories"
        current={stats.caloriesConsumed}
        total={stats.caloriesGoal}
        unit="cal"
      />
      <CircularProgress
        percentage={fastingPercentage}
        color="#3b82f6"
        label="Fasting Goal"
        current={Math.floor(stats.fastingProgress)}
        total={stats.fastingGoal}
        unit="hours"
      />
      <CircularProgress
        percentage={workoutsPercentage}
        color="#8b5cf6"
        label="Weekly Workouts"
        current={stats.workoutsThisWeek}
        total={stats.workoutGoal}
        unit="workouts"
      />
    </div>
  );
};
