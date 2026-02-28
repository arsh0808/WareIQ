'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserRole, type UserRole } from '@/lib/firebase/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Edit, Download, Filter } from 'lucide-react';
import toast from '@/lib/hooks/useToast';
import { exportToCSV } from '@/lib/utils/csvParser';

interface Transaction {
  id: string;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  productId: string;
  warehouseId: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  fromWarehouse?: string;
  toWarehouse?: string;
  referenceNumber: string;
  performedBy: string;
  notes?: string;
  timestamp: any;
  createdAt: any;
}

export default function TransactionsPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const role = await getUserRole(user.uid);
        setUserRole(role);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userRole?.warehouseId) return;

    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('warehouseId', '==', userRole.warehouseId),
      orderBy('timestamp', 'desc'),
      limit(500)
    );

    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];

      setTransactions(transactionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole]);

  useEffect(() => {
    let filtered = transactions;

    if (typeFilter !== 'all') {
      filtered = filtered.filter(txn => txn.type === typeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(txn =>
        txn.referenceNumber.toLowerCase().includes(query) ||
        txn.productId.toLowerCase().includes(query) ||
        txn.performedBy.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, typeFilter]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'IN': return { variant: 'success' as const, icon: ArrowDownCircle, label: 'Stock In' };
      case 'OUT': return { variant: 'danger' as const, icon: ArrowUpCircle, label: 'Stock Out' };
      case 'TRANSFER': return { variant: 'info' as const, icon: RefreshCw, label: 'Transfer' };
      case 'ADJUSTMENT': return { variant: 'warning' as const, icon: Edit, label: 'Adjustment' };
      default: return { variant: 'default' as const, icon: RefreshCw, label: type };
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = () => {
    const exportData = filteredTransactions.map(txn => ({
      referenceNumber: txn.referenceNumber,
      type: txn.type,
      productId: txn.productId,
      quantity: txn.quantity,
      unitPrice: txn.unitPrice,
      totalValue: txn.totalValue,
      performedBy: txn.performedBy,
      timestamp: formatDate(txn.timestamp),
      notes: txn.notes || '',
    }));

    exportToCSV(exportData, `transactions-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast('Transactions exported successfully');
  };

  const totalIn = transactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.quantity, 0);
  const totalOut = transactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.quantity, 0);
  const totalValue = transactions.reduce((sum, t) => sum + t.totalValue, 0);

  return (
    <div className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Transaction History
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Track all stock movements and adjustments
                </p>
              </div>
              <Button
                variant="outline"
                leftIcon={<Download className="w-4 h-4" />}
                onClick={handleExport}
                disabled={filteredTransactions.length === 0}
              >
                Export
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search by reference, product ID, or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={typeFilter === 'all' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setTypeFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={typeFilter === 'IN' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setTypeFilter('IN')}
                  leftIcon={<ArrowDownCircle className="w-4 h-4" />}
                >
                  In
                </Button>
                <Button
                  variant={typeFilter === 'OUT' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setTypeFilter('OUT')}
                  leftIcon={<ArrowUpCircle className="w-4 h-4" />}
                >
                  Out
                </Button>
                <Button
                  variant={typeFilter === 'TRANSFER' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setTypeFilter('TRANSFER')}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Transfer
                </Button>
              </div>
            </div>

            {loading ? (
              <Card className="p-6">
                <TableSkeleton rows={10} />
              </Card>
            ) : filteredTransactions.length === 0 ? (
              <Card className="p-12 text-center">
                <RefreshCw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {searchQuery ? 'No transactions match your search.' : 'No transactions found.'}
                </p>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Date/Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((txn) => {
                    const typeInfo = getTypeBadge(txn.type);
                    const Icon = typeInfo.icon;
                    return (
                      <TableRow key={txn.id}>
                        <TableCell>
                          <span className="font-mono text-sm font-semibold">{txn.referenceNumber}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={typeInfo.variant}>
                            <Icon className="w-3 h-3 mr-1" />
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{txn.productId}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${txn.type === 'IN' ? 'text-green-600' : txn.type === 'OUT' ? 'text-red-600' : 'text-blue-600'}`}>
                            {txn.type === 'IN' ? '+' : txn.type === 'OUT' ? '-' : ''}{txn.quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">₹{txn.unitPrice.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">₹{txn.totalValue.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{txn.performedBy}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(txn.timestamp)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            <div className="grid md:grid-cols-4 gap-6 mt-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Total Transactions
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {transactions.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Stock In
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      +{totalIn.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ArrowDownCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Stock Out
                    </p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      -{totalOut.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <ArrowUpCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Total Value
                    </p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      ₹{(totalValue / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <span className="text-2xl">💰</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>);}
