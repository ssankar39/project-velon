'use client';

import React from 'react';
import { Clock, Pause, Play, Coffee } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  type: 'starting' | 'break';
  reason?: string;
  duration?: string;
  image?: string;
}

interface RightSidebarProps {
  startingActivities?: Activity[];
  breakActivities?: Activity[];
}

const defaultStarting: Activity[] = [
  { id: '1', name: 'Morning Run', type: 'starting', image: undefined },
  { id: '2', name: 'Meal Prep', type: 'starting', image: undefined },
];

const defaultBreaks: Activity[] = [
  { id: '3', name: 'Rest Day', type: 'break', reason: 'Recovery', duration: '12:30' },
  { id: '4', name: 'Lunch Break', type: 'break', reason: 'Meal time', duration: '08:15' },
];

export const RightSidebar: React.FC<RightSidebarProps> = ({
  startingActivities = defaultStarting,
  breakActivities = defaultBreaks,
}) => {
  return (
    <aside className="fixed right-0 top-20 h-[calc(100vh-5rem)] w-80 glass p-6 overflow-y-auto animate-slideInRight">
      {/* Starting Activities */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Play size={20} className="text-green-400" />
          <h3 className="text-lg font-bold text-white">Starting Activities</h3>
        </div>

        <div className="space-y-3">
          {startingActivities.map((activity) => (
            <div
              key={activity.id}
              className="glass-light rounded-xl p-4 hover:bg-purple-600/20 transition-all cursor-pointer animate-fadeIn"
            >
              <div className="flex items-center gap-3">
                {activity.image ? (
                  <img
                    src={activity.image}
                    alt={activity.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Play size={16} className="text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{activity.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-slow" />
                    <span className="text-xs text-gray-400">Initiating...</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {startingActivities.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No activities starting
            </div>
          )}
        </div>
      </div>

      {/* Break Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Pause size={20} className="text-yellow-400" />
          <h3 className="text-lg font-bold text-white">On Break</h3>
        </div>

        <div className="space-y-3">
          {breakActivities.map((activity) => (
            <div
              key={activity.id}
              className="glass-light rounded-xl p-4 border-l-4 border-yellow-500 animate-fadeIn"
            >
              <div className="flex items-center gap-3 mb-2">
                {activity.image ? (
                  <img
                    src={activity.image}
                    alt={activity.name}
                    className="w-10 h-10 rounded-full object-cover grayscale"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Coffee size={16} className="text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{activity.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Pause size={12} className="text-yellow-400" />
                    <span className="text-xs text-gray-400">{activity.reason || 'Break'}</span>
                  </div>
                </div>
              </div>

              {activity.duration && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                  <Clock size={14} className="text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-semibold">{activity.duration}</span>
                  <span className="text-xs text-gray-400">elapsed</span>
                </div>
              )}
            </div>
          ))}

          {breakActivities.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No one on break
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 glass-light rounded-xl p-4">
        <h4 className="text-white font-semibold mb-3 text-sm">Today&apos;s Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Active Goals</span>
            <span className="text-sm font-bold text-green-400">3</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Completed</span>
            <span className="text-sm font-bold text-blue-400">7</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">On Break</span>
            <span className="text-sm font-bold text-yellow-400">{breakActivities.length}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
