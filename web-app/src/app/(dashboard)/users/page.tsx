'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, deleteDoc, addDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { PageWrapper } from '@/components/PageWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Users, UserPlus, Edit2, Trash2, Shield, Mail, Phone, Calendar } from 'lucide-react';
import toast from '@/lib/hooks/useToast';
import { EditUserDialog } from '@/components/EditUserDialog';
import { AddUserDialog } from '@/components/AddUserDialog';

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
}

export default function UsersPage() {
  const { user: currentUser, userRole } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const usersQuery = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as UserData[];
      
      setUsers(userData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    let filtered = users;

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.warehouseId.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter]);

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      toast('User deleted successfully');
    } catch (error: any) {
      toast('Failed to delete user: ' + error.message);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'success';
      case 'manager': return 'info';
      case 'staff': return 'warning';
      default: return 'default';
    }
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

  return (
    <PageWrapper allowedRoles={['admin', 'manager']}>
      <div className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  User Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage system users and their permissions
                </p>
              </div>
              <Button
                variant="primary"
                leftIcon={<UserPlus className="w-4 h-4" />}
                onClick={() => setShowAddDialog(true)}
              >
                Add User
              </Button>
            </div>

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
                    <TableHead>Role</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.uid?.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono">{user.warehouseId}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {formatDate(user.lastLogin)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(user.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Edit2 className="w-4 h-4" />}
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser?.uid}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="grid md:grid-cols-4 gap-6 mt-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Total Users
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {users.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Admins
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {users.filter(u => u.role === 'admin').length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Managers
                    </p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {users.filter(u => u.role === 'manager').length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Staff
                    </p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {users.filter(u => u.role === 'staff').length}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Users className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </Card>
            </div>
          </div>

      {selectedUser && (
        <EditUserDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
        />
      )}

      <AddUserDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />
    </PageWrapper>
  );
}
