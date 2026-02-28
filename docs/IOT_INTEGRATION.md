# IoT Integration Guide

Guide for integrating IoT devices with the Smart Warehouse System.

## Overview

The system supports various IoT sensors:
- Weight sensors (load cells)
- Temperature & humidity sensors
- RFID readers
- Barcode/QR scanners
- Camera systems

## Architecture

```
IoT Device → MQTT/HTTP → Firebase Realtime DB → Cloud Function → Firestore
                                                                    ↓
                                                              Web/Mobile App
```

## Device Registration

### 1. Add Device to Firestore

```javascript
// In Firestore Console or via app
const device = {
  deviceId: "DEVICE-001",
  deviceType: "weight_sensor",
  shelfId: "shelf-A-01",
  warehouseId: "warehouse-001",
  status: "offline",
  batteryLevel: 100,
  firmwareVersion: "1.0.0",
  configuration: {
    sampleRate: 5000, // milliseconds
    threshold: 100, // kg
  },
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### 2. Generate Device Credentials

Each device needs authentication to write to Firebase.

**Option A: Service Account (Recommended)**
```bash
# Generate service account key
firebase functions:config:set service.key="$(cat service-account.json)"
```

**Option B: Anonymous Auth**
```javascript
// Enable Anonymous Auth in Firebase Console
// Device uses anonymous sign-in
```

## Data Transmission Methods

### Method 1: HTTP Webhook (Recommended for Testing)

Device sends POST request to Cloud Function:

```javascript
// Device code (Arduino/ESP32)
const deviceData = {
  deviceId: "DEVICE-001",
  data: {
    weight: 75.5,
    temperature: 22.3,
    humidity: 45
  },
  timestamp: Date.now()
};

fetch('https://region-project.cloudfunctions.net/iotWebhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(deviceData)
});
```

### Method 2: Direct to Realtime Database

```javascript
// Device code with Firebase SDK
import { getDatabase, ref, set } from 'firebase/database';

const db = getDatabase();
set(ref(db, `sensor-data/${deviceId}/latest`), {
  weight: 75.5,
  temperature: 22.3,
  timestamp: Date.now()
});
```

### Method 3: MQTT (Advanced)

Use MQTT broker with Firebase bridge:

```javascript
// MQTT client on device
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.example.com');

client.publish('warehouse/sensor/DEVICE-001', JSON.stringify({
  weight: 75.5,
  timestamp: Date.now()
}));
```

## Hardware Examples

### Example 1: ESP32 Weight Sensor

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include "HX711.h"

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* webhookUrl = "https://region-project.cloudfunctions.net/iotWebhook";

HX711 scale;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  scale.begin(DOUT_PIN, SCK_PIN);
  scale.set_scale(calibration_factor);
  scale.tare();
}

void loop() {
  float weight = scale.get_units();
  
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(webhookUrl);
    http.addHeader("Content-Type", "application/json");
    
    String payload = "{\"deviceId\":\"DEVICE-001\",\"data\":{\"weight\":" + 
                     String(weight) + ",\"timestamp\":" + 
                     String(millis()) + "}}";
    
    int httpCode = http.POST(payload);
    Serial.println("Response: " + String(httpCode));
    
    http.end();
  }
  
  delay(5000); // Send every 5 seconds
}
```

### Example 2: Raspberry Pi Temperature Sensor

```python
import firebase_admin
from firebase_admin import credentials, db
import Adafruit_DHT
import time

# Initialize Firebase
cred = credentials.Certificate('service-account.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://your-project.firebaseio.com'
})

# DHT22 sensor on GPIO 4
sensor = Adafruit_DHT.DHT22
pin = 4
device_id = 'DEVICE-002'

while True:
    humidity, temperature = Adafruit_DHT.read_retry(sensor, pin)
    
    if humidity and temperature:
        data = {
            'temperature': round(temperature, 2),
            'humidity': round(humidity, 2),
            'timestamp': int(time.time() * 1000)
        }
        
        ref = db.reference(f'/sensor-data/{device_id}/latest')
        ref.set(data)
        
        print(f'Sent: {data}')
    
    time.sleep(5)
```

### Example 3: Node.js RFID Reader

```javascript
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
const { SerialPort } = require('serialport');

// Initialize Firebase
const app = initializeApp({
  apiKey: "YOUR_API_KEY",
  databaseURL: "https://your-project.firebaseio.com"
});

const rtdb = getDatabase(app);
const port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 9600 });

port.on('data', async (data) => {
  const rfidTag = data.toString().trim();
  
  await set(ref(rtdb, `/sensor-data/DEVICE-003/latest`), {
    rfidTag: rfidTag,
    timestamp: Date.now()
  });
  
  console.log(`RFID Tag scanned: ${rfidTag}`);
});
```

## Testing with Simulator

Use the included IoT simulator for testing:

```bash
cd iot-simulator
cp .env.example .env
# Edit .env with Firebase config
npm install
npm run simulate
```

The simulator will generate random sensor data every 5 seconds.

## Device Management

### Monitor Device Status

```javascript
// In web app
import { ref, onValue } from 'firebase/database';

const deviceRef = ref(rtdb, `/device-status/${deviceId}`);
onValue(deviceRef, (snapshot) => {
  const status = snapshot.val();
  console.log('Device online:', status.online);
  console.log('Last seen:', new Date(status.lastSeen));
});
```

### Update Device Configuration

```javascript
// In Firestore
await updateDoc(doc(db, 'iot-devices', deviceId), {
  configuration: {
    sampleRate: 10000, // Change to 10 seconds
    threshold: 150
  }
});
```

### Firmware Updates (OTA)

```javascript
// Cloud Function to push firmware updates
export const pushFirmwareUpdate = functions.https.onCall(async (data, context) => {
  const { deviceId, firmwareUrl, version } = data;
  
  // Notify device via Realtime Database
  await set(ref(rtdb, `/firmware-updates/${deviceId}`), {
    url: firmwareUrl,
    version: version,
    timestamp: Date.now()
  });
});
```

## Security Best Practices

1. **Use Device Authentication**
   - Generate unique credentials per device
   - Rotate credentials regularly

2. **Encrypt Data in Transit**
   - Use HTTPS/WSS for communication
   - Enable TLS on MQTT broker

3. **Validate Device Data**
   - Check data ranges
   - Implement rate limiting
   - Detect anomalies

4. **Secure Device Storage**
   - Store credentials securely on device
   - Use hardware security modules if available

## Troubleshooting

### Device Not Sending Data

1. Check WiFi/network connection
2. Verify Firebase credentials
3. Check webhook URL
4. Review device logs

### Data Not Appearing in App

1. Check Realtime Database rules
2. Verify Cloud Function is triggered
3. Check function logs: `firebase functions:log`
4. Ensure deviceId matches in Firestore

### High Latency

1. Reduce polling frequency
2. Use edge computing for preprocessing
3. Batch multiple readings
4. Optimize Firebase indexes

## Next Steps

- [Firebase Setup](./FIREBASE_SETUP.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
