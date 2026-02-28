'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserRole, type UserRole } from '@/lib/firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Download, TrendingUp, Package, DollarSign, AlertTriangle, Calendar } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';
import { exportToCSV } from '@/lib/utils/csvParser';

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<string>('');

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

  const generateInventoryReport = async () => {
    setLoading(true);
    try {
      const inventoryQuery = query(
        collection(db, 'inventory'),
        where('warehouseId', '==', userRole?.warehouseId)
      );
      const productsQuery = query(collection(db, 'products'));
      
      const [inventorySnapshot, productsSnapshot] = await Promise.all([
        getDocs(inventoryQuery),
        getDocs(productsQuery)
      ]);

      const productMap = new Map();
      productsSnapshot.forEach(doc => {
        productMap.set(doc.id, doc.data());
      });

      const reportData = inventorySnapshot.docs.map(doc => {
        const inv = doc.data();
        const product = productMap.get(inv.productId) || {};
        return {
          productId: inv.productId,
          productName: product.name || 'Unknown',
          sku: product.sku || 'N/A',
          category: product.category || 'N/A',
          quantity: inv.quantity,
          minStockLevel: inv.minStockLevel,
          maxStockLevel: inv.maxStockLevel,
          status: inv.quantity === 0 ? 'Out of Stock' : inv.quantity <= inv.minStockLevel ? 'Low Stock' : 'In Stock',
          shelfId: inv.shelfId,
          unitPrice: product.unitPrice || 0,
          totalValue: (inv.quantity || 0) * (product.unitPrice || 0),
        };
      });

      exportToCSV(reportData, `inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
      toast('Inventory report generated successfully');
    } catch (error: any) {
      toast('Failed to generate report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateStockMovementReport = async () => {
    setLoading(true);
    try {
      const txnQuery = query(
        collection(db, 'transactions'),
        where('warehouseId', '==', userRole?.warehouseId)
      );
      
      const snapshot = await getDocs(txnQuery);
      const reportData = snapshot.docs.map(doc => {
        const txn = doc.data();
        return {
          referenceNumber: txn.referenceNumber,
          type: txn.type,
          productId: txn.productId,
          quantity: txn.quantity,
          unitPrice: txn.unitPrice,
          totalValue: txn.totalValue,
          performedBy: txn.performedBy,
          timestamp: txn.timestamp?.toDate ? txn.timestamp.toDate().toISOString() : new Date().toISOString(),
          notes: txn.notes || '',
        };
      });

      exportToCSV(reportData, `stock-movement-report-${new Date().toISOString().split('T')[0]}.csv`);
      toast('Stock movement report generated successfully');
    } catch (error: any) {
      toast('Failed to generate report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateAlertsReport = async () => {
    setLoading(true);
    try {
      const alertsQuery = query(
        collection(db, 'alerts'),
        where('warehouseId', '==', userRole?.warehouseId)
      );
      
      const snapshot = await getDocs(alertsQuery);
      const reportData = snapshot.docs.map(doc => {
        const alert = doc.data();
        return {
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          productId: alert.productId || 'N/A',
          deviceId: alert.deviceId || 'N/A',
          resolved: alert.resolved ? 'Yes' : 'No',
          createdAt: alert.createdAt?.toDate ? alert.createdAt.toDate().toISOString() : new Date().toISOString(),
          resolvedAt: alert.resolvedAt?.toDate ? alert.resolvedAt.toDate().toISOString() : 'N/A',
          resolvedBy: alert.resolvedBy || 'N/A',
        };
      });

      exportToCSV(reportData, `alerts-report-${new Date().toISOString().split('T')[0]}.csv`);
      toast('Alerts report generated successfully');
    } catch (error: any) {
      toast('Failed to generate report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateValuationReport = async () => {
    setLoading(true);
    try {
      const inventoryQuery = query(
        collection(db, 'inventory'),
        where('warehouseId', '==', userRole?.warehouseId)
      );
      const productsQuery = query(collection(db, 'products'));
      
      const [inventorySnapshot, productsSnapshot] = await Promise.all([
        getDocs(inventoryQuery),
        getDocs(productsQuery)
      ]);

      const productMap = new Map();
      productsSnapshot.forEach(doc => {
        productMap.set(doc.id, doc.data());
      });

      let totalValue = 0;
      const categoryValues: Record<string, number> = {};

      const reportData = inventorySnapshot.docs.map(doc => {
        const inv = doc.data();
        const product = productMap.get(inv.productId) || {};
        const itemValue = (inv.quantity || 0) * (product.unitPrice || 0);
        
        totalValue += itemValue;
        const category = product.category || 'Unknown';
        categoryValues[category] = (categoryValues[category] || 0) + itemValue;

        return {
          productName: product.name || 'Unknown',
          category: category,
          quantity: inv.quantity,
          unitPrice: product.unitPrice || 0,
          totalValue: itemValue,
        };
      });

      reportData.push({
        productName: '--- TOTALS ---',
        category: 'All',
        quantity: reportData.reduce((sum, item) => sum + (item.quantity || 0), 0),
        unitPrice: 0,
        totalValue: totalValue,
      });

      exportToCSV(reportData, `valuation-report-${new Date().toISOString().split('T')[0]}.csv`);
      toast(`Valuation report generated. Total value: ₹${totalValue.toLocaleString()}`);
    } catch (error: any) {
      toast('Failed to generate report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    {
      title: 'Inventory Report',
      description: 'Detailed inventory levels, stock status, and location',
      icon: Package,
      color: 'blue',
      action: generateInventoryReport,
    },
    {
      title: 'Stock Movement Report',
      description: 'All stock transactions including IN, OUT, and TRANSFER',
      icon: TrendingUp,
      color: 'green',
      action: generateStockMovementReport,
    },
    {
      title: 'Alerts Report',
      description: 'History of all alerts and their resolution status',
      icon: AlertTriangle,
      color: 'yellow',
      action: generateAlertsReport,
    },
    {
      title: 'Valuation Report',
      description: 'Total inventory value and breakdown by category',
      icon: DollarSign,
      color: 'purple',
      action: generateValuationReport,
    },
  ];

  return (
    <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Generate and export various warehouse reports
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {reportTypes.map((report) => {
                const Icon = report.icon;
                return (
                  <Card key={report.title} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>
                        <div className="flex items-center gap-3">
                          <div className={`p-3 bg-${report.color}-100 dark:bg-${report.color}-900/30 rounded-lg`}>
                            <Icon className={`w-6 h-6 text-${report.color}-600 dark:text-${report.color}-400`} />
                          </div>
                          <span>{report.title}</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {report.description}
                      </p>
                      <Button
                        variant="primary"
                        leftIcon={<Download className="w-4 h-4" />}
                        onClick={report.action}
                        isLoading={loading}
                        className="w-full"
                      >
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Report Information
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Report Format
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All reports are exported in CSV format, compatible with Excel, Google Sheets, and other spreadsheet applications.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Real-time Data
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Reports are generated with the most current data from your warehouse at the time of generation.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Warehouse Specific
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Reports include data only from your assigned warehouse: <span className="font-mono font-semibold">{userRole?.warehouseId || 'N/A'}</span>
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Future Features
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Coming soon: PDF exports, scheduled reports, custom date ranges, and email delivery.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>);}
