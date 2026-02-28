const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('../firebase/service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function generateLowStockAlerts() {
  console.log('Generating low stock alerts based on inventory thresholds...');
  
  const inventorySnapshot = await db.collection('inventory').get();
  const productsSnapshot = await db.collection('products').get();
  
  const productMap = new Map();
  productsSnapshot.forEach(doc => {
    productMap.set(doc.id, doc.data());
  });
  
  const batch = db.batch();
  let alertCount = 0;
  
  for (const invDoc of inventorySnapshot.docs) {
    const invData = invDoc.data();
    const product = productMap.get(invData.productId);
    
    if (!product) continue;
    
    const quantity = invData.quantity || 0;
    const minStock = invData.minStockLevel || 10;
    
    if (quantity <= minStock) {
      const severity = quantity === 0 ? 'critical' : quantity <= minStock / 2 ? 'critical' : 'warning';
      const alertRef = db.collection('alerts').doc();
      
      batch.set(alertRef, {
        type: 'low_stock',
        severity: severity,
        warehouseId: invData.warehouseId,
        productId: invData.productId,
        shelfId: invData.shelfId,
        message: `Low stock alert for ${product.name}`,
        details: {
          currentQuantity: quantity,
          threshold: minStock,
          productName: product.name,
          sku: product.sku,
          category: product.category
        },
        resolved: Math.random() > 0.7,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      alertCount++;
    }
  }
  
  await batch.commit();
  console.log(`Generated ${alertCount} low stock alerts`);
  return alertCount;
}

async function generateDeviceAlerts() {
  console.log('Generating device-related alerts...');
  
  const devicesQuery = await db.collection('iot-devices').get();
  
  const batch = db.batch();
  let alertCount = 0;
  
  for (const deviceDoc of devicesQuery.docs) {
    const device = deviceDoc.data();
    
    if (device.status === 'offline' && Math.random() > 0.5) {
      const alertRef = db.collection('alerts').doc();
      
      batch.set(alertRef, {
        type: 'sensor_failure',
        severity: 'critical',
        warehouseId: device.warehouseId,
        deviceId: deviceDoc.id,
        shelfId: device.shelfId,
        message: `Device ${device.name || device.deviceId} is offline`,
        details: {
          deviceType: device.deviceType,
          lastHeartbeat: device.lastHeartbeat,
          deviceName: device.name
        },
        resolved: Math.random() > 0.6,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      alertCount++;
    }
    
    if (device.batteryLevel && device.batteryLevel < 20) {
      const alertRef = db.collection('alerts').doc();
      
      batch.set(alertRef, {
        type: 'low_battery',
        severity: device.batteryLevel < 10 ? 'critical' : 'warning',
        warehouseId: device.warehouseId,
        deviceId: deviceDoc.id,
        shelfId: device.shelfId,
        message: `Low battery on device ${device.name || device.deviceId}`,
        details: {
          batteryLevel: device.batteryLevel,
          deviceType: device.deviceType,
          deviceName: device.name
        },
        resolved: Math.random() > 0.8,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      alertCount++;
    }
  }
  
  await batch.commit();
  console.log(`Generated ${alertCount} device alerts`);
  return alertCount;
}

async function generateTemperatureAlerts() {
  console.log('Generating temperature alerts...');
  
  const warehousesSnapshot = await db.collection('warehouses').get();
  
  const batch = db.batch();
  let alertCount = 0;
  
  for (const warehouseDoc of warehousesSnapshot.docs) {
    if (Math.random() > 0.7) {
      const alertRef = db.collection('alerts').doc();
      const temp = 18 + Math.random() * 15;
      
      batch.set(alertRef, {
        type: 'temperature_alert',
        severity: temp > 30 ? 'critical' : 'warning',
        warehouseId: warehouseDoc.id,
        message: `Temperature exceeded safe limits in ${warehouseDoc.data().name}`,
        details: {
          currentTemperature: temp.toFixed(1),
          threshold: 25,
          warehouseName: warehouseDoc.data().name,
          location: warehouseDoc.data().location
        },
        resolved: Math.random() > 0.5,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      alertCount++;
    }
  }
  
  await batch.commit();
  console.log(`Generated ${alertCount} temperature alerts`);
  return alertCount;
}

async function updateResolvedAlerts() {
  console.log('Updating resolved alerts with resolution details...');
  
  const alertsQuery = await db.collection('alerts')
    .where('resolved', '==', true)
    .get();
  
  const batch = db.batch();
  let count = 0;
  
  for (const alertDoc of alertsQuery.docs) {
    const createdAt = alertDoc.data().createdAt;
    
    if (createdAt && !alertDoc.data().resolvedAt) {
      const createdDate = createdAt.toDate();
      const resolvedDate = new Date(createdDate.getTime() + (1 + Math.random() * 48) * 60 * 60 * 1000);
      
      batch.update(alertDoc.ref, {
        resolvedAt: admin.firestore.Timestamp.fromDate(resolvedDate),
        resolvedBy: 'admin@wareiq.com',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      count++;
    }
  }
  
  await batch.commit();
  console.log(`Updated ${count} resolved alerts`);
  return count;
}

async function main() {
  try {
    console.log('Starting threshold-based alert generation...\n');
    
    const lowStock = await generateLowStockAlerts();
    const devices = await generateDeviceAlerts();
    const temperature = await generateTemperatureAlerts();
    const updated = await updateResolvedAlerts();
    
    const total = lowStock + devices + temperature;
    
    console.log('\n✅ Alert generation completed!');
    console.log('\nSummary:');
    console.log(`- Low Stock Alerts: ${lowStock}`);
    console.log(`- Device Alerts: ${devices}`);
    console.log(`- Temperature Alerts: ${temperature}`);
    console.log(`- Total New Alerts: ${total}`);
    console.log(`- Updated Resolved Alerts: ${updated}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating alerts:', error);
    process.exit(1);
  }
}

main();
