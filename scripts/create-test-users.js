

const admin = require('firebase-admin');
const serviceAccount = require('../firebase/service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://wareiq-5f654-default-rtdb.firebaseio.com'
});

const auth = admin.auth();
const db = admin.firestore();

const testUsers = [
  {
    email: 'admin@warehouse.com',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'admin',
    warehouseId: 'warehouse-001'
  },
  {
    email: 'manager@warehouse.com',
    password: 'Manager123!',
    name: 'Manager User',
    role: 'manager',
    warehouseId: 'warehouse-001'
  },
  {
    email: 'staff@warehouse.com',
    password: 'Staff123!',
    name: 'Staff User',
    role: 'staff',
    warehouseId: 'warehouse-001'
  },
  {
    email: 'viewer@warehouse.com',
    password: 'Viewer123!',
    name: 'Viewer User',
    role: 'viewer',
    warehouseId: 'warehouse-001'
  },
  {
    email: 'test@example.com',
    password: 'Test123!',
    name: 'Test User',
    role: 'admin',
    warehouseId: 'warehouse-001'
  }
];

async function createTestUsers() {
  console.log('🚀 Creating test users...\n');

  for (const userData of testUsers) {
    try {
      
      let user;
      try {
        user = await auth.getUserByEmail(userData.email);
        console.log(`✅ User ${userData.email} already exists (UID: ${user.uid})`);
      } catch (error) {
        
        user = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.name,
          emailVerified: true
        });
        console.log(`✅ Created user ${userData.email} (UID: ${user.uid})`);
      }

      await db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        warehouseId: userData.warehouseId,
        photoURL: '',
        createdAt: new Date(),
        lastLogin: new Date()
      }, { merge: true });

      console.log(`✅ Added Firestore document for ${userData.email}`);
      console.log(`   Role: ${userData.role}, Warehouse: ${userData.warehouseId}\n`);

    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }

  console.log('\n✨ Test users created successfully!\n');
  console.log('📋 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  testUsers.forEach(user => {
    console.log(`📧 ${user.email.padEnd(25)} | 🔑 ${user.password.padEnd(15)} | 👤 ${user.role}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function createSampleWarehouse() {
  console.log('🏭 Creating sample warehouse...\n');

  try {
    await db.collection('warehouses').doc('warehouse-001').set({
      name: 'Main Warehouse',
      location: 'New York, USA',
      address: '123 Warehouse Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      capacity: 10000,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    console.log('✅ Sample warehouse created (ID: warehouse-001)\n');
  } catch (error) {
    console.error('❌ Error creating warehouse:', error.message);
  }
}

async function createSampleProducts() {
  console.log('📦 Creating sample products...\n');

  const products = [
    { id: 'PROD-001', name: 'Laptop Computer', category: 'Electronics', sku: 'ELEC-LP-001' },
    { id: 'PROD-002', name: 'Office Chair', category: 'Furniture', sku: 'FURN-CH-002' },
    { id: 'PROD-003', name: 'T-Shirt', category: 'Clothing', sku: 'CLTH-TS-003' },
    { id: 'PROD-004', name: 'Coffee Beans', category: 'Food', sku: 'FOOD-CF-004' },
    { id: 'PROD-005', name: 'Novel Book', category: 'Books', sku: 'BOOK-NV-005' }
  ];

  for (const product of products) {
    try {
      await db.collection('products').doc(product.id).set({
        name: product.name,
        category: product.category,
        sku: product.sku,
        price: 99.99,
        description: `Sample ${product.category.toLowerCase()} product`,
        createdAt: new Date()
      }, { merge: true });

      console.log(`✅ Created product: ${product.name} (${product.sku})`);
    } catch (error) {
      console.error(`❌ Error creating product ${product.id}:`, error.message);
    }
  }

  console.log('\n');
}

async function createSampleInventory() {
  console.log('📊 Creating sample inventory...\n');

  const inventoryItems = [
    { productId: 'PROD-001', shelfId: 'A1-SHELF-01', quantity: 150, min: 20, max: 500 },
    { productId: 'PROD-002', shelfId: 'A2-SHELF-01', quantity: 85, min: 15, max: 300 },
    { productId: 'PROD-003', shelfId: 'B1-SHELF-01', quantity: 250, min: 50, max: 800 },
    { productId: 'PROD-004', shelfId: 'B2-SHELF-01', quantity: 120, min: 30, max: 400 },
    { productId: 'PROD-005', shelfId: 'C1-SHELF-01', quantity: 65, min: 10, max: 200 }
  ];

  for (const item of inventoryItems) {
    try {
      await db.collection('inventory').add({
        productId: item.productId,
        warehouseId: 'warehouse-001',
        shelfId: item.shelfId,
        quantity: item.quantity,
        minStockLevel: item.min,
        maxStockLevel: item.max,
        lastUpdated: new Date(),
        createdAt: new Date()
      });

      console.log(`✅ Added inventory: ${item.productId} on ${item.shelfId} (Qty: ${item.quantity})`);
    } catch (error) {
      console.error(`❌ Error creating inventory:`, error.message);
    }
  }

  console.log('\n');
}

async function main() {
  try {
    console.log('\n🔥 Firebase Test Data Setup\n');
    console.log('Project: wareiq-5f654\n');
    
    await createTestUsers();
    await createSampleWarehouse();
    await createSampleProducts();
    await createSampleInventory();
    
    console.log('✨ All done! You can now login to the app.\n');
    console.log('🌐 Visit: http://localhost:3000/login\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
