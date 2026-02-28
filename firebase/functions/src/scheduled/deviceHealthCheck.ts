import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const deviceHealthCheck = functions.pubsub
  .schedule("*/15 * * * *")
  .onRun(async (context) => {
    try {
      console.log("Running device health check...");

      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      const devicesSnapshot = await db.collection("iot-devices").get();

      const batch = db.batch();
      const offlineDevices = [];

      for (const deviceDoc of devicesSnapshot.docs) {
        const deviceData = deviceDoc.data();
        const lastHeartbeat = deviceData.lastHeartbeat?.toDate();

        if (!lastHeartbeat || lastHeartbeat < fifteenMinutesAgo) {
          if (deviceData.status !== "offline") {
            
            batch.update(deviceDoc.ref, {
              status: "offline",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            offlineDevices.push({
              deviceId: deviceDoc.id,
              deviceType: deviceData.deviceType,
              shelfId: deviceData.shelfId,
              warehouseId: deviceData.warehouseId,
              lastHeartbeat: lastHeartbeat,
            });
          }
        }

        if (deviceData.batteryLevel && deviceData.batteryLevel < 20) {
          
          const existingAlert = await db.collection("alerts")
            .where("deviceId", "==", deviceDoc.id)
            .where("type", "==", "low_battery")
            .where("resolved", "==", false)
            .limit(1)
            .get();

          if (existingAlert.empty) {
            await db.collection("alerts").add({
              type: "low_battery",
              severity: deviceData.batteryLevel < 10 ? "critical" : "warning",
              warehouseId: deviceData.warehouseId,
              shelfId: deviceData.shelfId,
              deviceId: deviceDoc.id,
              message: `Device battery low: ${deviceData.batteryLevel}%`,
              details: {
                batteryLevel: deviceData.batteryLevel,
                deviceType: deviceData.deviceType,
              },
              resolved: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      }

      await batch.commit();

      for (const device of offlineDevices) {
        await db.collection("alerts").add({
          type: "sensor_failure",
          severity: "warning",
          warehouseId: device.warehouseId,
          shelfId: device.shelfId,
          deviceId: device.deviceId,
          message: `Device ${device.deviceId} is offline`,
          details: {
            deviceType: device.deviceType,
            lastHeartbeat: device.lastHeartbeat?.toISOString(),
          },
          resolved: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      console.log(`Health check complete. ${offlineDevices.length} devices marked as offline.`);
      return null;
    } catch (error) {
      console.error("Error during device health check:", error);
      return null;
    }
  });
