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
exports.iotWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const db = admin.firestore();
const rtdb = admin.database();
const rateLimitMap = new Map();
const MAX_REQUESTS_PER_MINUTE = 60;
const RATE_LIMIT_WINDOW_MS = 60000;
function hashApiKey(apiKey) {
    return crypto.createHash("sha256").update(apiKey).digest("hex");
}
function checkRateLimit(deviceId) {
    const now = Date.now();
    const requests = rateLimitMap.get(deviceId) || [];
    const validRequests = requests.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
    if (validRequests.length >= MAX_REQUESTS_PER_MINUTE) {
        return false;
    }
    validRequests.push(now);
    rateLimitMap.set(deviceId, validRequests);
    return true;
}
function verifySignature(payload, signature, secret) {
    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    catch {
        return false;
    }
}
exports.iotWebhook = functions.https.onRequest(async (request, response) => {
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "POST");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, X-Signature");
    if (request.method === "OPTIONS") {
        response.status(204).send("");
        return;
    }
    if (request.method !== "POST") {
        response.status(405).json({ error: "Method Not Allowed" });
        return;
    }
    try {
        const { deviceId, deviceType, data, timestamp } = request.body;
        const apiKey = request.headers["x-api-key"];
        const signature = request.headers["x-signature"];
        if (!deviceId || !data) {
            response.status(400).json({
                error: "Missing required fields: deviceId, data",
            });
            return;
        }
        if (!apiKey) {
            response.status(401).json({
                error: "Missing API key. Include X-API-Key header",
            });
            return;
        }
        if (!checkRateLimit(deviceId)) {
            response.status(429).json({
                error: "Rate limit exceeded. Maximum 60 requests per minute",
            });
            return;
        }
        const deviceDoc = await db.collection("iot-devices").doc(deviceId).get();
        if (!deviceDoc.exists) {
            response.status(404).json({
                error: "Device not found",
            });
            return;
        }
        const deviceData = deviceDoc.data();
        const hashedApiKey = hashApiKey(apiKey);
        if (deviceData?.apiKeyHash !== hashedApiKey) {
            response.status(403).json({
                error: "Invalid API key",
            });
            return;
        }
        if (signature && deviceData?.secretKey) {
            const payload = JSON.stringify({ deviceId, deviceType, data, timestamp });
            if (!verifySignature(payload, signature, deviceData.secretKey)) {
                response.status(403).json({
                    error: "Invalid signature",
                });
                return;
            }
        }
        await rtdb.ref(`/sensor-data/${deviceId}/latest`).set({
            ...data,
            timestamp: timestamp || Date.now(),
        });
        await rtdb.ref(`/device-status/${deviceId}`).set({
            online: true,
            lastSeen: admin.database.ServerValue.TIMESTAMP,
        });
        response.status(200).json({
            success: true,
            message: "Data received successfully",
            deviceId: deviceId,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error("Error processing IoT webhook:", error);
        response.status(500).json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
//# sourceMappingURL=iotWebhook.js.map