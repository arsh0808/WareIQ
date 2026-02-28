import { addDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { InventoryHistory, InventoryActionType, InventoryHistoryFilters } from '@/lib/types/inventoryHistory';
import type { Inventory } from '@/lib/types';

/**
 * Log an inventory action to history
 */
export async function logInventoryHistory(params: {
  inventoryId: string;
  productId: string;
  warehouseId: string;
  actionType: InventoryActionType;
  performedBy: string;
  performedByName?: string;
  changes: { field: string; oldValue: any; newValue: any }[];
  quantity?: number;
  previousQuantity?: number;
  shelfId?: string;
  previousShelfId?: string;
  reason?: string;
  notes?: string;
  referenceNumber?: string;
  relatedTransactionId?: string;
}): Promise<string> {
  try {
    // Build history data object, only including defined fields
    const historyData: any = {
      inventoryId: params.inventoryId,
      productId: params.productId,
      warehouseId: params.warehouseId,
      actionType: params.actionType,
      performedBy: params.performedBy,
      timestamp: Timestamp.now(),
      changes: params.changes,
    };

    // Only add optional fields if they are defined
    if (params.performedByName !== undefined) historyData.performedByName = params.performedByName;
    if (params.quantity !== undefined) historyData.quantity = params.quantity;
    if (params.previousQuantity !== undefined) historyData.previousQuantity = params.previousQuantity;
    if (params.shelfId !== undefined) historyData.shelfId = params.shelfId;
    if (params.previousShelfId !== undefined) historyData.previousShelfId = params.previousShelfId;
    if (params.reason !== undefined) historyData.reason = params.reason;
    if (params.notes !== undefined) historyData.notes = params.notes;
    if (params.referenceNumber !== undefined) historyData.referenceNumber = params.referenceNumber;
    if (params.relatedTransactionId !== undefined) historyData.relatedTransactionId = params.relatedTransactionId;

    const docRef = await addDoc(collection(db, 'inventory-history'), historyData);
    console.log(`Inventory history logged: ${params.actionType} for ${params.inventoryId}`);
    return docRef.id;
  } catch (error) {
    console.error('Error logging inventory history:', error);
    throw error;
  }
}

/**
 * Get inventory history with filters
 */
export async function getInventoryHistory(
  filters: InventoryHistoryFilters,
  maxResults: number = 100
): Promise<InventoryHistory[]> {
  try {
    let historyQuery = query(collection(db, 'inventory-history'));

    // Apply filters
    if (filters.inventoryId) {
      historyQuery = query(historyQuery, where('inventoryId', '==', filters.inventoryId));
    }
    if (filters.productId) {
      historyQuery = query(historyQuery, where('productId', '==', filters.productId));
    }
    if (filters.warehouseId) {
      historyQuery = query(historyQuery, where('warehouseId', '==', filters.warehouseId));
    }
    if (filters.actionType) {
      historyQuery = query(historyQuery, where('actionType', '==', filters.actionType));
    }
    if (filters.performedBy) {
      historyQuery = query(historyQuery, where('performedBy', '==', filters.performedBy));
    }
    if (filters.startDate) {
      historyQuery = query(historyQuery, where('timestamp', '>=', Timestamp.fromDate(filters.startDate)));
    }
    if (filters.endDate) {
      historyQuery = query(historyQuery, where('timestamp', '<=', Timestamp.fromDate(filters.endDate)));
    }

    // Order by timestamp (newest first)
    historyQuery = query(historyQuery, orderBy('timestamp', 'desc'), limit(maxResults));

    const snapshot = await getDocs(historyQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as InventoryHistory[];
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    throw error;
  }
}

/**
 * Get recent history for a specific inventory item
 */
export async function getRecentInventoryHistory(
  inventoryId: string,
  maxResults: number = 10
): Promise<InventoryHistory[]> {
  return getInventoryHistory({ inventoryId }, maxResults);
}

/**
 * Track inventory update with automatic history logging
 */
export async function trackInventoryUpdate(
  inventoryId: string,
  oldData: Inventory,
  newData: Partial<Inventory>,
  userId: string,
  userName?: string,
  reason?: string
): Promise<void> {
  const changes: { field: string; oldValue: any; newValue: any }[] = [];

  // Track all changed fields
  Object.keys(newData).forEach(key => {
    if (key === 'lastUpdated' || key === 'updatedBy') return; // Skip metadata fields
    
    const oldValue = (oldData as any)[key];
    const newValue = (newData as any)[key];
    
    if (oldValue !== newValue && newValue !== undefined) {
      changes.push({
        field: key,
        oldValue,
        newValue,
      });
    }
  });

  if (changes.length === 0) return; // No changes to log

  // Determine action type
  let actionType: InventoryActionType = 'update';
  if (newData.quantity !== undefined && oldData.quantity !== newData.quantity) {
    if (newData.quantity > oldData.quantity) {
      actionType = 'stock_in';
    } else if (newData.quantity < oldData.quantity) {
      actionType = 'stock_out';
    }
  }
  if (newData.shelfId !== undefined && oldData.shelfId !== newData.shelfId) {
    actionType = 'transfer';
  }

  await logInventoryHistory({
    inventoryId,
    productId: oldData.productId,
    warehouseId: oldData.warehouseId,
    actionType,
    performedBy: userId,
    performedByName: userName,
    changes,
    quantity: newData.quantity,
    previousQuantity: oldData.quantity,
    shelfId: newData.shelfId,
    previousShelfId: oldData.shelfId,
    reason,
  });
}

/**
 * Track inventory creation
 */
export async function trackInventoryCreate(
  inventoryId: string,
  inventoryData: Inventory,
  userId: string,
  userName?: string,
  reason?: string
): Promise<void> {
  await logInventoryHistory({
    inventoryId,
    productId: inventoryData.productId,
    warehouseId: inventoryData.warehouseId,
    actionType: 'create',
    performedBy: userId,
    performedByName: userName,
    changes: [
      { field: 'created', oldValue: null, newValue: 'Initial creation' },
    ],
    quantity: inventoryData.quantity,
    shelfId: inventoryData.shelfId,
    reason,
  });
}

/**
 * Track inventory deletion
 */
export async function trackInventoryDelete(
  inventoryId: string,
  inventoryData: Inventory,
  userId: string,
  userName?: string,
  reason?: string
): Promise<void> {
  await logInventoryHistory({
    inventoryId,
    productId: inventoryData.productId,
    warehouseId: inventoryData.warehouseId,
    actionType: 'delete',
    performedBy: userId,
    performedByName: userName,
    changes: [
      { field: 'deleted', oldValue: 'Active', newValue: 'Deleted' },
    ],
    previousQuantity: inventoryData.quantity,
    previousShelfId: inventoryData.shelfId,
    reason,
  });
}

/**
 * Track bulk update
 */
export async function trackBulkUpdate(
  inventoryItems: Inventory[],
  field: string,
  newValue: any,
  userId: string,
  userName?: string
): Promise<void> {
  const promises = inventoryItems.map(item => {
    const oldValue = (item as any)[field];
    return logInventoryHistory({
      inventoryId: item.id,
      productId: item.productId,
      warehouseId: item.warehouseId,
      actionType: 'bulk_update',
      performedBy: userId,
      performedByName: userName,
      changes: [
        { field, oldValue, newValue },
      ],
      quantity: item.quantity,
      shelfId: item.shelfId,
      notes: `Bulk update: ${field} changed to ${newValue}`,
    });
  });

  await Promise.all(promises);
}

/**
 * Get inventory history summary/statistics
 */
export async function getInventoryHistoryStats(
  warehouseId: string,
  days: number = 30
): Promise<{
  totalActions: number;
  stockIns: number;
  stockOuts: number;
  transfers: number;
  adjustments: number;
  mostActiveProducts: { productId: string; count: number }[];
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const history = await getInventoryHistory({ 
    warehouseId, 
    startDate 
  }, 1000);

  const stats = {
    totalActions: history.length,
    stockIns: history.filter(h => h.actionType === 'stock_in').length,
    stockOuts: history.filter(h => h.actionType === 'stock_out').length,
    transfers: history.filter(h => h.actionType === 'transfer').length,
    adjustments: history.filter(h => h.actionType === 'adjustment').length,
    mostActiveProducts: [] as { productId: string; count: number }[],
  };

  // Calculate most active products
  const productCounts: Record<string, number> = {};
  history.forEach(h => {
    productCounts[h.productId] = (productCounts[h.productId] || 0) + 1;
  });

  stats.mostActiveProducts = Object.entries(productCounts)
    .map(([productId, count]) => ({ productId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return stats;
}
