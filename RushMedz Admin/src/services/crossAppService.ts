/**
 * Cross-App Service
 * Provides unified communication between Admin app and all other apps
 * (DoctorApp, DriverApp, MerchantApp, UserApp)
 */

import { APP_URLS, APP_INFO, DEEP_LINK_SCHEMES, type AppType } from '../config/appConfig';
import axios from 'axios';

const API_BASE = APP_URLS.api;

// Get auth token
const getToken = () => localStorage.getItem('adminToken');

// Create authenticated axios instance
const createApiClient = () => {
  const client = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
};

const api = createApiClient();

/**
 * Doctor App Service
 * Manage doctors, appointments, and prescriptions from Admin
 */
export const doctorAppService = {
  // Get all doctors
  async getDoctors() {
    try {
      const response = await api.get('/api/doctors');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      return [];
    }
  },

  // Get doctor by ID
  async getDoctor(id: string | number) {
    try {
      const response = await api.get(`/api/doctors/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch doctor ${id}:`, error);
      return null;
    }
  },

  // Approve doctor registration
  async approveDoctor(id: string | number) {
    try {
      const response = await api.put(`/api/doctors/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Failed to approve doctor ${id}:`, error);
      throw error;
    }
  },

  // Suspend doctor
  async suspendDoctor(id: string | number, reason: string) {
    try {
      const response = await api.put(`/api/doctors/${id}/suspend`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Failed to suspend doctor ${id}:`, error);
      throw error;
    }
  },

  // Get doctor's appointments
  async getDoctorAppointments(doctorId: string | number) {
    try {
      const response = await api.get(`/api/doctors/${doctorId}/appointments`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch appointments for doctor ${doctorId}:`, error);
      return [];
    }
  },

  // Get all prescriptions pending review
  async getPendingPrescriptions() {
    try {
      const response = await api.get('/api/prescriptions?status=pending');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch pending prescriptions:', error);
      return [];
    }
  },

  // Get doctor statistics
  async getDoctorStats() {
    try {
      const response = await api.get('/api/doctors/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch doctor stats:', error);
      return { totalDoctors: 0, activeDoctors: 0, pendingApproval: 0, totalConsultations: 0 };
    }
  },
};

/**
 * Driver App Service
 * Manage drivers, deliveries, and earnings from Admin
 */
export const driverAppService = {
  // Get all drivers
  async getDrivers() {
    try {
      const response = await api.get('/api/drivers');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      return [];
    }
  },

  // Get driver by ID
  async getDriver(id: string | number) {
    try {
      const response = await api.get(`/api/drivers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch driver ${id}:`, error);
      return null;
    }
  },

  // Get online drivers
  async getOnlineDrivers() {
    try {
      const response = await api.get('/api/drivers?status=online');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch online drivers:', error);
      return [];
    }
  },

  // Get driver's active deliveries
  async getDriverDeliveries(driverId: string | number) {
    try {
      const response = await api.get(`/api/drivers/${driverId}/deliveries`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch deliveries for driver ${driverId}:`, error);
      return [];
    }
  },

  // Get driver earnings
  async getDriverEarnings(driverId: string | number, period?: 'today' | 'week' | 'month') {
    try {
      const query = period ? `?period=${period}` : '';
      const response = await api.get(`/api/drivers/${driverId}/earnings${query}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch earnings for driver ${driverId}:`, error);
      return { today: 0, week: 0, month: 0, total: 0 };
    }
  },

  // Suspend driver
  async suspendDriver(id: string | number, reason: string) {
    try {
      const response = await api.put(`/api/drivers/${id}/suspend`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Failed to suspend driver ${id}:`, error);
      throw error;
    }
  },

  // Activate driver
  async activateDriver(id: string | number) {
    try {
      const response = await api.put(`/api/drivers/${id}/activate`);
      return response.data;
    } catch (error) {
      console.error(`Failed to activate driver ${id}:`, error);
      throw error;
    }
  },

  // Get driver statistics
  async getDriverStats() {
    try {
      const response = await api.get('/api/drivers/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch driver stats:', error);
      return { totalDrivers: 0, onlineDrivers: 0, activeDeliveries: 0, completedToday: 0 };
    }
  },
};

/**
 * Merchant App Service
 * Manage merchants, products, and orders from Admin
 */
export const merchantAppService = {
  // Get all merchants
  async getMerchants() {
    try {
      const response = await api.get('/api/merchants');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
      return [];
    }
  },

  // Get merchant by ID
  async getMerchant(id: string | number) {
    try {
      const response = await api.get(`/api/merchants/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch merchant ${id}:`, error);
      return null;
    }
  },

  // Get merchant products
  async getMerchantProducts(merchantId: string | number) {
    try {
      const response = await api.get(`/api/merchants/${merchantId}/products`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch products for merchant ${merchantId}:`, error);
      return [];
    }
  },

  // Get merchant orders
  async getMerchantOrders(merchantId: string | number, status?: string) {
    try {
      const query = status ? `?status=${status}` : '';
      const response = await api.get(`/api/merchants/${merchantId}/orders${query}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch orders for merchant ${merchantId}:`, error);
      return [];
    }
  },

  // Approve merchant
  async approveMerchant(id: string | number) {
    try {
      const response = await api.put(`/api/merchants/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error(`Failed to approve merchant ${id}:`, error);
      throw error;
    }
  },

  // Suspend merchant
  async suspendMerchant(id: string | number, reason: string) {
    try {
      const response = await api.put(`/api/merchants/${id}/suspend`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Failed to suspend merchant ${id}:`, error);
      throw error;
    }
  },

  // Get merchant payout requests
  async getMerchantPayouts(merchantId?: string | number) {
    try {
      const endpoint = merchantId ? `/api/merchants/${merchantId}/payouts` : '/api/payouts';
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch merchant payouts:', error);
      return [];
    }
  },

  // Process payout
  async processPayout(payoutId: string | number, action: 'approve' | 'reject', reason?: string) {
    try {
      const response = await api.put(`/api/payouts/${payoutId}/${action}`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Failed to ${action} payout ${payoutId}:`, error);
      throw error;
    }
  },

  // Get merchant statistics
  async getMerchantStats() {
    try {
      const response = await api.get('/api/merchants/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch merchant stats:', error);
      return { totalMerchants: 0, activeMerchants: 0, totalProducts: 0, pendingApproval: 0 };
    }
  },
};

/**
 * User App Service
 * Manage users, orders, and wallets from Admin
 */
export const userAppService = {
  // Get all users
  async getUsers() {
    try {
      const response = await api.get('/api/users');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      return [];
    }
  },

  // Get user by ID
  async getUser(id: string | number) {
    try {
      const response = await api.get(`/api/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      return null;
    }
  },

  // Get user orders
  async getUserOrders(userId: string | number) {
    try {
      const response = await api.get(`/api/users/${userId}/orders`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch orders for user ${userId}:`, error);
      return [];
    }
  },

  // Get user wallet
  async getUserWallet(userId: string | number) {
    try {
      const response = await api.get(`/api/users/${userId}/wallet`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch wallet for user ${userId}:`, error);
      return { balance: 0, transactions: [] };
    }
  },

  // Suspend user
  async suspendUser(id: string | number, reason: string) {
    try {
      const response = await api.put(`/api/users/${id}/suspend`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Failed to suspend user ${id}:`, error);
      throw error;
    }
  },

  // Activate user
  async activateUser(id: string | number) {
    try {
      const response = await api.put(`/api/users/${id}/activate`);
      return response.data;
    } catch (error) {
      console.error(`Failed to activate user ${id}:`, error);
      throw error;
    }
  },

  // Get wallet top-up requests
  async getWalletTopUpRequests(status?: 'pending' | 'approved' | 'rejected') {
    try {
      const query = status ? `?status=${status}` : '';
      const response = await api.get(`/api/wallet/topups${query}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch wallet top-up requests:', error);
      return [];
    }
  },

  // Process wallet top-up
  async processTopUp(topUpId: string | number, action: 'approve' | 'reject') {
    try {
      const response = await api.put(`/api/wallet/topups/${topUpId}/${action}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to ${action} top-up ${topUpId}:`, error);
      throw error;
    }
  },

  // Get user statistics
  async getUserStats() {
    try {
      const response = await api.get('/api/users/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      return { totalUsers: 0, activeUsers: 0, newUsersToday: 0, totalOrders: 0 };
    }
  },
};

/**
 * Cross-App Notification Service
 * Send notifications across all apps
 */
export const notificationService = {
  // Send notification to specific app
  async sendToApp(appType: AppType, notification: { title: string; message: string; data?: any }) {
    try {
      const response = await api.post(`/api/notifications/send`, {
        target: appType,
        ...notification,
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to send notification to ${appType}:`, error);
      throw error;
    }
  },

  // Broadcast to all apps
  async broadcast(notification: { title: string; message: string; data?: any }) {
    try {
      const response = await api.post('/api/notifications/broadcast', notification);
      return response.data;
    } catch (error) {
      console.error('Failed to broadcast notification:', error);
      throw error;
    }
  },

  // Send to specific user across apps
  async sendToUser(userId: string | number, notification: { title: string; message: string; data?: any }) {
    try {
      const response = await api.post(`/api/notifications/user/${userId}`, notification);
      return response.data;
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
      throw error;
    }
  },
};

/**
 * App Link Helper
 * Generate deep links and web URLs for different apps
 */
export const appLinkHelper = {
  // Get app URL
  getAppUrl(appType: AppType): string {
    return APP_URLS[appType] || '';
  },

  // Get app info
  getAppInfo(appType: AppType) {
    return APP_INFO[appType];
  },

  // Generate deep link for mobile
  generateDeepLink(appType: Exclude<AppType, 'admin'>, path: string = ''): string {
    const scheme = DEEP_LINK_SCHEMES[appType];
    return `${scheme}${path}`;
  },

  // Generate web link
  generateWebLink(appType: AppType, path: string = ''): string {
    const baseUrl = APP_URLS[appType];
    return `${baseUrl}${path}`;
  },

  // Check if app is reachable
  async checkAppHealth(appType: AppType): Promise<boolean> {
    try {
      const url = APP_URLS[appType];
      const response = await fetch(`${url}/health`, { method: 'GET', mode: 'no-cors' });
      return true;
    } catch {
      return false;
    }
  },
};

export default {
  doctorAppService,
  driverAppService,
  merchantAppService,
  userAppService,
  notificationService,
  appLinkHelper,
};
