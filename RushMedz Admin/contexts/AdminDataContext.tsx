import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { eventBus } from '../services/eventBus';

export interface Order {
  id: number;
  customerName: string;
  status: 'pending' | 'processing' | 'delivering' | 'completed' | 'cancelled';
  totalAmount: number;
  items: string;
  merchant: string;
  driver: string;
  address: string;
  createdAt: string;
}

export interface Merchant {
  id: number;
  name: string;
  sales: number;
  status: 'active' | 'inactive' | 'pending';
  location: string;
  rating: number;
  totalOrders: number;
  contact: string;
}

export interface Driver {
  id: number;
  name: string;
  deliveries: number;
  status: 'online' | 'offline' | 'delivering';
  rating: number;
  currentLocation: string;
  earnings: number;
  vehicleType: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  activeMerchants: number;
  activeDrivers: number;
  totalUsers: number;
  pendingOrders: number;
  completedToday: number;
  avgDeliveryTime: number;
}

interface AdminDataContextType {
  orders: Order[];
  merchants: Merchant[];
  drivers: Driver[];
  metrics: DashboardMetrics | null;
  loading: boolean;
  refreshOrders: () => Promise<void>;
  refreshMerchants: () => Promise<void>;
  refreshDrivers: () => Promise<void>;
  updateOrderStatus: (orderId: number, status: Order['status']) => Promise<void>;
  assignDriver: (orderId: number, driverId: number) => Promise<void>;
  cancelOrder: (orderId: number) => Promise<void>;
  updateMerchantStatus: (merchantId: number, status: Merchant['status']) => Promise<void>;
  addMerchant: (merchant: Omit<Merchant, 'id'>) => Promise<void>;
  removeMerchant: (merchantId: number) => Promise<void>;
  addDriver: (driver: Omit<Driver, 'id'>) => Promise<void>;
  removeDriver: (driverId: number) => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize data
  useEffect(() => {
    loadAllData();
    setupEventListeners();
  }, []);

  const setupEventListeners = () => {
    const unsubAccepted = eventBus.subscribe('orderAccepted', ({ orderId, driverId }) => {
      setOrders(prev => prev.map(o => o.id === Number(orderId.replace('order-', '')) ? { ...o, status: 'processing' as const } : o));
    });
    const unsubStatus = eventBus.subscribe('orderStatusChanged', ({ orderId, status }) => {
      setOrders(prev => prev.map(o => o.id === Number(orderId.replace('order-', '')) ? { ...o, status: status as any } : o));
    });
    const unsubCompleted = eventBus.subscribe('orderCompleted', ({ orderId }) => {
      setOrders(prev => prev.map(o => o.id === Number(orderId.replace('order-', '')) ? { ...o, status: 'completed' as const } : o));
    });
    return () => { unsubAccepted(); unsubStatus(); unsubCompleted(); };
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([refreshOrders(), refreshMerchants(), refreshDrivers(), calculateMetrics()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = async () => {
    try {
      // For now, using mock data. Replace with: const data = await api.orders.getAll();
      await new Promise(resolve => setTimeout(resolve, 500));
      setOrders([
        { id: 1001, customerName: 'John Smith', status: 'delivering', totalAmount: 850.50, items: 'Paracetamol, Biogesic', merchant: 'Mercury Drug - Makati', driver: 'Juan Dela Cruz', address: 'BGC, Taguig', createdAt: '2025-11-29T10:30:00' },
        { id: 1002, customerName: 'Maria Garcia', status: 'processing', totalAmount: 1250.75, items: 'Vitamin C, Amoxicillin', merchant: 'Watsons - BGC', driver: 'Assigning...', address: 'Makati Ave', createdAt: '2025-11-29T11:15:00' },
        { id: 1003, customerName: 'Pedro Santos', status: 'pending', totalAmount: 450.00, items: 'Biogesic', merchant: 'South Star - QC', driver: 'Not assigned', address: 'Quezon City', createdAt: '2025-11-29T11:45:00' },
        { id: 1004, customerName: 'Ana Lopez', status: 'completed', totalAmount: 2150.25, items: 'Paracetamol, Vitamin C, Amoxicillin', merchant: 'Mercury Drug - Makati', driver: 'Maria Santos', address: 'Pasig City', createdAt: '2025-11-29T09:20:00' },
        { id: 1005, customerName: 'Carlos Reyes', status: 'cancelled', totalAmount: 680.00, items: 'Loperamide', merchant: 'The Generics - Pasig', driver: 'None', address: 'Manila', createdAt: '2025-11-29T08:50:00' },
      ]);
    } catch (error) {
      console.error('Error refreshing orders:', error);
    }
  };

  const refreshMerchants = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setMerchants([
        { id: 1, name: '🏪 Mercury Drug - Makati', sales: 45320.50, status: 'active', location: 'Makati City', rating: 4.8, totalOrders: 342, contact: '+63 917 123 4567' },
        { id: 2, name: '🏪 Watsons - BGC', sales: 38150.25, status: 'active', location: 'Bonifacio Global City', rating: 4.6, totalOrders: 289, contact: '+63 917 234 5678' },
        { id: 3, name: '🏪 South Star Drug - Quezon City', sales: 32890.75, status: 'active', location: 'Quezon City', rating: 4.7, totalOrders: 256, contact: '+63 917 345 6789' },
        { id: 4, name: '🏪 The Generics Pharmacy - Pasig', sales: 28450.00, status: 'active', location: 'Pasig City', rating: 4.5, totalOrders: 198, contact: '+63 917 456 7890' },
        { id: 5, name: '🏪 Rose Pharmacy - Manila', sales: 25670.30, status: 'pending', location: 'Manila', rating: 4.4, totalOrders: 167, contact: '+63 917 567 8901' },
        { id: 6, name: '🏪 ManilaMed Pharmacy', sales: 0, status: 'inactive', location: 'Ermita, Manila', rating: 0, totalOrders: 0, contact: '+63 917 678 9012' },
      ]);
    } catch (error) {
      console.error('Error refreshing merchants:', error);
    }
  };

  const refreshDrivers = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setDrivers([
        { id: 1, name: '🚗 Juan Dela Cruz', deliveries: 156, status: 'online', rating: 4.9, currentLocation: 'Makati Ave', earnings: 12450.50, vehicleType: 'Motorcycle' },
        { id: 2, name: '🚗 Maria Santos', deliveries: 142, status: 'delivering', rating: 4.8, currentLocation: 'BGC', earnings: 11230.25, vehicleType: 'Motorcycle' },
        { id: 3, name: '🚗 Pedro Reyes', deliveries: 128, status: 'online', rating: 4.7, currentLocation: 'Quezon City', earnings: 10890.75, vehicleType: 'Bicycle' },
        { id: 4, name: '🚗 Ana Lim', deliveries: 119, status: 'delivering', rating: 4.9, currentLocation: 'Pasig City', earnings: 9670.00, vehicleType: 'Motorcycle' },
        { id: 5, name: '🚗 Carlos Garcia', deliveries: 98, status: 'online', rating: 4.6, currentLocation: 'Manila', earnings: 8450.30, vehicleType: 'Car' },
        { id: 6, name: '🚗 Lisa Mendoza', deliveries: 87, status: 'offline', rating: 4.5, currentLocation: 'Last: Ermita', earnings: 7234.50, vehicleType: 'Motorcycle' },
      ]);
    } catch (error) {
      console.error('Error refreshing drivers:', error);
    }
  };

  const calculateMetrics = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setMetrics({
        totalRevenue: 145250.50,
        totalOrders: 1247,
        activeMerchants: 5,
        activeDrivers: 4,
        totalUsers: 3842,
        pendingOrders: 17,
        completedToday: 83,
        avgDeliveryTime: 28,
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  const updateOrderStatus = async (orderId: number, status: Order['status']) => {
    try {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      eventBus.publish('orderStatusChanged', { orderId: `order-${orderId}`, status });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const assignDriver = async (orderId: number, driverId: number) => {
    try {
      const driver = drivers.find(d => d.id === driverId);
      if (driver) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, driver: driver.name, status: 'processing' } : o));
        eventBus.publish('orderAccepted', { orderId: `order-${orderId}`, driverId: `driver-${driverId}` });
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
    }
  };

  const cancelOrder = async (orderId: number) => {
    try {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const updateMerchantStatus = async (merchantId: number, status: Merchant['status']) => {
    try {
      setMerchants(prev => prev.map(m => m.id === merchantId ? { ...m, status } : m));
    } catch (error) {
      console.error('Error updating merchant status:', error);
    }
  };

  const addMerchant = async (merchantData: Omit<Merchant, 'id'>) => {
    try {
      const newId = Math.max(0, ...merchants.map(m => m.id)) + 1;
      const newMerchant: Merchant = {
        id: newId,
        ...merchantData,
      };
      setMerchants(prev => [...prev, newMerchant]);
    } catch (error) {
      console.error('Error adding merchant:', error);
      throw error;
    }
  };

  const removeMerchant = async (merchantId: number) => {
    try {
      setMerchants(prev => prev.filter(m => m.id !== merchantId));
    } catch (error) {
      console.error('Error removing merchant:', error);
      throw error;
    }
  };

  const addDriver = async (driverData: Omit<Driver, 'id'>) => {
    try {
      const newId = Math.max(0, ...drivers.map(d => d.id)) + 1;
      const newDriver: Driver = {
        id: newId,
        ...driverData,
      };
      setDrivers(prev => [...prev, newDriver]);
    } catch (error) {
      console.error('Error adding driver:', error);
      throw error;
    }
  };

  const removeDriver = async (driverId: number) => {
    try {
      setDrivers(prev => prev.filter(d => d.id !== driverId));
    } catch (error) {
      console.error('Error removing driver:', error);
      throw error;
    }
  };

  return (
    <AdminDataContext.Provider
      value={{
        orders,
        merchants,
        drivers,
        metrics,
        loading,
        refreshOrders,
        refreshMerchants,
        refreshDrivers,
        updateOrderStatus,
        assignDriver,
        cancelOrder,
        updateMerchantStatus,
        addMerchant,
        removeMerchant,
        addDriver,
        removeDriver,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
};
