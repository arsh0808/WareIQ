'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserRole, type UserRole } from '@/lib/firebase/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { 
  AlertTriangle, CheckCircle, Bell, BellOff, Filter, Download, 
  Package, Activity, Zap, ThermometerSun, Scale, Battery 
} from 'lucide-react';
import toast from '@/lib/hooks/useToast';
import { exportToCSV } from '@/lib/utils/csvParser';
import type { Alert, AlertType, AlertSeverity, Product } from '@/lib/types';

export default function AlertsPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | AlertType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const role = await getUserRole(user.uid);
        setUserRole(role);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userRole?.warehouseId) return;

    const alertsQuery = query(
      collection(db, 'alerts'),
      where('warehouseId', '==', userRole.warehouseId),
      orderBy('createdAt', 'desc')
    );

    const unsubAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Alert[];
      setAlerts(data);
      setLoading(false);
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(data);
    });

    return () => {
      unsubAlerts();
      unsubProducts();
    };
  }, [userRole]);

  const getProductName = (productId?: string) => {
    if (!productId) return 'N/A';
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const getAlertIcon = (type: AlertType) => {
    const icons = {
      low_stock: Package,
      sensor_failure: Activity,
      unauthorized_access: AlertTriangle,
      temperature_alert: ThermometerSun,
      weight_mismatch: Scale,
      low_battery: Battery,
    };
    return icons[type] || Bell;
  };

  const filteredAlerts = alerts.filter(alert => {
    let matches = true;

    // Severity filter
    if (severityFilter !== 'all') {
      matches = matches && alert.severity === severityFilter;
    }

    // Type filter
    if (typeFilter !== 'all') {
      matches = matches && alert.type === typeFilter;
    }

    // Status filter
    if (statusFilter === 'active') {
      matches = matches && !alert.resolved;
    } else if (statusFilter === 'resolved') {
      matches = matches && alert.resolved;
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matches = matches && (
        alert.message.toLowerCase().includes(query) ||
        alert.type.toLowerCase().includes(query) ||
        getProductName(alert.productId).toLowerCase().includes(query) ||
        (alert.shelfId ? alert.shelfId.toLowerCase().includes(query) : false) ||
        (alert.deviceId ? alert.deviceId.toLowerCase().includes(query) : false)
      );
    }

    return matches;
  });

  const handleResolveAlert = async (alertId: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'alerts', alertId), {
        resolved: true,
        resolvedBy: user.uid,
        resolvedAt: Timestamp.now(),
      });

      toast.success('Alert resolved', 'The alert has been marked as resolved');
    } catch (error: any) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert', error.message);
    }
  };

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  const handleResolveSelected = async () => {
    const activeAlerts = filteredAlerts.filter(a => !a.resolved);
    if (activeAlerts.length === 0) {
      toast.info('No active alerts', 'All filtered alerts are already resolved');
      return;
    }

    if (!confirm(`Resolve ${activeAlerts.length} active alerts?`)) return;

    try {
      const promises = activeAlerts.map(alert =>
        updateDoc(doc(db, 'alerts', alert.id), {
          resolved: true,
          resolvedBy: user.uid,
          resolvedAt: Timestamp.now(),
        })
      );

      await Promise.all(promises);
      toast.success('Alerts resolved', `${activeAlerts.length} alerts have been resolved`);
    } catch (error: any) {
      console.error('Error resolving alerts:', error);
      toast.error('Failed to resolve alerts', error.message);
    }
  };

  const handleExport = () => {
    const exportData = filteredAlerts.map(alert => {
      const createdDate = alert.createdAt && typeof alert.createdAt === 'object' && 'toDate' in alert.createdAt 
        ? alert.createdAt.toDate().toISOString() 
        : new Date().toISOString();
      const resolvedDate = alert.resolvedAt && typeof alert.resolvedAt === 'object' && 'toDate' in alert.resolvedAt
        ? alert.resolvedAt.toDate().toISOString()
        : 'N/A';
      
      return {
        severity: alert.severity,
        type: alert.type,
        message: alert.message,
        product: getProductName(alert.productId),
        shelf: alert.shelfId || 'N/A',
        device: alert.deviceId || 'N/A',
        status: alert.resolved ? 'Resolved' : 'Active',
        createdAt: createdDate,
        resolvedAt: resolvedDate,
        resolvedBy: alert.resolvedBy || 'N/A',
      };
    });

    exportToCSV(exportData, `alerts-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Export successful', `Exported ${exportData.length} alerts`);
  };

  const stats = {
    total: alerts.length,
    active: alerts.filter(a => !a.resolved).length,
    critical: alerts.filter(a => !a.resolved && a.severity === 'critical').length,
    warning: alerts.filter(a => !a.resolved && a.severity === 'warning').length,
    info: alerts.filter(a => !a.resolved && a.severity === 'info').length,
  };

  return (
    <div className="p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Alert Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitor and manage all warehouse alerts
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={handleExport}
                  disabled={filteredAlerts.length === 0}
                >
                  Export
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                  onClick={handleResolveSelected}
                  disabled={filteredAlerts.filter(a => !a.resolved).length === 0}
                >
                  Resolve All Filtered
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</p>
                </div>
              </Card>
              <Card className="p-4 bg-red-50 dark:bg-red-900/20">
                <div className="text-center">
                  <p className="text-sm text-red-600 dark:text-red-400 mb-1">Critical</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.critical}</p>
                </div>
              </Card>
              <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="text-center">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Warning</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.warning}</p>
                </div>
              </Card>
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                <div className="text-center">
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Info</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.info}</p>
                </div>
              </Card>
            </div>

            {/* Filters */}
            <div className="mb-6 space-y-4">
              <SearchInput
                placeholder="Search alerts by message, type, product, shelf, or device..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />

              <div className="flex flex-wrap gap-2">
                {/* Status Filter */}
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === 'active' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('active')}
                    leftIcon={<Bell className="w-4 h-4" />}
                  >
                    Active
                  </Button>
                  <Button
                    variant={statusFilter === 'resolved' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('resolved')}
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                  >
                    Resolved
                  </Button>
                </div>

                <div className="w-px bg-gray-300 dark:bg-gray-600"></div>

                {/* Severity Filter */}
                <div className="flex gap-2">
                  <Button
                    variant={severityFilter === 'critical' ? 'danger' : 'outline'}
                    size="sm"
                    onClick={() => setSeverityFilter(severityFilter === 'critical' ? 'all' : 'critical')}
                  >
                    Critical
                  </Button>
                  <Button
                    variant={severityFilter === 'warning' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSeverityFilter(severityFilter === 'warning' ? 'all' : 'warning')}
                  >
                    Warning
                  </Button>
                  <Button
                    variant={severityFilter === 'info' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSeverityFilter(severityFilter === 'info' ? 'all' : 'info')}
                  >
                    Info
                  </Button>
                </div>
              </div>
            </div>

            {/* Alerts Table */}
            {loading ? (
              <Card className="p-6">
                <TableSkeleton rows={8} />
              </Card>
            ) : filteredAlerts.length === 0 ? (
              <Card className="p-12 text-center">
                <BellOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {searchQuery ? 'No alerts match your search.' : 'No alerts found.'}
                </p>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Product/Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => {
                    const Icon = getAlertIcon(alert.type);
                    return (
                      <TableRow key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
                        <TableCell>
                          <Badge
                            variant={
                              alert.severity === 'critical' ? 'danger' :
                              alert.severity === 'warning' ? 'warning' :
                              'info'
                            }
                          >
                            {alert.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{alert.type.replace(/_/g, ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="font-medium text-gray-900 dark:text-white">{alert.message}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {alert.productId && <div>{getProductName(alert.productId)}</div>}
                            {alert.deviceId && <div className="text-gray-500 font-mono">{alert.deviceId}</div>}
                            {!alert.productId && !alert.deviceId && <span className="text-gray-400">N/A</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.shelfId ? (
                            <Badge variant="default">{alert.shelfId}</Badge>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {formatTimestamp(alert.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {alert.resolved ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm">Resolved</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-orange-600">
                              <Bell className="w-4 h-4" />
                              <span className="text-sm">Active</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!alert.resolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveAlert(alert.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
    </div>
  );
}
