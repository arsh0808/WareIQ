"use strict";
/**
 * Email configuration
 * In production, use environment variables for sensitive data:
 * firebase functions:config:set gmail.email="your-email@gmail.com" gmail.password="your-app-password"
 *
 * NOTE: This file requires nodemailer to be installed.
 * Run: npm install nodemailer @types/nodemailer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.sendBulkEmail = sendBulkEmail;
exports.isValidEmail = isValidEmail;
/**
 * Send email function
 * NOTE: Email sending is disabled until nodemailer is installed
 */
async function sendEmail(options) {
    console.log('Email sending disabled. Would send email to:', options.to, 'Subject:', options.subject);
    console.warn('To enable email, install nodemailer: npm install nodemailer @types/nodemailer');
    return Promise.resolve();
}
/**
 * Send email to multiple recipients
 */
async function sendBulkEmail(recipients, subject, html, text) {
    const batchSize = 50; // Send in batches to avoid rate limits
    for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        await sendEmail({
            to: batch,
            subject,
            html,
            text,
        });
        // Small delay between batches
        if (i + batchSize < recipients.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    console.log(`Sent bulk email to ${recipients.length} recipients`);
}
/**
 * Validate email address
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
//# sourceMappingURL=sendEmail.js.map