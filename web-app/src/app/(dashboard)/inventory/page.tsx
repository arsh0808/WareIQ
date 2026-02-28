'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Inventory, Product } from '@/lib/types';
import { PageWrapper } from '@/components/PageWrapper';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Package, AlertTriangle, CheckCircle, Filter, Upload, Download, Edit, Plus, Trash2, History } from 'lucide-react';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { AddProductDialog } from '@/components/AddProductDialog';
import { EditInventoryDialog } from '@/components/EditInventoryDialog';
import { AddInventoryDialog } from '@/components/AddInventoryDialog';
import { BulkEditInventoryDialog } from '@/components/BulkEditInventoryDialog';
import { InventoryHistoryDialog } from '@/components/InventoryHistoryDialog';
import { exportToCSV } from '@/lib/utils/csvParser';
import toast from '@/lib/hooks/useToast';
import { trackInventoryDelete } from '@/lib/utils/inventoryHistory';
import { usePermission } from '@/components/PermissionGuard';

export default function InventoryPage() {
  const { user, userRole } = useAuth();
  const permissions = usePermission(userRole);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [showAddInventoryDialog, setShowAddInventoryDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<Inventory | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userRole?.warehouseId) return;

    const inventoryQuery = query(
      collection(db, 'inventory'),
      where('warehouseId', '==', userRole.warehouseId)
    );
    
    const unsubInventory = onSnapshot(inventoryQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Inventory[];
      setInventory(data);
      setLoading(false);
    });

    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(data);
    });

    return () => {
      unsubInventory();
      unsubProducts();
    };
  }, [userRole]);

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const getProductSku = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.sku || 'N/A';
  };

  const getStockStatus = (item: Inventory) => {
    if (item.quantity === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-50' };
    if (item.quantity <= item.minStockLevel) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-50' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-50' };
  };

  const filteredInventory = inventory.filter(item => {
    
    let statusMatch = true;
    if (filter === 'low') statusMatch = item.quantity <= item.minStockLevel && item.quantity > 0;
    if (filter === 'out') statusMatch = item.quantity === 0;

    let searchMatch = true;
    if (searchQuery) {
      const productName = getProductName(item.productId).toLowerCase();
      const productSku = getProductSku(item.productId).toLowerCase();
      const shelfId = item.shelfId.toLowerCase();
      const query = searchQuery.toLowerCase();
      searchMatch = productName.includes(query) || productSku.includes(query) || shelfId.includes(query);
    }
    
    return statusMatch && searchMatch;
  });

  const handleExport = () => {
    const exportData = filteredInventory.map(item => ({
      productId: item.productId,
      productName: getProductName(item.productId),
      sku: getProductSku(item.productId),
      quantity: item.quantity,
      minStockLevel: item.minStockLevel,
      maxStockLevel: item.maxStockLevel,
      shelfId: item.shelfId,
      status: getStockStatus(item).text,
    }));

    exportToCSV(exportData, `inventory-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Export successful', `Exported ${exportData.length} items`);
  };

  const handleEditInventory = (item: Inventory) => {
    setSelectedInventoryItem(item);
    setShowEditDialog(true);
  };

  const handleViewHistory = (item: Inventory) => {
    setSelectedInventoryItem(item);
    setShowHistoryDialog(true);
  };

  const handleDeleteInventory = async (item: Inventory) => {
    if (!user) return;
    
    if (!confirm(`Delete inventory for ${getProductName(item.productId)}?`)) {
      return;
    }

    try {
      // Track deletion before deleting
      await trackInventoryDelete(item.id, item, user.uid, undefined, 'Deleted via UI');
      
      await deleteDoc(doc(db, 'inventory', item.id));
      toast.success('Inventory deleted', 'The inventory item has been removed');
    } catch (error: any) {
      console.error('Error deleting inventory:', error);
      toast.error('Failed to delete inventory', error.message);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredInventory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredInventory.map(i => i.id)));
    }
  };

  const handleBulkEdit = () => {
    if (selectedItems.size === 0) {
      toast.warning('No items selected', 'Please select items to edit');
      return;
    }
    setShowBulkEditDialog(true);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      toast.warning('No items selected', 'Please select items to delete');
      return;
    }

    if (!confirm(`Delete ${selectedItems.size} inventory items?`)) {
      return;
    }

    try {
      const itemsToDelete = inventory.filter(i => selectedItems.has(i.id));
      
      // Track deletions
      for (const item of itemsToDelete) {
        await trackInventoryDelete(item.id, item, user!.uid, undefined, 'Bulk delete via UI');
      }

      // Delete items
      const promises = Array.from(selectedItems).map(id => 
        deleteDoc(doc(db, 'inventory', id))
      );

      await Promise.all(promises);
      toast.success('Items deleted', `${selectedItems.size} items have been removed`);
      setSelectedItems(new Set());
    } catch (error: any) {
      console.error('Error deleting items:', error);
      toast.error('Failed to delete items', error.message);
    }
  };

  return (
    <PageWrapper allowedRoles={['admin', 'manager', 'staff']}>
      <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Inventory Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track and manage your warehouse inventory
              </p>
            </div>
            <div className="flex gap-2">
              {selectedItems.size > 0 && (
                <>
                  <Button 
                    variant="outline" 
                    leftIcon={<Edit className="w-4 h-4" />}
                    onClick={handleBulkEdit}
                  >
                    Bulk Edit ({selectedItems.size})
                  </Button>
                  <Button 
                    variant="danger" 
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    onClick={handleBulkDelete}
                  >
                    Delete ({selectedItems.size})
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={() => setShowImportDialog(true)}
              >
                Import
              </Button>
              <Button 
                variant="outline" 
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExport}
                disabled={filteredInventory.length === 0}
              >
                Export
              </Button>
              <Button 
                variant="primary" 
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddInventoryDialog(true)}
              >
                Add Inventory
              </Button>
            </div>
          </div>

          {}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <SearchInput
                placeholder="Search by product, SKU, or shelf..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'primary' : 'outline'}
                size="md"
                onClick={() => setFilter('all')}
              >
                All Items
              </Button>
              <Button
                variant={filter === 'low' ? 'primary' : 'outline'}
                size="md"
                onClick={() => setFilter('low')}
                leftIcon={<AlertTriangle className="w-4 h-4" />}
              >
                Low Stock
              </Button>
              <Button
                variant={filter === 'out' ? 'danger' : 'outline'}
                size="md"
                onClick={() => setFilter('out')}
              >
                Out of Stock
              </Button>
            </div>
          </div>

          {loading ? (
            <Card className="p-6">
              <TableSkeleton rows={8} />
            </Card>
          ) : filteredInventory.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchQuery ? 'No inventory items match your search.' : 'No inventory items found.'}
              </p>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredInventory.length && filteredInventory.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Min/Max</TableHead>
                  <TableHead>Shelf</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const status = getStockStatus(item);
                  const product = products.find(p => p.id === item.productId);
                  const isSelected = selectedItems.has(item.id);
                  return (
                    <TableRow key={item.id} className={isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItemSelection(item.id)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getProductName(item.productId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                          {getProductSku(item.productId)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{item.quantity}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-500 dark:text-gray-400">
                          {item.minStockLevel} / {item.maxStockLevel}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{item.shelfId}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            item.quantity === 0 ? 'danger' :
                            item.quantity <= item.minStockLevel ? 'warning' :
                            'success'
                          }
                        >
                          {item.quantity === 0 && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {item.quantity > 0 && item.quantity <= item.minStockLevel && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {item.quantity > item.minStockLevel && <CheckCircle className="w-3 h-3 mr-1" />}
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<History className="w-4 h-4" />}
                            onClick={() => handleViewHistory(item)}
                            title="View History"
                          >
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Edit className="w-4 h-4" />}
                            onClick={() => handleEditInventory(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={() => handleDeleteInventory(item)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {}
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Total Items
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {inventory.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Low Stock Items
                  </p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {inventory.filter(i => i.quantity <= i.minStockLevel && i.quantity > 0).length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Out of Stock
                  </p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {inventory.filter(i => i.quantity === 0).length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </Card>
          </div>

          {/* Dialogs */}
          {userRole?.warehouseId && user && (
            <>
              <BulkImportDialog
                open={showImportDialog}
                onClose={() => setShowImportDialog(false)}
                warehouseId={userRole.warehouseId}
              />
              <AddProductDialog
                open={showAddProductDialog}
                onClose={() => setShowAddProductDialog(false)}
                warehouseId={userRole.warehouseId}
              />
              <AddInventoryDialog
                open={showAddInventoryDialog}
                onClose={() => setShowAddInventoryDialog(false)}
                warehouseId={userRole.warehouseId}
                userId={user.uid}
              />
              {selectedInventoryItem && (
                <>
                  <EditInventoryDialog
                    open={showEditDialog}
                    onClose={() => {
                      setShowEditDialog(false);
                      setSelectedInventoryItem(null);
                    }}
                    inventoryItem={selectedInventoryItem}
                    product={products.find(p => p.id === selectedInventoryItem.productId)}
                    userId={user.uid}
                  />
                  <InventoryHistoryDialog
                    open={showHistoryDialog}
                    onClose={() => {
                      setShowHistoryDialog(false);
                      setSelectedInventoryItem(null);
                    }}
                    inventoryId={selectedInventoryItem.id}
                    product={products.find(p => p.id === selectedInventoryItem.productId)}
                  />
                </>
              )}
              {selectedItems.size > 0 && (
                <BulkEditInventoryDialog
                  open={showBulkEditDialog}
                  onClose={() => {
                    setShowBulkEditDialog(false);
                    setSelectedItems(new Set());
                  }}
                  selectedItems={inventory.filter(i => selectedItems.has(i.id))}
                  products={products}
                  userId={user.uid}
                />
              )}
            </>
          )}
      </div>
    </PageWrapper>
  );
}
