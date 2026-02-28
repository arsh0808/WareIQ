'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Package, CheckCircle, Clock, AlertTriangle, QrCode, List } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const StaffTaskList: React.FC = () => {
  const router = useRouter();

  const tasks = [
    { id: 1, title: 'Check inventory - Aisle A3', priority: 'high', status: 'pending' },
    { id: 2, title: 'Restock low items - Aisle B2', priority: 'medium', status: 'pending' },
    { id: 3, title: 'Quality check incoming shipment', priority: 'high', status: 'in-progress' },
    { id: 4, title: 'Update product locations', priority: 'low', status: 'pending' },
  ];

  const priorityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="w-5 h-5" />
          My Tasks Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
            >
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 text-blue-600 rounded"
                checked={task.status === 'completed'}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-xs rounded ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                    {task.priority}
                  </span>
                  {task.status === 'in-progress' && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">In Progress</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const StaffQuickActions: React.FC = () => {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto flex-col gap-2 py-4"
          onClick={() => router.push('/inventory')}
        >
          <Package className="w-6 h-6" />
          <span className="text-xs">View Inventory</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col gap-2 py-4"
          onClick={() => {}}
        >
          <QrCode className="w-6 h-6" />
          <span className="text-xs">Scan Item</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col gap-2 py-4"
          onClick={() => router.push('/alerts')}
        >
          <AlertTriangle className="w-6 h-6" />
          <span className="text-xs">My Alerts</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col gap-2 py-4"
          onClick={() => router.push('/reports')}
        >
          <CheckCircle className="w-6 h-6" />
          <span className="text-xs">Daily Report</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export const RecentScansWidget: React.FC = () => {
  const recentScans = [
    { product: 'Product A-123', quantity: 50, time: '2 min ago', type: 'in' },
    { product: 'Product B-456', quantity: 30, time: '5 min ago', type: 'out' },
    { product: 'Product C-789', quantity: 25, time: '12 min ago', type: 'in' },
    { product: 'Product D-101', quantity: 15, time: '18 min ago', type: 'out' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Scans</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentScans.map((scan, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${scan.type === 'in' ? 'bg-green-500' : 'bg-orange-500'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{scan.product}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{scan.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{scan.quantity}</p>
                <p className={`text-xs ${scan.type === 'in' ? 'text-green-600' : 'text-orange-600'}`}>
                  {scan.type === 'in' ? 'IN' : 'OUT'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
