/**
 * Create Test Accounts for Smart Warehouse
 * 
 * Run this script to automatically create test accounts
 * Usage: node scripts/create-test-accounts.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase/auth-config.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://wareiq-5f654-default-rtdb.firebaseio.com'
});

const auth = admin.auth();
const firestore = admin.firestore();

// Test accounts to create
const testAccounts = [
  // Admin Accounts
  {
    email: 'admin@smartwarehouse.com',
    password: 'admin123456',
    displayName: 'Admin User',
    role: 'admin',
    warehouseId: 'warehouse-001'
  },
  {
    email: 'warehouse.admin@test.com',
    password: 'Admin@2024',
    displayName: 'Warehouse Admin',
    role: 'admin',
    warehouseId: 'warehouse-001'
  },
  
  // Manager Accounts
  {
    email: 'manager@smartwarehouse.com',
    password: 'manager123',
    displayName: 'Manager User',
    role: 'manager',
    warehouseId: 'warehouse-001'
  },
  {
    email: 'warehouse.manager@test.com',
    password: 'Manager@2024',
    displayName: 'Warehouse Manager',
    role: 'manager',
    warehouseId: 'warehouse-001'
  },
  
  // Staff Accounts
  {
    email: 'staff@smartwarehouse.com',
    password: 'staff123456',
    displayName: 'Staff User',
    role: 'staff',
    warehouseId: 'warehouse-001'
  },
  {
    email: 'warehouse.staff@test.com',
    password: 'Staff@2024',
    displayName: 'Warehouse Staff',
    role: 'staff',
    warehouseId: 'warehouse-001'
  },
  
  // Viewer Accounts
  {
    email: 'viewer@smartwarehouse.com',
    password: 'viewer123456',
    displayName: 'Viewer User',
    role: 'viewer',
    warehouseId: 'warehouse-001'
  },
  {
    email: 'demo@smartwarehouse.com',
    password: 'demo123456',
    displayName: 'Demo User',
    role: 'viewer',
    warehouseId: 'warehouse-001'
  }
];

async function createTestAccounts() {
  console.log('🚀 Creating test accounts...\n');
  
  let successCount = 0;
  let errorCount = 0;

  for (const account of testAccounts) {
    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: account.email,
        password: account.password,
        displayName: account.displayName,
        emailVerified: true // Auto-verify for test accounts
      });

      console.log(`✅ Created auth user: ${account.email}`);

      // Create user document in Firestore
      await firestore.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: account.email,
        name: account.displayName,
        role: account.role,
        warehouseId: account.warehouseId,
        photoURL: '',
        emailVerified: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Created Firestore document for: ${account.email}`);
      console.log(`   Role: ${account.role.toUpperCase()}\n`);
      
      successCount++;
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  User already exists: ${account.email}\n`);
      } else {
        console.error(`❌ Error creating ${account.email}:`, error.message, '\n');
        errorCount++;
      }
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Successfully created: ${successCount} accounts`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 TEST ACCOUNTS:\n');
  testAccounts.forEach(account => {
    console.log(`${getRoleEmoji(account.role)} ${account.role.toUpperCase()}`);
    console.log(`   Email:    ${account.email}`);
    console.log(`   Password: ${account.password}`);
    console.log(`   Name:     ${account.displayName}\n`);
  });

  console.log('🎯 QUICK TEST LOGIN:');
  console.log('   Email:    admin@smartwarehouse.com');
  console.log('   Password: admin123456\n');

  process.exit(0);
}

function getRoleEmoji(role) {
  const emojis = {
    admin: '👑',
    manager: '👔',
    staff: '👤',
    viewer: '👁️'
  };
  return emojis[role] || '👤';
}

// Run the script
createTestAccounts().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
