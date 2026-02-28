"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDailyReports = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.generateDailyReports = functions.pubsub
    .schedule("0 8 * * *")
    .timeZone("UTC")
    .onRun(async (context) => {
    try {
        console.log("Starting daily report generation...");
        const warehousesSnapshot = await db.collection("warehouses").get();
        for (const warehouseDoc of warehousesSnapshot.docs) {
            const warehouseId = warehouseDoc.id;
            const warehouseData = warehouseDoc.data();
            const report = await generateWarehouseReport(warehouseId, warehouseData);
            await db.collection("reports").add({
                warehouseId: warehouseId,
                warehouseName: warehouseData.name,
                type: "daily",
                date: new Date().toISOString().split("T")[0],
                data: report,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`Daily report generated for warehouse: ${warehouseData.name}`);
        }
        return null;
    }
    catch (error) {
        console.error("Error generating daily reports:", error);
        return null;
    }
});
async function generateWarehouseReport(warehouseId, warehouseData) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inventorySnapshot = await db.collection("inventory")
        .where("warehouseId", "==", warehouseId)
        .get();
    let totalItems = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    for (const doc of inventorySnapshot.docs) {
        const data = doc.data();
        totalItems += data.quantity;
        const productDoc = await db.collection("products").doc(data.productId).get();
        const productData = productDoc.data();
        if (data.quantity === 0) {
            outOfStockItems++;
        }
        else if (data.quantity <= (productData?.minStockLevel || 0)) {
            lowStockItems++;
        }
    }
    const alertsSnapshot = await db.collection("alerts")
        .where("warehouseId", "==", warehouseId)
        .where("createdAt", ">=", yesterday)
        .where("createdAt", "<", today)
        .get();
    const alertsByType = {};
    const criticalAlerts = [];
    alertsSnapshot.forEach((doc) => {
        const data = doc.data();
        alertsByType[data.type] = (alertsByType[data.type] || 0) + 1;
        if (data.severity === "critical") {
            criticalAlerts.push(data);
        }
    });
    const devicesSnapshot = await db.collection("iot-devices")
        .where("warehouseId", "==", warehouseId)
        .get();
    let onlineDevices = 0;
    let offlineDevices = 0;
    devicesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === "online") {
            onlineDevices++;
        }
        else {
            offlineDevices++;
        }
    });
    return {
        summary: {
            totalItems,
            lowStockItems,
            outOfStockItems,
            totalProducts: inventorySnapshot.size,
        },
        alerts: {
            total: alertsSnapshot.size,
            byType: alertsByType,
            criticalCount: criticalAlerts.length,
        },
        devices: {
            total: devicesSnapshot.size,
            online: onlineDevices,
            offline: offlineDevices,
        },
        warehouse: {
            name: warehouseData.name,
            location: warehouseData.location,
            capacity: warehouseData.capacity,
        },
    };
}
//# sourceMappingURL=dailyReports.js.map