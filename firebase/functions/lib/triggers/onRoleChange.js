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
exports.onRoleChange = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sendEmail_1 = require("../notifications/sendEmail");
const emailTemplates_1 = require("../notifications/emailTemplates");
/**
 * Trigger: Send email notification when user role changes
 */
exports.onRoleChange = functions.firestore
    .document('role-changes/{changeId}')
    .onCreate(async (snap, context) => {
    try {
        const changeData = snap.data();
        // Get user details
        const userDoc = await admin.firestore().collection('users').doc(changeData.userId).get();
        if (!userDoc.exists) {
            console.log('User not found:', changeData.userId);
            return;
        }
        const userData = userDoc.data();
        // Get the person who made the change
        let changedByName = 'System Administrator';
        if (changeData.changedBy) {
            const changedByDoc = await admin.firestore().collection('users').doc(changeData.changedBy).get();
            if (changedByDoc.exists) {
                changedByName = changedByDoc.data()?.name || changedByDoc.data()?.email || 'Administrator';
            }
        }
        // Prepare email data
        const emailData = (0, emailTemplates_1.roleChangeEmail)({
            userName: userData?.name || 'User',
            oldRole: changeData.oldRole,
            newRole: changeData.newRole,
            changedBy: changedByName,
            reason: changeData.reason || 'No reason provided',
            timestamp: changeData.timestamp?.toDate?.()?.toLocaleString() || new Date().toLocaleString(),
        });
        // Send email to user
        if (userData?.email) {
            await (0, sendEmail_1.sendEmail)({
                to: userData.email,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text,
            });
            console.log('Role change notification sent to:', userData.email);
        }
        return null;
    }
    catch (error) {
        console.error('Error sending role change notification:', error);
        // Don't throw - we don't want to fail the role change if email fails
        return null;
    }
});
//# sourceMappingURL=onRoleChange.js.map