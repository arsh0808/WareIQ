/**
 * Email Templates for Various Notifications
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Role Change Notification Email
 */
export function roleChangeEmail(data: {
  userName: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
  reason: string;
  timestamp: string;
}): EmailTemplate {
  const roleEmojis: Record<string, string> = {
    admin: '👑',
    manager: '🎯',
    staff: '👤',
    viewer: '👁️',
  };

  return {
    subject: `Your role has been updated - Smart Warehouse`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .role-change { background: #f7fafc; border-left: 4px solid #4299e1; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .role-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 0 5px; }
    .role-admin { background: #9f7aea; color: white; }
    .role-manager { background: #4299e1; color: white; }
    .role-staff { background: #48bb78; color: white; }
    .role-viewer { background: #a0aec0; color: white; }
    .footer { background: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 14px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #4a5568; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏭 Smart Warehouse</h1>
      <p style="margin: 0; opacity: 0.9;">Role Update Notification</p>
    </div>
    
    <div class="content">
      <h2>Hello ${data.userName},</h2>
      <p>Your role in the Smart Warehouse system has been updated.</p>
      
      <div class="role-change">
        <h3 style="margin-top: 0;">Role Change Details</h3>
        
        <div class="info-row">
          <span class="label">Previous Role:</span>
          <span class="role-badge role-${data.oldRole}">${roleEmojis[data.oldRole]} ${data.oldRole.toUpperCase()}</span>
        </div>
        
        <div style="text-align: center; margin: 20px 0; font-size: 24px; color: #4299e1;">
          ⬇️
        </div>
        
        <div class="info-row">
          <span class="label">New Role:</span>
          <span class="role-badge role-${data.newRole}">${roleEmojis[data.newRole]} ${data.newRole.toUpperCase()}</span>
        </div>
        
        <div class="info-row" style="margin-top: 20px;">
          <span class="label">Changed by:</span> ${data.changedBy}
        </div>
        
        <div class="info-row">
          <span class="label">Reason:</span> ${data.reason}
        </div>
        
        <div class="info-row">
          <span class="label">Date:</span> ${data.timestamp}
        </div>
      </div>
      
      <p>Your new permissions have been applied immediately. Please log out and log back in to see the changes.</p>
      
      <div style="text-align: center;">
        <a href="https://your-app-url.com/dashboard" class="button">Go to Dashboard</a>
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated notification from Smart Warehouse IoT Management System.</p>
      <p>If you have any questions, please contact your administrator.</p>
      <p style="margin-top: 20px; font-size: 12px;">© 2024 Smart Warehouse. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Hello ${data.userName},

Your role in the Smart Warehouse system has been updated.

ROLE CHANGE DETAILS
-------------------
Previous Role: ${data.oldRole.toUpperCase()}
New Role: ${data.newRole.toUpperCase()}

Changed by: ${data.changedBy}
Reason: ${data.reason}
Date: ${data.timestamp}

Your new permissions have been applied immediately. Please log out and log back in to see the changes.

Visit: https://your-app-url.com/dashboard

---
This is an automated notification from Smart Warehouse IoT Management System.
If you have any questions, please contact your administrator.
    `,
  };
}

/**
 * Low Stock Alert Email
 */
export function lowStockAlertEmail(data: {
  products: Array<{
    name: string;
    sku: string;
    currentStock: number;
    minStock: number;
    warehouse: string;
  }>;
  warehouseName: string;
}): EmailTemplate {
  const productRows = data.products.map(p => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px;">${p.name}</td>
      <td style="padding: 12px; font-family: monospace;">${p.sku}</td>
      <td style="padding: 12px; text-align: center; color: #e53e3e; font-weight: bold;">${p.currentStock}</td>
      <td style="padding: 12px; text-align: center;">${p.minStock}</td>
      <td style="padding: 12px;">${p.warehouse}</td>
    </tr>
  `).join('');

  return {
    subject: `⚠️ Low Stock Alert - ${data.products.length} items need attention`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f6ad55 0%, #ed8936 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .alert-box { background: #fff5f5; border: 2px solid #fc8181; padding: 20px; margin: 20px 0; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f7fafc; padding: 12px; text-align: left; border-bottom: 2px solid #4299e1; }
    .footer { background: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 14px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #ed8936; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Low Stock Alert</h1>
      <p style="margin: 0; opacity: 0.9;">${data.warehouseName}</p>
    </div>
    
    <div class="content">
      <div class="alert-box">
        <h3 style="margin-top: 0; color: #c53030;">⚠️ Attention Required</h3>
        <p style="margin: 0;"><strong>${data.products.length}</strong> products are below minimum stock levels and need to be restocked.</p>
      </div>
      
      <h3>Products Requiring Attention:</h3>
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th style="text-align: center;">Current Stock</th>
            <th style="text-align: center;">Min Stock</th>
            <th>Warehouse</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>
      
      <p><strong>Action Required:</strong> Please review these items and place restock orders as needed.</p>
      
      <div style="text-align: center;">
        <a href="https://your-app-url.com/inventory?filter=low" class="button">View Low Stock Items</a>
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated alert from Smart Warehouse IoT Management System.</p>
      <p style="margin-top: 20px; font-size: 12px;">© 2024 Smart Warehouse. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
LOW STOCK ALERT - ${data.warehouseName}

${data.products.length} products are below minimum stock levels and need attention.

PRODUCTS REQUIRING ATTENTION:
${data.products.map(p => `
- ${p.name} (${p.sku})
  Current: ${p.currentStock} | Min: ${p.minStock} | Warehouse: ${p.warehouse}
`).join('\n')}

Action Required: Please review these items and place restock orders as needed.

View all low stock items: https://your-app-url.com/inventory?filter=low

---
This is an automated alert from Smart Warehouse IoT Management System.
    `,
  };
}

/**
 * Welcome Email for New Users
 */
export function welcomeEmail(data: {
  userName: string;
  email: string;
  role: string;
  warehouseName: string;
  tempPassword?: string;
}): EmailTemplate {
  const roleEmojis: Record<string, string> = {
    admin: '👑',
    manager: '🎯',
    staff: '👤',
    viewer: '👁️',
  };

  const roleDescriptions: Record<string, string> = {
    admin: 'You have full system access with all administrative privileges.',
    manager: 'You can manage warehouse operations and most operational controls.',
    staff: 'You have access to basic warehouse operations and inventory management.',
    viewer: 'You have read-only access to view warehouse data.',
  };

  return {
    subject: 'Welcome to Smart Warehouse - Your Account is Ready',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .credentials-box { background: #edf2f7; border: 1px solid #cbd5e0; padding: 20px; margin: 20px 0; border-radius: 8px; font-family: monospace; }
    .role-info { background: #f0fff4; border-left: 4px solid #48bb78; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 14px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #4299e1; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
    .warning { background: #fffaf0; border: 1px solid #f6ad55; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0 0 10px 0;">🏭 Welcome to Smart Warehouse!</h1>
      <p style="margin: 0; opacity: 0.9; font-size: 18px;">Your account has been created</p>
    </div>
    
    <div class="content">
      <h2>Hello ${data.userName},</h2>
      <p>Welcome to the Smart Warehouse IoT Management System! Your account has been created and is ready to use.</p>
      
      <div class="credentials-box">
        <h3 style="margin-top: 0;">Your Login Credentials</h3>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.tempPassword ? `<p><strong>Temporary Password:</strong> ${data.tempPassword}</p>` : ''}
        <p><strong>Warehouse:</strong> ${data.warehouseName}</p>
      </div>
      
      ${data.tempPassword ? `
      <div class="warning">
        <p style="margin: 0;"><strong>⚠️ Important:</strong> Please change your password after your first login for security reasons.</p>
      </div>
      ` : ''}
      
      <div class="role-info">
        <h3 style="margin-top: 0;">${roleEmojis[data.role]} Your Role: ${data.role.toUpperCase()}</h3>
        <p style="margin: 0;">${roleDescriptions[data.role]}</p>
      </div>
      
      <h3>Getting Started:</h3>
      <ol>
        <li>Click the button below to access the system</li>
        <li>Log in with your credentials</li>
        ${data.tempPassword ? '<li>Change your temporary password</li>' : ''}
        <li>Explore your dashboard and assigned tasks</li>
      </ol>
      
      <div style="text-align: center;">
        <a href="https://your-app-url.com/login" class="button">Access Smart Warehouse</a>
      </div>
      
      <p style="margin-top: 30px;">If you have any questions or need assistance, please contact your administrator.</p>
    </div>
    
    <div class="footer">
      <p>This email was sent from Smart Warehouse IoT Management System.</p>
      <p style="margin-top: 20px; font-size: 12px;">© 2024 Smart Warehouse. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
WELCOME TO SMART WAREHOUSE!

Hello ${data.userName},

Your account has been created and is ready to use.

YOUR LOGIN CREDENTIALS
-----------------------
Email: ${data.email}
${data.tempPassword ? `Temporary Password: ${data.tempPassword}` : ''}
Warehouse: ${data.warehouseName}

${data.tempPassword ? 'IMPORTANT: Please change your password after your first login for security reasons.\n' : ''}

YOUR ROLE: ${data.role.toUpperCase()}
${roleDescriptions[data.role]}

GETTING STARTED:
1. Go to https://your-app-url.com/login
2. Log in with your credentials
${data.tempPassword ? '3. Change your temporary password\n' : ''}
4. Explore your dashboard and assigned tasks

If you have any questions or need assistance, please contact your administrator.

---
This email was sent from Smart Warehouse IoT Management System.
© 2024 Smart Warehouse. All rights reserved.
    `,
  };
}

/**
 * Critical Alert Email
 */
export function criticalAlertEmail(data: {
  alertType: string;
  message: string;
  severity: string;
  warehouse: string;
  deviceId?: string;
  timestamp: string;
}): EmailTemplate {
  return {
    subject: `🚨 CRITICAL ALERT - ${data.alertType}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #fc8181 0%, #e53e3e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .critical-box { background: #fff5f5; border: 3px solid #e53e3e; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .footer { background: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 14px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
    .detail-row { margin: 12px 0; padding: 10px; background: #f7fafc; border-radius: 4px; }
    .label { font-weight: bold; color: #2d3748; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🚨 CRITICAL ALERT</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Immediate Attention Required</p>
    </div>
    
    <div class="content">
      <div class="critical-box">
        <h2 style="margin-top: 0; color: #c53030;">${data.alertType}</h2>
        <p style="font-size: 16px; margin: 0;">${data.message}</p>
      </div>
      
      <h3>Alert Details:</h3>
      
      <div class="detail-row">
        <span class="label">Severity:</span>
        <span style="color: #e53e3e; font-weight: bold; text-transform: uppercase;">${data.severity}</span>
      </div>
      
      <div class="detail-row">
        <span class="label">Warehouse:</span> ${data.warehouse}
      </div>
      
      ${data.deviceId ? `
      <div class="detail-row">
        <span class="label">Device ID:</span> <code>${data.deviceId}</code>
      </div>
      ` : ''}
      
      <div class="detail-row">
        <span class="label">Timestamp:</span> ${data.timestamp}
      </div>
      
      <p style="margin-top: 20px;"><strong>Action Required:</strong> Please investigate and resolve this alert immediately.</p>
      
      <div style="text-align: center;">
        <a href="https://your-app-url.com/alerts" class="button">View All Alerts</a>
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated critical alert from Smart Warehouse IoT Management System.</p>
      <p style="margin-top: 20px; font-size: 12px;">© 2024 Smart Warehouse. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
CRITICAL ALERT - ${data.alertType}

Immediate Attention Required

${data.message}

ALERT DETAILS
-------------
Severity: ${data.severity.toUpperCase()}
Warehouse: ${data.warehouse}
${data.deviceId ? `Device ID: ${data.deviceId}` : ''}
Timestamp: ${data.timestamp}

Action Required: Please investigate and resolve this alert immediately.

View all alerts: https://your-app-url.com/alerts

---
This is an automated critical alert from Smart Warehouse IoT Management System.
    `,
  };
}
