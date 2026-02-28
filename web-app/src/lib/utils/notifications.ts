import { addDoc, collection, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Alert } from '@/lib/types';

export interface NotificationRecipient {
  userId: string;
  email?: string;
  phone?: string;
  name?: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  criticalOnly: boolean;
  alertTypes: string[];
}

/**
 * Send email notification (via Firebase Cloud Function)
 */
export async function sendEmailNotification(params: {
  to: string;
  subject: string;
  body: string;
  html?: string;
  alertId?: string;
  priority?: 'high' | 'normal' | 'low';
}): Promise<void> {
  try {
    // Queue email for sending via Cloud Function
    await addDoc(collection(db, 'emailQueue'), {
      to: params.to,
      subject: params.subject,
      body: params.body,
      html: params.html,
      alertId: params.alertId,
      priority: params.priority || 'normal',
      status: 'pending',
      createdAt: Timestamp.now(),
      attempts: 0,
    });

    console.log(`Email queued for ${params.to}: ${params.subject}`);
  } catch (error) {
    console.error('Error queuing email:', error);
    throw error;
  }
}

/**
 * Send SMS notification (via Firebase Cloud Function)
 */
export async function sendSMSNotification(params: {
  to: string;
  message: string;
  alertId?: string;
  priority?: 'high' | 'normal' | 'low';
}): Promise<void> {
  try {
    // Queue SMS for sending via Cloud Function
    await addDoc(collection(db, 'smsQueue'), {
      to: params.to,
      message: params.message,
      alertId: params.alertId,
      priority: params.priority || 'normal',
      status: 'pending',
      createdAt: Timestamp.now(),
      attempts: 0,
    });

    console.log(`SMS queued for ${params.to}`);
  } catch (error) {
    console.error('Error queuing SMS:', error);
    throw error;
  }
}

/**
 * Format alert for email
 */
export function formatAlertEmail(alert: Alert, productName?: string): { subject: string; html: string; body: string } {
  const severityColors = {
    critical: '#DC2626',
    warning: '#F59E0B',
    info: '#3B82F6',
  };

  const severityEmoji = {
    critical: '🚨',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const subject = `${severityEmoji[alert.severity]} ${alert.severity.toUpperCase()}: ${alert.message}`;
  
  const body = `
Alert: ${alert.message}
Severity: ${alert.severity.toUpperCase()}
Type: ${alert.type}
${productName ? `Product: ${productName}` : ''}
${alert.shelfId ? `Shelf: ${alert.shelfId}` : ''}
${alert.deviceId ? `Device: ${alert.deviceId}` : ''}

Details:
${JSON.stringify(alert.details, null, 2)}

Created: ${alert.createdAt instanceof Date ? alert.createdAt.toLocaleString() : new Date().toLocaleString()}
Warehouse: ${alert.warehouseId}

Please take appropriate action.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${severityColors[alert.severity]}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
    .detail { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
    .label { font-weight: bold; color: #6b7280; }
    .value { color: #111827; }
    .footer { margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-critical { background: #FEE2E2; color: #991B1B; }
    .badge-warning { background: #FEF3C7; color: #92400E; }
    .badge-info { background: #DBEAFE; color: #1E40AF; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">${severityEmoji[alert.severity]} Alert Notification</h1>
    </div>
    <div class="content">
      <div class="detail">
        <div class="label">Alert Message:</div>
        <div class="value" style="font-size: 18px; font-weight: bold; margin-top: 5px;">${alert.message}</div>
      </div>
      
      <div class="detail">
        <div class="label">Severity:</div>
        <span class="badge badge-${alert.severity}">${alert.severity.toUpperCase()}</span>
      </div>
      
      <div class="detail">
        <div class="label">Type:</div>
        <div class="value">${alert.type.replace(/_/g, ' ').toUpperCase()}</div>
      </div>
      
      ${productName ? `
      <div class="detail">
        <div class="label">Product:</div>
        <div class="value">${productName}</div>
      </div>
      ` : ''}
      
      ${alert.shelfId ? `
      <div class="detail">
        <div class="label">Shelf Location:</div>
        <div class="value">${alert.shelfId}</div>
      </div>
      ` : ''}
      
      ${alert.deviceId ? `
      <div class="detail">
        <div class="label">Device ID:</div>
        <div class="value">${alert.deviceId}</div>
      </div>
      ` : ''}
      
      <div class="detail">
        <div class="label">Additional Details:</div>
        <div class="value">
          ${Object.entries(alert.details).map(([key, value]) => `
            <div style="margin: 5px 0;">
              <strong>${key.replace(/([A-Z])/g, ' $1').trim()}:</strong> ${value}
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="detail">
        <div class="label">Created:</div>
        <div class="value">${alert.createdAt instanceof Date ? alert.createdAt.toLocaleString() : new Date().toLocaleString()}</div>
      </div>
      
      <div class="detail">
        <div class="label">Warehouse:</div>
        <div class="value">${alert.warehouseId}</div>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">This is an automated alert from Smart Warehouse Management System.</p>
      <p style="margin: 5px 0 0 0;">Please log in to the system to view and resolve this alert.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, body, html };
}

/**
 * Format alert for SMS (160 characters max)
 */
export function formatAlertSMS(alert: Alert, productName?: string): string {
  const emoji = {
    critical: '🚨',
    warning: '⚠️',
    info: 'ℹ️',
  };

  // Keep SMS concise
  let message = `${emoji[alert.severity]} ${alert.severity.toUpperCase()}: ${alert.message}`;
  
  if (productName && message.length < 100) {
    message += ` | ${productName}`;
  }
  
  if (alert.shelfId && message.length < 130) {
    message += ` @ ${alert.shelfId}`;
  }

  // Truncate if too long
  if (message.length > 160) {
    message = message.substring(0, 157) + '...';
  }

  return message;
}

/**
 * Get notification recipients for a warehouse
 */
export async function getNotificationRecipients(
  warehouseId: string,
  alertSeverity: 'critical' | 'warning' | 'info'
): Promise<NotificationRecipient[]> {
  try {
    // Get all users for this warehouse
    const usersQuery = query(
      collection(db, 'users'),
      where('warehouseId', '==', warehouseId)
    );
    
    const snapshot = await getDocs(usersQuery);
    const recipients: NotificationRecipient[] = [];

    for (const doc of snapshot.docs) {
      const userData = doc.data();
      
      // Check notification preferences
      const prefsDoc = await getDocs(
        query(collection(db, 'notificationPreferences'), where('userId', '==', doc.id))
      );

      let sendNotification = true;
      
      if (!prefsDoc.empty) {
        const prefs = prefsDoc.docs[0].data() as NotificationPreferences;
        
        // Skip if user only wants critical alerts and this isn't critical
        if (prefs.criticalOnly && alertSeverity !== 'critical') {
          sendNotification = false;
        }
      }

      if (sendNotification) {
        recipients.push({
          userId: doc.id,
          email: userData.email,
          phone: userData.phone,
          name: userData.name,
        });
      }
    }

    return recipients;
  } catch (error) {
    console.error('Error getting notification recipients:', error);
    return [];
  }
}

/**
 * Send alert notifications to all relevant recipients
 */
export async function sendAlertNotifications(
  alert: Alert,
  productName?: string
): Promise<{ emailsSent: number; smsSent: number }> {
  try {
    const recipients = await getNotificationRecipients(alert.warehouseId, alert.severity);
    
    let emailsSent = 0;
    let smsSent = 0;

    const emailContent = formatAlertEmail(alert, productName);
    const smsContent = formatAlertSMS(alert, productName);

    for (const recipient of recipients) {
      // Send email if available
      if (recipient.email) {
        try {
          await sendEmailNotification({
            to: recipient.email,
            subject: emailContent.subject,
            body: emailContent.body,
            html: emailContent.html,
            alertId: alert.id,
            priority: alert.severity === 'critical' ? 'high' : 'normal',
          });
          emailsSent++;
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
        }
      }

      // Send SMS for critical alerts only (to reduce SMS costs)
      if (recipient.phone && alert.severity === 'critical') {
        try {
          await sendSMSNotification({
            to: recipient.phone,
            message: smsContent,
            alertId: alert.id,
            priority: 'high',
          });
          smsSent++;
        } catch (error) {
          console.error(`Failed to send SMS to ${recipient.phone}:`, error);
        }
      }
    }

    console.log(`Alert notifications sent: ${emailsSent} emails, ${smsSent} SMS`);
    return { emailsSent, smsSent };
  } catch (error) {
    console.error('Error sending alert notifications:', error);
    return { emailsSent: 0, smsSent: 0 };
  }
}

/**
 * Send test notification
 */
export async function sendTestNotification(
  recipient: NotificationRecipient,
  type: 'email' | 'sms'
): Promise<boolean> {
  try {
    if (type === 'email' && recipient.email) {
      await sendEmailNotification({
        to: recipient.email,
        subject: 'Test Notification - Smart Warehouse',
        body: 'This is a test notification from Smart Warehouse Management System. If you received this, your email notifications are working correctly.',
        html: '<p>This is a test notification from <strong>Smart Warehouse Management System</strong>.</p><p>If you received this, your email notifications are working correctly.</p>',
        priority: 'low',
      });
      return true;
    } else if (type === 'sms' && recipient.phone) {
      await sendSMSNotification({
        to: recipient.phone,
        message: 'Test notification from Smart Warehouse. Your SMS alerts are configured correctly.',
        priority: 'low',
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
}
