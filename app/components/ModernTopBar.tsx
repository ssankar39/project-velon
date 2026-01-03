'use client';

import React, { useState, useEffect } from 'react';
import { User, ChevronDown } from 'lucide-react';

interface ModernTopBarProps {
  userName?: string;
  userEmail?: string;
  activeUsers?: number;
  totalUsers?: number;
  onBreak?: number;
}

export const ModernTopBar: React.FC<ModernTopBarProps> = ({
  userName,
  userEmail,
  activeUsers = 0,
  totalUsers = 0,
  onBreak = 0,
}) => {
  const [, setDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const displayName = userName?.split(' ')[0] || userEmail?.split('@')[0] || 'User';

  return (
    <header className="fixed top-0 left-20 right-0 h-20 glass z-40 flex items-center justify-between px-8 animate-slideInLeft">
      {/* Left: Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-lg">FT</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">FitTrack Pro</h1>
          <p className="text-xs text-gray-400">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Center: Active Status Pill */}
      <div className="glass-light px-6 py-3 rounded-full flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-gray-300">
            <span className="text-white font-semibold">{activeUsers}</span> of{' '}
            <span className="text-white font-semibold">{totalUsers}</span> goals active
          </span>
        </div>

        {onBreak > 0 && (
          <>
            <div className="w-px h-6 bg-white/20" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-sm text-gray-300">
                <span className="text-white font-semibold">{onBreak}</span> resting
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right: Admin Profile */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-white">{displayName}</p>
          <p className="text-xs text-gray-400">Admin</p>
        </div>

        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 glass-light px-4 py-2 rounded-lg hover:bg-purple-600/30 transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </button>
      </div>
    </header>
  );
};
