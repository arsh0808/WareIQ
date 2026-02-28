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
exports.deviceHealthCheck = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.deviceHealthCheck = functions.pubsub
    .schedule("*/15 * * * *")
    .onRun(async (context) => {
    try {
        console.log("Running device health check...");
        const fifteenMinutesAgo = new Date();
        fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
        const devicesSnapshot = await db.collection("iot-devices").get();
        const batch = db.batch();
        const offlineDevices = [];
        for (const deviceDoc of devicesSnapshot.docs) {
            const deviceData = deviceDoc.data();
            const lastHeartbeat = deviceData.lastHeartbeat?.toDate();
            if (!lastHeartbeat || lastHeartbeat < fifteenMinutesAgo) {
                if (deviceData.status !== "offline") {
                    batch.update(deviceDoc.ref, {
                        status: "offline",
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    offlineDevices.push({
                        deviceId: deviceDoc.id,
                        deviceType: deviceData.deviceType,
                        shelfId: deviceData.shelfId,
                        warehouseId: deviceData.warehouseId,
                        lastHeartbeat: lastHeartbeat,
                    });
                }
            }
            if (deviceData.batteryLevel && deviceData.batteryLevel < 20) {
                const existingAlert = await db.collection("alerts")
                    .where("deviceId", "==", deviceDoc.id)
                    .where("type", "==", "low_battery")
                    .where("resolved", "==", false)
                    .limit(1)
                    .get();
                if (existingAlert.empty) {
                    await db.collection("alerts").add({
                        type: "low_battery",
                        severity: deviceData.batteryLevel < 10 ? "critical" : "warning",
                        warehouseId: deviceData.warehouseId,
                        shelfId: deviceData.shelfId,
                        deviceId: deviceDoc.id,
                        message: `Device battery low: ${deviceData.batteryLevel}%`,
                        details: {
                            batteryLevel: deviceData.batteryLevel,
                            deviceType: deviceData.deviceType,
                        },
                        resolved: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            }
        }
        await batch.commit();
        for (const device of offlineDevices) {
            await db.collection("alerts").add({
                type: "sensor_failure",
                severity: "warning",
                warehouseId: device.warehouseId,
                shelfId: device.shelfId,
                deviceId: device.deviceId,
                message: `Device ${device.deviceId} is offline`,
                details: {
                    deviceType: device.deviceType,
                    lastHeartbeat: device.lastHeartbeat?.toISOString(),
                },
                resolved: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        console.log(`Health check complete. ${offlineDevices.length} devices marked as offline.`);
        return null;
    }
    catch (error) {
        console.error("Error during device health check:", error);
        return null;
    }
});
//# sourceMappingURL=deviceHealthCheck.js.map