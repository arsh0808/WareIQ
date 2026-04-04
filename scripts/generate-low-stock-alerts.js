const admin = require('firebase-admin');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'firebase', 'service-account.json');
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const TARGET_WAREHOUSE_ID = 'WH-MAIN-001';

async function generateLowStockAlerts() {
    console.log('🔍 Scanning inventory for low stock...');
    try {
        const inventorySnap = await db.collection('inventory').get();
        const productsSnap = await db.collection('products').get();

        const productsMap = new Map();
        productsSnap.forEach(doc => {
            productsMap.set(doc.id, doc.data());
        });

        const batch = db.batch();
        let alertsCreated = 0;

        inventorySnap.forEach(doc => {
            const item = doc.data();
            const product = productsMap.get(item.productId);

            if (product) {
                const reorder = product.reorderPoint || 20;
                const minStock = product.minStockLevel || 10;

                if (item.quantity <= reorder) {
                    const isCritical = item.quantity <= minStock;
                    const alertRef = db.collection('notifications').doc();

                    batch.set(alertRef, {
                        type: isCritical ? 'error' : 'warning',
                        title: isCritical ? 'Critical Stock Level' : 'Low Stock Warning',
                        message: `${product.name} (SKU: ${product.sku}) is at ${item.quantity} units. Minimum required is ${minStock}.`,
                        read: false,
                        userId: 'system',
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        link: `/inventory`,
                        metadata: {
                            productId: product.id,
                            warehouseId: item.warehouseId || TARGET_WAREHOUSE_ID,
                            currentQuantity: item.quantity,
                            type: 'inventory_alert'
                        }
                    });

                    alertsCreated++;
                }
            }
        });

        if (alertsCreated > 0) {
            await batch.commit();
            console.log(`✅ Generated ${alertsCreated} low-stock alerts successfully!`);
        } else {
            console.log(`✅ Inventory levels are healthy. No alerts generated.`);
        }
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to generate alerts:', error);
        process.exit(1);
    }
}

generateLowStockAlerts();
