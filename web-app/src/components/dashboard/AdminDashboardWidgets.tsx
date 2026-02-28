'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, Warehouse, TrendingUp, AlertTriangle, Settings, UserPlus, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const AdminSystemOverview: React.FC = () => {
  const router = useRouter();

  const systemMetrics = [
    { label: 'System Uptime', value: '99.9%', color: 'text-green-600' },
    { label: 'Total Storage', value: '2.4 TB', color: 'text-blue-600' },
    { label: 'API Calls Today', value: '45.2K', color: 'text-purple-600' },
    { label: 'Active Sessions', value: '128', color: 'text-orange-600' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          System Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {systemMetrics.map((metric) => (
            <div key={metric.label} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">{metric.label}</p>
              <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const AdminQuickActions: React.FC = () => {
  const router = useRouter();

  const actions = [
    {
      label: 'Add User',
      icon: UserPlus,
      onClick: () => router.push('/users'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      label: 'New Warehouse',
      icon: Building,
      onClick: () => router.push('/warehouses'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      label: 'System Settings',
      icon: Settings,
      onClick: () => router.push('/settings'),
      color: 'bg-gray-500 hover:bg-gray-600',
    },
    {
      label: 'View Alerts',
      icon: AlertTriangle,
      onClick: () => router.push('/alerts'),
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              onClick={action.onClick}
              className={`h-auto flex-col gap-2 py-4 text-white ${action.color}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{action.label}</span>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export const WarehouseOverviewWidget: React.FC = () => {
  const warehouses = [
    { name: 'Warehouse A', utilization: 85, status: 'optimal', alerts: 2 },
    { name: 'Warehouse B', utilization: 92, status: 'warning', alerts: 5 },
    { name: 'Warehouse C', utilization: 67, status: 'optimal', alerts: 0 },
    { name: 'Warehouse D', utilization: 78, status: 'optimal', alerts: 1 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="w-5 h-5" />
          Warehouse Status Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {warehouses.map((wh) => (
            <div key={wh.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {wh.name}
                  </span>
                  {wh.alerts > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                      {wh.alerts} alerts
                    </span>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {wh.utilization}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    wh.utilization > 90
                      ? 'bg-red-500'
                      : wh.utilization > 75
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${wh.utilization}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const UserActivityWidget: React.FC = () => {
  const recentUsers = [
    { name: 'John Smith', role: 'Manager', action: 'Updated inventory', time: '2 min ago' },
    { name: 'Sarah Johnson', role: 'Staff', action: 'Scanned 45 items', time: '5 min ago' },
    { name: 'Mike Davis', role: 'Manager', action: 'Created report', time: '12 min ago' },
    { name: 'Emily Brown', role: 'Staff', action: 'Added new product', time: '18 min ago' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Recent User Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentUsers.map((user, idx) => (
            <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{user.action}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">{user.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
