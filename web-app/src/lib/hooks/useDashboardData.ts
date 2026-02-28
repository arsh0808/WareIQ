import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Alert, IoTDevice, Product, Shelf } from '@/lib/types';

export interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  activeDevices: number;
  openAlerts: number;
  loading: boolean;
  error: string | null;
}

export interface RecentActivity {
  id: string;
  action: string;
  item: string;
  time: string;
  timestamp: Date;
}

export function useDashboardStats(warehouseId?: string): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockItems: 0,
    activeDevices: 0,
    openAlerts: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!warehouseId) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const unsubscribers: (() => void)[] = [];

    try {
      
      const productsQuery = query(collection(db, 'products'));
      const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, totalProducts: snapshot.size }));
      });
      unsubscribers.push(unsubProducts);

      const lowStockQuery = query(
        collection(db, 'inventory'),
        where('warehouseId', '==', warehouseId),
        where('quantity', '<=', 10)
      );
      const unsubLowStock = onSnapshot(lowStockQuery, (snapshot) => {
        setStats(prev => ({ ...prev, lowStockItems: snapshot.size }));
      });
      unsubscribers.push(unsubLowStock);

      const devicesQuery = query(
        collection(db, 'iot-devices'),
        where('warehouseId', '==', warehouseId),
        where('status', '==', 'online')
      );
      const unsubDevices = onSnapshot(devicesQuery, (snapshot) => {
        setStats(prev => ({ ...prev, activeDevices: snapshot.size }));
      });
      unsubscribers.push(unsubDevices);

      const alertsQuery = query(
        collection(db, 'alerts'),
        where('warehouseId', '==', warehouseId),
        where('resolved', '==', false)
      );
      const unsubAlerts = onSnapshot(alertsQuery, (snapshot) => {
        setStats(prev => ({ ...prev, openAlerts: snapshot.size, loading: false }));
      });
      unsubscribers.push(unsubAlerts);

    } catch (error) {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load stats',
      }));
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [warehouseId]);

  return stats;
}

export function useRecentActivity(warehouseId?: string, limitCount = 10) {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!warehouseId) {
      setLoading(false);
      return;
    }

    const alertsQuery = query(
      collection(db, 'alerts'),
      where('warehouseId', '==', warehouseId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const activities: RecentActivity[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = data.createdAt?.toDate() || new Date();
        
        return {
          id: doc.id,
          action: getActionText(data.type, data.resolved),
          item: data.message || 'Unknown',
          time: getRelativeTime(timestamp),
          timestamp,
        };
      });

      setActivities(activities);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [warehouseId, limitCount]);

  return { activities, loading };
}

function getActionText(type: string, resolved: boolean): string {
  if (resolved) return 'Alert Resolved';
  
  switch (type) {
    case 'low_stock': return 'Low Stock Alert';
    case 'weight_mismatch': return 'Weight Mismatch';
    case 'temperature_alert': return 'Temperature Alert';
    case 'sensor_failure': return 'Sensor Offline';
    case 'low_battery': return 'Low Battery';
    default: return 'System Alert';
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}
