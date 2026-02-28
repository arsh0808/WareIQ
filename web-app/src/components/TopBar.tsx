'use client';

import React from 'react';
import { UserProfileDropdown } from './UserProfileDropdown';
import type { UserRole } from '@/lib/firebase/auth';
import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface TopBarProps {
  user: any;
  userRole: UserRole | null;
  onMobileMenuToggle?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, userRole, onMobileMenuToggle }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between">
        {}
        <div className="flex items-center gap-4">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          
          {}
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Smart Warehouse
            </h1>
          </div>
        </div>

        {}
        <div className="flex items-center gap-3">
          {}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <div className="relative w-6 h-6">
              <Sun
                className={`absolute inset-0 w-6 h-6 text-yellow-500 transition-all duration-300 ${
                  theme === 'light' ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
                }`}
              />
              <Moon
                className={`absolute inset-0 w-6 h-6 text-blue-400 transition-all duration-300 ${
                  theme === 'dark' ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
                }`}
              />
            </div>
          </button>

          {}
          <UserProfileDropdown user={user} userRole={userRole} />
        </div>
      </div>
    </div>
  );
};
