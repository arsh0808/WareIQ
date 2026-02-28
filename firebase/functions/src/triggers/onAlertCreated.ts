import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const onAlertCreated = functions.firestore
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
    } catch (error) {
      console.error("Error processing alert creation:", error);
      return null;
    }
  });

async function getAlertRecipients(alertData: any): Promise<string[]> {
  const recipients: string[] = [];

  let usersSnapshot;

  if (alertData.severity === "critical") {
    usersSnapshot = await db.collection("users")
      .where("warehouseId", "==", alertData.warehouseId)
      .where("role", "in", ["admin", "manager"])
      .get();
  } else if (alertData.severity === "warning") {
    usersSnapshot = await db.collection("users")
      .where("warehouseId", "==", alertData.warehouseId)
      .where("role", "in", ["admin", "manager", "staff"])
      .get();
  } else {
    usersSnapshot = await db.collection("users")
      .where("warehouseId", "==", alertData.warehouseId)
      .get();
  }
  usersSnapshot.forEach((doc) => {
    recipients.push(doc.id);
  });

  return recipients;
}

function getAlertTitle(alertData: any): string {
  const titles: Record<string, string> = {
    low_stock: "Low Stock Alert",
    sensor_failure: "Sensor Failure",
    unauthorized_access: "Security Alert",
    temperature_alert: "Temperature Alert",
    weight_mismatch: "Weight Anomaly",
  };

  return titles[alertData.type] || "System Alert";
}

async function sendCriticalAlertNotifications(alertData: any, recipients: string[]) {
  
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
        await sendEmailNotification(
          userData.email,
          `[${alertData.severity.toUpperCase()}] ${alertData.message}`,
          emailHtml
        );
      }
    }
  } catch (error) {
    console.error("Error sending notifications:", error);
  }

  console.log(`Critical alert notification sent to ${recipients.length} recipients`);
  console.log("Alert details:", alertData);
}
