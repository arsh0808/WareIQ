import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'manager' | 'staff' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  warehouseId: string;
  photoURL?: string;
  createdAt: Timestamp | Date;
  lastLogin: Timestamp | Date;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  managerId?: string;
  capacity: number;
  status?: 'active' | 'inactive';
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface Shelf {
  id: string;
  warehouseId: string;
  shelfCode: string;
  zone: string;
  row: number;
  column: number;
  level: number;
  maxCapacity: number;
  maxWeight: number;
  currentWeight: number;
  status: 'active' | 'maintenance' | 'inactive';
  deviceIds: string[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  unitPrice: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  minStockLevel: number;
  reorderPoint: number;
  supplier: string;
  barcode: string;
  qrCode: string;
  imageURL: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface Inventory {
  id: string;
  productId: string;
  shelfId: string;
  warehouseId: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  lastCounted?: Timestamp | Date;
  lastUpdated?: Timestamp | Date;
  updatedBy?: string;
  status?: 'available' | 'reserved' | 'damaged';
}

export type DeviceType = 'weight_sensor' | 'rfid_reader' | 'temperature_sensor' | 'camera';
export type DeviceStatus = 'online' | 'offline' | 'error';

export interface IoTDevice {
  id: string;
  deviceId: string;
  deviceType: DeviceType;
  shelfId: string;
  warehouseId: string;
  status: DeviceStatus;
  batteryLevel: number;
  firmwareVersion?: string;
  lastHeartbeat?: Timestamp | Date;
  configuration?: Record<string, any>;
  name?: string;
  apiKeyHash?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export type AlertType = 
  | 'low_stock' 
  | 'sensor_failure' 
  | 'unauthorized_access' 
  | 'temperature_alert' 
  | 'weight_mismatch'
  | 'low_battery';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  warehouseId: string;
  shelfId?: string;
  productId?: string;
  deviceId?: string;
  message: string;
  details: Record<string, any>;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string;
  createdAt: Timestamp | Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: Timestamp | Date;
}

export interface SensorData {
  weight?: number;
  temperature?: number;
  humidity?: number;
  timestamp: number;
}

export interface DeviceStatusRealtime {
  online: boolean;
  lastSeen: number;
}

export interface RealTimeInventory {
  currentWeight: number;
  lastUpdate: number;
  items?: number;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  categoryDistribution: Record<string, number>;
}

export interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  byType: Record<AlertType, number>;
}

export interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  byType: Record<DeviceType, number>;
}

export interface DashboardData {
  inventory: InventoryStats;
  alerts: AlertStats;
  devices: DeviceStats;
  recentActivity: AuditLog[];
}
