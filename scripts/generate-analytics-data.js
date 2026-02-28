const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('../firebase/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return data;
}

function getRandomDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateActivityLogs() {
  console.log('Generating activity logs...');
  
  const activities = [
    'inventory_update',
    'stock_received',
    'stock_transferred',
    'stock_dispatched',
    'manual_count',
    'alert_created',
    'alert_resolved',
    'device_registered',
    'product_added',
    'warehouse_updated'
  ];
  
  const users = ['admin@wareiq.com', 'manager@wareiq.com', 'staff@wareiq.com'];
  const warehouses = ['W001', 'W002', 'W003', 'W004', 'W005', 'W006', 'W007', 'W008', 'W009', 'W010'];
  
  const batch = db.batch();
  let count = 0;
  
  for (let i = 0; i < 500; i++) {
    const docRef = db.collection('activityLogs').doc();
    const daysAgo = getRandomInt(0, 90);
    const activity = activities[getRandomInt(0, activities.length - 1)];
    
    batch.set(docRef, {
      userId: users[getRandomInt(0, users.length - 1)],
      action: activity,
      resource: activity.includes('inventory') ? 'inventory' : 
                activity.includes('stock') ? 'inventory' :
                activity.includes('alert') ? 'alert' :
                activity.includes('device') ? 'device' :
                activity.includes('product') ? 'product' : 'warehouse',
      resourceId: `RES-${getRandomInt(1000, 9999)}`,
      warehouseId: warehouses[getRandomInt(0, warehouses.length - 1)],
      details: {
        quantity: getRandomInt(10, 500),
        previousValue: getRandomInt(100, 1000),
        newValue: getRandomInt(100, 1000)
      },
      timestamp: admin.firestore.Timestamp.fromDate(getRandomDate(daysAgo)),
      createdAt: admin.firestore.Timestamp.fromDate(getRandomDate(daysAgo))
    });
    
    count++;
  }
  
  await batch.commit();
  console.log(`Generated ${count} activity logs`);
}

async function generateAlerts() {
  console.log('Generating alerts...');
  
  const products = parseCSV(path.join(__dirname, '../Warehouse_Inventory_Large_Dataset/products_large.csv'));
  const inventory = parseCSV(path.join(__dirname, '../Warehouse_Inventory_Large_Dataset/inventory_large.csv'));
  const warehouses = parseCSV(path.join(__dirname, '../Warehouse_Inventory_Large_Dataset/warehouses_large.csv'));
  
  const alertTypes = [
    { type: 'low_stock', severity: 'warning', message: 'Stock level below minimum threshold' },
    { type: 'sensor_failure', severity: 'critical', message: 'IoT sensor not responding' },
    { type: 'weight_mismatch', severity: 'warning', message: 'Physical weight does not match recorded quantity' },
    { type: 'temperature_alert', severity: 'critical', message: 'Temperature exceeded safe limits' },
    { type: 'low_battery', severity: 'info', message: 'Device battery level below 20%' }
  ];
  
  const batch = db.batch();
  let count = 0;
  
  for (let i = 0; i < 100; i++) {
    const docRef = db.collection('alerts').doc();
    const daysAgo = getRandomInt(0, 60);
    const alertTemplate = alertTypes[getRandomInt(0, alertTypes.length - 1)];
    const inventoryItem = inventory[getRandomInt(0, inventory.length - 1)];
    const isResolved = Math.random() > 0.3;
    
    const alertData = {
      type: alertTemplate.type,
      severity: alertTemplate.severity,
      warehouseId: inventoryItem.warehouse_id,
      productId: inventoryItem.product_id,
      message: alertTemplate.message,
      details: {
        currentQuantity: parseInt(inventoryItem.quantity),
        threshold: alertTemplate.type === 'low_stock' ? getRandomInt(20, 50) : null,
        deviceId: alertTemplate.type.includes('sensor') || alertTemplate.type.includes('battery') ? 
                  `DEV-${getRandomInt(1000, 9999)}` : null
      },
      resolved: isResolved,
      createdAt: admin.firestore.Timestamp.fromDate(getRandomDate(daysAgo))
    };
    
    if (isResolved) {
      alertData.resolvedAt = admin.firestore.Timestamp.fromDate(getRandomDate(daysAgo - getRandomInt(1, 5)));
      alertData.resolvedBy = 'admin@wareiq.com';
    }
    
    batch.set(docRef, alertData);
    count++;
  }
  
  await batch.commit();
  console.log(`Generated ${count} alerts`);
}

async function generateInventoryHistory() {
  console.log('Generating inventory history...');
  
  const inventory = parseCSV(path.join(__dirname, '../Warehouse_Inventory_Large_Dataset/inventory_large.csv'));
  
  let batchCount = 0;
  let currentBatch = db.batch();
  let totalCount = 0;
  
  for (const item of inventory) {
    for (let day = 0; day <= 90; day += 7) {
      const docRef = db.collection('inventoryHistory').doc();
      const currentQty = parseInt(item.quantity);
      const variance = getRandomInt(-50, 100);
      const historicalQty = Math.max(0, currentQty + variance);
      
      currentBatch.set(docRef, {
        inventoryId: item.inventory_id,
        productId: item.product_id,
        warehouseId: item.warehouse_id,
        quantity: historicalQty,
        value: historicalQty * getRandomInt(100, 5000),
        timestamp: admin.firestore.Timestamp.fromDate(getRandomDate(day)),
        reason: day === 0 ? 'current' : 
                variance > 0 ? 'stock_received' : 
                variance < 0 ? 'stock_dispatched' : 'manual_count'
      });
      
      batchCount++;
      totalCount++;
      
      if (batchCount === 500) {
        await currentBatch.commit();
        console.log(`Committed batch: ${totalCount} history records`);
        currentBatch = db.batch();
        batchCount = 0;
      }
    }
  }
  
  if (batchCount > 0) {
    await currentBatch.commit();
  }
  
  console.log(`Generated ${totalCount} inventory history records`);
}

async function generateDailyMetrics() {
  console.log('Generating daily metrics...');
  
  const warehouses = parseCSV(path.join(__dirname, '../Warehouse_Inventory_Large_Dataset/warehouses_large.csv'));
  
  const batch = db.batch();
  let count = 0;
  
  for (let day = 0; day <= 90; day++) {
    for (const warehouse of warehouses) {
      const docRef = db.collection('dailyMetrics').doc();
      
      batch.set(docRef, {
        warehouseId: warehouse.warehouse_id,
        date: admin.firestore.Timestamp.fromDate(getRandomDate(day)),
        metrics: {
          totalItems: getRandomInt(800, 1500),
          totalValue: getRandomInt(500000, 2000000),
          itemsReceived: getRandomInt(50, 200),
          itemsDispatched: getRandomInt(40, 180),
          itemsTransferred: getRandomInt(10, 50),
          lowStockAlerts: getRandomInt(0, 15),
          criticalAlerts: getRandomInt(0, 5),
          utilizationPercentage: getRandomInt(60, 95),
          accuracyRate: 95 + Math.random() * 4.5
        },
        categoryBreakdown: {
          Furniture: getRandomInt(100, 400),
          Stationery: getRandomInt(200, 600),
          Utility: getRandomInt(150, 500)
        },
        createdAt: admin.firestore.Timestamp.fromDate(getRandomDate(day))
      });
      
      count++;
    }
  }
  
  await batch.commit();
  console.log(`Generated ${count} daily metric records`);
}

async function generateTransactions() {
  console.log('Generating transactions...');
  
  const inventory = parseCSV(path.join(__dirname, '../Warehouse_Inventory_Large_Dataset/inventory_large.csv'));
  const products = parseCSV(path.join(__dirname, '../Warehouse_Inventory_Large_Dataset/products_large.csv'));
  
  const productPriceMap = {};
  products.forEach(p => {
    productPriceMap[p.product_id] = parseFloat(p.unit_price);
  });
  
  const transactionTypes = ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'];
  
  let batchCount = 0;
  let currentBatch = db.batch();
  let totalCount = 0;
  
  for (let i = 0; i < 1000; i++) {
    const docRef = db.collection('transactions').doc();
    const inventoryItem = inventory[getRandomInt(0, inventory.length - 1)];
    const transactionType = transactionTypes[getRandomInt(0, transactionTypes.length - 1)];
    const quantity = getRandomInt(5, 100);
    const unitPrice = productPriceMap[inventoryItem.product_id] || 100;
    
    currentBatch.set(docRef, {
      type: transactionType,
      productId: inventoryItem.product_id,
      warehouseId: inventoryItem.warehouse_id,
      quantity: quantity,
      unitPrice: unitPrice,
      totalValue: quantity * unitPrice,
      fromWarehouse: transactionType === 'TRANSFER' ? `W${getRandomInt(1, 10).toString().padStart(3, '0')}` : null,
      toWarehouse: transactionType === 'TRANSFER' ? inventoryItem.warehouse_id : null,
      referenceNumber: `TXN-${Date.now()}-${getRandomInt(1000, 9999)}`,
      performedBy: 'admin@wareiq.com',
      notes: `${transactionType} transaction for inventory management`,
      timestamp: admin.firestore.Timestamp.fromDate(getRandomDate(getRandomInt(0, 90))),
      createdAt: admin.firestore.Timestamp.fromDate(getRandomDate(getRandomInt(0, 90)))
    });
    
    batchCount++;
    totalCount++;
    
    if (batchCount === 500) {
      await currentBatch.commit();
      console.log(`Committed batch: ${totalCount} transactions`);
      currentBatch = db.batch();
      batchCount = 0;
    }
  }
  
  if (batchCount > 0) {
    await currentBatch.commit();
  }
  
  console.log(`Generated ${totalCount} transactions`);
}

async function main() {
  try {
    console.log('Starting analytics data generation...\n');
    
    await generateActivityLogs();
    await generateAlerts();
    await generateInventoryHistory();
    await generateDailyMetrics();
    await generateTransactions();
    
    console.log('\n✅ All analytics data generated successfully!');
    console.log('\nSummary:');
    console.log('- 500 Activity Logs');
    console.log('- 100 Alerts');
    console.log('- ~2,600 Inventory History Records (90 days)');
    console.log('- ~910 Daily Metrics (90 days × 10 warehouses)');
    console.log('- 1,000 Transactions');
    console.log('\nTotal: ~4,110+ documents for comprehensive analytics');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating analytics data:', error);
    process.exit(1);
  }
}

main();
