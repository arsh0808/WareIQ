import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendEmail } from '../notifications/sendEmail';
import { lowStockAlertEmail } from '../notifications/emailTemplates';

/**
 * Scheduled function: Check for low stock and send alerts
 * Runs daily at 8:00 AM
 */
export const checkLowStock = functions.pubsub
  .schedule('0 8 * * *') // Every day at 8 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      console.log('Running low stock check...');

      // Get all warehouses
      const warehousesSnapshot = await admin.firestore().collection('warehouses').get();

      for (const warehouseDoc of warehousesSnapshot.docs) {
        const warehouse = warehouseDoc.data();
        const warehouseId = warehouseDoc.id;

        // Get low stock items for this warehouse
        const inventorySnapshot = await admin
          .firestore()
          .collection('inventory')
          .where('warehouseId', '==', warehouseId)
          .get();

        const lowStockProducts: Array<{
          name: string;
          sku: string;
          currentStock: number;
          minStock: number;
          warehouse: string;
        }> = [];

        for (const invDoc of inventorySnapshot.docs) {
          const invData = invDoc.data();
          
          // Check if stock is low
          if (invData.quantity <= invData.minStockLevel) {
            // Get product details
            const productDoc = await admin.firestore().collection('products').doc(invData.productId).get();
            const productData = productDoc.data();

            if (productData) {
              lowStockProducts.push({
                name: productData.name,
                sku: productData.sku,
                currentStock: invData.quantity,
                minStock: invData.minStockLevel,
                warehouse: warehouse.name || warehouseId,
              });
            }
          }
        }

        // If there are low stock items, send alerts
        if (lowStockProducts.length > 0) {
          console.log(`Found ${lowStockProducts.length} low stock items in ${warehouse.name}`);

          // Get managers and admins for this warehouse
          const usersSnapshot = await admin
            .firestore()
            .collection('users')
            .where('warehouseId', '==', warehouseId)
            .where('role', 'in', ['admin', 'manager'])
            .get();

          const recipients = usersSnapshot.docs
            .map(doc => doc.data().email)
            .filter(email => email);

          if (recipients.length > 0) {
            const emailData = lowStockAlertEmail({
              products: lowStockProducts,
              warehouseName: warehouse.name || warehouseId,
            });

            // Send to all recipients
            for (const email of recipients) {
              await sendEmail({
                to: email,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text,
              });
            }

            console.log(`Low stock alerts sent to ${recipients.length} recipients`);
          }

          // Create alert in database
          await admin.firestore().collection('alerts').add({
            type: 'low_stock',
            severity: 'warning',
            warehouseId,
            message: `${lowStockProducts.length} products are below minimum stock levels`,
            productCount: lowStockProducts.length,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            resolved: false,
          });
        }
      }

      console.log('Low stock check completed');
      return null;
    } catch (error) {
      console.error('Error in low stock check:', error);
      return null;
    }
  });

/**
 * Trigger: Send immediate alert when inventory goes critical (0 stock)
 */
export const onCriticalStock = functions.firestore
  .document('inventory/{inventoryId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();

      // Check if stock just went to zero
      if (before.quantity > 0 && after.quantity === 0) {
        // Get product details
        const productDoc = await admin.firestore().collection('products').doc(after.productId).get();
        const productData = productDoc.data();

        if (!productData) return null;

        // Get warehouse details
        const warehouseDoc = await admin.firestore().collection('warehouses').doc(after.warehouseId).get();
        const warehouseData = warehouseDoc.data();

        // Get managers and admins
        const usersSnapshot = await admin
          .firestore()
          .collection('users')
          .where('warehouseId', '==', after.warehouseId)
          .where('role', 'in', ['admin', 'manager'])
          .get();

        const recipients = usersSnapshot.docs
          .map(doc => doc.data().email)
          .filter(email => email);

        if (recipients.length > 0) {
          const { criticalAlertEmail } = require('../notifications/emailTemplates');
          
          const emailData = criticalAlertEmail({
            alertType: 'CRITICAL: Product Out of Stock',
            message: `${productData.name} (${productData.sku}) is now completely out of stock!`,
            severity: 'critical',
            warehouse: warehouseData?.name || after.warehouseId,
            timestamp: new Date().toLocaleString(),
          });

          for (const email of recipients) {
            await sendEmail({
              to: email,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text,
            });
          }

          console.log(`Critical stock alert sent for product: ${productData.name}`);
        }

        // Create critical alert
        await admin.firestore().collection('alerts').add({
          type: 'out_of_stock',
          severity: 'critical',
          warehouseId: after.warehouseId,
          productId: after.productId,
          message: `${productData.name} is out of stock`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          resolved: false,
        });
      }

      return null;
    } catch (error) {
      console.error('Error in critical stock check:', error);
      return null;
    }
  });
