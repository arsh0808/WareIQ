# Firebase Setup Guide

This guide will help you set up Firebase for the Smart Warehouse System.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Google account

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `smart-warehouse-iot`
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Register Web App

1. In your Firebase project, click the **Web** icon (`</>`)
2. Register app name: `Smart Warehouse Web`
3. Check "Also set up Firebase Hosting" (optional for testing)
4. Click "Register app"
5. Copy the Firebase configuration object

## Step 3: Enable Firebase Services

### Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (we'll deploy security rules later)
4. Select your region
5. Click "Enable"

### Realtime Database

1. Go to **Realtime Database**
2. Click "Create database"
3. Choose "Start in test mode"
4. Select your region
5. Click "Enable"

### Authentication

1. Go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. Click "Save"

### Storage

1. Go to **Storage**
2. Click "Get started"
3. Start in test mode
4. Select your region
5. Click "Done"

## Step 4: Configure Environment Variables

1. Copy the Firebase config from Firebase Console
2. Create `.env.local` in `web-app` folder:

```bash
cd web-app
cp .env.example .env.local
```

3. Edit `.env.local` with your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

## Step 5: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 6: Login to Firebase

```bash
firebase login
```

## Step 7: Initialize Firebase in Project

```bash
cd firebase
firebase init
```

Select:
- ✅ Firestore
- ✅ Realtime Database
- ✅ Functions
- ✅ Storage
- ✅ Emulators

Follow the prompts:
- Use existing project: Select your project
- Firestore rules: `firestore.rules`
- Firestore indexes: `firestore.indexes.json`
- Database rules: `database.rules.json`
- Functions language: TypeScript
- Use ESLint: Yes
- Install dependencies: Yes
- Storage rules: `storage.rules`
- Emulators: Select all (Auth, Functions, Firestore, Database, Storage)

## Step 8: Update Firebase Project ID

Edit `firebase/.firebaserc`:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

## Step 9: Deploy Security Rules

```bash
cd firebase
firebase deploy --only firestore:rules
firebase deploy --only database:rules
firebase deploy --only storage:rules
```

## Step 10: Deploy Cloud Functions

```bash
cd firebase/functions
npm install
cd ..
firebase deploy --only functions
```

## Step 11: Create Test User

1. Go to Firebase Console > Authentication
2. Click "Add user"
3. Email: `admin@warehouse.com`
4. Password: `admin123`
5. Click "Add user"

6. Go to Firestore Database
7. Start collection: `users`
8. Document ID: Use the UID from Authentication
9. Add fields:
   - `email`: `admin@warehouse.com`
   - `name`: `Admin User`
   - `role`: `admin`
   - `warehouseId`: `warehouse-001`
   - `createdAt`: (timestamp) Now
   - `lastLogin`: (timestamp) Now

## Step 12: Seed Initial Data (Optional)

Create some test warehouses and products:

```bash
# In Firestore, create collections:

warehouses/warehouse-001:
{
  name: "Main Warehouse",
  location: {
    address: "123 Warehouse St",
    city: "San Francisco",
    country: "USA",
    coordinates: { lat: 37.7749, lng: -122.4194 }
  },
  managerId: "your-admin-uid",
  capacity: 10000,
  status: "active",
  createdAt: (timestamp),
  updatedAt: (timestamp)
}

products/product-001:
{
  sku: "WIDGET-001",
  name: "Widget A",
  description: "High quality widget",
  category: "Electronics",
  subcategory: "Components",
  unitPrice: 29.99,
  weight: 0.5,
  dimensions: { length: 10, width: 5, height: 3 },
  minStockLevel: 10,
  reorderPoint: 20,
  supplier: "WidgetCo",
  barcode: "123456789012",
  qrCode: "WDG-001",
  imageURL: "",
  createdAt: (timestamp),
  updatedAt: (timestamp)
}
```

## Step 13: Test Local Setup

```bash
# Terminal 1: Start Firebase Emulators
cd firebase
firebase emulators:start

# Terminal 2: Start Next.js Dev Server
cd web-app
npm install
npm run dev

# Terminal 3: Start IoT Simulator (Optional)
cd iot-simulator
cp .env.example .env
# Edit .env with your Firebase config
npm install
npm run simulate
```

Visit http://localhost:3000

## Troubleshooting

### Error: Missing Firebase Config

- Make sure `.env.local` exists in `web-app` folder
- Check that all environment variables are set correctly
- Restart the dev server after changing `.env.local`

### Error: Permission Denied

- Check Firestore security rules
- Make sure user is authenticated
- Verify user has correct role in Firestore

### Error: Functions not deploying

- Check Node.js version (must be 18)
- Run `npm install` in `firebase/functions`
- Check for TypeScript errors: `npm run build`

### Emulator Issues

- Make sure ports are not in use (4000, 5001, 8080, 9000, 9099, 9199)
- Clear emulator data: `firebase emulators:start --import=./emulator-data --export-on-exit`

## Next Steps

- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [IoT Integration Guide](./IOT_INTEGRATION.md)
