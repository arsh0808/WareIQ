'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { collection, query, getDocs, where, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from '@/lib/hooks/useToast';
import { Share2, ArrowRight, X, Package, Warehouse as WarehouseIcon } from 'lucide-react';
import type { Product, Warehouse, Inventory } from '@/lib/types';

interface TransferWizardDialogProps {
    open: boolean;
    onClose: () => void;
    userId: string;
    sourceWarehouseId?: string;
}

export function TransferWizardDialog({ open, onClose, userId, sourceWarehouseId }: TransferWizardDialogProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [sourceInventories, setSourceInventories] = useState<Inventory[]>([]);

    const [selectedProductId, setSelectedProductId] = useState('');
    const [fromWarehouseId, setFromWarehouseId] = useState(sourceWarehouseId || '');
    const [toWarehouseId, setToWarehouseId] = useState('');
    const [fromShelfId, setFromShelfId] = useState('');
    const [toShelfId, setToShelfId] = useState('');
    const [transferQty, setTransferQty] = useState(1);

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    // Load basic data
    useEffect(() => {
        if (!open) return;

        const loadData = async () => {
            const wQuery = query(collection(db, 'warehouses'));
            const wSnapshot = await getDocs(wQuery);
            setWarehouses(wSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Warehouse[]);

            const pQuery = query(collection(db, 'products'));
            const pSnapshot = await getDocs(pQuery);
            setProducts(pSnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
        };

        loadData();
    }, [open]);

    // Load source inventories when product and warehouse are selected
    useEffect(() => {
        if (!selectedProductId || !fromWarehouseId) {
            setSourceInventories([]);
            return;
        }

        const loadInventory = async () => {
            const iQuery = query(
                collection(db, 'inventory'),
                where('productId', '==', selectedProductId),
                where('warehouseId', '==', fromWarehouseId)
            );
            const snapshot = await getDocs(iQuery);
            setSourceInventories(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Inventory[]);
        };

        loadInventory();
    }, [selectedProductId, fromWarehouseId]);

    const handleTransfer = async () => {
        if (!selectedProductId || !fromWarehouseId || !toWarehouseId || !fromShelfId || !toShelfId) {
            toast.error('Please fill all required fields');
            return;
        }

        const sourceInv = sourceInventories.find(i => i.shelfId === fromShelfId);
        if (!sourceInv || sourceInv.quantity < transferQty) {
            toast.error('Insufficient stock in source shelf');
            return;
        }

        setLoading(true);
        try {
            await runTransaction(db, async (transaction) => {
                // 1. Source Inventory Adjustment
                const sourceRef = doc(db, 'inventory', sourceInv.id);
                transaction.update(sourceRef, {
                    quantity: sourceInv.quantity - transferQty,
                    lastUpdated: Timestamp.now(),
                    updatedBy: userId
                });

                // 2. Destination Inventory Adjustment
                // Check if item already exists in dest shelf
                const destQuery = query(
                    collection(db, 'inventory'),
                    where('productId', '==', selectedProductId),
                    where('warehouseId', '==', toWarehouseId),
                    where('shelfId', '==', toShelfId)
                );
                const destSnapshot = await getDocs(destQuery);

                if (!destSnapshot.empty) {
                    const destDoc = destSnapshot.docs[0];
                    const destData = destDoc.data() as Inventory;
                    transaction.update(destDoc.ref, {
                        quantity: destData.quantity + transferQty,
                        lastUpdated: Timestamp.now(),
                        updatedBy: userId
                    });
                } else {
                    // Create new record in dest
                    const newDestRef = doc(collection(db, 'inventory'));
                    transaction.set(newDestRef, {
                        productId: selectedProductId,
                        warehouseId: toWarehouseId,
                        shelfId: toShelfId,
                        quantity: transferQty,
                        minStockLevel: sourceInv.minStockLevel,
                        maxStockLevel: sourceInv.maxStockLevel,
                        status: 'available',
                        lastUpdated: Timestamp.now(),
                        updatedBy: userId
                    });
                }

                // 3. Log Transaction
                const logRef = doc(collection(db, 'transactions'));
                transaction.set(logRef, {
                    type: 'TRANSFER',
                    productId: selectedProductId,
                    quantity: transferQty,
                    fromWarehouseId,
                    toWarehouseId,
                    fromShelfId,
                    toShelfId,
                    referenceNumber: `TRF-${Date.now()}`,
                    performedBy: userId,
                    timestamp: Timestamp.now(),
                    createdAt: Timestamp.now()
                });
            });

            toast.success('Transfer successful!');
            onClose();
        } catch (error: any) {
            console.error('Transfer failed:', error);
            toast.error('Transfer failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onClose={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Share2 className="w-6 h-6 text-blue-500" />
                        Stock Transfer Wizard
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Step indicator */}
                    <div className="flex items-center justify-between px-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`flex items-center ${i < 3 ? 'flex-1' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {i}
                                </div>
                                {i < 3 && <div className={`flex-1 h-1 mx-2 ${step > i ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                            </div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Select Product</label>
                                <select
                                    className="w-full p-2 border rounded-lg bg-transparent"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                >
                                    <option value="">-- Select --</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <Button
                                className="w-full"
                                disabled={!selectedProductId}
                                onClick={() => setStep(2)}
                            >
                                Next <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Source Warehouse</label>
                                    <select
                                        className="w-full p-2 border rounded-lg bg-transparent"
                                        value={fromWarehouseId}
                                        onChange={(e) => setFromWarehouseId(e.target.value)}
                                    >
                                        <option value="">-- From --</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Source Shelf</label>
                                    <select
                                        className="w-full p-2 border rounded-lg bg-transparent"
                                        value={fromShelfId}
                                        onChange={(e) => setFromShelfId(e.target.value)}
                                        disabled={sourceInventories.length === 0}
                                    >
                                        <option value="">-- Shelf --</option>
                                        {sourceInventories.map(i => <option key={i.id} value={i.shelfId}>{i.shelfId} ({i.quantity} units)</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-3">
                                <ArrowRight className="w-5 h-5 text-blue-500" />
                                <p className="text-xs text-blue-700 dark:text-blue-300">Choose destination warehouse and shelf next.</p>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                                <Button className="flex-1" disabled={!fromShelfId} onClick={() => setStep(3)}>Next</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Dest Warehouse</label>
                                    <select
                                        className="w-full p-2 border rounded-lg bg-transparent"
                                        value={toWarehouseId}
                                        onChange={(e) => setToWarehouseId(e.target.value)}
                                    >
                                        <option value="">-- To --</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Dest Shelf</label>
                                    <Input
                                        placeholder="e.g. B2-05"
                                        value={toShelfId}
                                        onChange={(e) => setToShelfId(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Quantity to Transfer</label>
                                <Input
                                    type="number"
                                    value={transferQty}
                                    min={1}
                                    max={sourceInventories.find(i => i.shelfId === fromShelfId)?.quantity || 1}
                                    onChange={(e) => setTransferQty(parseInt(e.target.value) || 1)}
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                                <Button
                                    className="flex-1"
                                    isLoading={loading}
                                    onClick={handleTransfer}
                                >
                                    Confirm Transfer
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Dialog>
    );
}
