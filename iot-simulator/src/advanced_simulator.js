const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'firebase', 'service-account.json');
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
}

const db = admin.firestore();
const rtdb = admin.database();

const devices = [
    { id: 'device-001', type: 'weight_sensor', shelfId: 'shelf-A-01' },
    { id: 'device-002', type: 'temperature_sensor', shelfId: 'shelf-A-02' },
    { id: 'device-003', type: 'weight_sensor', shelfId: 'shelf-B-01' },
];

async function simulateDevice(device) {
    try {
        const timestamp = Date.now();
        let sensorData = { timestamp };

        if (device.type === 'weight_sensor') {
            // 1. Simulate weight (fluctuates slightly)
            const baseWeight = 75.5; // kg
            sensorData.weight = baseWeight + (Math.random() * 2 - 1);

            // 2. SYNC LOGIC: Update Inventory Quantity
            // Find what is on this shelf
            const invSnapshot = await db.collection('inventory').where('shelfId', '==', device.shelfId).limit(1).get();

            if (!invSnapshot.empty) {
                const invDoc = invSnapshot.docs[0];
                const invData = invDoc.data();

                // Get product weight per unit
                const productDoc = await db.collection('products').doc(invData.productId).get();
                if (productDoc.exists) {
                    const product = productDoc.data();
                    const weightPerUnit = product.weight || 0.75; // fallback

                    const calculatedQty = Math.floor(sensorData.weight / weightPerUnit);

                    if (calculatedQty !== invData.quantity) {
                        await invDoc.ref.update({
                            quantity: calculatedQty,
                            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                            syncSource: 'IoT Sensor ' + device.id
                        });
                        console.log(`🔄 [${device.id}] Auto-synced inventory: ${calculatedQty} units (based on ${sensorData.weight.toFixed(2)}kg)`);
                    }
                }
            }
        } else if (device.type === 'temperature_sensor') {
            sensorData.temperature = 18 + Math.random() * 4;
            sensorData.humidity = 45 + Math.random() * 5;
        }

        // Update Realtime Database for Live Charts
        await rtdb.ref(`sensor-data/${device.id}/latest`).set(sensorData);

        // Update Device Status
        await db.collection('iot-devices').doc(device.id).update({
            status: 'online',
            lastHeartbeat: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`[${device.id}] Sent data:`, sensorData);
    } catch (error) {
        console.error(`[${device.id}] Error:`, error);
    }
}

function startSimulation() {
    console.log('🚀 Starting Advanced IoT Simulator with Auto-Sync...');

    devices.forEach(device => {
        setInterval(() => simulateDevice(device), 5000);
        simulateDevice(device);
    });
}

startSimulation();
