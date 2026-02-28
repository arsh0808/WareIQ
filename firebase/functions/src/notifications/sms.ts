import * as admin from "firebase-admin";

const db = admin.firestore();

export async function sendSMSNotification(
  to: string,
  message: string
): Promise<boolean> {
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
  } catch (error) {
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

export function generateAlertSMSMessage(alertData: any): string {
  const emoji = alertData.severity === "critical" ? "🚨" :
                alertData.severity === "warning" ? "⚠️" : "ℹ️";
  
  return `${emoji} ALERT: ${alertData.message} | Warehouse: ${alertData.warehouseId} | ${new Date().toLocaleTimeString()}`;
}
