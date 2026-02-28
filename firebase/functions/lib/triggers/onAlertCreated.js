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
exports.onAlertCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.onAlertCreated = functions.firestore
    .document("alerts/{alertId}")
    .onCreate(async (snapshot, context) => {
    const alertData = snapshot.data();
    const alertId = context.params.alertId;
    try {
        const recipients = await getAlertRecipients(alertData);
        const batch = db.batch();
        recipients.forEach((userId) => {
            const notificationRef = db.collection("notifications").doc();
            batch.set(notificationRef, {
                userId: userId,
                type: alertData.type,
                title: getAlertTitle(alertData),
                message: alertData.message,
                read: false,
                actionUrl: `/alerts/${alertId}`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        await batch.commit();
        if (alertData.severity === "critical") {
            await sendCriticalAlertNotifications(alertData, recipients);
        }
        return null;
    }
    catch (error) {
        console.error("Error processing alert creation:", error);
        return null;
    }
});
async function getAlertRecipients(alertData) {
    const recipients = [];
    let usersSnapshot;
    if (alertData.severity === "critical") {
        usersSnapshot = await db.collection("users")
            .where("warehouseId", "==", alertData.warehouseId)
            .where("role", "in", ["admin", "manager"])
            .get();
    }
    else if (alertData.severity === "warning") {
        usersSnapshot = await db.collection("users")
            .where("warehouseId", "==", alertData.warehouseId)
            .where("role", "in", ["admin", "manager", "staff"])
            .get();
    }
    else {
        usersSnapshot = await db.collection("users")
            .where("warehouseId", "==", alertData.warehouseId)
            .get();
    }
    usersSnapshot.forEach((doc) => {
        recipients.push(doc.id);
    });
    return recipients;
}
function getAlertTitle(alertData) {
    const titles = {
        low_stock: "Low Stock Alert",
        sensor_failure: "Sensor Failure",
        unauthorized_access: "Security Alert",
        temperature_alert: "Temperature Alert",
        weight_mismatch: "Weight Anomaly",
    };
    return titles[alertData.type] || "System Alert";
}
async function sendCriticalAlertNotifications(alertData, recipients) {
    try {
        const { sendEmailNotification, generateAlertEmailHtml } = require("../notifications/email");
        const emailHtml = generateAlertEmailHtml(alertData);
        const usersSnapshot = await db.collection("users")
            .where("warehouseId", "==", alertData.warehouseId)
            .where("role", "in", ["admin", "manager"])
            .get();
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            if (userData.email) {
                await sendEmailNotification(userData.email, `[${alertData.severity.toUpperCase()}] ${alertData.message}`, emailHtml);
            }
        }
    }
    catch (error) {
        console.error("Error sending notifications:", error);
    }
    console.log(`Critical alert notification sent to ${recipients.length} recipients`);
    console.log("Alert details:", alertData);
}
//# sourceMappingURL=onAlertCreated.js.map