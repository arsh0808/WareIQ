'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { 
  TrendingUp, TrendingDown, Package, DollarSign, AlertTriangle, Download,
  Calendar, Filter
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { exportToCSV } from '@/lib/utils/csvParser';
import { toast } from '@/lib/hooks/useToast';
import {
  getInventoryTrends,
  getActivityMetrics,
  getCategoryDistribution,
  getStockMovementTrends,
  getAlertStatistics,
  calculateTrend,
  getTopProducts,
  getWarehouseUtilization
} from '@/lib/utils/analytics';

export default function AnalyticsPage() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  const [inventoryTrends, setInventoryTrends] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [movementData, setMovementData] = useState<any[]>([]);
  const [alertStats, setAlertStats] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [utilization, setUtilization] = useState<any>(null);
  const [trends, setTrends] = useState<any>({});
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [warehousePerformance, setWarehousePerformance] = useState<any[]>([]);

  useEffect(() => {
    if (!userRole?.warehouseId) return;

    const loadAnalyticsData = async () => {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      
      try {
        const [
          trendsData,
          activity,
          category,
          movement,
          alerts,
          products,
          warehouseUtil,
          itemsTrend,
          valueTrend
        ] = await Promise.all([
          getInventoryTrends(userRole.warehouseId, days),
          getActivityMetrics(userRole.warehouseId, days),
          getCategoryDistribution(userRole.warehouseId),
          getStockMovementTrends(userRole.warehouseId, days),
          getAlertStatistics(userRole.warehouseId, days),
          getTopProducts(userRole.warehouseId, 10),
          getWarehouseUtilization(userRole.warehouseId),
          calculateTrend(userRole.warehouseId, 'totalItems', days),
          calculateTrend(userRole.warehouseId, 'totalValue', days)
        ]);

        setInventoryTrends(trendsData.quantityData);
        setActivityData(activity.dailyActivity);
        setCategoryData(category.distribution);
        setMovementData(movement);
        setAlertStats(alerts);
        setTopProducts(products.topByValue);
        setUtilization(warehouseUtil);
        setTrends({
          items: itemsTrend,
          value: valueTrend
        });

        // Generate mock revenue data based on time range
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const numMonths = timeRange === '7d' ? 1 : timeRange === '30d' ? 3 : 6;
        const currentMonth = new Date().getMonth();
        const mockRevenueData = Array.from({ length: numMonths }, (_, i) => {
          const monthIndex = (currentMonth - numMonths + i + 1 + 12) % 12;
          const baseRevenue = 50000 + Math.random() * 30000;
          return {
            month: monthNames[monthIndex],
            revenue: Math.round(baseRevenue),
            profit: Math.round(baseRevenue * (0.15 + Math.random() * 0.1)),
          };
        });
        setRevenueData(mockRevenueData);

        // Generate mock warehouse performance data
        const mockPerformanceData = [
          {
            warehouse: userRole.warehouseId || 'WH-001',
            efficiency: 92 + Math.round(Math.random() * 6),
            orders: 1250 + Math.round(Math.random() * 500),
            accuracy: 96 + Math.round(Math.random() * 3),
          },
        ];
        setWarehousePerformance(mockPerformanceData);

      } catch (error) {
        console.error('Error loading analytics:', error);
        toast.error('Failed to load analytics data', 'Using sample data instead');
        
        // Use fallback sample data if real data fails
        setInventoryTrends([]);
        setActivityData([]);
        setCategoryData([]);
        setMovementData([]);
        setAlertStats({ total: 0, critical: 0, warning: 0, info: 0, resolved: 0 });
        setTopProducts([]);
        setUtilization({ totalCapacity: 1000, usedCapacity: 0, utilizationPercent: 0 });
        setTrends({ items: { current: 0, previous: 0, change: 0, changePercent: 0 }, value: { current: 0, previous: 0, change: 0, changePercent: 0 } });
        
        // Still generate revenue data
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const numMonths = timeRange === '7d' ? 1 : timeRange === '30d' ? 3 : 6;
        const currentMonth = new Date().getMonth();
        const mockRevenueData = Array.from({ length: numMonths }, (_, i) => {
          const monthIndex = (currentMonth - numMonths + i + 1 + 12) % 12;
          const baseRevenue = 50000 + Math.random() * 30000;
          return {
            month: monthNames[monthIndex],
            revenue: Math.round(baseRevenue),
            profit: Math.round(baseRevenue * (0.15 + Math.random() * 0.1)),
          };
        });
        setRevenueData(mockRevenueData);
        setWarehousePerformance([{
          warehouse: userRole.warehouseId || 'WH-001',
          efficiency: 92 + Math.round(Math.random() * 6),
          orders: 1250 + Math.round(Math.random() * 500),
          accuracy: 96 + Math.round(Math.random() * 3),
        }]);
      }
    };

    loadAnalyticsData();
  }, [userRole?.warehouseId, timeRange]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const handleExportReport = (type: string) => {
    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'inventory':
        data = inventoryTrends;
        filename = 'inventory-trends-report.csv';
        break;
      case 'movement':
        data = movementData;
        filename = 'stock-movement-report.csv';
        break;
      case 'category':
        data = categoryData;
        filename = 'category-distribution-report.csv';
        break;
      case 'products':
        data = topProducts;
        filename = 'top-products-report.csv';
        break;
    }

    if (data.length > 0) {
      exportToCSV(data, filename);
      toast('Report exported successfully');
    }
  };

  return (
    <PageWrapper allowedRoles={['admin', 'manager']}>
      <div className="p-8">
          {}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Analytics & Insights
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive analytics and performance metrics
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={timeRange === '7d' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('7d')}
              >
                7 Days
              </Button>
              <Button
                variant={timeRange === '30d' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('30d')}
              >
                30 Days
              </Button>
              <Button
                variant={timeRange === '90d' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('90d')}
              >
                90 Days
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Items"
              value={utilization?.used?.toLocaleString() || '0'}
              icon={Package}
              trend={{ value: `${trends?.items?.changePercent || 0}%`, isPositive: (trends?.items?.changePercent || 0) > 0 }}
              color="blue"
            />
            <StatCard
              title="Warehouse Capacity"
              value={utilization?.capacity?.toLocaleString() || '0'}
              icon={Package}
              trend={{ value: `${utilization?.utilizationPercent?.toFixed(1) || 0}% used`, isPositive: true }}
              color="green"
            />
            <StatCard
              title="Critical Alerts"
              value={alertStats ? alertStats.critical.toString() : '0'}
              icon={AlertTriangle}
              trend={{ value: `${alertStats?.warning || 0} warnings`, isPositive: false }}
              color="yellow"
            />
            <StatCard
              title="Total Alerts"
              value={alertStats ? alertStats.total.toString() : '0'}
              icon={AlertTriangle}
              trend={{ value: `${alertStats?.resolved || 0} resolved`, isPositive: true }}
              color="purple"
            />
          </div>

          {}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {}
            <Card>
              <CardHeader>
                <CardTitle>Stock Level Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={inventoryTrends}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="label" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#colorValue)" name="Quantity" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <CardTitle>Inventory by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage?.toFixed(0) || 0}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Stock Movement</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExportReport('movement')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={movementData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="incoming" fill="#10B981" radius={[8, 8, 0, 0]} name="Incoming" />
                    <Bar dataKey="outgoing" fill="#EF4444" radius={[8, 8, 0, 0]} name="Outgoing" />
                    <Bar dataKey="transfers" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Transfers" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Revenue & Profitability</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExportReport('revenue')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {}
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Warehouse</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Efficiency</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Orders Processed</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {warehousePerformance.map((wh, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{wh.warehouse}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${wh.efficiency}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{wh.efficiency}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{wh.orders.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            wh.accuracy >= 98 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            wh.accuracy >= 95 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {wh.accuracy}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
      </div>
    </PageWrapper>
  );
}
