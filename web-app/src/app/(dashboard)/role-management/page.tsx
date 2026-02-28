'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Shield, Users, Edit2, History, AlertCircle, TrendingUp, UserCog } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';
import { EditUserRoleDialog } from '@/components/EditUserRoleDialog';
import { RoleBadge } from '@/components/PermissionGuard';
import { StatCard } from '@/components/ui/StatCard';

interface UserData {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  warehouseId: string;
  photoURL?: string;
  createdAt: any;
  lastLogin: any;
  lastRoleChange?: {
    from: string;
    to: string;
    changedBy: string;
    changedAt: any;
    reason: string;
  };
}

interface RoleChange {
  id: string;
  userId: string;
  userEmail: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
  changedByEmail: string;
  reason: string;
  timestamp: any;
}

export default function RoleManagementPage() {
  const { user, userRole } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [roleChanges, setRoleChanges] = useState<RoleChange[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'history'>('users');

  useEffect(() => {
    if (!user) return;

    const usersQuery = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as UserData[];
      
      setUsers(userData);
      setLoading(false);
    });

    const changesQuery = query(
      collection(db, 'role-changes'),
      orderBy('timestamp', 'desc')
    );
    const unsubChanges = onSnapshot(changesQuery, (snapshot) => {
      const changes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as RoleChange[];
      
      setRoleChanges(changes);
    });

    return () => {
      unsubUsers();
      unsubChanges();
    };
  }, [user]);

  useEffect(() => {
    let filtered = users;

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.warehouseId.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter]);

  const handleEditRole = (user: UserData) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const roleStats = {
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length,
    staff: users.filter(u => u.role === 'staff').length,
    viewer: users.filter(u => u.role === 'viewer').length,
  };

  return (
    <PageWrapper allowedRoles={['admin']}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <UserCog className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Role Management
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage user roles and permissions across your organization
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={users.length.toString()}
            icon={Users}
            trend={{ value: `${roleChanges.length} changes`, isPositive: true }}
            color="blue"
          />
          <StatCard
            title="Admins"
            value={roleStats.admin.toString()}
            icon={Shield}
            color="purple"
          />
          <StatCard
            title="Managers"
            value={roleStats.manager.toString()}
            icon={UserCog}
            color="blue"
          />
          <StatCard
            title="Staff Members"
            value={roleStats.staff.toString()}
            icon={Users}
            color="green"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'users' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('users')}
            leftIcon={<Users className="w-4 h-4" />}
          >
            User Roles
          </Button>
          <Button
            variant={activeTab === 'history' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('history')}
            leftIcon={<History className="w-4 h-4" />}
          >
            Change History ({roleChanges.length})
          </Button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search by name, email, or warehouse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={roleFilter === 'all' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setRoleFilter('all')}
                >
                  All Users
                </Button>
                <Button
                  variant={roleFilter === 'admin' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setRoleFilter('admin')}
                >
                  Admins
                </Button>
                <Button
                  variant={roleFilter === 'manager' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setRoleFilter('manager')}
                >
                  Managers
                </Button>
                <Button
                  variant={roleFilter === 'staff' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setRoleFilter('staff')}
                >
                  Staff
                </Button>
              </div>
            </div>

            {/* Users Table */}
            {loading ? (
              <Card className="p-6">
                <TableSkeleton rows={8} />
              </Card>
            ) : filteredUsers.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {searchQuery ? 'No users match your search.' : 'No users found.'}
                </p>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Last Role Change</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((userData) => (
                    <TableRow key={userData.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {userData.photoURL ? (
                            <img
                              src={userData.photoURL}
                              alt={userData.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
                              {userData.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {userData.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {userData.uid?.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{userData.email}</span>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={userData.role} size="sm" />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">{userData.warehouseId}</span>
                      </TableCell>
                      <TableCell>
                        {userData.lastRoleChange ? (
                          <div className="text-sm">
                            <div className="text-gray-600 dark:text-gray-400">
                              {userData.lastRoleChange.from} → {userData.lastRoleChange.to}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {formatDate(userData.lastRoleChange.changedAt)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            No changes
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Edit2 className="w-4 h-4" />}
                          onClick={() => handleEditRole(userData)}
                          disabled={userData.id === user?.uid}
                        >
                          Edit Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle>Role Change History</CardTitle>
            </CardHeader>
            <CardContent>
              {roleChanges.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No role changes recorded yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {roleChanges.map((change) => (
                    <div
                      key={change.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {change.userEmail}
                            </div>
                            <div className="flex items-center gap-2">
                              <RoleBadge role={change.oldRole as any} size="sm" />
                              <span className="text-gray-400">→</span>
                              <RoleBadge role={change.newRole as any} size="sm" />
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Changed by: {change.changedByEmail}
                          </div>
                          {change.reason && (
                            <div className="text-sm text-gray-500 dark:text-gray-500">
                              Reason: {change.reason}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                          {formatDate(change.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Role Dialog */}
        {selectedUser && (
          <EditUserRoleDialog
            open={showEditDialog}
            onClose={() => {
              setShowEditDialog(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            currentUserId={user?.uid || ''}
          />
        )}
      </div>
    </PageWrapper>
  );
}
