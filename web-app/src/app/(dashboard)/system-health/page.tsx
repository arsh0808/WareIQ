'use client';

import { useEffect, useState } from 'react';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { 
  Activity, 
  Database, 
  Users, 
  Package, 
  Radio, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Server,
  Zap,
  HardDrive,
  Cpu
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalInventory: number;
  totalProducts: number;
  totalDevices: number;
  activeDevices: number;
  totalAlerts: number;
  criticalAlerts: number;
  totalWarehouses: number;
}

export default function SystemHealthPage() {
  const { user, userRole } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalInventory: 0,
    totalProducts: 0,
    totalDevices: 0,
    activeDevices: 0,
    totalAlerts: 0,
    criticalAlerts: 0,
    totalWarehouses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [responseTime, setResponseTime] = useState<number>(0);

  useEffect(() => {
    loadSystemMetrics();
  }, []);

  const loadSystemMetrics = async () => {
    const startTime = Date.now();

    try {
      // Fetch all metrics in parallel
      const [
        usersSnap,
        inventorySnap,
        productsSnap,
        devicesSnap,
        alertsSnap,
        criticalAlertsSnap,
        warehousesSnap,
        recentActivitySnap,
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'inventory')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'iot-devices')),
        getDocs(collection(db, 'alerts')),
        getDocs(query(collection(db, 'alerts'), where('severity', '==', 'critical'))),
        getDocs(collection(db, 'warehouses')),
        getDocs(query(
          collection(db, 'audit-logs'),
          orderBy('timestamp', 'desc'),
          limit(100)
        )),
      ]);

      // Calculate active users (logged in within last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = usersSnap.docs.filter(doc => {
        const lastLogin = doc.data().lastLogin?.toDate();
        return lastLogin && lastLogin > sevenDaysAgo;
      }).length;

      // Count active devices
      const activeDevices = devicesSnap.docs.filter(
        doc => doc.data().status === 'online'
      ).length;

      // Process recent activity for chart
      const activityByDay: Record<string, number> = {};
      recentActivitySnap.docs.forEach(doc => {
        const timestamp = doc.data().timestamp?.toDate();
        if (timestamp) {
          const dateKey = timestamp.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          activityByDay[dateKey] = (activityByDay[dateKey] || 0) + 1;
        }
      });

      const activityChartData = Object.entries(activityByDay)
        .slice(-7)
        .map(([date, count]) => ({ date, count }));

      setMetrics({
        totalUsers: usersSnap.size,
        activeUsers,
        totalInventory: inventorySnap.size,
        totalProducts: productsSnap.size,
        totalDevices: devicesSnap.size,
        activeDevices,
        totalAlerts: alertsSnap.size,
        criticalAlerts: criticalAlertsSnap.size,
        totalWarehouses: warehousesSnap.size,
      });

      setActivityData(activityChartData);

      // Calculate response time
      const endTime = Date.now();
      setResponseTime(endTime - startTime);

      setLoading(false);
    } catch (error) {
      console.error('Error loading system metrics:', error);
      setLoading(false);
    }
  };

  const getHealthStatus = () => {
    if (metrics.criticalAlerts > 5) return { status: 'Critical', color: 'red' };
    if (metrics.criticalAlerts > 0) return { status: 'Warning', color: 'yellow' };
    if (metrics.activeDevices / metrics.totalDevices < 0.8) return { status: 'Warning', color: 'yellow' };
    return { status: 'Healthy', color: 'green' };
  };

  const health = getHealthStatus();
  const deviceUptime = metrics.totalDevices > 0 
    ? ((metrics.activeDevices / metrics.totalDevices) * 100).toFixed(1) 
    : '0.0';
  const userActivity = metrics.totalUsers > 0 
    ? ((metrics.activeUsers / metrics.totalUsers) * 100).toFixed(1) 
    : '0.0';

  return (
    <PageWrapper allowedRoles={['admin']}>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                System Health
              </h1>
              <Badge 
                variant={health.color === 'green' ? 'success' : health.color === 'yellow' ? 'warning' : 'danger'}
              >
                {health.status}
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor system performance and resource utilization
            </p>
          </div>
        </div>

        {/* Overall Health Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="System Status"
            value={health.status}
            icon={health.color === 'green' ? CheckCircle : AlertTriangle}
            color={health.color as any}
            loading={loading}
          />
          <StatCard
            title="Response Time"
            value={`${responseTime}ms`}
            icon={Zap}
            trend={{ value: 'Fast', isPositive: responseTime < 1000 }}
            color="blue"
            loading={loading}
          />
          <StatCard
            title="Device Uptime"
            value={`${deviceUptime}%`}
            icon={Radio}
            trend={{ value: `${metrics.activeDevices}/${metrics.totalDevices}`, isPositive: true }}
            color="green"
            loading={loading}
          />
          <StatCard
            title="User Activity"
            value={`${userActivity}%`}
            icon={Users}
            trend={{ value: `${metrics.activeUsers} active`, isPositive: true }}
            color="purple"
            loading={loading}
          />
        </div>

        {/* Resource Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Users</span>
                    <span className="text-sm font-semibold">{metrics.totalUsers}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${Math.min((metrics.totalUsers / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Products</span>
                    <span className="text-sm font-semibold">{metrics.totalProducts}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${Math.min((metrics.totalProducts / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Inventory Items</span>
                    <span className="text-sm font-semibold">{metrics.totalInventory}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-purple-500 rounded-full" 
                      style={{ width: `${Math.min((metrics.totalInventory / 5000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                IoT Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Online Devices</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {metrics.activeDevices}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Offline Devices</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {metrics.totalDevices - metrics.activeDevices}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Warehouses</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {metrics.totalWarehouses}
                    </p>
                  </div>
                  <Server className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alert Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Critical Alerts</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {metrics.criticalAlerts}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {metrics.totalAlerts}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {Math.max(0, metrics.totalAlerts - metrics.criticalAlerts - 5)}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>System Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorActivity)" 
                  name="Activity Events"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
