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

async function importWarehouses() {
  console.log('Importing warehouses...');
  const warehouses = parseCSV(path.join(__dirname, '../Warehouse_Inventory_Large_Dataset/warehouses_large.csv'));
  
  const batch = db.batch();
  const warehouseMap = {};
  
  for (const warehouse of warehouses) {
    const docRef = db.collection('warehouses').doc(warehouse.warehouse_id);
    warehouseMap[warehouse.warehouse_id] = docRef.id;
    
    batch.set(docRef, {
      name: warehouse.warehouse_name,
      location: warehouse.location,
      address: warehouse.location,
      city: warehouse.location,
      state: '',
      zipCode: '',
      country: 'India',
      capacity: parseInt(warehouse.capacity),
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  await batch.commit();
  console.log(`Imported ${warehouses.length} warehouses`);
  return warehouseMap;
}

async function importSuppliers() {
  console.log('Importing suppliers...');
  const suppliers = parseCSV(path.join(__dirname, '../Warehouse_Inventory_Large_Dataset/suppliers_large.csv'));
  
  const batch = db.batch();
  const supplierMap = {};
  
  for (const supplier of suppliers) {
    const docRef = db.collection('suppliers').doc(supplier.supplier_id);
    supplierMap[supplier.supplier_id] = supplier.supplier_name;
    
    batch.set(docRef, {
      name: supplier.supplier_name,
      contactPerson: supplier.contact_person,
      phone: supplier.phone,
      city: supplier.city,
      email: `${supplier.contact_person.toLowerCase().replace(/\s+/g, '.')}@${supplier.supplier_name.toLowerCase().replace(/\s+/g, '')}.com`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  await batch.commit();
  console.log(`Imported ${suppliers.length} suppliers`);
  return supplierMap;
}

async function importProducts(supplierMap) {
  console.log('Importing products...');
  const products = parseCSV(path.join(__dirname, '../Warehouse_Inventory_Large_Dataset/products_large.csv'));
  
  const batch = db.batch();
  const productMap = {};
  
  for (const product of products) {
    const docRef = db.collection('products').doc(product.product_id);
    productMap[product.product_id] = docRef.id;
    
    batch.set(docRef, {
      sku: product.sku,
      name: product.product_name,
      description: `${product.category} product`,
      category: product.category,
      subcategory: product.category,
      unitPrice: parseFloat(product.unit_price),
      weight: Math.random() * 10 + 1,
      dimensions: {
        length: Math.random() * 50 + 10,
        width: Math.random() * 50 + 10,
        height: Math.random() * 50 + 10
      },
      minStockLevel: 10,
      reorderPoint: 20,
      supplier: 'General Supplier',
      barcode: product.sku,
      qrCode: product.sku,
      imageURL: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  await batch.commit();
  console.log(`Imported ${products.length} products`);
  return productMap;
}

async function importInventory(warehouseMap, productMap) {
  console.log('Importing inventory...');
  const inventory = parseCSV(path.join(__dirname, '../Warehouse_Inventory_Large_Dataset/inventory_large.csv'));
  
  const batchSize = 500;
  let currentBatch = db.batch();
  let operationCount = 0;
  let totalCount = 0;
  
  for (const item of inventory) {
    const docRef = db.collection('inventory').doc(item.inventory_id);
    
    currentBatch.set(docRef, {
      productId: item.product_id,
      shelfId: `SHELF-${item.warehouse_id}-${Math.floor(Math.random() * 100)}`,
      warehouseId: item.warehouse_id,
      quantity: parseInt(item.quantity),
      minStockLevel: 10,
      maxStockLevel: 500,
      lastUpdated: admin.firestore.Timestamp.fromDate(new Date(item.last_updated)),
      status: 'available'
    });
    
    operationCount++;
    totalCount++;
    
    if (operationCount === batchSize) {
      await currentBatch.commit();
      console.log(`Committed batch: ${totalCount} items`);
      currentBatch = db.batch();
      operationCount = 0;
    }
  }
  
  if (operationCount > 0) {
    await currentBatch.commit();
  }
  
  console.log(`Imported ${totalCount} inventory items`);
}

async function main() {
  try {
    console.log('Starting CSV data import...\n');
    
    const warehouseMap = await importWarehouses();
    const supplierMap = await importSuppliers();
    const productMap = await importProducts(supplierMap);
    await importInventory(warehouseMap, productMap);
    
    console.log('\n✅ All data imported successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
}

main();
