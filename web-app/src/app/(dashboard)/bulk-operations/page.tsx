'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Users, UserCheck, Download, Upload, Edit, Trash2, CheckSquare, Square } from 'lucide-react';
import toast from '@/lib/hooks/useToast';
import { RoleBadge } from '@/components/PermissionGuard';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';

interface UserData {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  warehouseId: string;
}

export default function BulkOperationsPage() {
  const { user, userRole } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showBulkRoleDialog, setShowBulkRoleDialog] = useState(false);
  const [showBulkWarehouseDialog, setShowBulkWarehouseDialog] = useState(false);
  const [bulkRole, setBulkRole] = useState<UserData['role']>('staff');
  const [bulkWarehouse, setBulkWarehouse] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
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
  }, []);

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.warehouseId.toLowerCase().includes(query)
    );
  });

  const toggleSelectUser = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleBulkRoleChange = async () => {
    if (selectedUsers.size === 0) {
      toast.warning('No users selected', 'Please select users to update');
      return;
    }

    if (!bulkReason.trim()) {
      toast.error('Reason required', 'Please provide a reason for this bulk change');
      return;
    }

    setProcessing(true);

    try {
      const batch = writeBatch(db);
      const timestamp = new Date();

      selectedUsers.forEach(userId => {
        const userData = users.find(u => u.id === userId);
        if (userData) {
          const userRef = doc(db, 'users', userId);
          batch.update(userRef, {
            role: bulkRole,
            updatedAt: timestamp,
            lastRoleChange: {
              from: userData.role,
              to: bulkRole,
              changedBy: user?.uid,
              changedAt: timestamp,
              reason: `Bulk update: ${bulkReason.trim()}`,
            },
          });
        }
      });

      await batch.commit();

      toast.success('Bulk update successful', `Updated ${selectedUsers.size} users to ${bulkRole}`);
      setSelectedUsers(new Set());
      setShowBulkRoleDialog(false);
      setBulkReason('');
    } catch (error: any) {
      console.error('Error in bulk update:', error);
      toast.error('Bulk update failed', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkWarehouseChange = async () => {
    if (selectedUsers.size === 0) {
      toast.warning('No users selected', 'Please select users to update');
      return;
    }

    if (!bulkWarehouse.trim()) {
      toast.error('Warehouse required', 'Please enter a warehouse ID');
      return;
    }

    if (!bulkReason.trim()) {
      toast.error('Reason required', 'Please provide a reason for this bulk change');
      return;
    }

    setProcessing(true);

    try {
      const batch = writeBatch(db);
      const timestamp = new Date();

      selectedUsers.forEach(userId => {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          warehouseId: bulkWarehouse.trim(),
          updatedAt: timestamp,
          lastWarehouseChange: {
            changedBy: user?.uid,
            changedAt: timestamp,
            reason: `Bulk update: ${bulkReason.trim()}`,
          },
        });
      });

      await batch.commit();

      toast.success('Bulk update successful', `Moved ${selectedUsers.size} users to ${bulkWarehouse}`);
      setSelectedUsers(new Set());
      setShowBulkWarehouseDialog(false);
      setBulkWarehouse('');
      setBulkReason('');
    } catch (error: any) {
      console.error('Error in bulk warehouse update:', error);
      toast.error('Bulk update failed', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleExportSelected = () => {
    if (selectedUsers.size === 0) {
      toast.warning('No users selected', 'Please select users to export');
      return;
    }

    const selectedData = users.filter(u => selectedUsers.has(u.id));
    const csv = [
      ['Name', 'Email', 'Role', 'Warehouse ID'].join(','),
      ...selectedData.map(u => [u.name, u.email, u.role, u.warehouseId].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast.success('Export successful', `Exported ${selectedUsers.size} users`);
  };

  return (
    <PageWrapper allowedRoles={['admin']}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <UserCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Bulk Operations
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Perform bulk updates on multiple users at once
          </p>
        </div>

        {/* Action Bar */}
        {selectedUsers.size > 0 && (
          <Card className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit className="w-4 h-4" />}
                  onClick={() => setShowBulkRoleDialog(true)}
                >
                  Change Role
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Edit className="w-4 h-4" />}
                  onClick={() => setShowBulkWarehouseDialog(true)}
                >
                  Change Warehouse
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={handleExportSelected}
                >
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Search */}
        <div className="mb-6">
          <SearchInput
            placeholder="Search users by name, email, or warehouse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        {/* Users Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    {selectedUsers.size === filteredUsers.length && filteredUsers.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Warehouse</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((userData) => (
                <TableRow
                  key={userData.id}
                  className={selectedUsers.has(userData.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                >
                  <TableCell>
                    <button
                      onClick={() => toggleSelectUser(userData.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {selectedUsers.has(userData.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
                        {userData.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{userData.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{userData.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={userData.role} size="sm" />
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{userData.warehouseId}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Bulk Role Change Dialog */}
        <Dialog open={showBulkRoleDialog} onClose={() => setShowBulkRoleDialog(false)}>
          <DialogHeader>
            <DialogTitle>Bulk Role Change</DialogTitle>
          </DialogHeader>
          <DialogContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You are about to change the role for <strong>{selectedUsers.size}</strong> user{selectedUsers.size !== 1 ? 's' : ''}.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Role
              </label>
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value as UserData['role'])}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <Input
              label="Reason for Change"
              type="text"
              required
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              placeholder="e.g., Department reorganization"
            />
          </DialogContent>
          <DialogFooter>
            <Button
              variant="primary"
              onClick={handleBulkRoleChange}
              isLoading={processing}
              disabled={!bulkReason.trim()}
            >
              Update {selectedUsers.size} User{selectedUsers.size !== 1 ? 's' : ''}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowBulkRoleDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
          </DialogFooter>
        </Dialog>

        {/* Bulk Warehouse Change Dialog */}
        <Dialog open={showBulkWarehouseDialog} onClose={() => setShowBulkWarehouseDialog(false)}>
          <DialogHeader>
            <DialogTitle>Bulk Warehouse Change</DialogTitle>
          </DialogHeader>
          <DialogContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You are about to move <strong>{selectedUsers.size}</strong> user{selectedUsers.size !== 1 ? 's' : ''} to a new warehouse.
            </p>

            <Input
              label="New Warehouse ID"
              type="text"
              required
              value={bulkWarehouse}
              onChange={(e) => setBulkWarehouse(e.target.value)}
              placeholder="e.g., warehouse-002"
            />

            <Input
              label="Reason for Change"
              type="text"
              required
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              placeholder="e.g., Warehouse consolidation"
            />
          </DialogContent>
          <DialogFooter>
            <Button
              variant="primary"
              onClick={handleBulkWarehouseChange}
              isLoading={processing}
              disabled={!bulkWarehouse.trim() || !bulkReason.trim()}
            >
              Update {selectedUsers.size} User{selectedUsers.size !== 1 ? 's' : ''}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowBulkWarehouseDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
          </DialogFooter>
        </Dialog>
      </div>
    </PageWrapper>
  );
}
