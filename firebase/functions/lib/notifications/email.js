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
exports.sendEmailNotification = sendEmailNotification;
exports.generateAlertEmailHtml = generateAlertEmailHtml;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
async function sendEmailNotification(to, subject, html) {
    try {
        console.log(`Email notification sent to ${to}: ${subject}`);
        await db.collection("notification-logs").add({
            type: "email",
            to,
            subject,
            status: "sent",
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return true;
    }
    catch (error) {
        console.error("Error sending email:", error);
        await db.collection("notification-logs").add({
            type: "email",
            to,
            subject,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return false;
    }
}
function generateAlertEmailHtml(alertData) {
    const severityColor = alertData.severity === "critical" ? "#dc2626" :
        alertData.severity === "warning" ? "#f59e0b" : "#3b82f6";
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${severityColor}; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .alert-details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Alert Notification</h1>
          <p style="margin: 0;">${alertData.severity.toUpperCase()}</p>
        </div>
        <div class="content">
          <h2>${alertData.message}</h2>
          <div class="alert-details">
            <p><strong>Type:</strong> ${alertData.type.replace(/_/g, ' ')}</p>
            <p><strong>Warehouse:</strong> ${alertData.warehouseId}</p>
            ${alertData.shelfId ? `<p><strong>Shelf:</strong> ${alertData.shelfId}</p>` : ''}
            ${alertData.deviceId ? `<p><strong>Device:</strong> ${alertData.deviceId}</p>` : ''}
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          ${alertData.details ? `
            <div class="alert-details">
              <h3>Additional Details:</h3>
              <pre>${JSON.stringify(alertData.details, null, 2)}</pre>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>Smart Warehouse IoT System</p>
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
//# sourceMappingURL=email.js.map