import { Timestamp } from 'firebase/firestore';

export type InventoryActionType = 
  | 'create'
  | 'update'
  | 'delete'
  | 'stock_in'
  | 'stock_out'
  | 'transfer'
  | 'adjustment'
  | 'bulk_update';

export interface InventoryHistory {
  id: string;
  inventoryId: string;
  productId: string;
  warehouseId: string;
  actionType: InventoryActionType;
  performedBy: string;
  performedByName?: string;
  timestamp: Timestamp | Date;
  
  // Changes
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  
  // Optional details
  quantity?: number;
  previousQuantity?: number;
  shelfId?: string;
  previousShelfId?: string;
  reason?: string;
  notes?: string;
  
  // Reference info
  referenceNumber?: string;
  relatedTransactionId?: string;
}

export interface InventoryHistoryFilters {
  inventoryId?: string;
  productId?: string;
  warehouseId?: string;
  actionType?: InventoryActionType;
  performedBy?: string;
  startDate?: Date;
  endDate?: Date;
}
