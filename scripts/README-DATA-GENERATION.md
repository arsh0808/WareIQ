# 🎭 Demo Data Generation Guide

## Quick Start - Populate Your Warehouse

This will generate realistic sample data to make your warehouse system look fully functional!

### 🚀 Run the Complete Data Generator

```bash
cd scripts
npm run generate-demo-data
```

### ✨ What Gets Created

The script generates **realistic sample data** for your entire warehouse system:

#### 📦 **Warehouses** (3)
- Main Warehouse (Mumbai Central) - 10,000 capacity
- North Warehouse (Delhi NCR) - 8,000 capacity
- South Warehouse (Bangalore) - 6,000 capacity

#### 🗄️ **Shelves** (~1,200)
- 5 zones (A, B, C, D, E) per warehouse
- 10 rows × 8 columns per zone
- Realistic shelf codes (A1-01, B3-05, etc.)

#### 📱 **Products** (50-80)
- 10 categories (Electronics, Furniture, Clothing, etc.)
- Each with subcategories and variations
- Prices in Rupees (₹)
- SKUs, barcodes, QR codes
- Product images from Picsum
- Realistic descriptions

**Sample Products:**
- Smartphone XR Pro - ₹15,499
- Ergonomic Chair Plus - ₹8,999
- Laptop Pro 15 - ₹45,999
- Cotton T-Shirt Standard - ₹499
- Instant Noodles Pack - ₹120

#### 📊 **Inventory Items** (~40-65)
- 80% of products stocked
- Various quantity levels
- Some items at zero stock (for alerts)
- Some items below minimum (for alerts)
- Realistic min/max stock levels

#### 💸 **Transactions** (200)
- Stock IN movements
- Stock OUT movements
- Warehouse TRANSFERS
- Inventory ADJUSTMENTS
- Spread across last 90 days
- Reference numbers (TXN-12345678)

#### 🚨 **Alerts** (30-40)
- **Low Stock Alerts** (15) - Warning severity
- **Out of Stock Alerts** (10) - Critical severity
- **Device Alerts** (5-10):
  - Low battery warnings
  - Sensor failures
  - Temperature alerts
- Some resolved, some active

#### 📡 **IoT Devices** (25-30)
- Weight sensors
- RFID readers
- Temperature sensors
- Cameras
- 75% online, 25% offline
- Battery levels (20-100%)
- Firmware versions

#### 📝 **Audit Logs** (100)
- User actions over last 60 days
- Create, update, delete operations
- IP addresses
- Detailed change tracking

---

## 🎯 Before Running

### Prerequisites

1. **Firebase Setup**: Make sure your `firebase/service-account.json` exists
2. **Dependencies**: Run `npm install` in the scripts folder

```bash
cd scripts
npm install
```

---

## 📋 Step-by-Step Instructions

### 1. Navigate to Scripts Folder
```bash
cd scripts
```

### 2. Install Dependencies (if not done)
```bash
npm install
```

### 3. Run the Generator
```bash
node generate-complete-demo-data.js
```

**OR using npm script:**
```bash
npm run generate-demo-data
```

### 4. Watch the Magic!
```
🚀 Starting complete data generation...

📦 Generating warehouses...
✅ Created 3 warehouses

🗄️ Generating shelves...
✅ Created 1200 shelves

📱 Generating products...
✅ Created 67 products

📊 Generating inventory...
✅ Created 54 inventory items

💸 Generating transactions...
✅ Created 200 transactions

🚨 Generating alerts...
✅ Created 35 alerts

📡 Generating IoT devices...
✅ Created 28 IoT devices

📝 Generating audit logs...
✅ Created 100 audit logs

✅ ========================================
✅ DATA GENERATION COMPLETE!
✅ ========================================

🎉 Your warehouse is now fully populated!
```

---

## 🔍 Verify Data Was Created

### Check in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. You should see collections:
   - `warehouses` (3 documents)
   - `shelves` (~1200 documents)
   - `products` (50-80 documents)
   - `inventory` (40-65 documents)
   - `transactions` (200 documents)
   - `alerts` (30-40 documents)
   - `iotDevices` (25-30 documents)
   - `auditLogs` (100 documents)

### Check in Your Web App

1. **Start the web app**:
   ```bash
   cd ../web-app
   npm run dev
   ```

2. **Visit pages**:
   - **Dashboard** - See overview stats
   - **Inventory** - See all products with stock levels
   - **Alerts** - See low stock & out of stock alerts
   - **Transactions** - See 200 transactions
   - **Analytics** - See charts and trends
   - **Products** - See 50+ products
   - **Devices** - See IoT devices

---

## 🎨 What You'll See

### Dashboard
- Total inventory value in ₹
- Active alerts count
- Stock movement trends
- Recent transactions

### Inventory Page
- Products with varying stock levels
- 🔴 Out of stock items (quantity = 0)
- 🟡 Low stock items (below minimum)
- 🟢 Well-stocked items

### Alerts Page
- ⚠️ 15 low stock warnings
- 🚨 10 critical out-of-stock alerts
- 📱 Device alerts (battery, sensors)
- Some resolved, some active

### Transactions Page
- 200 transactions across 90 days
- IN, OUT, TRANSFER, ADJUSTMENT types
- All with prices in Rupees (₹)
- Reference numbers

### Analytics Page
- Real data-driven charts
- Category distribution
- Stock movement trends
- Revenue projections

### Products Page
- 50-80 products across 10 categories
- Prices from ₹10 to ₹5,000
- Average price: ~₹2,500
- Total value in lakhs

---

## 🔄 Re-run or Reset Data

### To Generate Fresh Data

⚠️ **Warning**: This will ADD more data. If you want to reset:

1. **Delete existing data** in Firebase Console first
2. Then run the script again

### To Clear All Data

```bash
# In Firebase Console:
# 1. Go to Firestore Database
# 2. Delete each collection manually
# OR use Firebase CLI:
# firebase firestore:delete --all-collections --project YOUR_PROJECT_ID
```

---

## 🎭 Sample Data Details

### Categories Generated
1. **Electronics** - Smartphones, Laptops, Accessories
2. **Furniture** - Chairs, Desks, Tables
3. **Clothing** - Shirts, Pants, Shoes
4. **Food & Beverages** - Snacks, Drinks
5. **Hardware** - Tools, Equipment
6. **Stationery** - Pens, Paper, Files
7. **Sports** - Fitness, Outdoor gear
8. **Toys** - Games, Educational toys
9. **Automotive** - Parts, Accessories
10. **Books** - Fiction, Educational

### Price Ranges (₹)
- **Low**: ₹10 - ₹500 (Stationery, Food)
- **Medium**: ₹500 - ₹2,000 (Clothing, Hardware)
- **High**: ₹2,000 - ₹50,000 (Electronics, Furniture)

### Stock Levels
- **Out of Stock**: ~10 items (0 quantity)
- **Low Stock**: ~15 items (below minimum)
- **Normal Stock**: ~25-40 items (healthy levels)

---

## 🛠️ Troubleshooting

### Error: Firebase Admin Not Initialized
```
❌ Solution: Make sure firebase/service-account.json exists
```

### Error: Permission Denied
```
❌ Solution: Check your Firebase service account has write permissions
```

### Script Runs but No Data Visible
```
✅ Check:
1. Correct Firebase project in service-account.json
2. Firestore Database is created in Firebase Console
3. Web app is pointing to same Firebase project
```

### Too Much Data / Too Little Data
Edit the script constants:
- Line 10-20: Modify product counts
- Line 200: Change transaction count
- Line 250: Adjust alert limits

---

## 💡 Tips

1. **Run Once**: This creates enough data to demo the system
2. **Realistic**: Data spans 1-365 days for authentic timelines
3. **Variety**: Mix of active/resolved alerts, online/offline devices
4. **Indian Context**: All prices in Rupees (₹), Indian locations

---

## 📊 Expected Results

After running, your system will have:

✅ **Full Product Catalog** - Ready to demonstrate  
✅ **Active Inventory** - With realistic stock levels  
✅ **Transaction History** - 90 days of movements  
✅ **Live Alerts** - Some critical, some warnings  
✅ **IoT Integration** - Devices with real statuses  
✅ **Audit Trail** - Complete activity logs  

**Total Time**: ~2-3 minutes to generate all data

---

## 🎉 Success!

Your Smart Warehouse Management System is now **fully populated** and ready to demonstrate!

**Next Steps**:
1. Start the web app: `cd ../web-app && npm run dev`
2. Login with your test user
3. Explore all the pages
4. Show off your fully functional warehouse system! 🚀

---

**Need Help?**  
Check the console output for any errors or warnings during generation.
