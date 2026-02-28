import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

const db = admin.firestore();
const rtdb = admin.database();

const rateLimitMap = new Map<string, number[]>();
const MAX_REQUESTS_PER_MINUTE = 60;
const RATE_LIMIT_WINDOW_MS = 60000;

function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

function checkRateLimit(deviceId: string): boolean {
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

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

export const iotWebhook = functions.https.onRequest(async (request, response) => {
  
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Methods", "POST");
  response.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, X-Signature");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({error: "Method Not Allowed"});
    return;
  }

  try {
    const {deviceId, deviceType, data, timestamp} = request.body;
    const apiKey = request.headers["x-api-key"] as string;
    const signature = request.headers["x-signature"] as string;

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
      const payload = JSON.stringify({deviceId, deviceType, data, timestamp});
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
  } catch (error) {
    console.error("Error processing IoT webhook:", error);
    response.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
