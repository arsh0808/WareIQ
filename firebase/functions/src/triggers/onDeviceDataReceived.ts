import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();
const rtdb = admin.database();

export const onDeviceDataReceived = functions.database
  .ref("/sensor-data/{deviceId}/latest")
  .onWrite(async (change, context) => {
    const deviceId = context.params.deviceId;
    const newData = change.after.val();

    if (!newData) {
      return null;
    }

    try {
      
      const deviceDoc = await db.collection("iot-devices").doc(deviceId).get();
      
      if (!deviceDoc.exists) {
        console.error(`Device ${deviceId} not found in Firestore`);
        return null;
      }

      const deviceData = deviceDoc.data();
      const shelfId = deviceData?.shelfId;
      const warehouseId = deviceData?.warehouseId;

      await db.collection("iot-devices").doc(deviceId).update({
        lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
        status: "online",
      });

      if (deviceData?.deviceType === "weight_sensor" && newData.weight !== undefined) {
        
        await db.collection("shelves").doc(shelfId).update({
          currentWeight: newData.weight,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await rtdb.ref(`/real-time-inventory/${shelfId}`).set({
          currentWeight: newData.weight,
          lastUpdate: admin.database.ServerValue.TIMESTAMP,
        });

        const shelfDoc = await db.collection("shelves").doc(shelfId).get();
        const maxWeight = shelfDoc.data()?.maxWeight;

        if (maxWeight && newData.weight > maxWeight) {
          
          await db.collection("alerts").add({
            type: "weight_mismatch",
            severity: "warning",
            warehouseId: warehouseId,
            shelfId: shelfId,
            deviceId: deviceId,
            message: `Shelf weight exceeded maximum capacity (${newData.weight}kg > ${maxWeight}kg)`,
            details: {
              currentWeight: newData.weight,
              maxWeight: maxWeight,
            },
            resolved: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      if (deviceData?.deviceType === "temperature_sensor" && newData.temperature !== undefined) {
        const minTemp = 0;  
        const maxTemp = 30; 

        if (newData.temperature < minTemp || newData.temperature > maxTemp) {
          await db.collection("alerts").add({
            type: "temperature_alert",
            severity: "critical",
            warehouseId: warehouseId,
            shelfId: shelfId,
            deviceId: deviceId,
            message: `Temperature out of range: ${newData.temperature}°C`,
            details: {
              currentTemperature: newData.temperature,
              minTemperature: minTemp,
              maxTemperature: maxTemp,
              humidity: newData.humidity,
            },
            resolved: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      await rtdb.ref(`/sensor-data/${deviceId}/history/${Date.now()}`).set(newData);

      return null;
    } catch (error) {
      console.error("Error processing device data:", error);
      return null;
    }
  });
