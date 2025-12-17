'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Menu, UserCircle, LogOut } from 'lucide-react';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header className="sticky top-0 z-100 bg-[#141A1F] shadow-lg border-b border-white/10">
      <div className="relative flex items-center justify-center px-6 py-0 h-14 w-full">
        {/* Desktop Navigation */}
        <div className="hidden md:flex">
          <NavTabs onModuleChange={onModuleChange} activeModule={activeModule} />
        </div>

        {/* Username Dropdown */}
        <div className="absolute right-6 hidden md:flex items-center gap-3">
          {currentUser && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded font-semibold transition"
              >
                {currentUser.name?.split(' ')[0] || currentUser.email.split('@')[0]}
              </button>
              {dropdownOpen && (
                <div className="absolute top-full mt-2 right-0 bg-[#2D3748] rounded-lg shadow-xl overflow-hidden min-w-[160px] py-1">
                  <button
                    onClick={() => {
                      onModuleChange('profile');
                      setDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-white hover:bg-[#3d4a5c] transition flex items-center gap-3 text-sm"
                  >
                    <UserCircle className="w-4 h-4" />
                    Account
                  </button>
                  <button
                    onClick={() => {
                      onLogout?.();
                      setDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-white hover:bg-[#3d4a5c] transition flex items-center gap-3 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
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
        <div className="md:hidden bg-[#141A1F] px-6 py-4">
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
