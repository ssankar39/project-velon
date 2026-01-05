'use client';

import React from 'react';
import {
  BarChart3,
  Utensils,
  Calculator,
  Timer,
  Dumbbell,
  Target,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

type ModuleType = 'dashboard' | 'calories' | 'calculator' | 'fasting' | 'workouts' | 'metrics' | 'profile' | 'settings';

interface GlassSidebarProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  onLogout?: () => void;
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
  onLogout,
}) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-20 glass z-50 flex flex-col items-center py-6 animate-slideInLeft">
      {/* Logo/Brand */}

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col gap-4 w-full px-3">
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

      {/* Bottom Actions */}
      <div className="flex flex-col gap-4 w-full px-3 pt-4 border-t border-white/10">
        <button
          onClick={() => onModuleChange('profile')}
          className={`group relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
            activeModule === 'profile'
              ? 'bg-purple-600 shadow-lg'
              : 'glass-light hover:bg-purple-600/30'
          }`}
          title="Profile"
        >
          <User
            size={24}
            className={`transition-all ${
              activeModule === 'profile' ? 'text-white' : 'text-gray-300 group-hover:text-white'
            }`}
          />

          {/* Tooltip */}
          <div className="absolute left-full ml-4 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            Profile
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
          </div>
        </button>

        <button
          onClick={() => onModuleChange('settings')}
          className={`group relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
            activeModule === 'settings'
              ? 'bg-purple-600 shadow-lg'
              : 'glass-light hover:bg-purple-600/30'
          }`}
          title="Settings"
        >
          <Settings
            size={24}
            className={`transition-all ${
              activeModule === 'settings' ? 'text-white' : 'text-gray-300 group-hover:text-white'
            }`}
          />

          {/* Tooltip */}
          <div className="absolute left-full ml-4 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            Settings
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
          </div>
        </button>

        <button
          onClick={onLogout}
          className="group relative w-14 h-14 rounded-xl flex items-center justify-center glass-light hover:bg-red-600/30 transition-all duration-300"
          title="Logout"
        >
          <LogOut size={24} className="text-gray-300 group-hover:text-red-400 transition-all" />

          {/* Tooltip */}
          <div className="absolute left-full ml-4 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            Logout
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
          </div>
        </button>
      </div>
    </aside>
  );
};
