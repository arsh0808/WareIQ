# API Documentation

Complete API reference for the Smart Warehouse System.

## Base URLs

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.vercel.app/api`
- **Cloud Functions**: `https://region-project.cloudfunctions.net`

## Authentication

All API requests require Firebase Authentication token in header:

```
Authorization: Bearer <firebase-id-token>
```

## Firestore Collections

### Users Collection

**Path**: `/users/{userId}`

**Fields**:
```typescript
{
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  warehouseId: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
}
```

**Permissions**:
- Read: All authenticated users
- Create: Admin only
- Update: Admin or self
- Delete: Admin only

### Warehouses Collection

**Path**: `/warehouses/{warehouseId}`

**Fields**:
```typescript
{
  name: string;
  location: {
    address: string;
    city: string;
    country: string;
    coordinates: { lat: number; lng: number; }
  };
  managerId: string;
  capacity: number;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Products Collection

**Path**: `/products/{productId}`

**Fields**:
```typescript
{
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  unitPrice: number;
  weight: number;
  dimensions: { length: number; width: number; height: number; };
  minStockLevel: number;
  reorderPoint: number;
  supplier: string;
  barcode: string;
  qrCode: string;
  imageURL: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Inventory Collection

**Path**: `/inventory/{inventoryId}`

**Fields**:
```typescript
{
  productId: string;
  shelfId: string;
  warehouseId: string;
  quantity: number;
  lastCounted: Timestamp;
  lastUpdated: Timestamp;
  updatedBy: string;
  status: 'available' | 'reserved' | 'damaged';
}
```

### Alerts Collection

**Path**: `/alerts/{alertId}`

**Fields**:
```typescript
{
  type: 'low_stock' | 'sensor_failure' | 'unauthorized_access' | 'temperature_alert' | 'weight_mismatch';
  severity: 'critical' | 'warning' | 'info';
  warehouseId: string;
  shelfId?: string;
  productId?: string;
  deviceId?: string;
  message: string;
  details: object;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Timestamp;
  createdAt: Timestamp;
}
```

## Cloud Functions

### IoT Webhook

**Endpoint**: `POST /iotWebhook`

**Description**: Receive data from IoT devices

**Request**:
```json
{
  "deviceId": "DEVICE-001",
  "deviceType": "weight_sensor",
  "data": {
    "weight": 75.5,
    "temperature": 22.3,
    "humidity": 45
  },
  "timestamp": 1234567890
}
```

**Response**:
```json
{
  "success": true,
  "message": "Data received successfully",
  "deviceId": "DEVICE-001",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Get Analytics

**Endpoint**: `GET /analytics?warehouseId={id}&period={period}`

**Description**: Get analytics data for a warehouse

**Parameters**:
- `warehouseId` (required): Warehouse ID
- `period` (optional): "24h", "7d", "30d" (default: "7d")

**Response**:
```json
{
  "period": {
    "start": "2024-01-08T00:00:00Z",
    "end": "2024-01-15T00:00:00Z"
  },
  "inventory": {
    "totalItems": 1234,
    "totalValue": 45678.90,
    "categoryDistribution": {
      "Electronics": 500,
      "Hardware": 734
    }
  },
  "alerts": {
    "total": 45,
    "critical": 5,
    "warning": 30,
    "info": 10,
    "byType": {
      "low_stock": 20,
      "sensor_failure": 5
    }
  },
  "devices": {
    "total": 50,
    "online": 48,
    "offline": 2
  }
}
```

## Realtime Database Paths

### Sensor Data

**Path**: `/sensor-data/{deviceId}/latest`

**Data**:
```json
{
  "weight": 75.5,
  "temperature": 22.3,
  "humidity": 45,
  "timestamp": 1234567890
}
```

### Device Status

**Path**: `/device-status/{deviceId}`

**Data**:
```json
{
  "online": true,
  "lastSeen": 1234567890
}
```

### Real-time Inventory

**Path**: `/real-time-inventory/{shelfId}`

**Data**:
```json
{
  "currentWeight": 150.5,
  "lastUpdate": 1234567890,
  "items": 25
}
```

## Client SDK Examples

### Get Inventory

```typescript
import { getDocuments, where } from '@/lib/firebase/firestore';

const inventory = await getDocuments('inventory', [
  where('warehouseId', '==', warehouseId),
  orderBy('lastUpdated', 'desc')
]);
```

### Subscribe to Real-time Updates

```typescript
import { subscribeToCollection } from '@/lib/firebase/firestore';

const unsubscribe = subscribeToCollection(
  'alerts',
  [where('resolved', '==', false)],
  (alerts) => {
    console.log('Unresolved alerts:', alerts);
  }
);
```

### Update Inventory

```typescript
import { updateDocument } from '@/lib/firebase/firestore';

await updateDocument('inventory', inventoryId, {
  quantity: newQuantity,
  updatedBy: userId
});
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Missing or invalid parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |

## Rate Limits

- Firestore: 10,000 reads/day (free tier)
- Cloud Functions: 2M invocations/month (free tier)
- Realtime Database: 100 simultaneous connections (free tier)

## Best Practices

1. **Batch Operations**: Use batch writes for multiple updates
2. **Pagination**: Limit queries to 50 items
3. **Caching**: Cache frequently accessed data
4. **Indexes**: Create composite indexes for complex queries
5. **Real-time**: Use Realtime DB for high-frequency updates

## Next Steps

- [Firebase Setup](./FIREBASE_SETUP.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [IoT Integration](./IOT_INTEGRATION.md)
