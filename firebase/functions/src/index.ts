import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

admin.initializeApp();

export * from "./triggers/onInventoryUpdate";
export * from "./triggers/onDeviceDataReceived";
export * from "./triggers/onAlertCreated";
export * from "./triggers/onRoleChange";
export * from "./triggers/onLowStock";
export * from "./scheduled/dailyReports";
export * from "./scheduled/deviceHealthCheck";
export * from "./api/iotWebhook";
export * from "./api/analytics";

// Import role management router
import { roleManagementRouter } from "./api/roleManagement";

// Create Express app for API
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Mount role management routes
app.use("/roles", roleManagementRouter);

// Export as Cloud Function
export const api = functions.https.onRequest(app);

export const healthCheck = functions.https.onRequest((request, response) => {
  response.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.1.0",
  });
});
