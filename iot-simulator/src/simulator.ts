import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import * as dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);

const devices = [
  { id: 'device-001', type: 'weight_sensor', shelfId: 'shelf-A-01' },
  { id: 'device-002', type: 'temperature_sensor', shelfId: 'shelf-A-02' },
  { id: 'device-003', type: 'weight_sensor', shelfId: 'shelf-B-01' },
];

function generateSensorData(deviceType: string) {
  const data: any = {
    timestamp: Date.now(),
  };

  if (deviceType === 'weight_sensor') {
    data.weight = Math.random() * 100 + 50; 
  } else if (deviceType === 'temperature_sensor') {
    data.temperature = Math.random() * 10 + 15; 
    data.humidity = Math.random() * 30 + 40; 
  }

  return data;
}

async function simulateDevice(device: any) {
  try {
    const data = generateSensorData(device.type);

    await set(ref(rtdb, `/sensor-data/${device.id}/latest`), data);

    await set(ref(rtdb, `/device-status/${device.id}`), {
      online: true,
      lastSeen: Date.now(),
    });

    console.log(`[${device.id}] Sent data:`, data);
  } catch (error) {
    console.error(`[${device.id}] Error:`, error);
  }
}

async function startSimulation() {
  console.log('🚀 Starting IoT Device Simulator...');
  console.log(`📡 Simulating ${devices.length} devices\n`);

  devices.forEach((device) => {
    setInterval(() => {
      simulateDevice(device);
    }, 5000);

    simulateDevice(device);
  });

  console.log('✅ Simulation running. Press Ctrl+C to stop.\n');
}

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping simulator...');
  process.exit(0);
});

startSimulation();
