'use client';

import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import NavTabs from './Navigation/NavTabs';

type ModuleType = 'dashboard' | 'calories' | 'calculator' | 'fasting' | 'workouts' | 'metrics';

interface HeaderProps {
  onModuleChange: (module: ModuleType) => void;
  activeModule: ModuleType;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onModuleChange, activeModule, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-100 bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
      <div className="flex items-center justify-between px-6 py-0 h-14 w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-white/25 rounded flex items-center justify-center font-bold text-white text-sm">
            D
          </div>
          <h1 className="text-lg font-semibold text-white">Dashboard</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex">
          <NavTabs onModuleChange={onModuleChange} activeModule={activeModule} />
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="hidden md:block px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded font-semibold transition"
          >
            Logout
          </button>
        )}

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
        </div>
      )}
    </header>
  );
};
