const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Path to your service account key file
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'firebase', 'service-account.json');
const CSV_FILE_PATH = 'C:\\Users\\Rohit kumar\\Downloads\\Downloads\\Warehouse_and_Retail_Sales.csv';

// Initialize Firebase Admin
const serviceAccount = require(SERVICE_ACCOUNT_PATH);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Target Warehouse ID (we'll use a fixed one or detect from user roles)
const TARGET_WAREHOUSE_ID = 'WH-MAIN-001';

/**
 * Utility to generate realistic weights/dimensions based on category
 */
function getPhysicalAttributes(category, description) {
    let weight = 0.75; // Default for 750ml bottle in kg
    let dimensions = { length: 8, width: 8, height: 30 };

    const desc = description.toLowerCase();
    if (desc.includes('1.75l')) {
        weight = 1.75;
        dimensions = { length: 12, width: 12, height: 35 };
    } else if (desc.includes('375ml')) {
        weight = 0.4;
        dimensions = { length: 6, width: 6, height: 22 };
    } else if (desc.includes('beer') || category.includes('BEER')) {
        weight = 0.33;
        dimensions = { length: 6, width: 6, height: 12 };
    } else if (desc.includes('keg')) {
        weight = 50;
        dimensions = { length: 40, width: 40, height: 60 };
    }

    return { weight, dimensions };
}

function getZoneAndShelf(category, description) {
    const desc = (description || '').toLowerCase();
    const cat = (category || '').toLowerCase();

    if (cat.includes('beer') || desc.includes('keg') || desc.includes('beer')) {
        return { zoneId: 'ZONE-A-COLD', shelfId: `A-COLD-${Math.floor(Math.random() * 20) + 1}` };
    } else if (cat.includes('wine')) {
        return { zoneId: 'ZONE-B-WINE', shelfId: `B-WINE-${Math.floor(Math.random() * 50) + 1}` };
    } else if (cat.includes('spirits') || cat.includes('liquor')) {
        return { zoneId: 'ZONE-C-SECURE', shelfId: `C-SECURE-${Math.floor(Math.random() * 50) + 1}` };
    }

    return { zoneId: 'ZONE-GENERAL', shelfId: `GEN-${Math.floor(Math.random() * 100) + 1}` };
}

async function importData() {
    console.log('🚀 Starting import from:', CSV_FILE_PATH);

    const productsMap = new Map();
    const salesBatches = [];
    let rowCount = 0;
    let batch = db.batch();
    let operationCount = 0;
    const LIMIT_ROWS = 5000; // Limit for initial demo to avoid hitting free-tier 

    const readStream = fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv());

    for await (const row of readStream) {
        rowCount++;
        if (rowCount > LIMIT_ROWS) break;

        const sku = row['ITEM CODE'] || `SKU-${rowCount}`;
        const name = row['ITEM DESCRIPTION'] || 'Unknown Item';
        const supplier = row['SUPPLIER'] || 'Default Supplier';
        const category = row['ITEM TYPE'] || 'General';

        // Add Product if not already processed
        if (!productsMap.has(sku)) {
            const { weight, dimensions } = getPhysicalAttributes(category, name);
            const { zoneId, shelfId } = getZoneAndShelf(category, name);
            const productRef = db.collection('products').doc(sku);

            batch.set(productRef, {
                id: sku,
                sku,
                name,
                description: name,
                category,
                subcategory: 'General',
                supplier,
                weight,
                dimensions,
                unitPrice: 15.00 + (Math.random() * 50),
                minStockLevel: 10,
                reorderPoint: 20,
                barcode: sku,
                qrCode: `QR-${sku}`,
                imageURL: '',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Also create an inventory record
            const inventoryRef = db.collection('inventory').doc(`INV-${sku}`);
            batch.set(inventoryRef, {
                id: `INV-${sku}`,
                productId: sku,
                warehouseId: TARGET_WAREHOUSE_ID,
                zoneId,
                shelfId,
                quantity: Math.floor(Math.random() * 200) + 50,
                status: 'available',
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            });

            productsMap.set(sku, true);
            operationCount += 2;
        }

        // Add Sales Record (as activity/audit log for the dashboard)
        const salesTotal = parseFloat(row['RETAIL SALES']) + parseFloat(row['WAREHOUSE SALES']);
        if (salesTotal > 0) {
            let logTimestamp = admin.firestore.FieldValue.serverTimestamp();
            if (row.YEAR && row.MONTH) {
                const month = parseInt(row.MONTH);
                const year = parseInt(row.YEAR);
                if (!isNaN(month) && !isNaN(year)) {
                    logTimestamp = admin.firestore.Timestamp.fromDate(new Date(year, month - 1, 15)); // mid-month assumption
                }
            }

            const logRef = db.collection('audit-logs').doc();
            batch.set(logRef, {
                action: 'sale_recorded',
                warehouseId: TARGET_WAREHOUSE_ID,
                resource: 'inventory',
                resourceId: sku,
                userId: 'system-importer',
                details: {
                    period: `${row.MONTH}/${row.YEAR}`,
                    amount: salesTotal,
                    retailSales: parseFloat(row['RETAIL SALES']),
                    warehouseSales: parseFloat(row['WAREHOUSE SALES']),
                    transfers: parseFloat(row['RETAIL TRANSFERS'])
                },
                timestamp: logTimestamp,
            });
            operationCount++;
        }

        // Commit batch if it reaches limit
        if (operationCount >= 450) {
            console.log(`📦 Committing batch at row ${rowCount}...`);
            await batch.commit();
            batch = db.batch();
            operationCount = 0;
        }
    }

    // Final commit
    if (operationCount > 0) {
        await batch.commit();
    }

    console.log(`✅ Import completed! Processed ${rowCount} rows.`);
    process.exit(0);
}

importData().catch(err => {
    console.error('❌ Import failed:', err);
    process.exit(1);
});
