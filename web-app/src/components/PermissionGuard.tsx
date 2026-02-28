'use client';

import React from 'react';
import { UserRole } from '@/lib/firebase/auth';
import { Shield, AlertCircle } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  userRole: UserRole | null;
  allowedRoles: UserRole['role'][];
  fallback?: React.ReactNode;
  showMessage?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  userRole,
  allowedRoles,
  fallback,
  showMessage = false,
}) => {
  if (!userRole || !allowedRoles.includes(userRole.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showMessage) {
      return (
        <div className="flex items-center justify-center p-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Access Restricted
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access this feature.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Required role: {allowedRoles.join(', ')}
            </p>
          </div>
        </div>
      );
    }
    
    return null;
  }

  return <>{children}</>;
};

interface RoleRequiredProps {
  children: React.ReactNode;
  userRole: UserRole | null;
  requiredRole: 'admin' | 'manager' | 'staff' | 'viewer';
  mode?: 'exact' | 'minimum'; // exact = must be that role, minimum = must be at least that role
  fallback?: React.ReactNode;
}

const roleHierarchy: Record<UserRole['role'], number> = {
  admin: 4,
  manager: 3,
  staff: 2,
  viewer: 1,
};

export const RoleRequired: React.FC<RoleRequiredProps> = ({
  children,
  userRole,
  requiredRole,
  mode = 'minimum',
  fallback,
}) => {
  if (!userRole) {
    return fallback ? <>{fallback}</> : null;
  }

  const hasPermission =
    mode === 'exact'
      ? userRole.role === requiredRole
      : roleHierarchy[userRole.role] >= roleHierarchy[requiredRole];

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

interface RoleBadgeProps {
  role: UserRole['role'];
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800',
    manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    staff: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800',
    viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600',
  };

  const roleIcons = {
    admin: '👑',
    manager: '🎯',
    staff: '👤',
    viewer: '👁️',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClasses[size]} ${roleColors[role]}`}
    >
      <span>{roleIcons[role]}</span>
      <span className="capitalize">{role}</span>
    </span>
  );
};

export const usePermission = (userRole: UserRole | null) => {
  const hasRole = (allowedRoles: UserRole['role'][]) => {
    return userRole ? allowedRoles.includes(userRole.role) : false;
  };

  const isAdmin = () => hasRole(['admin']);
  const isManager = () => hasRole(['admin', 'manager']);
  const isStaff = () => hasRole(['admin', 'manager', 'staff']);
  const canManageUsers = () => hasRole(['admin', 'manager']);
  const canManageWarehouses = () => hasRole(['admin']);
  const canViewAnalytics = () => hasRole(['admin', 'manager']);
  const canEditInventory = () => hasRole(['admin', 'manager', 'staff']);
  const canDeleteInventory = () => hasRole(['admin', 'manager']);
  const canManageDevices = () => hasRole(['admin', 'manager']);
  const canViewAuditLogs = () => hasRole(['admin', 'manager']);

  return {
    hasRole,
    isAdmin: isAdmin(),
    isManager: isManager(),
    isStaff: isStaff(),
    canManageUsers: canManageUsers(),
    canManageWarehouses: canManageWarehouses(),
    canViewAnalytics: canViewAnalytics(),
    canEditInventory: canEditInventory(),
    canDeleteInventory: canDeleteInventory(),
    canManageDevices: canManageDevices(),
    canViewAuditLogs: canViewAuditLogs(),
    role: userRole?.role,
  };
};
