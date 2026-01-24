'use client';

import React from 'react';
import {
  BarChart3,
  Utensils,
  Calculator,
  Timer,
  Dumbbell,
  Target,
  X,
} from 'lucide-react';

type ModuleType = 'dashboard' | 'calories' | 'calculator' | 'fasting' | 'workouts' | 'metrics' | 'profile' | 'settings';

interface GlassSidebarProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

const navigationItems = [
  { id: 'dashboard' as ModuleType, icon: BarChart3, label: 'Dashboard' },
  { id: 'calories' as ModuleType, icon: Utensils, label: 'Calories' },
  { id: 'calculator' as ModuleType, icon: Calculator, label: 'Calculator' },
  { id: 'fasting' as ModuleType, icon: Timer, label: 'Fasting' },
  { id: 'workouts' as ModuleType, icon: Dumbbell, label: 'Workouts' },
  { id: 'metrics' as ModuleType, icon: Target, label: 'Metrics' },
];

export const GlassSidebar: React.FC<GlassSidebarProps> = ({
  activeModule,
  onModuleChange,
  mobileMenuOpen = false,
  onMobileMenuToggle,
}) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 h-auto max-h-[70vh] w-20 glass z-50 flex-col items-center justify-center py-6 rounded-r-3xl animate-slideInLeft">
      {/* Navigation Icons */}
      <nav className="flex flex-col gap-3 w-full px-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={`group relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'bg-purple-600 shadow-lg'
                  : 'glass-light hover:bg-purple-600/30'
              }`}
              title={item.label}
            >
              <Icon
                size={24}
                className={`transition-all ${
                  isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                }`}
              />

              {/* Tooltip */}
              <div className="absolute left-full ml-4 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
              </div>
            </button>
          );
        })}
      </nav>
    </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 animate-fadeIn"
          onClick={onMobileMenuToggle}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed left-0 top-0 bottom-0 w-64 glass z-50 flex flex-col py-6 transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close Button */}
        <div className="flex justify-between items-center px-6 mb-8">
          <h2 className="text-xl font-bold text-white">Menu</h2>
          <button
            onClick={onMobileMenuToggle}
            className="w-10 h-10 rounded-lg glass-light flex items-center justify-center hover:bg-purple-600/30 transition-all"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-2 px-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onModuleChange(item.id)}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-purple-600 shadow-lg'
                    : 'glass-light hover:bg-purple-600/30'
                }`}
              >
                <Icon
                  size={20}
                  className={`transition-all ${
                    isActive ? 'text-white' : 'text-gray-300'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    isActive ? 'text-white' : 'text-gray-300'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
