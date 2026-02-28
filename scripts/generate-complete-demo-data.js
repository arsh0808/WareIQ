/**
 * Complete Demo Data Generator
 * Generates realistic sample data for Smart Warehouse Management System
 * 
 * This script creates:
 * - Products (50+)
 * - Warehouses
 * - Inventory items
 * - Transactions (stock movements)
 * - Alerts (low stock, out of stock, device alerts)
 * - Shelves
 * - IoT Devices
 * - Audit logs
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../firebase/service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Sample data arrays
const categories = [
  'Electronics', 'Furniture', 'Clothing', 'Food & Beverages', 
  'Hardware', 'Stationery', 'Sports', 'Toys', 'Automotive', 'Books'
];

const subcategories = {
  'Electronics': ['Smartphones', 'Laptops', 'Tablets', 'Accessories', 'Cameras'],
  'Furniture': ['Office Chairs', 'Desks', 'Cabinets', 'Tables', 'Shelving'],
  'Clothing': ['Shirts', 'Pants', 'Jackets', 'Shoes', 'Accessories'],
  'Food & Beverages': ['Snacks', 'Beverages', 'Canned Goods', 'Frozen Items', 'Dairy'],
  'Hardware': ['Tools', 'Fasteners', 'Power Tools', 'Hand Tools', 'Safety Equipment'],
  'Stationery': ['Pens', 'Paper', 'Notebooks', 'Files', 'Desk Organizers'],
  'Sports': ['Fitness', 'Outdoor', 'Team Sports', 'Individual Sports', 'Accessories'],
  'Toys': ['Action Figures', 'Board Games', 'Educational', 'Dolls', 'Outdoor Toys'],
  'Automotive': ['Parts', 'Accessories', 'Fluids', 'Tools', 'Electronics'],
  'Books': ['Fiction', 'Non-Fiction', 'Educational', 'Children', 'Reference']
};

const productNames = {
  'Electronics': ['Smartphone XR', 'Laptop Pro 15', 'Wireless Mouse', 'USB Hub', 'Power Bank'],
  'Furniture': ['Ergonomic Chair', 'Standing Desk', 'File Cabinet', 'Conference Table', 'Bookshelf'],
  'Clothing': ['Cotton T-Shirt', 'Denim Jeans', 'Winter Jacket', 'Running Shoes', 'Belt'],
  'Food & Beverages': ['Instant Noodles', 'Coffee Beans', 'Cookies Pack', 'Energy Drink', 'Mineral Water'],
  'Hardware': ['Screwdriver Set', 'Hammer', 'Drill Machine', 'Measuring Tape', 'Safety Gloves'],
  'Stationery': ['Ballpoint Pen', 'A4 Paper Ream', 'Spiral Notebook', 'Stapler', 'Highlighters'],
  'Sports': ['Yoga Mat', 'Dumbbells', 'Basketball', 'Tennis Racket', 'Water Bottle'],
  'Toys': ['Building Blocks', 'Puzzle Game', 'RC Car', 'Teddy Bear', 'Art Set'],
  'Automotive': ['Engine Oil', 'Car Polish', 'Air Filter', 'Brake Pads', 'Floor Mats'],
  'Books': ['Business Guide', 'Cooking Recipes', 'Learn Python', "Children's Stories", 'World Atlas']
};

const suppliers = [
  'TechWorld Suppliers', 'Global Imports Ltd', 'Quality Goods Co', 
  'Prime Distributors', 'Elite Products Inc', 'Metro Wholesale',
  'Best Buy Trading', 'Supreme Vendors', 'Crystal Exports', 'Omega Suppliers'
];

const warehouses = [
  { id: 'WH-001', name: 'Main Warehouse', location: 'Mumbai Central', capacity: 10000 },
  { id: 'WH-002', name: 'North Warehouse', location: 'Delhi NCR', capacity: 8000 },
  { id: 'WH-003', name: 'South Warehouse', location: 'Bangalore Tech Park', capacity: 6000 }
];

const zones = ['A', 'B', 'C', 'D', 'E'];

// Helper functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateSKU(category, index) {
  const prefix = category.substring(0, 3).toUpperCase();
  return `${prefix}-${String(index).padStart(4, '0')}`;
}

function generateBarcode() {
  return String(randomInt(1000000000000, 9999999999999));
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return admin.firestore.Timestamp.fromDate(date);
}

// Main generation functions
async function generateWarehouses() {
  console.log('📦 Generating warehouses...');
  
  for (const wh of warehouses) {
    await db.collection('warehouses').doc(wh.id).set({
      name: wh.name,
      location: wh.location,
      address: `${randomInt(1, 999)} Warehouse Street`,
      city: wh.location.split(' ')[0],
      state: 'Maharashtra',
      zipCode: String(randomInt(400000, 400100)),
      country: 'India',
      capacity: wh.capacity,
      status: 'active',
      createdAt: daysAgo(365),
      updatedAt: daysAgo(1)
    });
  }
  
  console.log(`✅ Created ${warehouses.length} warehouses`);
}

async function generateShelves() {
  console.log('🗄️ Generating shelves...');
  
  let totalShelves = 0;
  
  for (const wh of warehouses) {
    for (const zone of zones) {
      for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 8; col++) {
          const shelfCode = `${zone}${row}-${String(col).padStart(2, '0')}`;
          
          await db.collection('shelves').add({
            warehouseId: wh.id,
            shelfCode,
            zone,
            row,
            column: col,
            level: randomInt(1, 4),
            maxCapacity: randomInt(50, 200),
            maxWeight: randomInt(500, 2000),
            currentWeight: randomInt(0, 1000),
            status: randomElement(['active', 'active', 'active', 'maintenance']),
            deviceIds: [],
            createdAt: daysAgo(randomInt(180, 365)),
            updatedAt: daysAgo(randomInt(1, 30))
          });
          
          totalShelves++;
        }
      }
    }
  }
  
  console.log(`✅ Created ${totalShelves} shelves`);
}

async function generateProducts() {
  console.log('📱 Generating products...');
  
  const products = [];
  let index = 1;
  
  for (const category of categories) {
    const subCats = subcategories[category];
    const names = productNames[category];
    
    // Generate 5-8 products per category
    for (let i = 0; i < randomInt(5, 8); i++) {
      const name = `${randomElement(names)} ${randomElement(['Pro', 'Plus', 'Lite', 'Max', 'Standard', ''])}`.trim();
      const sku = generateSKU(category, index);
      
      const product = {
        sku,
        name,
        description: `High quality ${name.toLowerCase()} for all your needs. Premium grade product.`,
        category,
        subcategory: randomElement(subCats),
        unitPrice: randomInt(10, 5000),
        weight: parseFloat((Math.random() * 10 + 0.1).toFixed(2)),
        dimensions: {
          length: randomInt(5, 50),
          width: randomInt(5, 50),
          height: randomInt(5, 50)
        },
        minStockLevel: randomInt(10, 30),
        reorderPoint: randomInt(15, 40),
        supplier: randomElement(suppliers),
        barcode: generateBarcode(),
        qrCode: `QR-${sku}`,
        imageURL: `https://picsum.photos/seed/${sku}/400/400`,
        createdAt: daysAgo(randomInt(100, 365)),
        updatedAt: daysAgo(randomInt(1, 50))
      };
      
      const docRef = await db.collection('products').add(product);
      products.push({ id: docRef.id, ...product });
      index++;
    }
  }
  
  console.log(`✅ Created ${products.length} products`);
  return products;
}

async function generateInventory(products) {
  console.log('📊 Generating inventory...');
  
  const inventory = [];
  
  // Get shelves
  const shelvesSnapshot = await db.collection('shelves').limit(100).get();
  const shelves = shelvesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Create inventory for 80% of products
  const productsToStock = products.slice(0, Math.floor(products.length * 0.8));
  
  for (const product of productsToStock) {
    const shelf = randomElement(shelves);
    const quantity = randomInt(0, 150); // Some will be 0 for out-of-stock alerts
    const minStockLevel = product.minStockLevel;
    const maxStockLevel = randomInt(minStockLevel + 50, minStockLevel + 200);
    
    const invData = {
      productId: product.id,
      shelfId: shelf.shelfCode,
      warehouseId: shelf.warehouseId,
      quantity,
      minStockLevel,
      maxStockLevel,
      status: quantity === 0 ? 'out_of_stock' : quantity <= minStockLevel ? 'low_stock' : 'available',
      lastUpdated: daysAgo(randomInt(1, 30)),
      updatedBy: 'system'
    };
    
    const docRef = await db.collection('inventory').add(invData);
    inventory.push({ id: docRef.id, ...invData });
  }
  
  console.log(`✅ Created ${inventory.length} inventory items`);
  return inventory;
}

async function generateTransactions(products, inventory) {
  console.log('💸 Generating transactions...');
  
  const types = ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'];
  let transactionCount = 0;
  
  // Generate 200 transactions over the past 90 days
  for (let i = 0; i < 200; i++) {
    const product = randomElement(products);
    const type = randomElement(types);
    const quantity = randomInt(1, 50);
    const unitPrice = product.unitPrice;
    
    const txnData = {
      type,
      productId: product.id,
      warehouseId: randomElement(warehouses).id,
      quantity,
      unitPrice,
      totalValue: quantity * unitPrice,
      referenceNumber: `TXN-${String(Date.now() + i).slice(-8)}`,
      performedBy: randomElement(['admin', 'manager', 'staff']),
      notes: `${type} transaction for ${product.name}`,
      timestamp: daysAgo(randomInt(1, 90)),
      createdAt: daysAgo(randomInt(1, 90))
    };
    
    if (type === 'TRANSFER') {
      txnData.fromWarehouse = randomElement(warehouses).id;
      txnData.toWarehouse = randomElement(warehouses).id;
    }
    
    await db.collection('transactions').add(txnData);
    transactionCount++;
  }
  
  console.log(`✅ Created ${transactionCount} transactions`);
}

async function generateAlerts(products, inventory) {
  console.log('🚨 Generating alerts...');
  
  let alertCount = 0;
  
  // Generate low stock alerts
  const lowStockItems = inventory.filter(inv => inv.quantity > 0 && inv.quantity <= inv.minStockLevel);
  
  for (const item of lowStockItems.slice(0, 15)) { // Limit to 15 alerts
    const product = products.find(p => p.id === item.productId);
    
    await db.collection('alerts').add({
      type: 'low_stock',
      severity: 'warning',
      warehouseId: item.warehouseId,
      shelfId: item.shelfId,
      productId: item.productId,
      message: `Low stock alert for ${product?.name || 'product'}`,
      details: {
        currentQuantity: item.quantity,
        minStockLevel: item.minStockLevel,
        productName: product?.name || 'Unknown',
        sku: product?.sku || 'N/A',
        alertReason: 'below_minimum'
      },
      resolved: randomInt(0, 10) > 7, // 30% resolved
      createdAt: daysAgo(randomInt(1, 30))
    });
    alertCount++;
  }
  
  // Generate out of stock alerts
  const outOfStockItems = inventory.filter(inv => inv.quantity === 0);
  
  for (const item of outOfStockItems.slice(0, 10)) {
    const product = products.find(p => p.id === item.productId);
    
    await db.collection('alerts').add({
      type: 'low_stock',
      severity: 'critical',
      warehouseId: item.warehouseId,
      shelfId: item.shelfId,
      productId: item.productId,
      message: `${product?.name || 'Product'} is OUT OF STOCK`,
      details: {
        currentQuantity: 0,
        minStockLevel: item.minStockLevel,
        productName: product?.name || 'Unknown',
        sku: product?.sku || 'N/A',
        alertReason: 'out_of_stock'
      },
      resolved: randomInt(0, 10) > 8, // 20% resolved
      createdAt: daysAgo(randomInt(1, 15))
    });
    alertCount++;
  }
  
  // Generate some device alerts
  for (let i = 0; i < 5; i++) {
    const alertTypes = ['low_battery', 'sensor_failure', 'temperature_alert'];
    const type = randomElement(alertTypes);
    
    await db.collection('alerts').add({
      type,
      severity: type === 'sensor_failure' ? 'critical' : 'warning',
      warehouseId: randomElement(warehouses).id,
      deviceId: `DEV-${randomInt(1000, 9999)}`,
      message: `Device alert: ${type.replace('_', ' ')}`,
      details: {
        deviceType: randomElement(['weight_sensor', 'rfid_reader', 'temperature_sensor']),
        alertReason: type
      },
      resolved: randomInt(0, 10) > 6,
      createdAt: daysAgo(randomInt(1, 20))
    });
    alertCount++;
  }
  
  console.log(`✅ Created ${alertCount} alerts`);
}

async function generateIoTDevices() {
  console.log('📡 Generating IoT devices...');
  
  const shelvesSnapshot = await db.collection('shelves').limit(50).get();
  const shelves = shelvesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  const deviceTypes = ['weight_sensor', 'rfid_reader', 'temperature_sensor', 'camera'];
  let deviceCount = 0;
  
  for (const shelf of shelves) {
    if (Math.random() > 0.5) { // 50% of shelves have devices
      const deviceType = randomElement(deviceTypes);
      
      await db.collection('iotDevices').add({
        deviceId: `DEV-${shelf.warehouseId}-${randomInt(1000, 9999)}`,
        deviceType,
        shelfId: shelf.shelfCode,
        warehouseId: shelf.warehouseId,
        name: `${deviceType.replace('_', ' ')} - ${shelf.shelfCode}`,
        status: randomElement(['online', 'online', 'online', 'offline']), // 75% online
        batteryLevel: randomInt(20, 100),
        firmwareVersion: `v${randomInt(1, 3)}.${randomInt(0, 9)}.${randomInt(0, 9)}`,
        lastHeartbeat: daysAgo(randomInt(0, 2)),
        configuration: {
          sensitivity: randomElement(['low', 'medium', 'high']),
          alertThreshold: randomInt(80, 95)
        },
        createdAt: daysAgo(randomInt(30, 365)),
        updatedAt: daysAgo(randomInt(0, 5))
      });
      deviceCount++;
    }
  }
  
  console.log(`✅ Created ${deviceCount} IoT devices`);
}

async function generateAuditLogs() {
  console.log('📝 Generating audit logs...');
  
  const actions = [
    'create_product', 'update_inventory', 'delete_product', 
    'create_transaction', 'resolve_alert', 'update_user',
    'create_warehouse', 'update_shelf', 'device_configured'
  ];
  
  const resources = ['products', 'inventory', 'transactions', 'alerts', 'users', 'warehouses', 'shelves', 'devices'];
  
  for (let i = 0; i < 100; i++) {
    const action = randomElement(actions);
    const resource = randomElement(resources);
    
    await db.collection('auditLogs').add({
      userId: randomElement(['admin', 'manager', 'staff']),
      action,
      resource,
      resourceId: `${resource.toUpperCase()}-${randomInt(1000, 9999)}`,
      details: {
        action: action,
        description: `User performed ${action.replace('_', ' ')} on ${resource}`,
        changes: {}
      },
      ipAddress: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
      timestamp: daysAgo(randomInt(1, 60))
    });
  }
  
  console.log(`✅ Created 100 audit logs`);
}

// Main execution
async function generateAllData() {
  console.log('\n🚀 Starting complete data generation...\n');
  
  try {
    await generateWarehouses();
    await generateShelves();
    const products = await generateProducts();
    const inventory = await generateInventory(products);
    await generateTransactions(products, inventory);
    await generateAlerts(products, inventory);
    await generateIoTDevices();
    await generateAuditLogs();
    
    console.log('\n✅ ========================================');
    console.log('✅ DATA GENERATION COMPLETE!');
    console.log('✅ ========================================\n');
    console.log('📊 Summary:');
    console.log(`   - Warehouses: ${warehouses.length}`);
    console.log(`   - Shelves: ~${warehouses.length * zones.length * 10 * 8}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Inventory Items: ${inventory.length}`);
    console.log(`   - Transactions: 200`);
    console.log(`   - Alerts: ~30-40`);
    console.log(`   - IoT Devices: ~25-30`);
    console.log(`   - Audit Logs: 100`);
    console.log('\n🎉 Your warehouse is now fully populated!\n');
    
  } catch (error) {
    console.error('❌ Error generating data:', error);
  } finally {
    process.exit(0);
  }
}

// Run the generator
generateAllData();
