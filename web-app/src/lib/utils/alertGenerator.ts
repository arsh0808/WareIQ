import { addDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Alert, AlertType, AlertSeverity, Inventory, Product } from '@/lib/types';
import { sendAlertNotifications } from './notifications';

interface AlertGenerationParams {
  warehouseId: string;
  productId?: string;
  shelfId?: string;
  deviceId?: string;
  currentQuantity?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  previousQuantity?: number;
}

/**
 * Check and generate stock-related alerts
 */
export async function checkAndGenerateStockAlerts(
  params: AlertGenerationParams,
  product?: Product
): Promise<void> {
  const { warehouseId, productId, shelfId, currentQuantity, minStockLevel, maxStockLevel, previousQuantity } = params;

  if (currentQuantity === undefined || minStockLevel === undefined) return;

  // Out of stock alert (Critical)
  if (currentQuantity === 0 && (previousQuantity === undefined || previousQuantity > 0)) {
    await createAlert({
      type: 'low_stock',
      severity: 'critical',
      warehouseId,
      productId,
      shelfId,
      message: `Product "${product?.name || productId}" is now OUT OF STOCK`,
      details: {
        currentQuantity: 0,
        minStockLevel,
        productName: product?.name || 'Unknown',
        sku: product?.sku || 'N/A',
        alertReason: 'out_of_stock',
      },
    });
  }
  // Low stock alert (Warning)
  else if (currentQuantity > 0 && currentQuantity <= minStockLevel) {
    // Check if alert already exists for this product/shelf
    const existingAlert = await checkExistingAlert(warehouseId, productId, 'low_stock');
    
    if (!existingAlert) {
      await createAlert({
        type: 'low_stock',
        severity: 'warning',
        warehouseId,
        productId,
        shelfId,
        message: `Product "${product?.name || productId}" is running low on stock`,
        details: {
          currentQuantity,
          minStockLevel,
          maxStockLevel,
          productName: product?.name || 'Unknown',
          sku: product?.sku || 'N/A',
          alertReason: 'below_minimum',
          percentageRemaining: ((currentQuantity / minStockLevel) * 100).toFixed(1),
        },
      });
    }
  }
  // Overstocked alert (Info) - if quantity exceeds max stock level
  else if (maxStockLevel && currentQuantity > maxStockLevel) {
    const existingAlert = await checkExistingAlert(warehouseId, productId, 'low_stock');
    
    if (!existingAlert) {
      await createAlert({
        type: 'low_stock',
        severity: 'info',
        warehouseId,
        productId,
        shelfId,
        message: `Product "${product?.name || productId}" has exceeded maximum stock level`,
        details: {
          currentQuantity,
          minStockLevel,
          maxStockLevel,
          productName: product?.name || 'Unknown',
          sku: product?.sku || 'N/A',
          alertReason: 'overstocked',
          percentageOverMax: (((currentQuantity - maxStockLevel) / maxStockLevel) * 100).toFixed(1),
        },
      });
    }
  }
}

/**
 * Check if an unresolved alert already exists
 */
async function checkExistingAlert(
  warehouseId: string,
  productId?: string,
  type?: AlertType
): Promise<boolean> {
  try {
    let alertQuery = query(
      collection(db, 'alerts'),
      where('warehouseId', '==', warehouseId),
      where('resolved', '==', false)
    );

    if (productId) {
      alertQuery = query(alertQuery, where('productId', '==', productId));
    }

    if (type) {
      alertQuery = query(alertQuery, where('type', '==', type));
    }

    const snapshot = await getDocs(alertQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking existing alerts:', error);
    return false;
  }
}

/**
 * Create a new alert in the database
 */
async function createAlert(alertData: Omit<Alert, 'id' | 'createdAt' | 'resolved'>): Promise<string> {
  try {
    const fullAlertData = {
      ...alertData,
      resolved: false,
      createdAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, 'alerts'), fullAlertData);
    
    console.log(`Alert created: ${alertData.type} - ${alertData.message}`);
    
    // Send notifications for the alert (async, don't wait)
    const productName = alertData.details?.productName as string | undefined;
    sendAlertNotifications(
      { id: docRef.id, ...fullAlertData } as Alert,
      productName
    ).catch(err => console.error('Error sending alert notifications:', err));
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
}

/**
 * Generate device-related alerts
 */
export async function checkAndGenerateDeviceAlerts(params: {
  warehouseId: string;
  deviceId: string;
  shelfId?: string;
  batteryLevel?: number;
  status?: string;
  lastHeartbeat?: Date;
}): Promise<void> {
  const { warehouseId, deviceId, shelfId, batteryLevel, status } = params;

  // Low battery alert
  if (batteryLevel !== undefined && batteryLevel < 20) {
    const existingAlert = await checkExistingAlert(warehouseId, undefined, 'low_battery');
    
    if (!existingAlert) {
      await createAlert({
        type: 'low_battery',
        severity: batteryLevel < 10 ? 'critical' : 'warning',
        warehouseId,
        deviceId,
        shelfId,
        message: `Device ${deviceId} has low battery (${batteryLevel}%)`,
        details: {
          batteryLevel,
          deviceId,
          alertReason: 'low_battery',
        },
      });
    }
  }

  // Sensor failure alert
  if (status === 'error' || status === 'offline') {
    const existingAlert = await checkExistingAlert(warehouseId, undefined, 'sensor_failure');
    
    if (!existingAlert) {
      await createAlert({
        type: 'sensor_failure',
        severity: 'critical',
        warehouseId,
        deviceId,
        shelfId,
        message: `Device ${deviceId} is ${status}`,
        details: {
          deviceId,
          status,
          alertReason: 'device_malfunction',
        },
      });
    }
  }
}

/**
 * Batch check all inventory for alerts
 */
export async function batchCheckInventoryAlerts(
  warehouseId: string,
  inventory: Inventory[],
  products: Product[]
): Promise<number> {
  let alertsGenerated = 0;

  for (const item of inventory) {
    const product = products.find(p => p.id === item.productId);
    
    try {
      await checkAndGenerateStockAlerts(
        {
          warehouseId: item.warehouseId,
          productId: item.productId,
          shelfId: item.shelfId,
          currentQuantity: item.quantity,
          minStockLevel: item.minStockLevel,
          maxStockLevel: item.maxStockLevel,
        },
        product
      );
      alertsGenerated++;
    } catch (error) {
      console.error(`Error checking alerts for product ${item.productId}:`, error);
    }
  }

  return alertsGenerated;
}
