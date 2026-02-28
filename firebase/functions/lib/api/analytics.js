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
exports.getAnalytics = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.getAnalytics = functions.https.onRequest(async (request, response) => {
    response.set("Access-Control-Allow-Origin", "*");
    if (request.method === "OPTIONS") {
        response.status(204).send("");
        return;
    }
    if (request.method !== "GET") {
        response.status(405).send("Method Not Allowed");
        return;
    }
    // Verify authentication and check permissions
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        response.status(401).json({
            error: "Unauthorized",
            message: "Authentication required to access analytics",
        });
        return;
    }
    try {
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        // Get user role
        const userDoc = await admin.firestore().collection("users").doc(decodedToken.uid).get();
        if (!userDoc.exists) {
            response.status(403).json({
                error: "Forbidden",
                message: "User profile not found",
            });
            return;
        }
        const userRole = userDoc.data();
        // Check if user has analytics permission
        const canViewAnalytics = ["admin", "manager"].includes(userRole?.role);
        if (!canViewAnalytics) {
            response.status(403).json({
                error: "Forbidden",
                message: "Insufficient permissions to access analytics",
                requiredRole: "admin or manager",
            });
            return;
        }
        const warehouseId = request.query.warehouseId;
        const period = request.query.period || "7d";
        if (!warehouseId) {
            response.status(400).json({ error: "warehouseId is required" });
            return;
        }
        // Ensure non-admin users can only access their warehouse
        if (userRole?.role !== "admin" && userRole?.warehouseId !== warehouseId) {
            response.status(403).json({
                error: "Forbidden",
                message: "You can only access analytics for your assigned warehouse",
            });
            return;
        }
        const endDate = new Date();
        const startDate = new Date();
        switch (period) {
            case "24h":
                startDate.setHours(startDate.getHours() - 24);
                break;
            case "7d":
                startDate.setDate(startDate.getDate() - 7);
                break;
            case "30d":
                startDate.setDate(startDate.getDate() - 30);
                break;
            default:
                startDate.setDate(startDate.getDate() - 7);
        }
        const analytics = await generateAnalytics(warehouseId, startDate, endDate);
        response.status(200).json(analytics);
    }
    catch (error) {
        console.error("Error generating analytics:", error);
        response.status(500).json({
            error: "Failed to generate analytics",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
async function generateAnalytics(warehouseId, startDate, endDate) {
    const inventorySnapshot = await db.collection("inventory")
        .where("warehouseId", "==", warehouseId)
        .get();
    const alertsSnapshot = await db.collection("alerts")
        .where("warehouseId", "==", warehouseId)
        .where("createdAt", ">=", startDate)
        .where("createdAt", "<=", endDate)
        .get();
    const devicesSnapshot = await db.collection("iot-devices")
        .where("warehouseId", "==", warehouseId)
        .get();
    let totalInventoryValue = 0;
    const categoryDistribution = {};
    for (const doc of inventorySnapshot.docs) {
        const inventoryData = doc.data();
        const productDoc = await db.collection("products").doc(inventoryData.productId).get();
        const productData = productDoc.data();
        if (productData) {
            totalInventoryValue += inventoryData.quantity * productData.unitPrice;
            const category = productData.category || "Uncategorized";
            categoryDistribution[category] = (categoryDistribution[category] || 0) + inventoryData.quantity;
        }
    }
    const alertStats = {
        total: alertsSnapshot.size,
        critical: 0,
        warning: 0,
        info: 0,
        byType: {},
    };
    alertsSnapshot.forEach((doc) => {
        const data = doc.data();
        alertStats[data.severity]++;
        alertStats.byType[data.type] = (alertStats.byType[data.type] || 0) + 1;
    });
    return {
        period: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
        },
        inventory: {
            totalItems: inventorySnapshot.size,
            totalValue: totalInventoryValue,
            categoryDistribution,
        },
        alerts: alertStats,
        devices: {
            total: devicesSnapshot.size,
            online: devicesSnapshot.docs.filter((doc) => doc.data().status === "online").length,
            offline: devicesSnapshot.docs.filter((doc) => doc.data().status === "offline").length,
        },
    };
}
//# sourceMappingURL=analytics.js.map