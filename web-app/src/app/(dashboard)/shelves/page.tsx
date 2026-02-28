'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserRole, type UserRole } from '@/lib/firebase/auth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Grid3x3, Plus, Edit2, Trash2, Package, MapPin, Layers } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';
import { AddShelfDialog } from '@/components/AddShelfDialog';
import { EditShelfDialog } from '@/components/EditShelfDialog';

interface Shelf {
  id: string;
  warehouseId: string;
  shelfCode: string;
  zone: string;
  row: number;
  column: number;
  level: number;
  maxCapacity: number;
  maxWeight: number;
  currentWeight: number;
  status: 'active' | 'maintenance' | 'inactive';
  deviceIds: string[];
  createdAt: any;
  updatedAt: any;
}

export default function ShelvesPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [filteredShelves, setFilteredShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<Shelf | null>(null);

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

    const shelvesQuery = query(
      collection(db, 'shelves'),
      where('warehouseId', '==', userRole.warehouseId)
    );

    const unsubscribe = onSnapshot(shelvesQuery, (snapshot) => {
      const shelvesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Shelf[];

      setShelves(shelvesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole]);

  useEffect(() => {
    let filtered = shelves;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(shelf => shelf.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shelf =>
        shelf.shelfCode.toLowerCase().includes(query) ||
        shelf.zone.toLowerCase().includes(query)
      );
    }

    setFilteredShelves(filtered);
  }, [shelves, searchQuery, statusFilter]);

  const handleEditShelf = (shelf: Shelf) => {
    setSelectedShelf(shelf);
    setShowEditDialog(true);
  };

  const handleDeleteShelf = async (shelfId: string) => {
    if (!confirm('Are you sure you want to delete this shelf?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'shelves', shelfId));
      toast('Shelf deleted successfully');
    } catch (error: any) {
      toast('Failed to delete shelf: ' + error.message);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'maintenance': return 'warning';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const getUtilizationColor = (currentWeight: number, maxWeight: number) => {
    const percent = (currentWeight / maxWeight) * 100;
    if (percent >= 90) return 'text-red-600 dark:text-red-400';
    if (percent >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Shelf Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Organize and monitor warehouse shelving units
                </p>
              </div>
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAddDialog(true)}
              >
                Add Shelf
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search by shelf code or zone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setStatusFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'maintenance' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setStatusFilter('maintenance')}
                >
                  Maintenance
                </Button>
                <Button
                  variant={statusFilter === 'inactive' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setStatusFilter('inactive')}
                >
                  Inactive
                </Button>
              </div>
            </div>

            {loading ? (
              <Card className="p-6">
                <TableSkeleton rows={8} />
              </Card>
            ) : filteredShelves.length === 0 ? (
              <Card className="p-12 text-center">
                <Grid3x3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {searchQuery ? 'No shelves match your search.' : 'No shelves found. Add your first shelf!'}
                </p>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shelf Code</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Devices</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShelves.map((shelf) => {
                    const utilizationPercent = (shelf.currentWeight / shelf.maxWeight) * 100;
                    return (
                      <TableRow key={shelf.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Grid3x3 className="w-5 h-5 text-gray-400" />
                            <span className="font-mono font-semibold">{shelf.shelfCode}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{shelf.zone}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Row {shelf.row}, Col {shelf.column}</div>
                            <div className="text-gray-500">Level {shelf.level}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{shelf.maxCapacity} items</span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className={getUtilizationColor(shelf.currentWeight, shelf.maxWeight)}>
                              {shelf.currentWeight.toFixed(1)} / {shelf.maxWeight} kg
                            </div>
                            <div className="text-gray-500">
                              {utilizationPercent.toFixed(0)}% utilized
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="info">
                            {shelf.deviceIds?.length || 0} devices
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(shelf.status)}>
                            {shelf.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Edit2 className="w-4 h-4" />}
                              onClick={() => handleEditShelf(shelf)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              leftIcon={<Trash2 className="w-4 h-4" />}
                              onClick={() => handleDeleteShelf(shelf.id)}
                            >
                              Delete
                            </Button>
                          </div>
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
                      Total Shelves
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {shelves.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Layers className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Active
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {shelves.filter(s => s.status === 'active').length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Grid3x3 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Maintenance
                    </p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {shelves.filter(s => s.status === 'maintenance').length}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Package className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Avg. Utilization
                    </p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {shelves.length > 0
                        ? (shelves.reduce((acc, s) => acc + (s.currentWeight / s.maxWeight) * 100, 0) / shelves.length).toFixed(0)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Layers className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </Card>
            </div>

      <AddShelfDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        warehouseId={userRole?.warehouseId || ''}
      />

      {selectedShelf && (
        <EditShelfDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedShelf(null);
          }}
          shelf={selectedShelf}
        />
      )}
    </div>
  );
}
