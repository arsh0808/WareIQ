'use client';

import React, { useState } from 'react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleBadge } from './PermissionGuard';
import { Shield, AlertTriangle } from 'lucide-react';
import toast from '@/lib/hooks/useToast';

interface UserData {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  warehouseId: string;
}

interface EditUserRoleDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserData;
  currentUserId: string;
}

export const EditUserRoleDialog: React.FC<EditUserRoleDialogProps> = ({
  open,
  onClose,
  user,
  currentUserId,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserData['role']>(user.role);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const roles: { value: UserData['role']; label: string; description: string }[] = [
    {
      value: 'admin',
      label: 'Administrator',
      description: 'Full system access with all administrative privileges',
    },
    {
      value: 'manager',
      label: 'Manager',
      description: 'Warehouse management with most operational controls',
    },
    {
      value: 'staff',
      label: 'Staff',
      description: 'Basic warehouse operations and inventory management',
    },
    {
      value: 'viewer',
      label: 'Viewer',
      description: 'Read-only access to view warehouse data',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRole === user.role) {
      toast.warning('No change', 'The selected role is the same as the current role');
      return;
    }

    if (!reason.trim()) {
      toast.error('Reason required', 'Please provide a reason for this role change');
      return;
    }

    setSubmitting(true);

    try {
      // Update user role in Firestore
      await updateDoc(doc(db, 'users', user.id), {
        role: selectedRole,
        updatedAt: new Date(),
        lastRoleChange: {
          from: user.role,
          to: selectedRole,
          changedBy: currentUserId,
          changedAt: new Date(),
          reason: reason.trim(),
        },
      });

      // Log role change
      await addDoc(collection(db, 'role-changes'), {
        userId: user.id,
        userEmail: user.email,
        oldRole: user.role,
        newRole: selectedRole,
        changedBy: currentUserId,
        reason: reason.trim(),
        timestamp: new Date(),
      });

      toast.success('Role updated', `${user.name}'s role has been changed to ${selectedRole}`);
      onClose();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader>
        <DialogTitle>Edit User Role</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-6">
          {/* User Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Current Role:</span>
              <RoleBadge role={user.role} size="sm" />
            </div>
          </div>

          {/* Warning for self-edit */}
          {user.id === currentUserId && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Warning:</strong> You cannot change your own role to prevent accidental lockout.
                </div>
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select New Role
            </label>
            <div className="space-y-2">
              {roles.map((role) => (
                <div
                  key={role.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedRole === role.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedRole(role.value)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={selectedRole === role.value}
                        onChange={() => setSelectedRole(role.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {role.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {role.description}
                        </div>
                      </div>
                    </div>
                    <RoleBadge role={role.value} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <Input
              label="Reason for Change"
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Promotion, department transfer, etc."
              helperText="This will be recorded in the audit log"
            />
          </div>

          {/* Change Preview */}
          {selectedRole !== user.role && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex items-center gap-2 text-sm">
                  <RoleBadge role={user.role} size="sm" />
                  <span className="text-gray-600 dark:text-gray-400">→</span>
                  <RoleBadge role={selectedRole} size="sm" />
                </div>
              </div>
            </div>
          )}
        </DialogContent>

        <DialogFooter>
          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
            disabled={user.id === currentUserId || selectedRole === user.role}
          >
            Update Role
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};
