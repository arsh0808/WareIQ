import * as admin from "firebase-admin";

const db = admin.firestore();

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> {
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

    const tokensToRemove: string[] = [];
    response.results.forEach((result, index) => {
      const error = result.error;
      if (error) {
        console.error(`Error sending to token ${fcmTokens[index]}:`, error);
        if (
          error.code === "messaging/invalid-registration-token" ||
          error.code === "messaging/registration-token-not-registered"
        ) {
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
  } catch (error) {
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

export async function sendPushNotificationToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: any
): Promise<void> {
  const promises = userIds.map(userId =>
    sendPushNotification(userId, title, body, data)
  );
  
  await Promise.all(promises);
}

export function generateAlertPushData(alertData: any) {
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
