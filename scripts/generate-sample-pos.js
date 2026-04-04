const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const path = require('path');

// Initialize Firebase Admin
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'firebase', 'service-account.json');
const serviceAccount = require(SERVICE_ACCOUNT_PATH);

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function generateSamplePOs() {
    console.log('--- Generating Sample Purchase Orders ---');

    try {
        // 1. Get a warehouse
        const warehousesSnapshot = await db.collection('warehouses').limit(1).get();
        if (warehousesSnapshot.empty) {
            console.error('No warehouses found. Please create a warehouse first.');
            return;
        }
        const warehouseId = warehousesSnapshot.docs[0].id;
        console.log(`Using Warehouse ID: ${warehouseId}`);

        // 2. Get some products
        const productsSnapshot = await db.collection('products').limit(20).get();
        if (productsSnapshot.empty) {
            console.error('No products found. Please run the import script first.');
            return;
        }
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`Found ${products.length} products to choose from.`);

        const suppliers = ['Global Spirits Ltd', 'Vineyard Direct', 'Himalayan Beverages', 'Premium Imports', 'Craft Brew Co'];
        const statuses = ['DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'];

        const ordersToCreate = 15;
        let createdCount = 0;

        for (let i = 1; i <= ordersToCreate; i++) {
            const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            // Select 1-5 random products
            const pCount = Math.floor(Math.random() * 5) + 1;
            const orderItems = [];
            let totalValue = 0;

            for (let j = 0; j < pCount; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const qty = Math.floor(Math.random() * 50) + 10;
                const subtotal = qty * product.unitPrice;

                orderItems.push({
                    productId: product.id,
                    productName: product.name,
                    sku: product.sku,
                    reorderQty: qty,
                    unitPrice: product.unitPrice
                });

                totalValue += subtotal;
            }

            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));

            const poData = {
                poNumber: `PO-2024-${String(i).padStart(4, '0')}`,
                supplier: supplier,
                status: status,
                totalValue: Math.round(totalValue),
                items: orderItems,
                warehouseId: warehouseId,
                notes: status === 'CANCELLED' ? 'Duplicate order' : (status === 'RECEIVED' ? 'All items verified' : 'Automated reorder draft'),
                createdAt: Timestamp.fromDate(date),
                updatedAt: Timestamp.now()
            };

            await db.collection('purchase-orders').add(poData);
            createdCount++;
            console.log(`Created ${poData.poNumber} (${status}) - ₹${poData.totalValue}`);
        }

        console.log(`\nSuccess! Created ${createdCount} sample Purchase Orders.`);
        process.exit(0);
    } catch (error) {
        console.error('Error generating sample POs:', error);
        process.exit(1);
    }
}

generateSamplePOs();
