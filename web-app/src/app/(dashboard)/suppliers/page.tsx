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
import { Truck, Plus, Edit2, Trash2, Mail, Phone, MapPin, Download } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';
import { AddSupplierDialog } from '@/components/AddSupplierDialog';
import { EditSupplierDialog } from '@/components/EditSupplierDialog';
import { exportToCSV } from '@/lib/utils/csvParser';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  address?: string;
  rating?: number;
  createdAt: any;
  updatedAt: any;
}

export default function SuppliersPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

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
    const suppliersQuery = query(collection(db, 'suppliers'));
    
    const unsubscribe = onSnapshot(suppliersQuery, (snapshot) => {
      const suppliersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Supplier[];
      
      setSuppliers(suppliersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = suppliers;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(query) ||
        supplier.contactPerson.toLowerCase().includes(query) ||
        supplier.city.toLowerCase().includes(query) ||
        supplier.phone.includes(query)
      );
    }

    setFilteredSuppliers(filtered);
  }, [suppliers, searchQuery]);

  const handleEditSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowEditDialog(true);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'suppliers', supplierId));
      toast('Supplier deleted successfully');
    } catch (error: any) {
      toast('Failed to delete supplier: ' + error.message);
    }
  };

  const handleExport = () => {
    const exportData = filteredSuppliers.map(supplier => ({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      city: supplier.city,
      rating: supplier.rating || 'N/A',
    }));

    exportToCSV(exportData, `suppliers-export-${new Date().toISOString().split('T')[0]}.csv`);
    toast('Suppliers exported successfully');
  };

  return (
    <div className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Supplier Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your suppliers and vendor relationships
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={handleExport}
                  disabled={filteredSuppliers.length === 0}
                >
                  Export
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowAddDialog(true)}
                >
                  Add Supplier
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search by name, contact person, city, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                />
              </div>
            </div>

            {loading ? (
              <Card className="p-6">
                <TableSkeleton rows={8} />
              </Card>
            ) : filteredSuppliers.length === 0 ? (
              <Card className="p-12 text-center">
                <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {searchQuery ? 'No suppliers match your search.' : 'No suppliers found.'}
                </p>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-semibold">
                            {supplier.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {supplier.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {supplier.id.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{supplier.contactPerson}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{supplier.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{supplier.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{supplier.city}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.rating ? (
                          <Badge variant="success">
                            ⭐ {supplier.rating.toFixed(1)}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">Not rated</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Edit2 className="w-4 h-4" />}
                            onClick={() => handleEditSupplier(supplier)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            onClick={() => handleDeleteSupplier(supplier.id)}
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
                      Total Suppliers
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {suppliers.length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Truck className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Avg. Rating
                    </p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {suppliers.filter(s => s.rating).length > 0
                        ? (suppliers.reduce((acc, s) => acc + (s.rating || 0), 0) / suppliers.filter(s => s.rating).length).toFixed(1)
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <span className="text-3xl">⭐</span>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Cities
                    </p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {new Set(suppliers.map(s => s.city)).size}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Contacts
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {suppliers.length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </Card>
            </div>

      <AddSupplierDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />

      {selectedSupplier && (
        <EditSupplierDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedSupplier(null);
          }}
          supplier={selectedSupplier}
        />
      )}
    </div>
  );
}
