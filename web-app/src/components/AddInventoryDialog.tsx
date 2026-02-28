'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { addDoc, collection, Timestamp, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from '@/lib/hooks/useToast';
import { Plus, X, Package } from 'lucide-react';
import type { Product } from '@/lib/types';
import { checkAndGenerateStockAlerts } from '@/lib/utils/alertGenerator';
import { trackInventoryCreate } from '@/lib/utils/inventoryHistory';

interface AddInventoryDialogProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  userId: string;
}

export function AddInventoryDialog({ open, onClose, warehouseId, userId }: AddInventoryDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [minStockLevel, setMinStockLevel] = useState(10);
  const [maxStockLevel, setMaxStockLevel] = useState(100);
  const [shelfId, setShelfId] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      const productsQuery = query(collection(db, 'products'));
      const snapshot = await getDocs(productsQuery);
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(productsData);
    };

    if (open) {
      loadProducts();
    }
  }, [open]);

  const resetForm = () => {
    setSelectedProductId('');
    setQuantity(0);
    setMinStockLevel(10);
    setMaxStockLevel(100);
    setShelfId('');
    setValidationError(null);
  };

  const validateForm = (): boolean => {
    if (!selectedProductId) {
      setValidationError('Please select a product');
      return false;
    }
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
      const selectedProduct = products.find(p => p.id === selectedProductId);
      
      const inventoryData = {
        productId: selectedProductId,
        shelfId,
        warehouseId,
        quantity,
        minStockLevel,
        maxStockLevel,
        lastUpdated: Timestamp.now(),
        updatedBy: userId,
        status: 'available' as const,
      };
      
      // Add inventory item
      const docRef = await addDoc(collection(db, 'inventory'), inventoryData);

      // Track history
      await trackInventoryCreate(
        docRef.id,
        { id: docRef.id, ...inventoryData } as any,
        userId,
        undefined,
        'Created via Add Inventory Dialog'
      );

      // Check and generate alerts for the new inventory
      await checkAndGenerateStockAlerts(
        {
          warehouseId,
          productId: selectedProductId,
          shelfId,
          currentQuantity: quantity,
          minStockLevel,
          maxStockLevel,
        },
        selectedProduct
      );

      if (quantity === 0) {
        toast.error('Inventory added - OUT OF STOCK', `${selectedProduct?.name || 'Product'} has zero stock!`);
      } else if (quantity <= minStockLevel) {
        toast.warning('Inventory added - LOW STOCK', `${selectedProduct?.name || 'Product'} is below minimum level`);
      } else {
        toast.success('Inventory added successfully', `Added ${selectedProduct?.name || 'product'} to inventory`);
      }
      
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error adding inventory:', error);
      toast.error('Failed to add inventory', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6" />
            Add Inventory Item
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Initial Quantity <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="Enter quantity"
              min="0"
              required
            />
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
              <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              isLoading={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Inventory
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
