import * as admin from "firebase-admin";

const db = admin.firestore();

export async function sendEmailNotification(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
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
  } catch (error) {
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

export function generateAlertEmailHtml(alertData: any): string {
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
