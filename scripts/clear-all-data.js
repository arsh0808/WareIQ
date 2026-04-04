const admin = require('firebase-admin');
const path = require('path');

// Path to your service account key file
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'firebase', 'service-account.json');

// Initialize Firebase Admin
const serviceAccount = require(SERVICE_ACCOUNT_PATH);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteCollection(collectionPath, batchSize = 100) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

async function clearImportedData() {
    const collectionsToClear = [
        'products',
        'inventory',
        'audit-logs',
        'alerts',
        'purchaseOrders',
        'stockMovements',
        'transactions',
        'activities'
    ];

    console.log('🧹 Starting deep clean of Firestore data...');

    for (const collectionName of collectionsToClear) {
        console.log(`Deleting ${collectionName}...`);
        await deleteCollection(collectionName);
    }

    console.log('✅ All imported inventory management data has been removed from Firestore.');
    process.exit(0);
}

clearImportedData().catch(err => {
    console.error('❌ Data cleanup failed:', err);
    process.exit(1);
});
