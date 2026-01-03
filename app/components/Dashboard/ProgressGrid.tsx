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
    <div className="glass rounded-2xl p-6 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300 animate-fadeIn">
      <h3 className="text-lg font-semibold text-white mb-4">{label}</h3>
      <div className="relative w-32 h-32 mb-2">
        <svg className="w-32 h-32" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.1)"
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
            style={{ transition: 'stroke-dashoffset 0.3s ease', filter: 'drop-shadow(0 0 8px ' + color + ')' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-300">
        <span className="text-white font-semibold">{current}</span> / {total} {unit}
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <CircularProgress
        percentage={caloriesPercentage}
        color="#8b5cf6"
        label="Daily Calories"
        current={stats.caloriesConsumed}
        total={stats.caloriesGoal}
        unit="cal"
      />
      <CircularProgress
        percentage={fastingPercentage}
        color="#fbbf24"
        label="Fasting Goal"
        current={Math.floor(stats.fastingProgress)}
        total={stats.fastingGoal}
        unit="hours"
      />
      <CircularProgress
        percentage={workoutsPercentage}
        color="#a78bfa"
        label="Weekly Workouts"
        current={stats.workoutsThisWeek}
        total={stats.workoutGoal}
        unit="workouts"
      />
    </div>
  );
};
