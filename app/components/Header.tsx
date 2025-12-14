'use client';

import React, { useState, useEffect } from 'react';
import { Menu, UserCircle } from 'lucide-react';
import NavTabs from './Navigation/NavTabs';

type ModuleType = 'dashboard' | 'calories' | 'calculator' | 'fasting' | 'workouts' | 'metrics' | 'profile';

interface HeaderProps {
  onModuleChange: (module: ModuleType) => void;
  activeModule: ModuleType;
  onLogout?: () => void;
}

interface CurrentUser {
  id: string;
  email: string;
  name?: string;
}

export const Header: React.FC<HeaderProps> = ({ onModuleChange, activeModule, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

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

  return (
    <header className="sticky top-0 z-100 bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
      <div className="relative flex items-center justify-center px-6 py-0 h-14 w-full">
        {/* Logo */}
        <div className="absolute left-6 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => onModuleChange('profile')}
            className="px-4 py-2 hover:bg-white/20 text-white rounded font-semibold transition flex items-center gap-2"
            title="Account Settings"
          >
            <UserCircle className="w-7 h-7" />
          </button>
          {currentUser && (
            <span className="text-white font-medium hidden md:block">
              Welcome, {currentUser.name?.split(' ')[0] || currentUser.email.split('@')[0]}
            </span>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex">
          <NavTabs onModuleChange={onModuleChange} activeModule={activeModule} />
        </div>

        {/* Logout */}
        <div className="absolute right-6 hidden md:flex items-center gap-3">
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded font-semibold transition"
            >
              Logout
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-indigo-600 px-6 py-4">
          <NavTabs
            onModuleChange={(module) => {
              onModuleChange(module);
              setMobileMenuOpen(false);
            }}
            activeModule={activeModule}
            mobile
          />
          <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
            <button
              onClick={() => {
                onModuleChange('profile');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 rounded transition"
            >
              <UserCircle className="w-5 h-5" />
              Account Settings
            </button>
            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded font-semibold transition"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
