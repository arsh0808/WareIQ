'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { X, History, User, Calendar, FileText } from 'lucide-react';
import { getRecentInventoryHistory } from '@/lib/utils/inventoryHistory';
import type { InventoryHistory } from '@/lib/types/inventoryHistory';
import type { Product } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface InventoryHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  inventoryId: string;
  product?: Product;
}

export function InventoryHistoryDialog({ 
  open, 
  onClose, 
  inventoryId,
  product 
}: InventoryHistoryDialogProps) {
  const [history, setHistory] = useState<InventoryHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && inventoryId) {
      loadHistory();
    }
  }, [open, inventoryId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getRecentInventoryHistory(inventoryId, 50);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      update: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      delete: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      stock_in: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      stock_out: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      transfer: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      adjustment: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      bulk_update: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    };
    return colors[actionType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6" />
            Inventory History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Product Info */}
        {product && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Product</p>
                <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">SKU</p>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{product.sku}</p>
              </div>
            </div>
          </div>
        )}

        {/* History Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No history records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record, index) => (
                <div
                  key={record.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Action Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(record.actionType)}`}>
                        {record.actionType.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      {record.quantity !== undefined && record.previousQuantity !== undefined && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {record.previousQuantity} → {record.quantity}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(record.timestamp)}
                    </div>
                  </div>

                  {/* Changes */}
                  {record.changes && record.changes.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {record.changes.map((change, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 p-2 rounded"
                        >
                          <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                            {change.field}:
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {String(change.oldValue)}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {String(change.newValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes/Reason */}
                  {(record.notes || record.reason) && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 italic mb-2">
                      "{record.notes || record.reason}"
                    </div>
                  )}

                  {/* Performed By */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <User className="w-3 h-3" />
                    <span>
                      {record.performedByName || record.performedBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {history.length} recent {history.length === 1 ? 'record' : 'records'}
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
