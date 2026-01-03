'use client';

import React from 'react';
import { Dumbbell, Utensils, Timer, TrendingUp } from 'lucide-react';

interface LiveActivityCardProps {
  type: 'workout' | 'meal' | 'fasting' | 'progress';
  name: string;
  image?: string;
  duration: string;
  totalTime: string;
  status: 'active' | 'completed' | 'paused';
  dotData?: number[]; // Array of values for dot grid visualization
}

export const LiveActivityCard: React.FC<LiveActivityCardProps> = ({
  type,
  name,
  image,
  duration,
  totalTime,
  status,
  dotData = [],
}) => {
  const getIcon = () => {
    switch (type) {
      case 'workout':
        return <Dumbbell size={20} className="text-purple-400" />;
      case 'meal':
        return <Utensils size={20} className="text-yellow-400" />;
      case 'fasting':
        return <Timer size={20} className="text-green-400" />;
      case 'progress':
        return <TrendingUp size={20} className="text-blue-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
    }
  };

  // Generate dot grid if no data provided
  const generateDots = () => {
    if (dotData.length > 0) return dotData;
    return Array.from({ length: 48 }, () => Math.random());
  };

  const dots = generateDots();

  return (
    <div className="glass rounded-2xl p-5 animate-fadeIn hover:scale-105 transition-transform duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {image ? (
            <img src={image} alt={name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              {getIcon()}
            </div>
          )}
          <div>
            <h4 className="text-white font-semibold">{name}</h4>
            <p className="text-xs text-gray-400 capitalize">{type}</p>
          </div>
        </div>

        {/* Status indicator with pulse animation */}
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          {status === 'active' && (
            <div className={`absolute inset-0 w-3 h-3 rounded-full ${getStatusColor()} animate-ping opacity-75`} />
          )}
        </div>
      </div>

      {/* Time stats */}
      <div className="flex justify-between mb-4">
        <div>
          <p className="text-xs text-gray-400">Duration</p>
          <p className="text-lg font-bold text-white">{duration}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total Time</p>
          <p className="text-lg font-bold text-white">{totalTime}</p>
        </div>
      </div>

      {/* Dot grid visualization */}
      <div className="grid grid-cols-12 gap-1 p-3 glass-light rounded-lg">
        {dots.map((value, index) => {
          const intensity = value > 0.5 ? 'high' : 'low';
          const color = intensity === 'high' ? 'bg-purple-500' : 'bg-yellow-500';
          const opacity = value > 0.7 ? 'opacity-100' : value > 0.4 ? 'opacity-60' : 'opacity-30';

          return (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${color} ${opacity} transition-all hover:scale-150`}
              title={`Activity: ${Math.round(value * 100)}%`}
            />
          );
        })}
      </div>
    </div>
  );
};
