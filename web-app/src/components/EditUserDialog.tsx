'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from '@/lib/hooks/useToast';
import { User } from 'lucide-react';

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'staff' | 'viewer';
    warehouseId: string;
  };
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({ open, onClose, user }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'staff' as 'admin' | 'manager' | 'staff' | 'viewer',
    warehouseId: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        role: user.role,
        warehouseId: user.warehouseId,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await updateDoc(doc(db, 'users', user.id), {
        name: formData.name,
        role: formData.role,
        warehouseId: formData.warehouseId,
        updatedAt: new Date(),
      });

      toast('User updated successfully');
      onClose();
    } catch (error: any) {
      toast('Failed to update user: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Edit User
          </div>
        </DialogTitle>
      </DialogHeader>

      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            value={user.email}
            disabled
            helperText="Email cannot be changed"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="viewer">Viewer</option>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <Input
            label="Warehouse ID"
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            required
            placeholder="W001"
          />
        </form>
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={submitting}
        >
          Update User
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
