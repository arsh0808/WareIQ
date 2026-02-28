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
exports.sendSMSNotification = sendSMSNotification;
exports.generateAlertSMSMessage = generateAlertSMSMessage;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
async function sendSMSNotification(to, message) {
    try {
        console.log(`SMS notification sent to ${to}: ${message}`);
        await db.collection("notification-logs").add({
            type: "sms",
            to,
            message,
            status: "sent",
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return true;
    }
    catch (error) {
        console.error("Error sending SMS:", error);
        await db.collection("notification-logs").add({
            type: "sms",
            to,
            message,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return false;
    }
}
function generateAlertSMSMessage(alertData) {
    const emoji = alertData.severity === "critical" ? "🚨" :
        alertData.severity === "warning" ? "⚠️" : "ℹ️";
    return `${emoji} ALERT: ${alertData.message} | Warehouse: ${alertData.warehouseId} | ${new Date().toLocaleTimeString()}`;
}
//# sourceMappingURL=sms.js.map