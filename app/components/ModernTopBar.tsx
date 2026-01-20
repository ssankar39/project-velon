'use client';

import React, { useState } from 'react';
import { User, ChevronDown, UserCircle, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

interface ModernTopBarProps {
  userName?: string;
  userEmail?: string;
  activeUsers?: number;
  totalUsers?: number;
  onBreak?: number;
  onModuleChange?: (module: 'profile' | 'settings') => void;
  onLogout?: () => void;
}

export const ModernTopBar: React.FC<ModernTopBarProps> = ({
  userName,
  userEmail,
  onModuleChange,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayName = userName?.split(' ')[0] || userEmail?.split('@')[0] || 'User';

  return (
    <header className="fixed top-0 left-0 right-0 h-20 glass z-40 flex items-center justify-between px-8 animate-slideInLeft">
      {/* Left: Brand Logo */}
      <div className="flex items-center gap-3">
        <Link href="/landing" className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-white">Velon</h1>
      </div>

      {/* Right: Admin Profile */}
      <div className="flex items-center gap-4 relative">
        <div className="text-right">
          <p className="text-m font-semibold text-white">Hello, {displayName}</p>
        </div>

        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 glass-light px-4 py-2 rounded-lg hover:bg-purple-600/30 transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden animate-fadeIn">
            <button
              onClick={() => {
                onModuleChange?.('profile');
                setDropdownOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-purple-600/30 transition-all"
            >
              <UserCircle size={18} />
              <span>Profile</span>
            </button>
            <button
              onClick={() => {
                onModuleChange?.('settings');
                setDropdownOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-purple-600/30 transition-all"
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <div className="border-t border-white/10" />
            <button
              onClick={() => {
                onLogout?.();
                setDropdownOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-600/20 transition-all"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
