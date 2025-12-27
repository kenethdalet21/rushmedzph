import { ref } from 'vue';
import { useApi } from './useApi';

export const useAdmin = () => {
  const { api } = useApi();
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Dashboard metrics
  const getDashboardMetrics = async () => {
    loading.value = true;
    try {
      const response = await api.get('/admin/dashboard/metrics');
      return response.data;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Merchant Management
  const getMerchants = async () => {
    const response = await api.get('/admin/merchants');
    return response.data;
  };

  const approveMerchant = async (merchantId: number) => {
    const response = await api.put(`/admin/merchants/${merchantId}/approve`);
    return response.data;
  };

  const suspendMerchant = async (merchantId: number) => {
    const response = await api.put(`/admin/merchants/${merchantId}/suspend`);
    return response.data;
  };

  // Driver Management
  const getDrivers = async () => {
    const response = await api.get('/admin/drivers');
    return response.data;
  };

  const approveDriver = async (driverId: number) => {
    const response = await api.put(`/admin/drivers/${driverId}/approve`);
    return response.data;
  };

  const suspendDriver = async (driverId: number) => {
    const response = await api.put(`/admin/drivers/${driverId}/suspend`);
    return response.data;
  };

  // Doctor Management
  const getDoctors = async () => {
    const response = await api.get('/admin/doctors');
    return response.data;
  };

  const approveDoctor = async (doctorId: number) => {
    const response = await api.put(`/admin/doctors/${doctorId}/approve`);
    return response.data;
  };

  const suspendDoctor = async (doctorId: number) => {
    const response = await api.put(`/admin/doctors/${doctorId}/suspend`);
    return response.data;
  };

  // Order Management
  const getOrders = async () => {
    const response = await api.get('/admin/orders');
    return response.data;
  };

  const getOrderById = async (orderId: number) => {
    const response = await api.get(`/admin/orders/${orderId}`);
    return response.data;
  };

  // User Management
  const getUsers = async () => {
    const response = await api.get('/admin/users');
    return response.data;
  };

  // Payment Management
  const getPayments = async () => {
    const response = await api.get('/admin/payments');
    return response.data;
  };

  const processPayment = async (paymentId: number) => {
    const response = await api.post(`/admin/payments/${paymentId}/process`);
    return response.data;
  };

  // Analytics
  const getSalesAnalytics = async (startDate: string, endDate: string) => {
    const response = await api.get('/admin/analytics/sales', {
      params: { startDate, endDate },
    });
    return response.data;
  };

  // Wallet Management
  const getWalletTopUps = async () => {
    const response = await api.get('/admin/wallet/topups');
    return response.data;
  };

  const approveTopUp = async (topUpId: number) => {
    const response = await api.put(`/admin/wallet/topups/${topUpId}/approve`);
    return response.data;
  };

  const rejectTopUp = async (topUpId: number) => {
    const response = await api.put(`/admin/wallet/topups/${topUpId}/reject`);
    return response.data;
  };

  // Push Notifications
  const sendPushNotification = async (data: {
    title: string;
    message: string;
    target: string;
  }) => {
    const response = await api.post('/admin/notifications/send', data);
    return response.data;
  };

  const getNotificationHistory = async () => {
    const response = await api.get('/admin/notifications/history');
    return response.data;
  };

  // System Configuration
  const getSystemConfig = async () => {
    const response = await api.get('/admin/config');
    return response.data;
  };

  const updateSystemConfig = async (configId: number, value: any) => {
    const response = await api.put(`/admin/config/${configId}`, { value });
    return response.data;
  };

  return {
    loading,
    error,
    getDashboardMetrics,
    getMerchants,
    approveMerchant,
    suspendMerchant,
    getDrivers,
    approveDriver,
    suspendDriver,
    getDoctors,
    approveDoctor,
    suspendDoctor,
    getOrders,
    getOrderById,
    getUsers,
    getPayments,
    processPayment,
    getSalesAnalytics,
    getWalletTopUps,
    approveTopUp,
    rejectTopUp,
    sendPushNotification,
    getNotificationHistory,
    getSystemConfig,
    updateSystemConfig,
  };
};
