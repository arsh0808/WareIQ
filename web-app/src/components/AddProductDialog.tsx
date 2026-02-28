'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from '@/lib/hooks/useToast';
import { Package } from 'lucide-react';

interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onClose,
  warehouseId,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    description: '',
    price: 0,
    shelfId: '',
    quantity: 0,
    minStockLevel: 0,
    maxStockLevel: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      
      const productRef = await addDoc(collection(db, 'products'), {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        description: formData.description,
        price: formData.price,
        createdAt: new Date(),
      });

      await addDoc(collection(db, 'inventory'), {
        productId: productRef.id,
        warehouseId: warehouseId,
        shelfId: formData.shelfId,
        quantity: formData.quantity,
        minStockLevel: formData.minStockLevel,
        maxStockLevel: formData.maxStockLevel,
        lastUpdated: new Date(),
        createdAt: new Date(),
      });

      toast.success('Product added!', 'Successfully added new product and inventory');
      handleClose();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product', 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      description: '',
      price: 0,
      shelfId: '',
      quantity: 0,
      minStockLevel: 0,
      maxStockLevel: 0,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} size="lg">
      <DialogHeader>
        <DialogTitle>Add New Product</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Laptop Computer"
              leftIcon={<Package className="w-5 h-5" />}
            />

            <Input
              label="SKU"
              type="text"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="PROD-001"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Category"
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Electronics"
            />

            <Input
              label="Price"
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              placeholder="99.99"
            />
          </div>

          <Input
            label="Description"
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Product description"
          />

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Inventory Details
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Shelf ID"
                type="text"
                required
                value={formData.shelfId}
                onChange={(e) => setFormData({ ...formData, shelfId: e.target.value })}
                placeholder="A1-SHELF-01"
              />

              <Input
                label="Initial Quantity"
                type="number"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                placeholder="100"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Min Stock Level"
                type="number"
                required
                value={formData.minStockLevel}
                onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                placeholder="20"
              />

              <Input
                label="Max Stock Level"
                type="number"
                required
                value={formData.maxStockLevel}
                onChange={(e) => setFormData({ ...formData, maxStockLevel: parseInt(e.target.value) || 0 })}
                placeholder="500"
              />
            </div>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button 
            type="submit" 
            variant="primary"
            isLoading={submitting}
            leftIcon={<Package className="w-4 h-4" />}
          >
            Add Product
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};
