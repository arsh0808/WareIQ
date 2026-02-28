'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import toast from '@/lib/hooks/useToast';
import { Save, X, Package, AlertTriangle } from 'lucide-react';
import type { Inventory, Product } from '@/lib/types';
import { checkAndGenerateStockAlerts } from '@/lib/utils/alertGenerator';
import { trackInventoryUpdate } from '@/lib/utils/inventoryHistory';

interface EditInventoryDialogProps {
  open: boolean;
  onClose: () => void;
  inventoryItem: Inventory;
  product?: Product;
  userId: string;
}

export function EditInventoryDialog({ open, onClose, inventoryItem, product, userId }: EditInventoryDialogProps) {
  const [quantity, setQuantity] = useState(inventoryItem.quantity);
  const [minStockLevel, setMinStockLevel] = useState(inventoryItem.minStockLevel);
  const [maxStockLevel, setMaxStockLevel] = useState(inventoryItem.maxStockLevel);
  const [shelfId, setShelfId] = useState(inventoryItem.shelfId);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when inventory item changes
  useEffect(() => {
    setQuantity(inventoryItem.quantity);
    setMinStockLevel(inventoryItem.minStockLevel);
    setMaxStockLevel(inventoryItem.maxStockLevel);
    setShelfId(inventoryItem.shelfId);
    setValidationError(null);
  }, [inventoryItem]);

  const validateForm = (): boolean => {
    if (quantity < 0) {
      setValidationError('Quantity cannot be negative');
      return false;
    }
    if (minStockLevel < 0) {
      setValidationError('Minimum stock level cannot be negative');
      return false;
    }
    if (maxStockLevel < 0) {
      setValidationError('Maximum stock level cannot be negative');
      return false;
    }
    if (minStockLevel > maxStockLevel) {
      setValidationError('Minimum stock level cannot be greater than maximum stock level');
      return false;
    }
    if (!shelfId.trim()) {
      setValidationError('Shelf ID is required');
      return false;
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
      const previousQuantity = inventoryItem.quantity;
      const inventoryRef = doc(db, 'inventory', inventoryItem.id);
      
      const updateData = {
        quantity,
        minStockLevel,
        maxStockLevel,
        shelfId,
        lastUpdated: Timestamp.now(),
        updatedBy: userId,
      };
      
      // Update inventory
      await updateDoc(inventoryRef, updateData);

      // Track history
      await trackInventoryUpdate(
        inventoryItem.id,
        inventoryItem,
        updateData,
        userId,
        undefined,
        'Manual update via Edit Dialog'
      );

      // Check and generate alerts based on the new stock levels
      await checkAndGenerateStockAlerts(
        {
          warehouseId: inventoryItem.warehouseId,
          productId: inventoryItem.productId,
          shelfId,
          currentQuantity: quantity,
          minStockLevel,
          maxStockLevel,
          previousQuantity,
        },
        product
      );

      // Show appropriate toast based on stock status
      if (quantity === 0) {
        toast.error('Inventory updated - OUT OF STOCK', `${product?.name || 'Product'} is now out of stock!`);
      } else if (quantity <= minStockLevel) {
        toast.warning('Inventory updated - LOW STOCK', `${product?.name || 'Product'} is below minimum stock level`);
      } else {
        toast.success('Inventory updated successfully', `Updated ${product?.name || 'product'} inventory`);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      toast.error('Failed to update inventory', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusInfo = () => {
    if (quantity === 0) {
      return {
        text: 'OUT OF STOCK',
        color: 'text-red-600 bg-red-50 dark:bg-red-900/20',
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    } else if (quantity <= minStockLevel) {
      return {
        text: 'LOW STOCK WARNING',
        color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
        icon: <AlertTriangle className="w-4 h-4" />,
      };
    } else if (maxStockLevel && quantity > maxStockLevel) {
      return {
        text: 'OVERSTOCKED',
        color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
        icon: <Package className="w-4 h-4" />,
      };
    }
    return {
      text: 'STOCK OK',
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
      icon: <Package className="w-4 h-4" />,
    };
  };

  const stockStatus = getStockStatusInfo();

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6" />
            Edit Inventory
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Product Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Product</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {product?.name || 'Unknown Product'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">SKU</p>
              <p className="font-mono font-semibold text-gray-900 dark:text-white">
                {product?.sku || 'N/A'}
              </p>
            </div>
          </div>
          
          {/* Live Stock Status Badge */}
          <div className={`mt-3 px-3 py-2 rounded-md flex items-center gap-2 ${stockStatus.color}`}>
            {stockStatus.icon}
            <span className="font-semibold text-sm">{stockStatus.text}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="Enter quantity"
              min="0"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current: {inventoryItem.quantity} units
            </p>
          </div>

          {/* Shelf ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Shelf ID <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={shelfId}
              onChange={(e) => setShelfId(e.target.value)}
              placeholder="e.g., A1-01"
              required
            />
          </div>

          {/* Min/Max Stock Levels */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Stock Level <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(parseInt(e.target.value) || 0)}
                placeholder="Min"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Stock Level <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={maxStockLevel}
                onChange={(e) => setMaxStockLevel(parseInt(e.target.value) || 0)}
                placeholder="Max"
                min="0"
                required
              />
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {validationError}
              </p>
            </div>
          )}

          {/* Alert Preview */}
          {quantity <= minStockLevel && quantity > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <strong>Warning:</strong> This will trigger a low stock alert
              </p>
            </div>
          )}

          {quantity === 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <strong>Critical:</strong> This will trigger an out-of-stock alert
              </p>
            </div>
          )}

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
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
