import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const onInventoryUpdate = functions.firestore
  .document("inventory/{inventoryId}")
  .onWrite(async (change, context) => {
    const newData = change.after.exists ? change.after.data() : null;
    const previousData = change.before.exists ? change.before.data() : null;

    if (!newData) {
      
      return null;
    }

    try {
      
      const productDoc = await db.collection("products").doc(newData.productId).get();
      
      if (!productDoc.exists) {
        console.error(`Product ${newData.productId} not found`);
        return null;
      }

      const productData = productDoc.data();
      const minStockLevel = productData?.minStockLevel || 0;
      const reorderPoint = productData?.reorderPoint || 0;

      if (newData.quantity <= minStockLevel && (!previousData || previousData.quantity > minStockLevel)) {
        
        await db.collection("alerts").add({
          type: "low_stock",
          severity: newData.quantity === 0 ? "critical" : "warning",
          warehouseId: newData.warehouseId,
          shelfId: newData.shelfId,
          productId: newData.productId,
          message: `Low stock alert: ${productData?.name} is at ${newData.quantity} units`,
          details: {
            currentQuantity: newData.quantity,
            minStockLevel: minStockLevel,
            reorderPoint: reorderPoint,
          },
          resolved: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await sendLowStockNotification(newData, productData);
      }

      await db.collection("audit-logs").add({
        userId: newData.updatedBy || "system",
        action: change.before.exists ? "update_inventory" : "create_inventory",
        resource: "inventory",
        resourceId: context.params.inventoryId,
        details: {
          productId: newData.productId,
          shelfId: newData.shelfId,
          previousQuantity: previousData?.quantity || 0,
          newQuantity: newData.quantity,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    } catch (error) {
      console.error("Error processing inventory update:", error);
      return null;
    }
  });

async function sendLowStockNotification(inventoryData: any, productData: any) {
  
  const managersSnapshot = await db.collection("users")
    .where("warehouseId", "==", inventoryData.warehouseId)
    .where("role", "in", ["admin", "manager"])
    .get();

  const batch = db.batch();

  managersSnapshot.forEach((doc) => {
    const notificationRef = db.collection("notifications").doc();
    batch.set(notificationRef, {
      userId: doc.id,
      type: "low_stock",
      title: "Low Stock Alert",
      message: `${productData.name} is running low (${inventoryData.quantity} units remaining)`,
      read: false,
      actionUrl: `/inventory?productId=${inventoryData.productId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}
