'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { generateApiKey, hashApiKey } from '@/lib/utils/security';
import type { IoTDevice } from '@/lib/types';
import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { SearchInput } from '@/components/ui/SearchInput';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Radio, Battery, Wifi, WifiOff, Plus, Copy, CheckCircle } from 'lucide-react';
import toast from '@/lib/hooks/useToast';

export default function DevicesPage() {
  const { user, userRole } = useAuth();
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    deviceType: 'weight_sensor' as const,
    shelfId: '',
    name: '',
  });
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);

  useEffect(() => {
    if (!userRole?.warehouseId) return;

    const devicesQuery = query(
      collection(db, 'iot-devices'),
      where('warehouseId', '==', userRole.warehouseId)
    );

    const unsubscribe = onSnapshot(devicesQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as IoTDevice[];
      setDevices(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole]);

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRole?.warehouseId) return;

    const apiKey = generateApiKey();
    const apiKeyHash = hashApiKey(apiKey);

    try {
      await addDoc(collection(db, 'iot-devices'), {
        deviceId: newDevice.deviceId,
        deviceType: newDevice.deviceType,
        warehouseId: userRole.warehouseId,
        shelfId: newDevice.shelfId,
        name: newDevice.name,
        apiKeyHash,
        status: 'offline',
        batteryLevel: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setGeneratedApiKey(apiKey);
      toast.success('Device added successfully!', 'Save the API key securely');
      setNewDevice({
        deviceId: '',
        deviceType: 'weight_sensor',
        shelfId: '',
        name: '',
      });
    } catch (error) {
      console.error('Error adding device:', error);
      toast.error('Failed to add device', 'Please try again');
    }
  };

  const copyApiKey = () => {
    if (generatedApiKey) {
      navigator.clipboard.writeText(generatedApiKey);
      toast.success('Copied!', 'API key copied to clipboard');
    }
  };

  const filteredDevices = devices.filter(device => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      device.deviceId.toLowerCase().includes(query) ||
      device.name?.toLowerCase().includes(query) ||
      device.shelfId.toLowerCase().includes(query) ||
      device.deviceType.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <PageWrapper allowedRoles={['admin', 'manager']}>
      <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                IoT Devices
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and monitor your IoT sensors and devices
              </p>
            </div>
            <Button 
              variant="primary" 
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowModal(true)}
            >
              Add Device
            </Button>
          </div>

          {}
          <div className="mb-6">
            <SearchInput
              placeholder="Search by device ID, name, or shelf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : filteredDevices.length === 0 ? (
            <Card className="p-12 text-center">
              <Radio className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                {searchQuery ? 'No devices match your search.' : 'No devices found.'}
              </p>
              {!searchQuery && (
                <Button 
                  variant="primary" 
                  onClick={() => setShowModal(true)}
                  className="mt-4"
                >
                  Add Your First Device
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDevices.map((device) => (
                <Card key={device.id} hover>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                          {device.name || device.deviceId}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                          {device.deviceType.replace('_', ' ')}
                        </p>
                      </div>
                      <Badge variant={device.status === 'online' ? 'success' : 'danger'}>
                        {device.status === 'online' ? (
                          <Wifi className="w-3 h-3 mr-1" />
                        ) : (
                          <WifiOff className="w-3 h-3 mr-1" />
                        )}
                        {device.status}
                      </Badge>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Device ID:</span>
                        <span className="font-mono text-gray-900 dark:text-white text-xs">
                          {device.deviceId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Shelf:</span>
                        <Badge variant="default">{device.shelfId}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Battery:</span>
                        <div className="flex items-center gap-2">
                          <Battery className={`w-4 h-4 ${getBatteryColor(device.batteryLevel || 0)}`} />
                          <span className={`font-semibold ${getBatteryColor(device.batteryLevel || 0)}`}>
                            {device.batteryLevel || 0}%
                          </span>
                        </div>
                      </div>
                      {device.lastHeartbeat && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Last seen: {new Date(
                              typeof device.lastHeartbeat === 'object' && 'seconds' in device.lastHeartbeat
                                ? device.lastHeartbeat.seconds * 1000
                                : device.lastHeartbeat
                            ).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {}
          <Dialog open={showModal} onClose={() => { setShowModal(false); setGeneratedApiKey(null); }}>
            <DialogHeader>
              <DialogTitle>
                {generatedApiKey ? 'Device Added Successfully!' : 'Add New Device'}
              </DialogTitle>
            </DialogHeader>

            {generatedApiKey ? (
              <>
                <DialogContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-green-800 dark:text-green-200 font-semibold mb-1">
                            Save this API key securely!
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            You won't be able to see it again.
                          </p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-3 rounded border border-green-300 dark:border-green-700">
                        <p className="font-mono text-sm break-all text-gray-900 dark:text-white">
                          {generatedApiKey}
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
                <DialogFooter>
                  <Button
                    variant="primary"
                    onClick={copyApiKey}
                    leftIcon={<Copy className="w-4 h-4" />}
                  >
                    Copy API Key
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowModal(false);
                      setGeneratedApiKey(null);
                    }}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <form onSubmit={handleAddDevice}>
                <DialogContent className="space-y-4">
                  <Input
                    label="Device ID"
                    type="text"
                    required
                    value={newDevice.deviceId}
                    onChange={(e) => setNewDevice({ ...newDevice, deviceId: e.target.value })}
                    placeholder="device-001"
                  />

                  <Input
                    label="Device Name"
                    type="text"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    placeholder="Warehouse Sensor #1"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Device Type
                    </label>
                    <select
                      value={newDevice.deviceType}
                      onChange={(e) => setNewDevice({ ...newDevice, deviceType: e.target.value as any })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="weight_sensor">Weight Sensor</option>
                      <option value="temperature_sensor">Temperature Sensor</option>
                      <option value="rfid_reader">RFID Reader</option>
                      <option value="barcode_scanner">Barcode Scanner</option>
                    </select>
                  </div>

                  <Input
                    label="Shelf ID"
                    type="text"
                    required
                    value={newDevice.shelfId}
                    onChange={(e) => setNewDevice({ ...newDevice, shelfId: e.target.value })}
                    placeholder="shelf-A1"
                  />
                </DialogContent>
                <DialogFooter>
                  <Button type="submit" variant="primary">
                    Add Device
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </form>
            )}
          </Dialog>

          {/* Device Stats */}
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Total Devices
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {devices.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Radio className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Online
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {devices.filter(d => d.status === 'online').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Wifi className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Offline
                  </p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {devices.filter(d => d.status === 'offline').length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </Card>
          </div>
      </div>
    </PageWrapper>
  );
}
