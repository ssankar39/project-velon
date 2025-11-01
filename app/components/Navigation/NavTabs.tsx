'use client';

import React from 'react';
import {
  BarChart3,
  Utensils,
  Timer,
  Dumbbell,
  Target,
} from 'lucide-react';

type ModuleType = 'dashboard' | 'calories' | 'calculator' | 'fasting' | 'workouts' | 'metrics';

interface NavTabsProps {
  onModuleChange: (module: ModuleType) => void;
  activeModule: ModuleType;
  mobile?: boolean;
}

const modules = [
  { id: 'dashboard' as ModuleType, label: 'Dashboard', icon: BarChart3, disabled: false },
  { id: 'calories' as ModuleType, label: 'Calories', icon: Utensils, disabled: false },
  { id: 'calculator' as ModuleType, label: 'Calculator', icon: Timer, disabled: false },
  { id: 'fasting' as ModuleType, label: 'Fasting', icon: Timer, disabled: false },
  { id: 'workouts' as ModuleType, label: 'Workouts', icon: Dumbbell, disabled: true },
  { id: 'metrics' as ModuleType, label: 'Metrics', icon: Target, disabled: true },
];

export const NavTabs: React.FC<NavTabsProps> = ({ onModuleChange, activeModule, mobile = false }) => {
  return (
    <nav
      className={`flex ${
        mobile ? 'flex-col gap-2' : 'gap-10 overflow-x-auto'
      } items-center`}
    >
      {modules.map((module) => {
        const Icon = module.icon;
        return (
          <button
            key={module.id}
            onClick={() => !module.disabled && onModuleChange(module.id)}
            disabled={module.disabled}
            className={`flex items-center gap-2 px-0 py-2 font-medium whitespace-nowrap transition-all duration-200 border-b-2 ${
              mobile ? 'justify-end w-full max-w-sm' : ''
            } ${
              activeModule === module.id
                ? 'text-white border-b-white'
                : 'text-white/90 border-b-transparent hover:text-white'
            } ${
              module.disabled
                ? 'text-white/50 cursor-not-allowed opacity-60'
                : 'cursor-pointer'
            }`}
          >
            <Icon size={20} />
            <span className="text-sm md:text-base">{module.label}</span>
            {module.disabled && (
              <span className="text-xs bg-white/20 text-white/80 px-2 py-0.5 rounded-full ml-1">
                Soon
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default NavTabs;
