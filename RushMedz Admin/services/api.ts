import { supabase } from './supabase';
import type { Product, Order, Merchant, Driver, AnalyticsSummary } from '../types';

// Prefer environment-provided base URL for flexibility between dev/staging/prod.
// EXPO_PUBLIC_API_BASE_URL can be set in an .env file (Expo SDK 54 supports public env vars).
// Default to localhost for Expo web (localhost:8086).
// For physical devices/tunnel, set EXPO_PUBLIC_API_BASE_URL to the LAN IP in .env.local.
const DEFAULT_HOST = 'http://localhost:8086';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_HOST) + '/api';

// Helper for fetch with error handling
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    // Log error only in non-development mode or for specific critical endpoints
    const isDev = process.env.NODE_ENV === 'development' || process.env.EXPO_PUBLIC_DEV_MODE === 'true';
    if (!isDev) {
      console.error(`API call failed for ${endpoint}:`, error);
    } else {
      console.debug(`API call failed for ${endpoint} (dev mode - returning empty):`, error);
    }
    // Return empty data for development when backend is unavailable
    return [] as any as T;
  }
}

// Auth API
export const authAPI = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, name: string, role: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },
};

// Products API
export const productsAPI = {
  async getAll(merchantId?: string): Promise<Product[]> {
    const query = merchantId ? `?merchantId=${merchantId}` : '';
    return fetchAPI<Product[]>(`/products${query}`);
  },

  async getById(id: string): Promise<Product> {
    return fetchAPI<Product>(`/products/${id}`);
  },

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return fetchAPI<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  async update(id: string, product: Partial<Product>): Promise<Product> {
    return fetchAPI<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },

  async delete(id: string): Promise<void> {
    return fetchAPI<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  async searchByCategory(category: string): Promise<Product[]> {
    return fetchAPI<Product[]>(`/products/category/${category}`);
  },

  async search(query: string): Promise<Product[]> {
    return fetchAPI<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
  },
};

// Orders API
export const ordersAPI = {
  async getAll(filters?: { userId?: string; merchantId?: string; driverId?: string; status?: string }): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.merchantId) params.append('merchantId', filters.merchantId);
    if (filters?.driverId) params.append('driverId', filters.driverId);
    if (filters?.status) params.append('status', filters.status);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<Order[]>(`/orders${query}`);
  },

  async getById(id: string): Promise<Order> {
    return fetchAPI<Order>(`/orders/${id}`);
  },

  async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Order> {
    return fetchAPI<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({ ...order, status: 'pending' }),
    });
  },

  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    return fetchAPI<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async assignDriver(orderId: string, driverId: string): Promise<Order> {
    return fetchAPI<Order>(`/orders/${orderId}/assign-driver`, {
      method: 'PATCH',
      body: JSON.stringify({ driverId }),
    });
  },

  async cancel(id: string): Promise<Order> {
    return fetchAPI<Order>(`/orders/${id}/cancel`, {
      method: 'PATCH',
    });
  },
};

// Merchants API
export const merchantsAPI = {
  async getAll(): Promise<Merchant[]> {
    return fetchAPI<Merchant[]>('/merchants');
  },

  async getById(id: string): Promise<Merchant> {
    return fetchAPI<Merchant>(`/merchants/${id}`);
  },

  async create(merchant: Omit<Merchant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Merchant> {
    return fetchAPI<Merchant>('/merchants', {
      method: 'POST',
      body: JSON.stringify(merchant),
    });
  },

  async update(id: string, merchant: Partial<Merchant>): Promise<Merchant> {
    return fetchAPI<Merchant>(`/merchants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(merchant),
    });
  },
};

// Drivers API
export const driversAPI = {
  async getAll(available?: boolean): Promise<Driver[]> {
    const query = available !== undefined ? `?available=${available}` : '';
    return fetchAPI<Driver[]>(`/drivers${query}`);
  },

  async getById(id: string): Promise<Driver> {
    return fetchAPI<Driver>(`/drivers/${id}`);
  },

  async updateEarnings(id: string, amount: number): Promise<Driver> {
    return fetchAPI<Driver>(`/drivers/${id}/earnings`, {
      method: 'PATCH',
      body: JSON.stringify({ amount }),
    });
  },

  async getEarnings(id: string, period: 'today' | 'week' | 'month'): Promise<{ total: number; breakdown: any[] }> {
    return fetchAPI(`/drivers/${id}/earnings/${period}`);
  },
};

// Payouts API
export const payoutsAPI = {
  async getAll(merchantId?: string): Promise<any[]> {
    const query = merchantId ? `?merchantId=${merchantId}` : '';
    return fetchAPI<any[]>(`/payouts${query}`);
  },

  async getById(id: string): Promise<any> {
    return fetchAPI<any>(`/payouts/${id}`);
  },

  async create(payout: {
    merchantId: string;
    amount: number;
    currency: string;
    payoutMethod: 'bank_transfer' | 'gcash' | 'paymaya';
    accountDetails: Record<string, any>;
  }): Promise<any> {
    return fetchAPI<any>('/payouts', {
      method: 'POST',
      body: JSON.stringify(payout),
    });
  },

  async updateStatus(id: string, status: string): Promise<any> {
    return fetchAPI<any>(`/payouts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Analytics API
export const analyticsAPI = {
  async getSummary(): Promise<AnalyticsSummary> {
    return fetchAPI<AnalyticsSummary>('/analytics/summary');
  },

  async getSalesData(period: 'day' | 'week' | 'month' | 'year'): Promise<any[]> {
    return fetchAPI(`/analytics/sales?period=${period}`);
  },

  async getMerchantAnalytics(merchantId: string): Promise<any> {
    return fetchAPI(`/analytics/merchants/${merchantId}`);
  },

  async getDriverAnalytics(driverId: string): Promise<any> {
    return fetchAPI(`/analytics/drivers/${driverId}`);
  },
};

// Health check
export const healthAPI = {
  async check(): Promise<{ status: string; service: string; timestamp: string }> {
    return fetchAPI('/health');
  },
};

export default {
  auth: authAPI,
  products: productsAPI,
  orders: ordersAPI,
  merchants: merchantsAPI,
  drivers: driversAPI,
  payouts: payoutsAPI,
  analytics: analyticsAPI,
  health: healthAPI,
};
