'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { UserRole } from '@/lib/firebase/auth';
import { Lock } from 'lucide-react';

interface PageWrapperProps {
  children: React.ReactNode;
  allowedRoles?: UserRole['role'][];
  requireAuth?: boolean;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
}) => {
  const router = useRouter();
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      router.push('/login');
    }
  }, [loading, requireAuth, user, router]);

  if (loading) {
    return null; // Layout handles loading state
  }

  if (requireAuth && !user) {
    return null;
  }

  // Check if user has required role
  if (allowedRoles && userRole && !allowedRoles.includes(userRole.role)) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Required role: <span className="font-semibold">{allowedRoles.join(', ')}</span>
            <br />
            Your role: <span className="font-semibold">{userRole.role}</span>
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
