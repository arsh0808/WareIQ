'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Badge } from './ui/Badge';
import { toast } from '@/lib/hooks/useToast';
import type { UserRole } from '@/lib/firebase/auth';

interface UserProfileDropdownProps {
  user: any;
  userRole: UserRole | null;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ user, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out', 'You have been logged out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Logout failed', 'Please try again');
    }
  };

  const handleSettings = () => {
    setIsOpen(false);
    router.push('/settings');
  };

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getRoleBadgeVariant = () => {
    switch (userRole?.role) {
      case 'admin':
        return 'success';
      case 'manager':
        return 'info';
      case 'staff':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {}
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
              {getUserInitials()}
            </div>
          )}

          {}
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
              {user?.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              {userRole?.role || 'Loading...'}
            </p>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          {}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg">
                  {getUserInitials()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Badge variant={getRoleBadgeVariant()} size="sm">
              {userRole?.role?.toUpperCase() || 'USER'}
            </Badge>
          </div>

          {}
          <div className="py-2">
            {}
            <button
              onClick={handleSettings}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Account Settings</span>
            </button>
          </div>

          {}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
