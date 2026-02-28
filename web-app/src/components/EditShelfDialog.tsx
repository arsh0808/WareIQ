'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from '@/lib/hooks/useToast';
import { Grid3x3 } from 'lucide-react';

interface EditShelfDialogProps {
  open: boolean;
  onClose: () => void;
  shelf: {
    id: string;
    shelfCode: string;
    zone: string;
    row: number;
    column: number;
    level: number;
    maxCapacity: number;
    maxWeight: number;
    currentWeight: number;
    status: 'active' | 'maintenance' | 'inactive';
  };
}

export const EditShelfDialog: React.FC<EditShelfDialogProps> = ({ open, onClose, shelf }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    shelfCode: '',
    zone: '',
    row: 1,
    column: 1,
    level: 1,
    maxCapacity: 100,
    maxWeight: 500,
    currentWeight: 0,
    status: 'active' as 'active' | 'maintenance' | 'inactive',
  });

  useEffect(() => {
    if (shelf) {
      setFormData({
        shelfCode: shelf.shelfCode,
        zone: shelf.zone,
        row: shelf.row,
        column: shelf.column,
        level: shelf.level,
        maxCapacity: shelf.maxCapacity,
        maxWeight: shelf.maxWeight,
        currentWeight: shelf.currentWeight,
        status: shelf.status,
      });
    }
  }, [shelf]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await updateDoc(doc(db, 'shelves', shelf.id), {
        shelfCode: formData.shelfCode,
        zone: formData.zone,
        row: formData.row,
        column: formData.column,
        level: formData.level,
        maxCapacity: formData.maxCapacity,
        maxWeight: formData.maxWeight,
        currentWeight: formData.currentWeight,
        status: formData.status,
        updatedAt: new Date(),
      });

      toast('Shelf updated successfully');
      onClose();
    } catch (error: any) {
      toast('Failed to update shelf: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5" />
            Edit Shelf
          </div>
        </DialogTitle>
      </DialogHeader>

      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Shelf Code"
            value={formData.shelfCode}
            onChange={(e) => setFormData({ ...formData, shelfCode: e.target.value })}
            required
          />

          <Input
            label="Zone"
            value={formData.zone}
            onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Row"
              type="number"
              value={formData.row}
              onChange={(e) => setFormData({ ...formData, row: parseInt(e.target.value) })}
              required
              min={1}
            />

            <Input
              label="Column"
              type="number"
              value={formData.column}
              onChange={(e) => setFormData({ ...formData, column: parseInt(e.target.value) })}
              required
              min={1}
            />

            <Input
              label="Level"
              type="number"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              required
              min={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Capacity (items)"
              type="number"
              value={formData.maxCapacity}
              onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
              required
              min={1}
            />

            <Input
              label="Max Weight (kg)"
              type="number"
              value={formData.maxWeight}
              onChange={(e) => setFormData({ ...formData, maxWeight: parseFloat(e.target.value) })}
              required
              min={1}
            />
          </div>

          <Input
            label="Current Weight (kg)"
            type="number"
            value={formData.currentWeight}
            onChange={(e) => setFormData({ ...formData, currentWeight: parseFloat(e.target.value) })}
            required
            min={0}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>
          Update Shelf
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
