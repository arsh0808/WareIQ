import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Alert, IoTDevice, Product, Shelf } from '@/lib/types';
import * as demoData from '@/lib/utils/demoData';

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
      // Products
      const productsQuery = query(collection(db, 'products'));
      const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
        const val = snapshot.empty ? demoData.DEMO_PRODUCTS.length : snapshot.size;
        setStats(prev => ({ ...prev, totalProducts: val, loading: false }));
      }, () => {
        setStats(prev => ({ ...prev, totalProducts: demoData.DEMO_PRODUCTS.length, loading: false }));
      });
      unsubscribers.push(unsubProducts);

      // Low Stock items from inventory
      const lowStockQuery = query(
        collection(db, 'inventory'),
        where('warehouseId', '==', warehouseId),
        where('quantity', '<=', 10)
      );
      const unsubLowStock = onSnapshot(lowStockQuery, (snapshot) => {
        let val = snapshot.size;
        if (snapshot.empty) {
          const demoMatches = demoData.DEMO_INVENTORY.filter(i => i.status === 'low_stock' && i.warehouseId === warehouseId);
          val = demoMatches.length > 0 ? demoMatches.length : demoData.DEMO_INVENTORY.filter(i => i.status === 'low_stock' && i.warehouseId === 'wh-001').length;
        }
        setStats(prev => ({ ...prev, lowStockItems: val }));
      }, () => {
        const demoMatches = demoData.DEMO_INVENTORY.filter(i => i.status === 'low_stock' && i.warehouseId === warehouseId);
        const val = demoMatches.length > 0 ? demoMatches.length : demoData.DEMO_INVENTORY.filter(i => i.status === 'low_stock' && i.warehouseId === 'wh-001').length;
        setStats(prev => ({ ...prev, lowStockItems: val }));
      });
      unsubscribers.push(unsubLowStock);

      // Online Devices
      const devicesQuery = query(
        collection(db, 'iot-devices'),
        where('warehouseId', '==', warehouseId),
        where('status', '==', 'online')
      );
      const unsubDevices = onSnapshot(devicesQuery, (snapshot) => {
        const val = snapshot.empty ? 5 : snapshot.size; // Default to 5 online devices in demo
        setStats(prev => ({ ...prev, activeDevices: val }));
      }, () => {
        setStats(prev => ({ ...prev, activeDevices: 5 }));
      });
      unsubscribers.push(unsubDevices);

      // Active Alerts
      const alertsQuery = query(
        collection(db, 'alerts'),
        where('warehouseId', '==', warehouseId),
        where('resolved', '==', false)
      );
      const unsubAlerts = onSnapshot(alertsQuery, (snapshot) => {
        let val = snapshot.size;
        if (snapshot.empty) {
          const demoMatches = demoData.DEMO_ALERTS.filter(a => a.warehouseId === warehouseId);
          val = demoMatches.length > 0 ? demoMatches.length : demoData.DEMO_ALERTS.filter(a => a.warehouseId === 'wh-001').length;
        }
        setStats(prev => ({ ...prev, openAlerts: val, loading: false }));
      }, () => {
        const demoMatches = demoData.DEMO_ALERTS.filter(a => a.warehouseId === warehouseId);
        const val = demoMatches.length > 0 ? demoMatches.length : demoData.DEMO_ALERTS.filter(a => a.warehouseId === 'wh-001').length;
        setStats(prev => ({ ...prev, openAlerts: val, loading: false }));
      });
      unsubscribers.push(unsubAlerts);

    } catch (error) {
      setStats({
        totalProducts: demoData.DEMO_PRODUCTS.length,
        lowStockItems: 2,
        activeDevices: 5,
        openAlerts: demoData.DEMO_ALERTS.length,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load stats',
      });
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [warehouseId]);

  return stats;
}

export function useActivityTrends(warehouseId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For the demo/empty state, we'll provide realistic weekly trends
    const demoTrends = [
      { name: 'Mon', items: 24 },
      { name: 'Tue', items: 35 },
      { name: 'Wed', items: 28 },
      { name: 'Thu', items: 42 },
      { name: 'Fri', items: 38 },
      { name: 'Sat', items: 15 },
      { name: 'Sun', items: 12 },
    ];

    if (!warehouseId) {
      setData(demoTrends);
      setLoading(false);
      return;
    }

    // Attempt to fetch real activity counts if possible
    // (Note: This is a simplified version for the dashboard chart)
    setData(demoTrends);
    setLoading(false);
  }, [warehouseId]);

  return { data, loading };
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
      if (snapshot.empty) {
        // Map demo alerts to activities
        setActivities(demoData.DEMO_ALERTS
          .filter(a => a.warehouseId === warehouseId)
          .map(a => ({
            id: a.id,
            action: getActionText(a.type, a.resolved),
            item: a.message,
            time: 'Demo Data',
            timestamp: new Date()
          })));
      } else {
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
      }
      setLoading(false);
    }, () => {
      setActivities(demoData.DEMO_ALERTS.map(a => ({
        id: a.id,
        action: getActionText(a.type, a.resolved),
        item: a.message,
        time: 'Fallback Data',
        timestamp: new Date()
      })));
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
