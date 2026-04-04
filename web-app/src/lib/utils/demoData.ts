// Premium High-Fidelity Demo Data for WareIQ Smart Warehouse
// Specialized for Electronics, Gadgets, and Computing

export const CATEGORY_MAP: Record<string, string> = {
    '1': 'Computing',
    '2': 'Mobile Devices',
    '3': 'Audio & Sound',
    '4': 'Wearables',
    '5': 'Photography'
};

export const DEMO_PRODUCTS = [
    { id: 'prod-001', name: 'MacBook Pro M3', sku: 'LAP-MBP-M3', category: 'Computing', subcategory: 'Laptops', unitPrice: 1999, weight: 1.6, supplier: 'Apple Inc', barcode: '885909727407', minStockLevel: 5 },
    { id: 'prod-002', name: 'iPhone 15 Pro', sku: 'MOB-IPH-15P', category: 'Mobile Devices', subcategory: 'Phones', unitPrice: 999, weight: 0.18, supplier: 'Apple Inc', barcode: '194253401507', minStockLevel: 15 },
    { id: 'prod-003', name: 'Sony WH-1000XM5', sku: 'AUD-SON-XM5', category: 'Audio & Sound', subcategory: 'Headphones', unitPrice: 399, weight: 0.25, supplier: 'Sony Logistics', barcode: '4548736132581', minStockLevel: 20 },
    { id: 'prod-004', name: 'Apple Watch Series 9', sku: 'WEA-AWS-9', category: 'Wearables', subcategory: 'Smartwatches', unitPrice: 399, weight: 0.05, supplier: 'Apple Inc', barcode: '194253818617', minStockLevel: 25 },
    { id: 'prod-005', name: 'Dell UltraSharp 32"', sku: 'COM-DEL-U32', category: 'Computing', subcategory: 'Monitors', unitPrice: 899, weight: 7.5, supplier: 'Dell Technologies', barcode: '5397184601679', minStockLevel: 8 },
    { id: 'prod-006', name: 'Bose QuietComfort Ultra', sku: 'AUD-BOS-QCU', category: 'Audio & Sound', subcategory: 'Headphones', unitPrice: 429, weight: 0.25, supplier: 'Bose Corp', barcode: '017817847761', minStockLevel: 15 },
    { id: 'prod-007', name: 'Samsung Galaxt S24 Ultra', sku: 'MOB-SAM-S24U', category: 'Mobile Devices', subcategory: 'Phones', unitPrice: 1299, weight: 0.23, supplier: 'Samsung Electronics', barcode: '8806095360411', minStockLevel: 10 },
    { id: 'prod-008', name: 'Fujifilm X-T5', sku: 'PHO-FUJ-XT5', category: 'Photography', subcategory: 'Cameras', unitPrice: 1699, weight: 0.55, supplier: 'Fujifilm Global', barcode: '4547410486414', minStockLevel: 3 },
    { id: 'prod-009', name: 'Logitech MX Master 3S', sku: 'COM-LOG-MX3', category: 'Computing', subcategory: 'Peripherals', unitPrice: 99, weight: 0.14, supplier: 'Logitech', barcode: '097855173362', minStockLevel: 50 },
    { id: 'prod-010', name: 'iPad Air M2', sku: 'MOB-IPA-M2', category: 'Mobile Devices', subcategory: 'Tablets', unitPrice: 599, weight: 0.46, supplier: 'Apple Inc', barcode: '194253846610', minStockLevel: 12 },
];

export const DEMO_SHELVES = [
    { id: 'SH-A1-L1', shelfCode: 'A1-L1', zone: 'A', row: 1, level: 1, maxWeight: 500, currentWeight: 145.5, status: 'active', warehouseId: 'wh-001' },
    { id: 'SH-B2-L3', shelfCode: 'B2-L3', zone: 'B', row: 2, level: 3, maxWeight: 300, currentWeight: 88.2, status: 'active', warehouseId: 'wh-001' },
    { id: 'SH-C3-L2', shelfCode: 'C3-L2', zone: 'C', row: 3, level: 2, maxWeight: 400, currentWeight: 110.0, status: 'active', warehouseId: 'wh-002' },
    { id: 'SH-D4-L4', shelfCode: 'D4-L4', zone: 'D', row: 4, level: 4, maxWeight: 250, currentWeight: 45.0, status: 'active', warehouseId: 'wh-001' },
];

export const DEMO_INVENTORY = [
    { id: 'inv-001', productId: 'prod-001', warehouseId: 'wh-001', shelfId: 'SH-A1-L1', quantity: 15, minStockLevel: 5, maxStockLevel: 30, batchNumber: 'LOT-2024-A', status: 'available' },
    { id: 'inv-002', productId: 'prod-002', warehouseId: 'wh-001', shelfId: 'SH-B2-L3', quantity: 45, minStockLevel: 15, maxStockLevel: 100, batchNumber: 'LOT-2024-B', status: 'available' },
    { id: 'inv-003', productId: 'prod-003', warehouseId: 'wh-001', shelfId: 'SH-B2-L3', quantity: 28, minStockLevel: 20, maxStockLevel: 80, batchNumber: 'LOT-2024-C', status: 'available' },
    { id: 'inv-004', productId: 'prod-007', warehouseId: 'wh-002', shelfId: 'SH-C3-L2', quantity: 12, minStockLevel: 10, maxStockLevel: 50, batchNumber: 'LOT-2024-D', status: 'available' },
    { id: 'inv-005', productId: 'prod-008', warehouseId: 'wh-001', shelfId: 'SH-D4-L4', quantity: 4, minStockLevel: 3, maxStockLevel: 10, batchNumber: 'LOT-2024-E', status: 'available' },
    { id: 'inv-006', productId: 'prod-004', warehouseId: 'wh-001', shelfId: 'SH-A1-L1', quantity: 6, minStockLevel: 25, maxStockLevel: 100, batchNumber: 'LOT-2024-F', status: 'low_stock' },
];

export const DEMO_PURCHASE_ORDERS = [
    { id: 'po-001', poNumber: 'PO-24-001', supplier: 'Apple Inc', status: 'PENDING', totalValue: 25000, warehouseId: 'wh-001', createdAt: new Date(Date.now() - 86400000), items: [{ productName: 'MacBook Pro M3', reorderQty: 10, unitPrice: 1800 }] },
    { id: 'po-002', poNumber: 'PO-24-002', supplier: 'Sony Logistics', status: 'RECEIVED', totalValue: 12000, warehouseId: 'wh-001', createdAt: new Date(Date.now() - 432000000), items: [{ productName: 'Sony WH-1000XM5', reorderQty: 30, unitPrice: 350 }] },
];

export const DEMO_SALES_ORDERS = [
    { id: 'so-001', customerName: 'Apex Tech Solutions', status: 'Shipped', orderDate: new Date(Date.now() - 172800000), warehouseId: 'wh-001', totalValue: 4500 },
    { id: 'so-002', customerName: 'Cloud Nine Retail', status: 'Pending', orderDate: new Date(Date.now() - 43200000), warehouseId: 'wh-001', totalValue: 2400 },
    { id: 'so-003', customerName: 'Quantum Computing', status: 'Delivered', orderDate: new Date(Date.now() - 604800000), warehouseId: 'wh-001', totalValue: 12000 },
];

export const DEMO_ALERTS = [
    { id: 'alt-001', type: 'low_stock', severity: 'warning', warehouseId: 'wh-001', message: 'Apple Watch Series 9 inventory is below minimum level', details: { current: 6, min: 25 }, resolved: false, createdAt: new Date() },
    { id: 'alt-002', type: 'sensor_failure', severity: 'critical', warehouseId: 'wh-001', shelfId: 'SH-B2-L3', message: 'Weight sensor on B2-L3 reporting error', details: { errorCode: 'ERR_04' }, resolved: false, createdAt: new Date(Date.now() - 3600000) },
];

export const DEMO_NOTIFICATIONS = [
    { id: 'notif-001', type: 'warning', title: 'Low Stock Alert', message: 'Apple Watch Series 9 stock level low.', read: false, userId: 'demo-user', createdAt: new Date(Date.now() - 3600000), link: '/inventory' }
];

export const DEMO_AUDIT_LOGS = [
    { id: 'log-001', userId: 'admin', action: 'inventory_update', resource: 'inventory', resourceId: 'inv-001', details: { prevQty: 10, newQty: 15 }, timestamp: new Date(Date.now() - 7200000) },
    { id: 'log-002', userId: 'admin', action: 'shelf_maintenance', resource: 'shelf', resourceId: 'SH-B2-L3', details: { maintenanceType: 'Sensor Calibration' }, timestamp: new Date(Date.now() - 86400000) }
];
