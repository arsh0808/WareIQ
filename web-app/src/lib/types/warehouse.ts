export interface Warehouse {
  id: string;
  name: string;
  location: string;
  address: string;
  manager: string;
  capacity: number;
  currentStock: number;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: any;
  updatedAt: any;
}

export interface WarehouseFormData {
  name: string;
  location: string;
  address: string;
  manager: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
}
