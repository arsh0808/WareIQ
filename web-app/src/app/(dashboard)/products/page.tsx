'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserRole, type UserRole } from '@/lib/firebase/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Box, Plus, Edit2, Trash2, DollarSign, Package, Download } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';
import { AddProductDialog } from '@/components/AddProductDialog';
import { exportToCSV } from '@/lib/utils/csvParser';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  unitPrice: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  minStockLevel: number;
  reorderPoint: number;
  supplier: string;
  barcode: string;
  qrCode: string;
  imageURL: string;
  createdAt: any;
  updatedAt: any;
}

export default function ProductsPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

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
    const productsQuery = query(collection(db, 'products'));
    
    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      
      setProducts(productsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, categoryFilter]);

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'products', productId));
      toast('Product deleted successfully');
    } catch (error: any) {
      toast('Failed to delete product: ' + error.message);
    }
  };

  const handleExport = () => {
    const exportData = filteredProducts.map(product => ({
      sku: product.sku,
      name: product.name,
      category: product.category,
      unitPrice: product.unitPrice,
      weight: product.weight,
      minStockLevel: product.minStockLevel,
      supplier: product.supplier,
    }));

    exportToCSV(exportData, `products-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast('Products exported successfully');
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Product Catalog
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your product inventory catalog
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={handleExport}
                  disabled={filteredProducts.length === 0}
                >
                  Export
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowAddDialog(true)}
                >
                  Add Product
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search by name, SKU, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={categoryFilter === 'all' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setCategoryFilter('all')}
                >
                  All
                </Button>
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={categoryFilter === category ? 'primary' : 'outline'}
                    size="md"
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {loading ? (
              <Card className="p-6">
                <TableSkeleton rows={8} />
              </Card>
            ) : filteredProducts.length === 0 ? (
              <Card className="p-12 text-center">
                <Box className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {searchQuery ? 'No products match your search.' : 'No products found.'}
                </p>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold">
                            {product.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {product.description.substring(0, 30)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold">{product.sku}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold">{(product.unitPrice || 0).toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{(product.weight || 0).toFixed(2)} kg</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{product.minStockLevel}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{product.supplier}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Edit2 className="w-4 h-4" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="grid md:grid-cols-4 gap-6 mt-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Total Products
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {products.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Box className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Categories
                    </p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {categories.length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Avg. Price
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      ₹{products.length > 0 ? (products.reduce((sum, p) => sum + p.unitPrice, 0) / products.length).toFixed(2) : '0'}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Total Value
                    </p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      ₹{(products.reduce((sum, p) => sum + p.unitPrice, 0) / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <DollarSign className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </Card>
            </div>

      {userRole?.warehouseId && (
        <AddProductDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          warehouseId={userRole.warehouseId}
        />
      )}
    </div>
  );
}
