'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Warehouse } from '@/lib/types';
import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, Column } from '@/components/ui/DataTable';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Warehouse as WarehouseIcon, MapPin, User, Package, Edit, Trash2, Plus, Building2 } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';

export default function WarehousesPage() {
  const { user, userRole } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    capacity: 0,
  });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'warehouses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Warehouse[];
      setWarehouses(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenDialog = (warehouse?: Warehouse) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        location: warehouse.location,
        address: warehouse.address,
        city: warehouse.city || '',
        state: warehouse.state || '',
        zipCode: warehouse.zipCode || '',
        country: warehouse.country || '',
        capacity: warehouse.capacity,
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: '',
        location: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        capacity: 0,
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingWarehouse(null);
    setFormData({
      name: '',
      location: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      capacity: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingWarehouse) {
        await updateDoc(doc(db, 'warehouses', editingWarehouse.id), {
          ...formData,
          updatedAt: new Date(),
        });
        toast.success('Warehouse updated', 'Successfully updated warehouse details');
      } else {
        await addDoc(collection(db, 'warehouses'), {
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        toast.success('Warehouse created', 'Successfully created new warehouse');
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving warehouse:', error);
      toast.error('Failed to save', 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (warehouse: Warehouse) => {
    if (!confirm(`Are you sure you want to delete "${warehouse.name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'warehouses', warehouse.id));
      toast.success('Warehouse deleted', 'Successfully deleted warehouse');
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      toast.error('Failed to delete', 'Please try again');
    }
  };

  const filteredWarehouses = warehouses.filter(warehouse => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      warehouse.name.toLowerCase().includes(query) ||
      warehouse.location.toLowerCase().includes(query) ||
      warehouse.address?.toLowerCase().includes(query) ||
      warehouse.city?.toLowerCase().includes(query)
    );
  });

  const columns: Column<Warehouse>[] = [
    {
      key: 'name',
      header: 'Warehouse Name',
      sortable: true,
      render: (warehouse) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{warehouse.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{warehouse.location}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      sortable: true,
      render: (warehouse) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div>{warehouse.address}</div>
          {warehouse.city && (
            <div className="text-xs">{warehouse.city}, {warehouse.state} {warehouse.zipCode}</div>
          )}
        </div>
      ),
    },
    {
      key: 'capacity',
      header: 'Capacity',
      sortable: true,
      render: (warehouse) => (
        <div className="text-gray-900 dark:text-white">
          <div className="font-semibold">{warehouse.capacity}</div>
          <div className="text-xs text-gray-500">units</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (warehouse) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDialog(warehouse)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(warehouse)}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper allowedRoles={['admin', 'manager']}>
      <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Warehouses
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your warehouse locations and capacity
              </p>
            </div>
            <Button 
              variant="primary" 
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => handleOpenDialog()}
            >
              Add Warehouse
            </Button>
          </div>

          {}
          <div className="mb-6">
            <SearchInput
              placeholder="Search warehouses by name, location, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : filteredWarehouses.length === 0 ? (
            <Card className="p-12 text-center">
              <WarehouseIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                {searchQuery ? 'No warehouses match your search.' : 'No warehouses found.'}
              </p>
              {!searchQuery && (
                <Button 
                  variant="primary" 
                  onClick={() => handleOpenDialog()}
                  className="mt-4"
                >
                  Add Your First Warehouse
                </Button>
              )}
            </Card>
          ) : (
            <DataTable
              data={filteredWarehouses}
              columns={columns}
              keyExtractor={(warehouse) => warehouse.id}
              pageSize={10}
            />
          )}

          {}
          <Dialog open={showDialog} onClose={handleCloseDialog} size="lg">
            <DialogHeader>
              <DialogTitle>
                {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <DialogContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Warehouse Name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Main Warehouse"
                  />

                  <Input
                    label="Location"
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="New York, USA"
                  />
                </div>

                <Input
                  label="Address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="New York"
                  />

                  <Input
                    label="State"
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="NY"
                  />

                  <Input
                    label="Zip Code"
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    placeholder="10001"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Country"
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="USA"
                  />

                  <Input
                    label="Capacity (units)"
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    placeholder="10000"
                  />
                </div>
              </DialogContent>

              <DialogFooter>
                <Button 
                  type="submit" 
                  variant="primary"
                  isLoading={submitting}
                >
                  {editingWarehouse ? 'Update Warehouse' : 'Add Warehouse'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseDialog}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Dialog>
      </div>
    </PageWrapper>
  );
}
