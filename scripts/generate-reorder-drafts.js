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

async function generateReorderDrafts() {
    console.log('🔍 Scanning inventory for low stock...');

    // 1. Get all inventory items (limit to 100 for safety)
    const inventorySnapshot = await db.collection('inventory').limit(100).get();
    const lowStockItems = [];

    inventorySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.quantity <= data.minStockLevel) {
            lowStockItems.push({ id: doc.id, ...data });
        }
    });

    console.log(`📡 Found ${lowStockItems.length} low stock items.`);

    if (lowStockItems.length === 0) {
        console.log('✅ No reordering needed.');
        process.exit(0);
    }

    // 2. Get product details to identify suppliers
    const productIds = [...new Set(lowStockItems.map(item => item.productId))];
    const products = {};

    for (const pid of productIds) {
        const pDoc = await db.collection('products').doc(pid).get();
        if (pDoc.exists) {
            products[pid] = pDoc.data();
        }
    }

    // 3. Group by supplier
    const supplierOrders = {};

    lowStockItems.forEach(item => {
        const product = products[item.productId];
        if (!product || !product.supplier) return;

        const supplier = product.supplier;
        if (!supplierOrders[supplier]) {
            supplierOrders[supplier] = [];
        }

        // Calculate reorder amount (up to max stock level)
        const reorderQty = (item.maxStockLevel || (item.minStockLevel * 2)) - item.quantity;

        supplierOrders[supplier].push({
            productId: item.productId,
            productName: product.name,
            sku: product.sku,
            currentQuantity: item.quantity,
            reorderQty: reorderQty > 0 ? reorderQty : item.minStockLevel,
            unitPrice: product.unitPrice || 0
        });
    });

    // 4. Create Draft Purchase Orders
    const batch = db.batch();
    let poCount = 0;

    for (const [supplier, items] of Object.entries(supplierOrders)) {
        const poRef = db.collection('purchase-orders').doc();
        const totalValue = items.reduce((sum, item) => sum + (item.reorderQty * item.unitPrice), 0);

        const poData = {
            poNumber: `PO-${Date.now()}-${poCount + 1}`,
            supplier,
            items,
            totalValue,
            status: 'DRAFT',
            warehouseId: items[0].warehouseId || 'primary',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            notes: 'Automatically generated due to low stock'
        };

        batch.set(poRef, poData);
        console.log(`📝 Generated Draft PO for ${supplier}: ${poData.poNumber} (${items.length} items)`);
        poCount++;
    }

    await batch.commit();
    console.log(`🚀 Successfully created ${poCount} draft purchase orders.`);
    process.exit(0);
}

generateReorderDrafts().catch(err => {
    console.error('❌ Error generating reorder drafts:', err);
    process.exit(1);
});
