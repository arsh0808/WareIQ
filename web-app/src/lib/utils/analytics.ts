import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface CategoryData {
  name: string;
  value: number;
  percentage?: number;
}

export interface TrendData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export async function getInventoryTrends(warehouseId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const historyQuery = query(
    collection(db, 'inventoryHistory'),
    where('warehouseId', '==', warehouseId),
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    orderBy('timestamp', 'asc')
  );
  
  const snapshot = await getDocs(historyQuery);
  const dataByDate: Record<string, { quantity: number; value: number }> = {};
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const date = data.timestamp.toDate().toISOString().split('T')[0];
    
    if (!dataByDate[date]) {
      dataByDate[date] = { quantity: 0, value: 0 };
    }
    
    dataByDate[date].quantity += data.quantity || 0;
    dataByDate[date].value += data.value || 0;
  });
  
  const quantityData: TimeSeriesData[] = Object.entries(dataByDate).map(([date, data]) => ({
    date,
    value: data.quantity,
    label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));
  
  const valueData: TimeSeriesData[] = Object.entries(dataByDate).map(([date, data]) => ({
    date,
    value: data.value,
    label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));
  
  return { quantityData, valueData };
}

export async function getActivityMetrics(warehouseId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const activityQuery = query(
    collection(db, 'activityLogs'),
    where('warehouseId', '==', warehouseId),
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    orderBy('timestamp', 'asc')
  );
  
  const snapshot = await getDocs(activityQuery);
  const dataByDate: Record<string, number> = {};
  const dataByType: Record<string, number> = {};
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const date = data.timestamp.toDate().toISOString().split('T')[0];
    
    dataByDate[date] = (dataByDate[date] || 0) + 1;
    dataByType[data.action] = (dataByType[data.action] || 0) + 1;
  });
  
  const dailyActivity: TimeSeriesData[] = Object.entries(dataByDate).map(([date, count]) => ({
    date,
    value: count,
    label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
  }));
  
  const activityByType: CategoryData[] = Object.entries(dataByType).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  }));
  
  return { dailyActivity, activityByType };
}

export async function getCategoryDistribution(warehouseId: string) {
  const inventoryQuery = query(
    collection(db, 'inventory'),
    where('warehouseId', '==', warehouseId)
  );
  
  const productsQuery = query(collection(db, 'products'));
  
  const [inventorySnapshot, productsSnapshot] = await Promise.all([
    getDocs(inventoryQuery),
    getDocs(productsQuery)
  ]);
  
  const productMap = new Map();
  productsSnapshot.forEach(doc => {
    const data = doc.data();
    productMap.set(doc.id, {
      category: data.category,
      price: data.unitPrice || 0
    });
  });
  
  const categoryTotals: Record<string, { quantity: number; value: number }> = {};
  let totalQuantity = 0;
  let totalValue = 0;
  
  inventorySnapshot.forEach(doc => {
    const data = doc.data();
    const product = productMap.get(data.productId);
    
    if (product) {
      const category = product.category || 'Other';
      const quantity = data.quantity || 0;
      const value = quantity * product.price;
      
      if (!categoryTotals[category]) {
        categoryTotals[category] = { quantity: 0, value: 0 };
      }
      
      categoryTotals[category].quantity += quantity;
      categoryTotals[category].value += value;
      totalQuantity += quantity;
      totalValue += value;
    }
  });
  
  const distribution: CategoryData[] = Object.entries(categoryTotals).map(([name, data]) => ({
    name,
    value: data.quantity,
    percentage: totalQuantity > 0 ? (data.quantity / totalQuantity) * 100 : 0
  }));
  
  return { distribution, totalQuantity, totalValue };
}

export async function getStockMovementTrends(warehouseId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('warehouseId', '==', warehouseId),
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    orderBy('timestamp', 'asc')
  );
  
  const snapshot = await getDocs(transactionsQuery);
  const dataByDate: Record<string, { in: number; out: number; transfer: number }> = {};
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const date = data.timestamp.toDate().toISOString().split('T')[0];
    
    if (!dataByDate[date]) {
      dataByDate[date] = { in: 0, out: 0, transfer: 0 };
    }
    
    const quantity = data.quantity || 0;
    
    if (data.type === 'IN') {
      dataByDate[date].in += quantity;
    } else if (data.type === 'OUT') {
      dataByDate[date].out += quantity;
    } else if (data.type === 'TRANSFER') {
      dataByDate[date].transfer += quantity;
    }
  });
  
  const movementData = Object.entries(dataByDate).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    incoming: data.in,
    outgoing: data.out,
    transfers: data.transfer
  }));
  
  return movementData;
}

export async function getAlertStatistics(warehouseId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const alertsQuery = query(
    collection(db, 'alerts'),
    where('warehouseId', '==', warehouseId),
    where('createdAt', '>=', Timestamp.fromDate(startDate))
  );
  
  const snapshot = await getDocs(alertsQuery);
  
  let critical = 0;
  let warning = 0;
  let info = 0;
  let resolved = 0;
  let unresolved = 0;
  
  const alertsByType: Record<string, number> = {};
  const alertsByDate: Record<string, number> = {};
  
  snapshot.forEach(doc => {
    const data = doc.data();
    
    if (data.severity === 'critical') critical++;
    else if (data.severity === 'warning') warning++;
    else if (data.severity === 'info') info++;
    
    if (data.resolved) resolved++;
    else unresolved++;
    
    alertsByType[data.type] = (alertsByType[data.type] || 0) + 1;
    
    const date = data.createdAt.toDate().toISOString().split('T')[0];
    alertsByDate[date] = (alertsByDate[date] || 0) + 1;
  });
  
  const severityData: CategoryData[] = [
    { name: 'Critical', value: critical },
    { name: 'Warning', value: warning },
    { name: 'Info', value: info }
  ];
  
  const typeData: CategoryData[] = Object.entries(alertsByType).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  }));
  
  const trendData: TimeSeriesData[] = Object.entries(alertsByDate).map(([date, count]) => ({
    date,
    value: count,
    label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));
  
  return {
    total: snapshot.size,
    critical,
    warning,
    info,
    resolved,
    unresolved,
    severityData,
    typeData,
    trendData
  };
}

export async function calculateTrend(warehouseId: string, metric: string, days: number = 30): Promise<TrendData> {
  const metricsQuery = query(
    collection(db, 'dailyMetrics'),
    where('warehouseId', '==', warehouseId),
    orderBy('date', 'desc'),
    limit(days * 2)
  );
  
  const snapshot = await getDocs(metricsQuery);
  const metrics: any[] = [];
  
  snapshot.forEach(doc => {
    metrics.push(doc.data());
  });
  
  if (metrics.length < 2) {
    return {
      current: 0,
      previous: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable'
    };
  }
  
  const currentPeriod = metrics.slice(0, Math.floor(metrics.length / 2));
  const previousPeriod = metrics.slice(Math.floor(metrics.length / 2));
  
  const currentAvg = currentPeriod.reduce((sum, m) => sum + (m.metrics?.[metric] || 0), 0) / currentPeriod.length;
  const previousAvg = previousPeriod.reduce((sum, m) => sum + (m.metrics?.[metric] || 0), 0) / previousPeriod.length;
  
  const change = currentAvg - previousAvg;
  const changePercent = previousAvg > 0 ? (change / previousAvg) * 100 : 0;
  
  return {
    current: Math.round(currentAvg),
    previous: Math.round(previousAvg),
    change: Math.round(change),
    changePercent: Math.round(changePercent * 100) / 100,
    trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable'
  };
}

export async function getTopProducts(warehouseId: string, limit: number = 10) {
  const inventoryQuery = query(
    collection(db, 'inventory'),
    where('warehouseId', '==', warehouseId)
  );
  
  const productsQuery = query(collection(db, 'products'));
  
  const [inventorySnapshot, productsSnapshot] = await Promise.all([
    getDocs(inventoryQuery),
    getDocs(productsQuery)
  ]);
  
  const productMap = new Map();
  productsSnapshot.forEach(doc => {
    productMap.set(doc.id, {
      name: doc.data().name,
      price: doc.data().unitPrice || 0,
      category: doc.data().category
    });
  });
  
  const productData: Array<{ name: string; quantity: number; value: number; category: string }> = [];
  
  inventorySnapshot.forEach(doc => {
    const data = doc.data();
    const product = productMap.get(data.productId);
    
    if (product) {
      productData.push({
        name: product.name,
        quantity: data.quantity || 0,
        value: (data.quantity || 0) * product.price,
        category: product.category
      });
    }
  });
  
  const topByQuantity = [...productData]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
  
  const topByValue = [...productData]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
  
  return { topByQuantity, topByValue };
}

export async function getWarehouseUtilization(warehouseId: string) {
  const warehouseDoc = await getDocs(query(
    collection(db, 'warehouses'),
    where('__name__', '==', warehouseId)
  ));
  
  if (warehouseDoc.empty) {
    return { capacity: 0, used: 0, available: 0, utilizationPercent: 0 };
  }
  
  const warehouse = warehouseDoc.docs[0].data();
  const capacity = warehouse.capacity || 0;
  
  const inventoryQuery = query(
    collection(db, 'inventory'),
    where('warehouseId', '==', warehouseId)
  );
  
  const inventorySnapshot = await getDocs(inventoryQuery);
  let totalItems = 0;
  
  inventorySnapshot.forEach(doc => {
    totalItems += doc.data().quantity || 0;
  });
  
  const utilizationPercent = capacity > 0 ? (totalItems / capacity) * 100 : 0;
  
  return {
    capacity,
    used: totalItems,
    available: Math.max(0, capacity - totalItems),
    utilizationPercent: Math.round(utilizationPercent * 100) / 100
  };
}
