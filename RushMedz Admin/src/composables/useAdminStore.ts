import { ref, computed } from 'vue';
import { useApi } from './useApi';

// Types matching React Native AdminDataContext
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

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  licenseNumber: string;
  hospital: string;
  rating: number;
  consultations: number;
  consultationFee: number;
  status: 'pending' | 'approved' | 'suspended';
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended';
  totalOrders: number;
  totalSpent: number;
  joinedAt: string;
}

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  merchant: string;
  date: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  activeMerchants: number;
  activeDrivers: number;
  totalUsers: number;
  totalDoctors: number;
  pendingOrders: number;
  completedToday: number;
  avgDeliveryTime: number;
}

// Global reactive state (simulating React Context)
const orders = ref<Order[]>([]);
const merchants = ref<Merchant[]>([]);
const drivers = ref<Driver[]>([]);
const doctors = ref<Doctor[]>([]);
const users = ref<User[]>([]);
const payments = ref<Payment[]>([]);
const metrics = ref<DashboardMetrics | null>(null);
const loading = ref(false);

// Initialize with mock data
const initializeMockData = () => {
  // Orders
  orders.value = [
    { id: 1001, customerName: 'John Smith', status: 'delivering', totalAmount: 850.50, items: 'Paracetamol, Biogesic', merchant: 'Mercury Drug - Makati', driver: 'Juan Dela Cruz', address: 'BGC, Taguig', createdAt: '2025-12-26T10:30:00' },
    { id: 1002, customerName: 'Maria Garcia', status: 'processing', totalAmount: 1250.75, items: 'Vitamin C, Amoxicillin', merchant: 'Watsons - BGC', driver: 'Assigning...', address: 'Makati Ave', createdAt: '2025-12-26T11:15:00' },
    { id: 1003, customerName: 'Pedro Santos', status: 'pending', totalAmount: 450.00, items: 'Biogesic', merchant: 'South Star - QC', driver: 'Not assigned', address: 'Quezon City', createdAt: '2025-12-26T11:45:00' },
    { id: 1004, customerName: 'Ana Lopez', status: 'completed', totalAmount: 2150.25, items: 'Paracetamol, Vitamin C, Amoxicillin', merchant: 'Mercury Drug - Makati', driver: 'Maria Santos', address: 'Pasig City', createdAt: '2025-12-26T09:20:00' },
    { id: 1005, customerName: 'Carlos Reyes', status: 'cancelled', totalAmount: 680.00, items: 'Loperamide', merchant: 'The Generics - Pasig', driver: 'None', address: 'Manila', createdAt: '2025-12-26T08:50:00' },
    { id: 1006, customerName: 'Lisa Tan', status: 'pending', totalAmount: 340.00, items: 'Biogesic', merchant: 'Mercury Drug - Makati', driver: 'Not assigned', address: 'Mandaluyong', createdAt: '2025-12-26T12:00:00' },
    { id: 1007, customerName: 'Robert Chen', status: 'processing', totalAmount: 920.50, items: 'Vitamin C, Zinc', merchant: 'Watsons - BGC', driver: 'Pedro Reyes', address: 'Pasay City', createdAt: '2025-12-26T12:15:00' },
  ];

  // Merchants
  merchants.value = [
    { id: 1, name: 'Mercury Drug - Makati', sales: 45320.50, status: 'active', location: 'Makati City', rating: 4.8, totalOrders: 342, contact: '+63 917 123 4567' },
    { id: 2, name: 'Watsons - BGC', sales: 38150.25, status: 'active', location: 'Bonifacio Global City', rating: 4.6, totalOrders: 289, contact: '+63 917 234 5678' },
    { id: 3, name: 'South Star Drug - Quezon City', sales: 32890.75, status: 'active', location: 'Quezon City', rating: 4.7, totalOrders: 256, contact: '+63 917 345 6789' },
    { id: 4, name: 'The Generics Pharmacy - Pasig', sales: 28450.00, status: 'active', location: 'Pasig City', rating: 4.5, totalOrders: 198, contact: '+63 917 456 7890' },
    { id: 5, name: 'Rose Pharmacy - Manila', sales: 25670.30, status: 'pending', location: 'Manila', rating: 4.4, totalOrders: 167, contact: '+63 917 567 8901' },
    { id: 6, name: 'ManilaMed Pharmacy', sales: 0, status: 'inactive', location: 'Ermita, Manila', rating: 0, totalOrders: 0, contact: '+63 917 678 9012' },
  ];

  // Drivers
  drivers.value = [
    { id: 1, name: 'Juan Dela Cruz', deliveries: 156, status: 'online', rating: 4.9, currentLocation: 'Makati Ave', earnings: 12450.50, vehicleType: 'Motorcycle' },
    { id: 2, name: 'Maria Santos', deliveries: 142, status: 'delivering', rating: 4.8, currentLocation: 'BGC', earnings: 11230.25, vehicleType: 'Motorcycle' },
    { id: 3, name: 'Pedro Reyes', deliveries: 128, status: 'online', rating: 4.7, currentLocation: 'Quezon City', earnings: 10890.75, vehicleType: 'Bicycle' },
    { id: 4, name: 'Ana Lim', deliveries: 119, status: 'delivering', rating: 4.9, currentLocation: 'Pasig City', earnings: 9670.00, vehicleType: 'Motorcycle' },
    { id: 5, name: 'Carlos Garcia', deliveries: 98, status: 'online', rating: 4.6, currentLocation: 'Manila', earnings: 8450.30, vehicleType: 'Car' },
    { id: 6, name: 'Lisa Mendoza', deliveries: 87, status: 'offline', rating: 4.5, currentLocation: 'Last: Ermita', earnings: 7234.50, vehicleType: 'Motorcycle' },
  ];

  // Doctors
  doctors.value = [
    { id: 1, name: 'Dr. Maria Santos', specialization: 'General Medicine', licenseNumber: 'PRC-12345', hospital: 'Makati Medical Center', rating: 4.9, consultations: 234, consultationFee: 800, status: 'approved' },
    { id: 2, name: 'Dr. Juan Reyes', specialization: 'Pediatrics', licenseNumber: 'PRC-23456', hospital: 'St. Lukes Medical Center', rating: 4.8, consultations: 189, consultationFee: 1000, status: 'approved' },
    { id: 3, name: 'Dr. Ana Garcia', specialization: 'Dermatology', licenseNumber: 'PRC-34567', hospital: 'Asian Hospital', rating: 4.7, consultations: 156, consultationFee: 1200, status: 'pending' },
    { id: 4, name: 'Dr. Pedro Lim', specialization: 'Internal Medicine', licenseNumber: 'PRC-45678', hospital: 'Manila Doctors', rating: 4.6, consultations: 178, consultationFee: 900, status: 'approved' },
  ];

  // Users
  users.value = [
    { id: 1, name: 'John Smith', email: 'john@email.com', phone: '+63 917 123 4567', status: 'active', totalOrders: 45, totalSpent: 18450.50, joinedAt: '2025-01-15' },
    { id: 2, name: 'Maria Garcia', email: 'maria@email.com', phone: '+63 917 234 5678', status: 'active', totalOrders: 38, totalSpent: 15230.25, joinedAt: '2025-02-20' },
    { id: 3, name: 'Pedro Santos', email: 'pedro@email.com', phone: '+63 917 345 6789', status: 'active', totalOrders: 28, totalSpent: 11890.75, joinedAt: '2025-03-10' },
    { id: 4, name: 'Ana Lopez', email: 'ana@email.com', phone: '+63 917 456 7890', status: 'suspended', totalOrders: 12, totalSpent: 5450.00, joinedAt: '2025-04-05' },
    { id: 5, name: 'Carlos Reyes', email: 'carlos@email.com', phone: '+63 917 567 8901', status: 'active', totalOrders: 52, totalSpent: 22340.30, joinedAt: '2025-01-08' },
  ];

  // Payments
  payments.value = [
    { id: 1, orderId: 1001, amount: 850.50, method: 'GCash', status: 'completed', merchant: 'Mercury Drug - Makati', date: '2025-12-26T10:30:00' },
    { id: 2, orderId: 1002, amount: 1250.75, method: 'PayMaya', status: 'processing', merchant: 'Watsons - BGC', date: '2025-12-26T11:15:00' },
    { id: 3, orderId: 1003, amount: 450.00, method: 'Cash', status: 'pending', merchant: 'South Star - QC', date: '2025-12-26T11:45:00' },
    { id: 4, orderId: 1004, amount: 2150.25, method: 'Credit Card', status: 'completed', merchant: 'Mercury Drug - Makati', date: '2025-12-26T09:20:00' },
    { id: 5, orderId: 1006, amount: 340.00, method: 'GCash', status: 'processing', merchant: 'Mercury Drug - Makati', date: '2025-12-26T12:00:00' },
  ];

  // Metrics
  metrics.value = {
    totalRevenue: 145250.50,
    totalOrders: 1247,
    activeMerchants: 5,
    activeDrivers: 4,
    totalUsers: 3842,
    totalDoctors: 127,
    pendingOrders: 17,
    completedToday: 83,
    avgDeliveryTime: 28,
  };
};

// Initialize data on first import
initializeMockData();

export const useAdminStore = () => {
  const { api } = useApi();

  // Computed values
  const pendingOrders = computed(() => orders.value.filter(o => o.status === 'pending'));
  const activeOrders = computed(() => orders.value.filter(o => o.status !== 'completed' && o.status !== 'cancelled'));
  const activeMerchantsCount = computed(() => merchants.value.filter(m => m.status === 'active').length);
  const onlineDriversCount = computed(() => drivers.value.filter(d => d.status === 'online' || d.status === 'delivering').length);

  // Order Management
  const refreshOrders = async () => {
    loading.value = true;
    try {
      // When backend is ready: const response = await api.get('/admin/orders');
      // For now, keeping mock data
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      loading.value = false;
    }
  };

  const updateOrderStatus = async (orderId: number, status: Order['status']) => {
    try {
      orders.value = orders.value.map(o => 
        o.id === orderId ? { ...o, status } : o
      );
      // When backend is ready: await api.put(`/admin/orders/${orderId}/status`, { status });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  };

  const assignDriverToOrder = async (orderId: number, driverId: number) => {
    try {
      const driver = drivers.value.find(d => d.id === driverId);
      if (driver) {
        orders.value = orders.value.map(o => 
          o.id === orderId ? { ...o, driver: driver.name, status: 'processing' } : o
        );
      }
      // When backend is ready: await api.put(`/admin/orders/${orderId}/assign-driver`, { driverId });
    } catch (error) {
      console.error('Error assigning driver:', error);
      throw error;
    }
  };

  const cancelOrder = async (orderId: number) => {
    try {
      orders.value = orders.value.map(o => 
        o.id === orderId ? { ...o, status: 'cancelled' } : o
      );
      // When backend is ready: await api.put(`/admin/orders/${orderId}/cancel`);
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  };

  // Merchant Management
  const refreshMerchants = async () => {
    loading.value = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      // When backend is ready: const response = await api.get('/admin/merchants');
    } catch (error) {
      console.error('Error refreshing merchants:', error);
    } finally {
      loading.value = false;
    }
  };

  const updateMerchantStatus = async (merchantId: number, status: Merchant['status']) => {
    try {
      merchants.value = merchants.value.map(m => 
        m.id === merchantId ? { ...m, status } : m
      );
      // When backend is ready: await api.put(`/admin/merchants/${merchantId}/status`, { status });
    } catch (error) {
      console.error('Error updating merchant status:', error);
      throw error;
    }
  };

  const removeMerchant = async (merchantId: number) => {
    try {
      merchants.value = merchants.value.filter(m => m.id !== merchantId);
      // When backend is ready: await api.delete(`/admin/merchants/${merchantId}`);
    } catch (error) {
      console.error('Error removing merchant:', error);
      throw error;
    }
  };

  // Driver Management
  const refreshDrivers = async () => {
    loading.value = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      // When backend is ready: const response = await api.get('/admin/drivers');
    } catch (error) {
      console.error('Error refreshing drivers:', error);
    } finally {
      loading.value = false;
    }
  };

  const updateDriverStatus = async (driverId: number, status: Driver['status']) => {
    try {
      drivers.value = drivers.value.map(d => 
        d.id === driverId ? { ...d, status } : d
      );
      // When backend is ready: await api.put(`/admin/drivers/${driverId}/status`, { status });
    } catch (error) {
      console.error('Error updating driver status:', error);
      throw error;
    }
  };

  const removeDriver = async (driverId: number) => {
    try {
      drivers.value = drivers.value.filter(d => d.id !== driverId);
      // When backend is ready: await api.delete(`/admin/drivers/${driverId}`);
    } catch (error) {
      console.error('Error removing driver:', error);
      throw error;
    }
  };

  // Doctor Management
  const approveDoctorAction = async (doctorId: number) => {
    try {
      doctors.value = doctors.value.map(d => 
        d.id === doctorId ? { ...d, status: 'approved' } : d
      );
      // When backend is ready: await api.put(`/admin/doctors/${doctorId}/approve`);
    } catch (error) {
      console.error('Error approving doctor:', error);
      throw error;
    }
  };

  const suspendDoctor = async (doctorId: number) => {
    try {
      doctors.value = doctors.value.map(d => 
        d.id === doctorId ? { ...d, status: 'suspended' } : d
      );
      // When backend is ready: await api.put(`/admin/doctors/${doctorId}/suspend`);
    } catch (error) {
      console.error('Error suspending doctor:', error);
      throw error;
    }
  };

  // User Management
  const suspendUser = async (userId: number) => {
    try {
      users.value = users.value.map(u => 
        u.id === userId ? { ...u, status: 'suspended' } : u
      );
      // When backend is ready: await api.put(`/admin/users/${userId}/suspend`);
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  };

  const activateUser = async (userId: number) => {
    try {
      users.value = users.value.map(u => 
        u.id === userId ? { ...u, status: 'active' } : u
      );
      // When backend is ready: await api.put(`/admin/users/${userId}/activate`);
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  };

  // Payment Management
  const processPaymentAction = async (paymentId: number) => {
    try {
      payments.value = payments.value.map(p => 
        p.id === paymentId ? { ...p, status: 'completed' } : p
      );
      // When backend is ready: await api.post(`/admin/payments/${paymentId}/process`);
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  };

  const refundPayment = async (paymentId: number) => {
    try {
      payments.value = payments.value.map(p => 
        p.id === paymentId ? { ...p, status: 'failed' } : p
      );
      // When backend is ready: await api.post(`/admin/payments/${paymentId}/refund`);
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  };

  return {
    // State
    orders,
    merchants,
    drivers,
    doctors,
    users,
    payments,
    metrics,
    loading,
    
    // Computed
    pendingOrders,
    activeOrders,
    activeMerchantsCount,
    onlineDriversCount,
    
    // Methods - Orders
    refreshOrders,
    updateOrderStatus,
    assignDriverToOrder,
    cancelOrder,
    
    // Methods - Merchants
    refreshMerchants,
    updateMerchantStatus,
    removeMerchant,
    
    // Methods - Drivers
    refreshDrivers,
    updateDriverStatus,
    removeDriver,
    
    // Methods - Doctors
    approveDoctorAction,
    suspendDoctor,
    
    // Methods - Users
    suspendUser,
    activateUser,
    
    // Methods - Payments
    processPaymentAction,
    refundPayment,
  };
};
