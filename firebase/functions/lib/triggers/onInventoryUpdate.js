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
exports.onInventoryUpdate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.onInventoryUpdate = functions.firestore
    .document("inventory/{inventoryId}")
    .onWrite(async (change, context) => {
    const newData = change.after.exists ? change.after.data() : null;
    const previousData = change.before.exists ? change.before.data() : null;
    if (!newData) {
        return null;
    }
    try {
        const productDoc = await db.collection("products").doc(newData.productId).get();
        if (!productDoc.exists) {
            console.error(`Product ${newData.productId} not found`);
            return null;
        }
        const productData = productDoc.data();
        const minStockLevel = productData?.minStockLevel || 0;
        const reorderPoint = productData?.reorderPoint || 0;
        if (newData.quantity <= minStockLevel && (!previousData || previousData.quantity > minStockLevel)) {
            await db.collection("alerts").add({
                type: "low_stock",
                severity: newData.quantity === 0 ? "critical" : "warning",
                warehouseId: newData.warehouseId,
                shelfId: newData.shelfId,
                productId: newData.productId,
                message: `Low stock alert: ${productData?.name} is at ${newData.quantity} units`,
                details: {
                    currentQuantity: newData.quantity,
                    minStockLevel: minStockLevel,
                    reorderPoint: reorderPoint,
                },
                resolved: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await sendLowStockNotification(newData, productData);
        }
        await db.collection("audit-logs").add({
            userId: newData.updatedBy || "system",
            action: change.before.exists ? "update_inventory" : "create_inventory",
            resource: "inventory",
            resourceId: context.params.inventoryId,
            details: {
                productId: newData.productId,
                shelfId: newData.shelfId,
                previousQuantity: previousData?.quantity || 0,
                newQuantity: newData.quantity,
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        return null;
    }
    catch (error) {
        console.error("Error processing inventory update:", error);
        return null;
    }
});
async function sendLowStockNotification(inventoryData, productData) {
    const managersSnapshot = await db.collection("users")
        .where("warehouseId", "==", inventoryData.warehouseId)
        .where("role", "in", ["admin", "manager"])
        .get();
    const batch = db.batch();
    managersSnapshot.forEach((doc) => {
        const notificationRef = db.collection("notifications").doc();
        batch.set(notificationRef, {
            userId: doc.id,
            type: "low_stock",
            title: "Low Stock Alert",
            message: `${productData.name} is running low (${inventoryData.quantity} units remaining)`,
            read: false,
            actionUrl: `/inventory?productId=${inventoryData.productId}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });
    await batch.commit();
}
//# sourceMappingURL=onInventoryUpdate.js.map