# 🏭 Smart Warehouse IoT System

An IoT-driven smart warehouse management system with real-time inventory tracking, smart shelves, and role-based access control.

## 🚀 Tech Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Database:** Firebase (Firestore + Realtime Database)
- **Authentication:** Firebase Auth
- **Cloud Functions:** Firebase Cloud Functions
- **Deployment:** Vercel (Frontend) + Firebase (Backend)
- **Mobile:** React Native + Expo (Coming soon)

## 📋 Features

- ✅ Real-time inventory tracking
- ✅ IoT sensor integration (weight, temperature, RFID)
- ✅ Role-based access control (Admin, Manager, Staff, Viewer)
- ✅ Smart shelves monitoring
- ✅ Automated alerts and notifications
- ✅ Analytics dashboard
- ✅ Mobile app support
- ✅ Barcode/QR code scanning

## 🏗️ Project Structure

```
smart-warehouse-iot/
├── web-app/              # Next.js web application
├── mobile-app/           # React Native mobile app
├── firebase/             # Firebase functions and config
├── iot-simulator/        # IoT device simulator for testing
└── docs/                 # Documentation
```

## 🛠️ Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd smart-warehouse-iot
   ```

2. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. **Set up Firebase project**
   ```bash
   firebase init
   # Select: Firestore, Realtime Database, Functions, Storage
   ```

4. **Install dependencies**
   ```bash
   # Web app
   cd web-app
   npm install
   
   # Firebase functions
   cd ../firebase/functions
   npm install
   
   # IoT simulator
   cd ../../iot-simulator
   npm install
   ```

5. **Configure environment variables**
   ```bash
   cd web-app
   cp .env.example .env.local
   # Edit .env.local with your Firebase config
   ```

6. **Run locally**
   ```bash
   # Terminal 1: Firebase emulators
   firebase emulators:start
   
   # Terminal 2: Next.js dev server
   cd web-app
   npm run dev
   
   # Terminal 3: IoT simulator (optional)
   cd iot-simulator
   npm run simulate
   ```

7. **Open browser**
   - Web App: http://localhost:3000
   - Firebase Emulator UI: http://localhost:4000

## 🌐 Deployment

### Vercel (Frontend)
```bash
cd web-app
vercel --prod
```

### Firebase (Cloud Functions)
```bash
firebase deploy --only functions
firebase deploy --only firestore:rules
```

## 📚 Documentation

- [Firebase Setup Guide](docs/FIREBASE_SETUP.md)
- [API Documentation](docs/API.md)
- [IoT Integration Guide](docs/IOT_INTEGRATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 👥 Team

- Backend Development
- Frontend Development
- IoT Engineering
- Mobile Development

## 📄 License

MIT License

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.
