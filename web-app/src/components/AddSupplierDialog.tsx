'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import toast from '@/lib/hooks/useToast';
import { Truck } from 'lucide-react';

interface AddSupplierDialogProps {
  open: boolean;
  onClose: () => void;
}

export const AddSupplierDialog: React.FC<AddSupplierDialogProps> = ({ open, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await addDoc(collection(db, 'suppliers'), {
        ...formData,
        rating: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast('Supplier created successfully');
      setFormData({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        city: '',
        address: '',
      });
      onClose();
    } catch (error: any) {
      toast('Failed to create supplier: ' + error.message);
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
            Add New Supplier
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
            placeholder="ABC Suppliers Ltd."
          />

          <Input
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            required
            placeholder="John Doe"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="+1234567890"
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="contact@supplier.com"
            />
          </div>

          <Input
            label="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
            placeholder="New York"
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
              placeholder="123 Main St, Building A"
            />
          </div>
        </form>
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>
          Create Supplier
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
