import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['admin', 'manager', 'staff', 'viewer']),
  warehouseId: z.string().min(1, 'Warehouse is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  sku: z.string().min(1, 'SKU is required').max(50),
  description: z.string().max(500).optional(),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive'),
  weight: z.number().positive('Weight must be positive').optional(),
  imageUrl: z.string().url().optional(),
  barcode: z.string().optional(),
});

export const warehouseSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  location: z.string().min(1, 'Location is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'Valid zip code required').max(10),
  country: z.string().min(2, 'Country is required'),
  capacity: z.number().positive('Capacity must be positive'),
  manager: z.string().optional(),
});

export const shelfSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  location: z.string().min(1, 'Location is required'),
  aisle: z.string().min(1, 'Aisle is required'),
  row: z.string().min(1, 'Row is required'),
  level: z.number().int().positive('Level must be positive'),
  maxWeight: z.number().positive('Max weight must be positive'),
  maxCapacity: z.number().positive('Max capacity must be positive'),
});

export const iotDeviceSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  deviceType: z.enum(['weight_sensor', 'temperature_sensor', 'rfid_reader', 'barcode_scanner']),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  shelfId: z.string().min(1, 'Shelf is required'),
  apiKey: z.string().min(32, 'Valid API key required'),
  name: z.string().optional(),
  model: z.string().optional(),
  firmwareVersion: z.string().optional(),
});

export const iotWebhookSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  apiKey: z.string().min(32, 'API key is required'),
  deviceType: z.enum(['weight_sensor', 'temperature_sensor', 'rfid_reader', 'barcode_scanner']),
  data: z.record(z.any()),
  timestamp: z.number().optional(),
  signature: z.string().optional(),
});

export const inventorySchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  shelfId: z.string().min(1, 'Shelf is required'),
  quantity: z.number().int().nonnegative('Quantity cannot be negative'),
  minStockLevel: z.number().int().positive('Minimum stock level must be positive'),
  maxStockLevel: z.number().int().positive('Maximum stock level must be positive'),
});

export const alertSchema = z.object({
  type: z.enum(['low_stock', 'weight_mismatch', 'temperature_alert', 'sensor_failure', 'low_battery']),
  severity: z.enum(['info', 'warning', 'critical']),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  shelfId: z.string().optional(),
  deviceId: z.string().optional(),
  productId: z.string().optional(),
  message: z.string().min(1, 'Message is required').max(500),
  details: z.record(z.any()).optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type WarehouseInput = z.infer<typeof warehouseSchema>;
export type ShelfInput = z.infer<typeof shelfSchema>;
export type IotDeviceInput = z.infer<typeof iotDeviceSchema>;
export type IotWebhookInput = z.infer<typeof iotWebhookSchema>;
export type InventoryInput = z.infer<typeof inventorySchema>;
export type AlertInput = z.infer<typeof alertSchema>;
