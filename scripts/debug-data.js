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

async function checkData() {
    try {
        const products = await db.collection('products').count().get();
        const inventory = await db.collection('inventory').count().get();
        const shelves = await db.collection('shelves').count().get();
        const warehouses = await db.collection('warehouses').count().get();

        console.log('--- DATABASE STATUS ---');
        console.log(`Products:   ${products.data().count}`);
        console.log(`Inventory:  ${inventory.data().count}`);
        console.log(`Shelves:    ${shelves.data().count}`);
        console.log(`Warehouses: ${warehouses.data().count}`);

        process.exit(0);
    } catch (err) {
        console.error('--- ERROR ---');
        console.error(err.message);
        if (err.details) console.error('Details:', err.details);
        process.exit(1);
    }
}

checkData();
