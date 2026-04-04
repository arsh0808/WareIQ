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

async function makeDevicesOnline() {
    console.log('📡 Fetching devices...');
    const snapshot = await db.collection('iot-devices').get();

    if (snapshot.empty) {
        console.log('⚠️ No devices found in iot-devices collection.');
        process.exit(0);
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        console.log(`✅ Setting device ${doc.id} to ONLINE`);
        batch.update(doc.ref, {
            status: 'online',
            batteryLevel: 100,
            lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });

    await batch.commit();
    console.log('🚀 All devices are now ONLINE.');
    process.exit(0);
}

makeDevicesOnline().catch(err => {
    console.error('❌ Error updating devices:', err);
    process.exit(1);
});
