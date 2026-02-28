'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { useDashboardStats, useRecentActivity } from '@/lib/hooks/useDashboardData';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Package, AlertTriangle, Radio, Bell, Plus, FileText, QrCode, Settings, Users, Warehouse, TrendingUp, Activity } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/hooks/useToast';
import { usePermission, PermissionGuard } from '@/components/PermissionGuard';
import { AdminSystemOverview, WarehouseOverviewWidget, UserActivityWidget } from '@/components/dashboard/AdminDashboardWidgets';
import { StaffTaskList, RecentScansWidget } from '@/components/dashboard/StaffDashboardWidgets';

export default function DashboardPage() {
  const router = useRouter();
  const { user, userRole, loading } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const permissions = usePermission(userRole);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const stats = useDashboardStats(userRole?.warehouseId);
  const { activities } = useRecentActivity(userRole?.warehouseId, 5);

  useEffect(() => {
    if (!userRole?.warehouseId) return;

    const fetchInventoryByCategory = async () => {
      const inventoryQuery = query(
        collection(db, 'inventory'),
        where('warehouseId', '==', userRole.warehouseId)
      );
      const inventorySnapshot = await getDocs(inventoryQuery);
      const productsQuery = query(collection(db, 'products'));
      const productsSnapshot = await getDocs(productsQuery);

      const productMap = new Map();
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        productMap.set(doc.id, data.category);
      });

      const categoryTotals: Record<string, number> = {};
      inventorySnapshot.forEach(doc => {
        const data = doc.data();
        const category = productMap.get(data.productId) || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + (data.quantity || 0);
      });

      const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value
      }));

      setInventoryData(categoryData);
    };

    fetchInventoryByCategory();
  }, [userRole?.warehouseId]);

  const [activityData, setActivityData] = useState([
    { name: 'Mon', items: 0 },
    { name: 'Tue', items: 0 },
    { name: 'Wed', items: 0 },
    { name: 'Thu', items: 0 },
    { name: 'Fri', items: 0 },
    { name: 'Sat', items: 0 },
    { name: 'Sun', items: 0 },
  ]);

  const [inventoryData, setInventoryData] = useState<{ name: string; value: number }[]>([]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
          {}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {userRole?.name || user?.displayName || 'User'}! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {permissions.isAdmin 
                ? "System overview and administrative controls" 
                : permissions.isManager 
                ? "Here's what's happening with your warehouse today"
                : "Your daily warehouse operations dashboard"}
            </p>
          </div>

          {}
          {permissions.isAdmin && (
            <PermissionGuard userRole={userRole} allowedRoles={['admin']}>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <StatCard
                  title="Total Warehouses"
                  value={stats.loading ? '...' : '8'}
                  icon={Warehouse}
                  trend={{ value: '2 new', isPositive: true }}
                  loading={stats.loading}
                  color="purple"
                />
                <StatCard
                  title="Total Users"
                  value={stats.loading ? '...' : '45'}
                  icon={Users}
                  trend={{ value: '12%', isPositive: true }}
                  loading={stats.loading}
                  color="blue"
                />
                <StatCard
                  title="Total Products"
                  value={stats.loading ? '...' : stats.totalProducts.toLocaleString()}
                  icon={Package}
                  trend={{ value: '12%', isPositive: true }}
                  loading={stats.loading}
                  color="blue"
                />
                <StatCard
                  title="System Alerts"
                  value={stats.loading ? '...' : stats.openAlerts.toString()}
                  icon={Bell}
                  trend={{ value: '5 critical', isPositive: false }}
                  loading={stats.loading}
                  color="red"
                />
                <StatCard
                  title="Active Devices"
                  value={stats.loading ? '...' : stats.activeDevices.toString()}
                  icon={Radio}
                  trend={{ value: '98%', isPositive: true }}
                  loading={stats.loading}
                  color="green"
                />
              </div>
            </PermissionGuard>
          )}

          {}
          {permissions.isManager && !permissions.isAdmin && (
            <PermissionGuard userRole={userRole} allowedRoles={['manager']}>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Products"
                  value={stats.loading ? '...' : stats.totalProducts.toLocaleString()}
                  icon={Package}
                  trend={{ value: '12%', isPositive: true }}
                  loading={stats.loading}
                  color="blue"
                />
                <StatCard
                  title="Low Stock Items"
                  value={stats.loading ? '...' : stats.lowStockItems.toString()}
                  icon={AlertTriangle}
                  trend={{ value: '5%', isPositive: false }}
                  loading={stats.loading}
                  color="yellow"
                />
                <StatCard
                  title="Active Devices"
                  value={stats.loading ? '...' : stats.activeDevices.toString()}
                  icon={Radio}
                  trend={{ value: '8%', isPositive: true }}
                  loading={stats.loading}
                  color="green"
                />
                <StatCard
                  title="Open Alerts"
                  value={stats.loading ? '...' : stats.openAlerts.toString()}
                  icon={Bell}
                  trend={{ value: '15%', isPositive: false }}
                  loading={stats.loading}
                  color="red"
                />
              </div>
            </PermissionGuard>
          )}

          {}
          {permissions.isStaff && !permissions.isManager && (
            <PermissionGuard userRole={userRole} allowedRoles={['staff']}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                  title="My Tasks Today"
                  value={stats.loading ? '...' : '12'}
                  icon={Activity}
                  trend={{ value: '3 pending', isPositive: true }}
                  loading={stats.loading}
                  color="blue"
                />
                <StatCard
                  title="Items Processed"
                  value={stats.loading ? '...' : '247'}
                  icon={Package}
                  trend={{ value: '+18%', isPositive: true }}
                  loading={stats.loading}
                  color="green"
                />
                <StatCard
                  title="Active Alerts"
                  value={stats.loading ? '...' : stats.lowStockItems.toString()}
                  icon={AlertTriangle}
                  trend={{ value: '5 new', isPositive: false }}
                  loading={stats.loading}
                  color="yellow"
                />
              </div>
            </PermissionGuard>
          )}

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>
                  {permissions.isAdmin ? 'System-Wide Activity' : 'Weekly Activity'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorItems" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area type="monotone" dataKey="items" stroke="#3B82F6" fillOpacity={1} fill="url(#colorItems)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {}
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
                  <Plus className="w-6 h-6" />
                  <span className="text-xs">Add Product</span>
                </Button>
                {permissions.canViewAnalytics ? (
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => router.push('/analytics')}
                  >
                    <FileText className="w-6 h-6" />
                    <span className="text-xs">Analytics</span>
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => router.push('/reports')}
                  >
                    <FileText className="w-6 h-6" />
                    <span className="text-xs">Reports</span>
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => setShowScanner(true)}
                >
                  <QrCode className="w-6 h-6" />
                  <span className="text-xs">Scan Code</span>
                </Button>
                {permissions.isManager ? (
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => router.push('/settings')}
                  >
                    <Settings className="w-6 h-6" />
                    <span className="text-xs">Settings</span>
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => router.push('/alerts')}
                  >
                    <Bell className="w-6 h-6" />
                    <span className="text-xs">My Alerts</span>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Role-specific widgets */}
          {permissions.isAdmin && (
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <AdminSystemOverview />
              <WarehouseOverviewWidget />
            </div>
          )}

          {permissions.isStaff && !permissions.isManager && (
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <StaffTaskList />
              <RecentScansWidget />
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {}
            <Card>
              <CardHeader>
                <CardTitle>Inventory by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={inventoryData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={80} />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No recent activity
                    </p>
                  ) : (
                    activities.map((activity) => (
                      <ActivityItem
                        key={activity.id}
                        action={activity.action}
                        item={activity.item}
                        time={activity.time}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {}
          <BarcodeScanner
            open={showScanner}
            onClose={() => setShowScanner(false)}
            onScan={(code) => {
              console.log('Scanned code:', code);
              toast.success('Code scanned!', `Found: ${code}`);
              
              router.push(`/inventory?search=${code}`);
            }}
          />
          </div>);}

function ActivityItem({ action, item, time }: any) {
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition">
      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{action}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{item}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}
