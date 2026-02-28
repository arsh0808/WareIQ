'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import toast from '@/lib/hooks/useToast';
import { Truck } from 'lucide-react';

interface EditSupplierDialogProps {
  open: boolean;
  onClose: () => void;
  supplier: {
    id: string;
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    city: string;
    address?: string;
    rating?: number;
  };
}

export const EditSupplierDialog: React.FC<EditSupplierDialogProps> = ({ open, onClose, supplier }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    rating: 0,
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        city: supplier.city,
        address: supplier.address || '',
        rating: supplier.rating || 0,
      });
    }
  }, [supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await updateDoc(doc(db, 'suppliers', supplier.id), {
        ...formData,
        updatedAt: new Date(),
      });

      toast('Supplier updated successfully');
      onClose();
    } catch (error: any) {
      toast('Failed to update supplier: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Edit Supplier
          </div>
        </DialogTitle>
      </DialogHeader>

      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Supplier Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <Input
            label="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address (Optional)
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              rows={3}
            />
          </div>

          <Input
            label="Rating (0-5)"
            type="number"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
            min={0}
            max={5}
            step={0.1}
          />
        </form>
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>
          Update Supplier
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
