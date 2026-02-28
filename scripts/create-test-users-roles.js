/**
 * Script to create test users for each role
 * Run with: node scripts/create-test-users-roles.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase/service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

const testUsers = [
  {
    email: 'admin@warehouse.com',
    password: 'Admin@123456',
    name: 'Admin User',
    role: 'admin',
    warehouseId: 'warehouse-001',
  },
  {
    email: 'manager@warehouse.com',
    password: 'Manager@123456',
    name: 'Manager User',
    role: 'manager',
    warehouseId: 'warehouse-001',
  },
  {
    email: 'staff@warehouse.com',
    password: 'Staff@123456',
    name: 'Staff User',
    role: 'staff',
    warehouseId: 'warehouse-001',
  },
  {
    email: 'viewer@warehouse.com',
    password: 'Viewer@123456',
    name: 'Viewer User',
    role: 'viewer',
    warehouseId: 'warehouse-001',
  },
  {
    email: 'manager2@warehouse.com',
    password: 'Manager@123456',
    name: 'Manager Two',
    role: 'manager',
    warehouseId: 'warehouse-002',
  },
  {
    email: 'staff2@warehouse.com',
    password: 'Staff@123456',
    name: 'Staff Two',
    role: 'staff',
    warehouseId: 'warehouse-002',
  },
];

async function createTestUsers() {
  console.log('🚀 Creating test users for role testing...\n');

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(userData.email);
        console.log(`✓ User already exists: ${userData.email}`);
      } catch (error) {
        // User doesn't exist, create it
        userRecord = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.name,
        });
        console.log(`✓ Created auth user: ${userData.email}`);
      }

      // Create or update Firestore user document
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        warehouseId: userData.warehouseId,
        photoURL: '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      console.log(`✓ Created Firestore profile: ${userData.name} (${userData.role})`);
      console.log(`  Password: ${userData.password}\n`);
    } catch (error) {
      console.error(`✗ Error creating user ${userData.email}:`, error.message);
    }
  }

  console.log('✅ Test users creation complete!\n');
  console.log('📋 Test User Credentials:');
  console.log('═══════════════════════════════════════════════════════\n');
  
  testUsers.forEach(user => {
    console.log(`${getRoleEmoji(user.role)} ${user.role.toUpperCase()}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log(`   Warehouse: ${user.warehouseId}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('\n💡 Use these credentials to test role-based features!');
  
  process.exit(0);
}

function getRoleEmoji(role) {
  const emojis = {
    admin: '👑',
    manager: '🎯',
    staff: '👤',
    viewer: '👁️',
  };
  return emojis[role] || '👤';
}

// Run the script
createTestUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
