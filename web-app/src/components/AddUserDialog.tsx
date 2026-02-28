'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { toast } from '@/lib/hooks/useToast';
import { UserPlus } from 'lucide-react';

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
}

export const AddUserDialog: React.FC<AddUserDialogProps> = ({ open, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'admin' | 'manager' | 'staff' | 'viewer',
    warehouseId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: formData.email,
        name: formData.name,
        role: formData.role,
        warehouseId: formData.warehouseId,
        photoURL: '',
        createdAt: new Date(),
        lastLogin: new Date(),
      });

      toast('User created successfully');
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        warehouseId: '',
      });
      onClose();
    } catch (error: any) {
      toast('Failed to create user: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add New User
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
            placeholder="John Doe"
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="user@example.com"
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder="••••••••"
            helperText="Must be at least 8 characters"
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
              <option value="viewer">Viewer - Read-only access</option>
              <option value="staff">Staff - Basic operations</option>
              <option value="manager">Manager - Manage warehouse</option>
              <option value="admin">Admin - Full access</option>
            </select>
          </div>

          <Input
            label="Warehouse ID"
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            required
            placeholder="W001"
            helperText="Assign user to a warehouse"
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
          Create User
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
