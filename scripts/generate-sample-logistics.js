const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'firebase', 'service-account.json');
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function generateSampleLogistics() {
    console.log('🧪 Starting Professional Shelf & Inventory Generation...');

    try {
        // 1. Get Warehouses
        const warehousesSnapshot = await db.collection('warehouses').get();
        if (warehousesSnapshot.empty) {
            console.log('⚠️ No warehouses found. Creating default warehouse...');
            await db.collection('warehouses').doc('wh-001').set({
                name: 'Smart Warehouse - Delhi',
                location: 'Delhi NCR',
                type: 'Fulfillment',
                capacity: 5000,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        const warehouseIds = (await db.collection('warehouses').get()).docs.map(d => d.id);
        const wId = warehouseIds[0];
        console.log(`🏢 Using Warehouse: ${wId}`);

        // 2. Generate Realistic Shelf Matrix (Zones A-D, Rows 1-5, Levels 1-3)
        console.log('📦 Generating large shelf matrix...');
        const zones = ['A', 'B', 'C', 'D'];
        const rows = [1, 2, 3, 4, 5];
        const levels = [1, 2, 3];
        const shelves = [];

        for (const zone of zones) {
            for (const row of rows) {
                for (const level of levels) {
                    const shelfCode = `${zone}${row}-${level.toString().padStart(2, '0')}`;
                    const shelfData = {
                        warehouseId: wId,
                        shelfCode,
                        zone,
                        row,
                        level,
                        maxWeight: 500,
                        currentWeight: 0,
                        status: 'active',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    };

                    const shelfRef = db.collection('shelves').doc(`${wId}-${shelfCode}`);
                    await shelfRef.set(shelfData, { merge: true });
                    shelves.push({ id: shelfRef.id, shelfCode });
                }
            }
        }
        console.log(`✅ Created ${shelves.length} professional shelves.`);

        // 3. Fetch Products
        const productsSnapshot = await db.collection('products').limit(50).get();
        const products = productsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        if (products.length === 0) {
            console.error('❌ No products found. Run import script first.');
            return;
        }

        // 4. Populate Shelves with Inventory
        console.log('📝 Populating shelves with products...');
        let itemsCreated = 0;

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const shelf = shelves[i % shelves.length];

            const quantity = Math.floor(Math.random() * 50) + 5;
            const minStock = product.minStockLevel || 10;

            const invData = {
                productId: product.id,
                warehouseId: wId,
                shelfId: shelf.shelfCode,
                quantity,
                minStockLevel: minStock,
                maxStockLevel: minStock * 10,
                batchNumber: `B-${2024}-${(i + 100).toString()}`,
                expiryDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + (Math.random() * 180 * 24 * 60 * 60 * 1000))),
                status: quantity <= minStock ? 'low_stock' : 'available',
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('inventory').add(invData);

            // Update shelf weight (simulating IoT sync)
            const itemWeight = product.weight || 0.5;
            await db.collection('shelves').doc(shelf.id).update({
                currentWeight: admin.firestore.FieldValue.increment(quantity * itemWeight)
            });

            // Create linked IoT Device
            await db.collection('iotDevices').doc(`dev-${shelf.shelfCode}`).set({
                deviceId: `SNS-${shelf.shelfCode}`,
                deviceType: 'weight_sensor',
                shelfId: shelf.shelfCode,
                warehouseId: wId,
                status: 'online',
                batteryLevel: Math.floor(Math.random() * 40) + 60,
                lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            itemsCreated++;
        }

        console.log(`🚀 Success! Populated ${itemsCreated} inventory records across the warehouse.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

generateSampleLogistics();
