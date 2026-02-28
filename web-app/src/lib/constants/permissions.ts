import { UserRole } from '@/lib/firebase/auth';

export const PAGE_PERMISSIONS: Record<string, UserRole['role'][]> = {
  '/dashboard': ['admin', 'manager', 'staff', 'viewer'],
  '/warehouses': ['admin', 'manager'],
  '/inventory': ['admin', 'manager', 'staff'],
  '/products': ['admin', 'manager', 'staff'],
  '/shelves': ['admin', 'manager', 'staff'],
  '/suppliers': ['admin', 'manager'],
  '/transactions': ['admin', 'manager', 'staff'],
  '/devices': ['admin', 'manager'],
  '/alerts': ['admin', 'manager', 'staff'],
  '/analytics': ['admin', 'manager'],
  '/reports': ['admin', 'manager', 'staff'],
  '/users': ['admin', 'manager'],
  '/audit-logs': ['admin', 'manager'],
  '/settings': ['admin', 'manager'],
};

export const FEATURE_PERMISSIONS = {
  canManageUsers: ['admin', 'manager'] as UserRole['role'][],
  canManageWarehouses: ['admin'] as UserRole['role'][],
  canViewAnalytics: ['admin', 'manager'] as UserRole['role'][],
  canEditInventory: ['admin', 'manager', 'staff'] as UserRole['role'][],
  canDeleteInventory: ['admin', 'manager'] as UserRole['role'][],
  canManageDevices: ['admin', 'manager'] as UserRole['role'][],
  canViewAuditLogs: ['admin', 'manager'] as UserRole['role'][],
  canManageSuppliers: ['admin', 'manager'] as UserRole['role'][],
  canExportData: ['admin', 'manager'] as UserRole['role'][],
  canImportData: ['admin', 'manager'] as UserRole['role'][],
  canManageSettings: ['admin', 'manager'] as UserRole['role'][],
};

export const ROLE_DESCRIPTIONS: Record<UserRole['role'], string> = {
  admin: 'Full system access with all administrative privileges',
  manager: 'Warehouse management with most operational controls',
  staff: 'Basic warehouse operations and inventory management',
  viewer: 'Read-only access to view warehouse data',
};

export const ROLE_COLORS = {
  admin: {
    bg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-800 dark:text-purple-200',
    border: 'border-purple-200 dark:border-purple-800',
  },
  manager: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-800',
  },
  staff: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-800 dark:text-green-200',
    border: 'border-green-200 dark:border-green-800',
  },
  viewer: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-800 dark:text-gray-200',
    border: 'border-gray-200 dark:border-gray-600',
  },
};
