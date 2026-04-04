import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, Query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import * as demoData from '@/lib/utils/demoData';

type DataType = 'products' | 'inventory' | 'shelves' | 'purchase-orders' | 'alerts' | 'notifications' | 'audit-logs';

const demoDataMap: Record<DataType, any[]> = {
    'products': demoData.DEMO_PRODUCTS,
    'inventory': demoData.DEMO_INVENTORY,
    'shelves': demoData.DEMO_SHELVES,
    'purchase-orders': demoData.DEMO_PURCHASE_ORDERS,
    'alerts': demoData.DEMO_ALERTS,
    'notifications': demoData.DEMO_NOTIFICATIONS,
    'audit-logs': demoData.DEMO_AUDIT_LOGS,
};

export function useData<T>(type: DataType, firestoreQuery: Query) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const [isDemoData, setIsDemoData] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            firestoreQuery,
            (snapshot) => {
                if (snapshot.empty) {
                    console.log(`ℹ️ Firestore ${type} is empty, using real-world demo fallback.`);
                    setData(demoDataMap[type] as T[]);
                    setIsDemoData(true);
                } else {
                    const docs = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as T[];
                    setData(docs);
                    setIsDemoData(false);
                }
                setLoading(false);
            },
            (err) => {
                console.warn(`⚠️ Firestore ${type} error, using real-world demo fallback:`, err.message);
                setError(err);
                setData(demoDataMap[type] as T[]);
                setIsDemoData(true);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [type, firestoreQuery]);

    return { data, loading, error, isDemoData };
}
