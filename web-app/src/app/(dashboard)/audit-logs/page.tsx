'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserRole, type UserRole, isAdmin } from '@/lib/firebase/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ClipboardList, Download, Shield, User, Package, Database } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';
import { exportToCSV } from '@/lib/utils/csvParser';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  warehouseId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: any;
}

export default function AuditLogsPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

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
    if (!userRole) return;

    const logsQuery = query(
      collection(db, 'activityLogs'),
      orderBy('timestamp', 'desc'),
      limit(500)
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AuditLog[];

      setLogs(logsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole]);

  useEffect(() => {
    let filtered = logs;

    if (resourceFilter !== 'all') {
      filtered = filtered.filter(log => log.resource === resourceFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.userId.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.resourceId.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, searchQuery, resourceFilter]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadge = (action: string) => {
    if (action.includes('create') || action.includes('add')) return { variant: 'success' as const, label: 'CREATE' };
    if (action.includes('update') || action.includes('edit')) return { variant: 'info' as const, label: 'UPDATE' };
    if (action.includes('delete') || action.includes('remove')) return { variant: 'danger' as const, label: 'DELETE' };
    return { variant: 'default' as const, label: action.toUpperCase() };
  };

  const handleExport = () => {
    const exportData = filteredLogs.map(log => ({
      timestamp: formatDate(log.timestamp),
      userId: log.userId,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      warehouseId: log.warehouseId || 'N/A',
      ipAddress: log.ipAddress || 'N/A',
    }));

    exportToCSV(exportData, `audit-logs-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast('Audit logs exported successfully');
  };

  if (!isAdmin(userRole)) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You need admin privileges to access audit logs.
          </p>
        </Card>
      </div>
    );
  }

  const resources = Array.from(new Set(logs.map(l => l.resource)));

  return (
    <div className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Audit Logs
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Track all system activities and changes
                </p>
              </div>
              <Button
                variant="outline"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExport}
                disabled={filteredLogs.length === 0}
              >
                Export
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search by user, action, or resource ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={resourceFilter === 'all' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setResourceFilter('all')}
                >
                  All
                </Button>
                {resources.slice(0, 5).map(resource => (
                  <Button
                    key={resource}
                    variant={resourceFilter === resource ? 'primary' : 'outline'}
                    size="md"
                    onClick={() => setResourceFilter(resource)}
                  >
                    {resource}
                  </Button>
                ))}
              </div>
            </div>

            {loading ? (
              <Card className="p-6">
                <TableSkeleton rows={10} />
              </Card>
            ) : filteredLogs.length === 0 ? (
              <Card className="p-12 text-center">
                <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {searchQuery ? 'No logs match your search.' : 'No audit logs found.'}
                </p>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Resource ID</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const actionInfo = getActionBadge(log.action);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(log.timestamp)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-mono">{log.userId.substring(0, 12)}...</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionInfo.variant}>
                            {log.action.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{log.resource}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{log.resourceId}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{log.warehouseId || 'N/A'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">{log.ipAddress || 'N/A'}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            <div className="grid md:grid-cols-4 gap-6 mt-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Total Logs
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {logs.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ClipboardList className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Unique Users
                    </p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {new Set(logs.map(l => l.userId)).size}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <User className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Resources
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {resources.length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Database className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Today
                    </p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {logs.filter(l => {
                        const logDate = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
                        const today = new Date();
                        return logDate.toDateString() === today.toDateString();
                      }).length}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <ClipboardList className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </Card>
            </div>
          </div>);}
