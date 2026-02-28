'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Warehouse, 
  Package, 
  Radio, 
  Bell, 
  BarChart3, 
  Settings,
  ChevronLeft,
  Menu,
  Users,
  Grid3x3,
  Truck,
  RefreshCw,
  Box,
  FileText,
  ClipboardList,
  Shield,
  UserCheck,
  Activity
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { UserRole } from '@/lib/firebase/auth';
import { RoleBadge } from './PermissionGuard';

interface SidebarProps {
  user: any;
  userRole?: UserRole | null;
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
  allowedRoles: UserRole['role'][];
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, allowedRoles: ['admin', 'manager', 'staff', 'viewer'] },
  { name: 'Warehouses', href: '/warehouses', icon: Warehouse, allowedRoles: ['admin', 'manager'] },
  { name: 'Inventory', href: '/inventory', icon: Package, allowedRoles: ['admin', 'manager', 'staff'] },
  { name: 'Products', href: '/products', icon: Box, allowedRoles: ['admin', 'manager', 'staff'] },
  { name: 'Shelves', href: '/shelves', icon: Grid3x3, allowedRoles: ['admin', 'manager', 'staff'] },
  { name: 'Suppliers', href: '/suppliers', icon: Truck, allowedRoles: ['admin', 'manager'] },
  { name: 'Transactions', href: '/transactions', icon: RefreshCw, allowedRoles: ['admin', 'manager', 'staff'] },
  { name: 'Devices', href: '/devices', icon: Radio, allowedRoles: ['admin', 'manager'] },
  { name: 'Alerts', href: '/alerts', icon: Bell, allowedRoles: ['admin', 'manager', 'staff'] },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, allowedRoles: ['admin', 'manager'] },
  { name: 'Reports', href: '/reports', icon: FileText, allowedRoles: ['admin', 'manager', 'staff'] },
  { name: 'Users', href: '/users', icon: Users, allowedRoles: ['admin', 'manager'] },
  { name: 'Role Management', href: '/role-management', icon: Shield, allowedRoles: ['admin'] },
  { name: 'Bulk Operations', href: '/bulk-operations', icon: UserCheck, allowedRoles: ['admin'] },
  { name: 'System Health', href: '/system-health', icon: Activity, allowedRoles: ['admin'] },
  { name: 'Notifications', href: '/notifications', icon: Bell, allowedRoles: ['admin', 'manager', 'staff', 'viewer'] },
  { name: 'Audit Logs', href: '/audit-logs', icon: ClipboardList, allowedRoles: ['admin', 'manager'] },
];

export default function Sidebar({ user, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!userRole) return false;
    return item.allowedRoles.includes(userRole.role);
  });

  // Add custom scrollbar styles for collapsed state
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .sidebar-nav-collapsed::-webkit-scrollbar {
        width: 4px;
      }
      .sidebar-nav-collapsed::-webkit-scrollbar-track {
        background: transparent;
      }
      .sidebar-nav-collapsed::-webkit-scrollbar-thumb {
        background: rgba(156, 163, 175, 0.3);
        border-radius: 2px;
      }
      .sidebar-nav-collapsed::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.5);
      }
      .sidebar-nav-expanded::-webkit-scrollbar {
        width: 6px;
      }
      .sidebar-nav-expanded::-webkit-scrollbar-track {
        background: transparent;
      }
      .sidebar-nav-expanded::-webkit-scrollbar-thumb {
        background: rgba(156, 163, 175, 0.3);
        border-radius: 3px;
      }
      .sidebar-nav-expanded::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.5);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className={cn(
        "border-b border-gray-200 dark:border-gray-700 transition-all duration-300",
        collapsed ? "p-4" : "p-6"
      )}>
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className={cn(
              "flex items-center gap-3 transition-all duration-300 hover:opacity-80",
              collapsed && "justify-center"
            )}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-105">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <div className="transition-opacity duration-300">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Smart Warehouse
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">IoT System</p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-1 overflow-y-auto transition-all duration-300",
        collapsed ? "p-2 sidebar-nav-collapsed" : "p-4 sidebar-nav-expanded"
      )}>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isHovered = hoveredItem === item.href;
          
          return (
            <div key={item.href} className="relative">
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg transition-all duration-200 group relative overflow-hidden',
                  collapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-[1.02]',
                )}
                onClick={() => setMobileOpen(false)}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Animated background */}
                {!isActive && (
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300",
                    isHovered && "opacity-100"
                  )} />
                )}
                
                <Icon className={cn(
                  'transition-all duration-300 relative z-10',
                  collapsed ? 'w-6 h-6' : 'w-5 h-5',
                  isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'
                )} />
                
                {!collapsed && (
                  <span className="font-medium transition-all duration-200 relative z-10">
                    {item.name}
                  </span>
                )}
                
                {isActive && !collapsed && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse relative z-10" />
                )}
                
                {/* Active indicator for collapsed state */}
                {isActive && collapsed && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
                )}
              </Link>
              
              {/* Tooltip for collapsed state */}
              {collapsed && isHovered && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg shadow-xl whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-2 duration-200">
                  {item.name}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Info Footer */}
      <div className={cn(
        "border-t border-gray-200 dark:border-gray-700 transition-all duration-300",
        collapsed ? "p-2" : "p-4"
      )}>
        {!collapsed && user && userRole && (
          <div className="px-3 py-2 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.displayName || user.email}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
              {user.email}
            </p>
            <RoleBadge role={userRole.role} size="sm" />
          </div>
        )}
        {collapsed && user && (
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg transition-transform duration-300 hover:scale-110 cursor-pointer">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg"
      >
        <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 z-40 h-full w-72 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out sticky top-0 shadow-sm',
          collapsed ? 'w-20' : 'w-72'
        )}
      >
        <SidebarContent />
        
        {/* Expand Button - Improved */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-blue-600 text-white shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center hover:scale-110 active:scale-95 z-50"
            aria-label="Expand sidebar"
          >
            <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
          </button>
        )}
      </aside>
    </>
  );
}
