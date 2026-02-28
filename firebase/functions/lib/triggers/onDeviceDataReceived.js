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
exports.onDeviceDataReceived = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
const rtdb = admin.database();
exports.onDeviceDataReceived = functions.database
    .ref("/sensor-data/{deviceId}/latest")
    .onWrite(async (change, context) => {
    const deviceId = context.params.deviceId;
    const newData = change.after.val();
    if (!newData) {
        return null;
    }
    try {
        const deviceDoc = await db.collection("iot-devices").doc(deviceId).get();
        if (!deviceDoc.exists) {
            console.error(`Device ${deviceId} not found in Firestore`);
            return null;
        }
        const deviceData = deviceDoc.data();
        const shelfId = deviceData?.shelfId;
        const warehouseId = deviceData?.warehouseId;
        await db.collection("iot-devices").doc(deviceId).update({
            lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
            status: "online",
        });
        if (deviceData?.deviceType === "weight_sensor" && newData.weight !== undefined) {
            await db.collection("shelves").doc(shelfId).update({
                currentWeight: newData.weight,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            await rtdb.ref(`/real-time-inventory/${shelfId}`).set({
                currentWeight: newData.weight,
                lastUpdate: admin.database.ServerValue.TIMESTAMP,
            });
            const shelfDoc = await db.collection("shelves").doc(shelfId).get();
            const maxWeight = shelfDoc.data()?.maxWeight;
            if (maxWeight && newData.weight > maxWeight) {
                await db.collection("alerts").add({
                    type: "weight_mismatch",
                    severity: "warning",
                    warehouseId: warehouseId,
                    shelfId: shelfId,
                    deviceId: deviceId,
                    message: `Shelf weight exceeded maximum capacity (${newData.weight}kg > ${maxWeight}kg)`,
                    details: {
                        currentWeight: newData.weight,
                        maxWeight: maxWeight,
                    },
                    resolved: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }
        if (deviceData?.deviceType === "temperature_sensor" && newData.temperature !== undefined) {
            const minTemp = 0;
            const maxTemp = 30;
            if (newData.temperature < minTemp || newData.temperature > maxTemp) {
                await db.collection("alerts").add({
                    type: "temperature_alert",
                    severity: "critical",
                    warehouseId: warehouseId,
                    shelfId: shelfId,
                    deviceId: deviceId,
                    message: `Temperature out of range: ${newData.temperature}°C`,
                    details: {
                        currentTemperature: newData.temperature,
                        minTemperature: minTemp,
                        maxTemperature: maxTemp,
                        humidity: newData.humidity,
                    },
                    resolved: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        }
        await rtdb.ref(`/sensor-data/${deviceId}/history/${Date.now()}`).set(newData);
        return null;
    }
    catch (error) {
        console.error("Error processing device data:", error);
        return null;
    }
});
//# sourceMappingURL=onDeviceDataReceived.js.map