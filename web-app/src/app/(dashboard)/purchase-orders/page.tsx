'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { FileText, CheckCircle, Clock, Truck, Download, Eye } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';
import { PageWrapper } from '@/components/PageWrapper';
import { useData } from '@/lib/hooks/useData';
import { formatDate } from '@/lib/utils/date';

interface POItem {
    productId: string;
    productName: string;
    sku: string;
    reorderQty: number;
    unitPrice: number;
}

interface PurchaseOrder {
    id: string;
    poNumber: string;
    supplier: string;
    status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
    totalValue: number;
    items: POItem[];
    warehouseId: string;
    createdAt: any;
    notes?: string;
}

export default function PurchaseOrdersPage() {
    const { user, userRole } = useAuth();
    const poQuery = query(
        collection(db, 'purchase-orders'),
        where('warehouseId', '==', userRole?.warehouseId || 'wh-001'),
        orderBy('createdAt', 'desc')
    );

    const { data: orders, loading, isDemoData: isDemo } = useData<PurchaseOrder>('purchase-orders', poQuery);

    const handleApprove = async (orderId: string) => {
        try {
            await updateDoc(doc(db, 'purchase-orders', orderId), {
                status: 'ORDERED',
                updatedAt: new Date()
            });
            toast.success('PO Approved', 'Order has been marked as SENT to supplier');
        } catch (error: any) {
            toast.error('Failed to approve PO', error.message);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT': return <Badge variant="warning">Draft</Badge>;
            case 'ORDERED': return <Badge variant="info">Ordered</Badge>;
            case 'RECEIVED': return <Badge variant="success">Received</Badge>;
            case 'CANCELLED': return <Badge variant="danger">Cancelled</Badge>;
            default: return <Badge variant="default">{status}</Badge>;
        }
    };

    return (
        <PageWrapper allowedRoles={['admin', 'manager']}>
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Purchase Orders</h1>
                        <p className="text-gray-500">Review and approve automated supply orders</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>Export All</Button>
                    </div>
                </div>

                {loading ? (
                    <p>Loading orders...</p>
                ) : orders.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No Purchase Orders generated yet.</p>
                        <p className="text-xs text-gray-400 mt-1">Run the Reorder script to generate drafts.</p>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {orders.map(order => (
                            <Card key={order.id} className="overflow-hidden border-l-4 border-l-blue-500">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-mono font-bold text-lg">{order.poNumber}</span>
                                                {getStatusBadge(order.status)}
                                            </div>
                                            <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                                <Truck className="w-3 h-3" /> Supplier: {order.supplier}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold">₹{order.totalValue.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">Total Value</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4 mb-4">
                                        <p className="text-xs font-bold uppercase text-gray-400 mb-2">Order Items ({order.items.length})</p>
                                        <div className="space-y-2">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span>{item.productName} (x{item.reorderQty})</span>
                                                    <span className="font-mono text-gray-500">₹{(item.reorderQty * item.unitPrice).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-gray-500 italic">
                                            {order.notes || 'No notes'}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" leftIcon={<Eye className="w-4 h-4" />}>Details</Button>
                                            {order.status === 'DRAFT' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    leftIcon={<CheckCircle className="w-4 h-4" />}
                                                    onClick={() => handleApprove(order.id)}
                                                >
                                                    Approve Order
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
