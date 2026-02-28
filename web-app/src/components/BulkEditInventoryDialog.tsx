'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { doc, updateDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from '@/lib/hooks/useToast';
import { Save, X, Package, AlertTriangle } from 'lucide-react';
import type { Inventory, Product } from '@/lib/types';
import { checkAndGenerateStockAlerts } from '@/lib/utils/alertGenerator';
import { trackBulkUpdate } from '@/lib/utils/inventoryHistory';

interface BulkEditInventoryDialogProps {
  open: boolean;
  onClose: () => void;
  selectedItems: Inventory[];
  products: Product[];
  userId: string;
}

type BulkEditField = 'minStockLevel' | 'maxStockLevel' | 'shelfId' | 'quantity';

export function BulkEditInventoryDialog({ 
  open, 
  onClose, 
  selectedItems, 
  products,
  userId 
}: BulkEditInventoryDialogProps) {
  const [editField, setEditField] = useState<BulkEditField>('minStockLevel');
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (!value.trim()) {
      setValidationError('Value is required');
      return false;
    }

    if (editField !== 'shelfId') {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 0) {
        setValidationError('Value must be a positive number');
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const batch = writeBatch(db);
      const updateData: any = {
        lastUpdated: Timestamp.now(),
        updatedBy: userId,
      };

      if (editField === 'shelfId') {
        updateData.shelfId = value;
      } else {
        updateData[editField] = parseInt(value);
      }

      // Update all selected items
      selectedItems.forEach(item => {
        const inventoryRef = doc(db, 'inventory', item.id);
        batch.update(inventoryRef, updateData);
      });

      await batch.commit();

      // Track bulk update history
      await trackBulkUpdate(
        selectedItems,
        editField,
        editField === 'shelfId' ? value : parseInt(value),
        userId
      );

      // Generate alerts for items if quantity was changed
      if (editField === 'quantity' || editField === 'minStockLevel' || editField === 'maxStockLevel') {
        for (const item of selectedItems) {
          const product = products.find(p => p.id === item.productId);
          const newQuantity = editField === 'quantity' ? parseInt(value) : item.quantity;
          const newMinLevel = editField === 'minStockLevel' ? parseInt(value) : item.minStockLevel;
          const newMaxLevel = editField === 'maxStockLevel' ? parseInt(value) : item.maxStockLevel;

          await checkAndGenerateStockAlerts(
            {
              warehouseId: item.warehouseId,
              productId: item.productId,
              shelfId: item.shelfId,
              currentQuantity: newQuantity,
              minStockLevel: newMinLevel,
              maxStockLevel: newMaxLevel,
              previousQuantity: item.quantity,
            },
            product
          );
        }
      }

      toast.success(
        'Bulk update successful', 
        `Updated ${selectedItems.length} items`
      );
      
      onClose();
    } catch (error: any) {
      console.error('Error bulk updating inventory:', error);
      toast.error('Failed to update inventory', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = (field: BulkEditField): string => {
    switch (field) {
      case 'quantity': return 'Quantity';
      case 'minStockLevel': return 'Minimum Stock Level';
      case 'maxStockLevel': return 'Maximum Stock Level';
      case 'shelfId': return 'Shelf ID';
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6" />
            Bulk Edit Inventory
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-400">
            <strong>{selectedItems.length}</strong> items selected for bulk update
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Field to Update <span className="text-red-500">*</span>
            </label>
            <select
              value={editField}
              onChange={(e) => setEditField(e.target.value as BulkEditField)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="minStockLevel">Minimum Stock Level</option>
              <option value="maxStockLevel">Maximum Stock Level</option>
              <option value="quantity">Quantity</option>
              <option value="shelfId">Shelf ID</option>
            </select>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Value <span className="text-red-500">*</span>
            </label>
            <Input
              type={editField === 'shelfId' ? 'text' : 'number'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Enter new ${getFieldLabel(editField).toLowerCase()}`}
              min={editField !== 'shelfId' ? '0' : undefined}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This value will be applied to all {selectedItems.length} selected items
            </p>
          </div>

          {/* Warning */}
          {editField === 'quantity' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <strong>Warning:</strong> This will update quantity for all selected items and may trigger alerts
              </p>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {validationError}
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 font-semibold">
              Preview of changes:
            </p>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 max-h-32 overflow-y-auto">
              {selectedItems.slice(0, 5).map(item => {
                const product = products.find(p => p.id === item.productId);
                return (
                  <div key={item.id} className="flex justify-between">
                    <span>{product?.name || 'Unknown'}</span>
                    <span className="font-mono">
                      {editField === 'shelfId' ? value : value}
                    </span>
                  </div>
                );
              })}
              {selectedItems.length > 5 && (
                <div className="text-gray-500 italic">
                  ... and {selectedItems.length - 5} more
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              Update {selectedItems.length} Items
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
