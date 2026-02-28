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
exports.sendPushNotification = sendPushNotification;
exports.sendPushNotificationToUsers = sendPushNotificationToUsers;
exports.generateAlertPushData = generateAlertPushData;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
async function sendPushNotification(userId, title, body, data) {
    try {
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();
        if (!userData?.fcmTokens || userData.fcmTokens.length === 0) {
            console.log(`No FCM tokens found for user ${userId}`);
            return false;
        }
        const fcmTokens = userData.fcmTokens;
        const payload = {
            notification: {
                title,
                body,
            },
            data: data || {},
        };
        const response = await admin.messaging().sendToDevice(fcmTokens, payload);
        const tokensToRemove = [];
        response.results.forEach((result, index) => {
            const error = result.error;
            if (error) {
                console.error(`Error sending to token ${fcmTokens[index]}:`, error);
                if (error.code === "messaging/invalid-registration-token" ||
                    error.code === "messaging/registration-token-not-registered") {
                    tokensToRemove.push(fcmTokens[index]);
                }
            }
        });
        if (tokensToRemove.length > 0) {
            await db.collection("users").doc(userId).update({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove),
            });
        }
        await db.collection("notification-logs").add({
            type: "push",
            userId,
            title,
            body,
            status: "sent",
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            successCount: response.successCount,
            failureCount: response.failureCount,
        });
        return response.successCount > 0;
    }
    catch (error) {
        console.error("Error sending push notification:", error);
        await db.collection("notification-logs").add({
            type: "push",
            userId,
            title,
            body,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return false;
    }
}
async function sendPushNotificationToUsers(userIds, title, body, data) {
    const promises = userIds.map(userId => sendPushNotification(userId, title, body, data));
    await Promise.all(promises);
}
function generateAlertPushData(alertData) {
    return {
        title: `${alertData.severity.toUpperCase()} Alert`,
        body: alertData.message,
        data: {
            type: "alert",
            alertId: alertData.id,
            alertType: alertData.type,
            severity: alertData.severity,
            warehouseId: alertData.warehouseId,
            timestamp: new Date().toISOString(),
        },
    };
}
//# sourceMappingURL=push.js.map