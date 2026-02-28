import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendEmail } from '../notifications/sendEmail';
import { roleChangeEmail } from '../notifications/emailTemplates';

/**
 * Trigger: Send email notification when user role changes
 */
export const onRoleChange = functions.firestore
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
      const emailData = roleChangeEmail({
        userName: userData?.name || 'User',
        oldRole: changeData.oldRole,
        newRole: changeData.newRole,
        changedBy: changedByName,
        reason: changeData.reason || 'No reason provided',
        timestamp: changeData.timestamp?.toDate?.()?.toLocaleString() || new Date().toLocaleString(),
      });

      // Send email to user
      if (userData?.email) {
        await sendEmail({
          to: userData.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
        });

        console.log('Role change notification sent to:', userData.email);
      }

      return null;
    } catch (error) {
      console.error('Error sending role change notification:', error);
      // Don't throw - we don't want to fail the role change if email fails
      return null;
    }
  });
