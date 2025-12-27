import type { 
  PaymentTransaction, 
  PaymentMethod, 
  PaymentStatus, 
  Refund, 
  Payout 
} from '../types';

type GatewayMethod = Exclude<PaymentMethod, 'wallet'>;

const DEFAULT_HOST = 'http://192.168.1.63:8085';
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_HOST) + '/api';

// Payment Gateway Configurations
const GATEWAY_CONFIGS: Record<GatewayMethod, { name: string; enabled: boolean; supportedCurrencies: string[] }> = {
  gcash: {
    name: 'GCash',
    enabled: true,
    supportedCurrencies: ['PHP'],
  },
  paymaya: {
    name: 'PayMaya',
    enabled: true,
    supportedCurrencies: ['PHP'],
  },
  paypal: {
    name: 'PayPal',
    enabled: true,
    supportedCurrencies: ['USD', 'PHP'],
  },
  razorpay: {
    name: 'Razorpay',
    enabled: true,
    supportedCurrencies: ['INR', 'USD'],
  },
  card: {
    name: 'Credit/Debit Card',
    enabled: true,
    supportedCurrencies: ['PHP', 'USD'],
  },
  cod: {
    name: 'Cash on Delivery',
    enabled: true,
    supportedCurrencies: ['PHP'],
  },
};

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

    return await response.json() as T;
  } catch (error) {
    // Log error only in non-development mode
    const isDev = process.env.NODE_ENV === 'development' || process.env.EXPO_PUBLIC_DEV_MODE === 'true';
    if (!isDev) {
      console.error(`Payment API call failed for ${endpoint}:`, error);
    } else {
      console.debug(`Payment API call failed for ${endpoint} (dev mode - returning empty):`, error);
    }
    // Return empty data for development when backend is unavailable
    return [] as any as T;
  }
}

// Payment Transactions API
export const paymentTransactionsAPI = {
  async getAll(filters?: {
    userId?: string;
    merchantId?: string;
    orderId?: string;
    status?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    fromDate?: string;
    toDate?: string;
  }): Promise<PaymentTransaction[]> {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.merchantId) params.append('merchantId', filters.merchantId);
    if (filters?.orderId) params.append('orderId', filters.orderId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<PaymentTransaction[]>(`/payments/transactions${query}`);
  },

  async getById(id: string): Promise<PaymentTransaction> {
    return fetchAPI<PaymentTransaction>(`/payments/transactions/${id}`);
  },

  async create(transaction: Omit<PaymentTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentTransaction> {
    return fetchAPI<PaymentTransaction>('/payments/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  },

  async updateStatus(id: string, status: PaymentStatus, metadata?: any): Promise<PaymentTransaction> {
    return fetchAPI<PaymentTransaction>(`/payments/transactions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, metadata }),
    });
  },

  async getByOrder(orderId: string): Promise<PaymentTransaction[]> {
    return fetchAPI<PaymentTransaction[]>(`/payments/transactions/order/${orderId}`);
  },
};

// Payment Processing API
export const paymentProcessingAPI = {
  async initiatePayment(data: {
    orderId: string;
    userId: string;
    merchantId: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    returnUrl?: string;
    metadata?: any;
  }): Promise<{
    transactionId: string;
    paymentUrl?: string;
    qrCode?: string;
    reference?: string;
    expiresAt?: string;
  }> {
    return fetchAPI('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async confirmPayment(transactionId: string, confirmationData?: any): Promise<PaymentTransaction> {
    return fetchAPI(`/payments/confirm/${transactionId}`, {
      method: 'POST',
      body: JSON.stringify(confirmationData || {}),
    });
  },

  async cancelPayment(transactionId: string, reason?: string): Promise<PaymentTransaction> {
    return fetchAPI(`/payments/cancel/${transactionId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async verifyPayment(transactionId: string): Promise<{
    verified: boolean;
    status: PaymentStatus;
    gatewayResponse?: any;
  }> {
    return fetchAPI(`/payments/verify/${transactionId}`);
  },
};

// GCash Integration
export const gcashAPI = {
  async createPayment(amount: number, orderId: string, redirectUrl: string): Promise<any> {
    return fetchAPI('/payments/gcash/create', {
      method: 'POST',
      body: JSON.stringify({ amount, orderId, redirectUrl }),
    });
  },

  async verifyPayment(referenceId: string): Promise<any> {
    return fetchAPI(`/payments/gcash/verify/${referenceId}`);
  },
};

// PayMaya Integration
export const paymayaAPI = {
  async createPayment(amount: number, orderId: string, redirectUrl: string): Promise<any> {
    return fetchAPI('/payments/paymaya/create', {
      method: 'POST',
      body: JSON.stringify({ amount, orderId, redirectUrl }),
    });
  },

  async verifyPayment(paymentId: string): Promise<any> {
    return fetchAPI(`/payments/paymaya/verify/${paymentId}`);
  },
};

// PayPal Integration
export const paypalAPI = {
  async createOrder(amount: number, currency: string, orderId: string): Promise<any> {
    return fetchAPI('/payments/paypal/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, currency, orderId }),
    });
  },

  async captureOrder(paypalOrderId: string): Promise<any> {
    return fetchAPI(`/payments/paypal/capture/${paypalOrderId}`, {
      method: 'POST',
    });
  },
};

// Razorpay Integration
export const razorpayAPI = {
  async createOrder(amount: number, currency: string, orderId: string): Promise<any> {
    return fetchAPI('/payments/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, currency, orderId }),
    });
  },

  async verifySignature(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<any> {
    return fetchAPI('/payments/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Refunds API
export const refundsAPI = {
  async create(refund: Omit<Refund, 'id' | 'createdAt' | 'updatedAt'>): Promise<Refund> {
    return fetchAPI<Refund>('/payments/refunds', {
      method: 'POST',
      body: JSON.stringify(refund),
    });
  },

  async getAll(filters?: {
    transactionId?: string;
    orderId?: string;
    status?: PaymentStatus;
  }): Promise<Refund[]> {
    const params = new URLSearchParams();
    if (filters?.transactionId) params.append('transactionId', filters.transactionId);
    if (filters?.orderId) params.append('orderId', filters.orderId);
    if (filters?.status) params.append('status', filters.status);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI<Refund[]>(`/payments/refunds${query}`);
  },

  async getById(id: string): Promise<Refund> {
    return fetchAPI<Refund>(`/payments/refunds/${id}`);
  },

  async updateStatus(id: string, status: PaymentStatus): Promise<Refund> {
    return fetchAPI<Refund>(`/payments/refunds/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// Payouts API (for Merchant settlements)
export const payoutsAPI = {
  async create(payout: Omit<Payout, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payout> {
    return fetchAPI<Payout>('/payments/payouts', {
      method: 'POST',
      body: JSON.stringify(payout),
    });
  },

  async getAll(merchantId?: string): Promise<Payout[]> {
    const query = merchantId ? `?merchantId=${merchantId}` : '';
    return fetchAPI<Payout[]>(`/payments/payouts${query}`);
  },

  async getById(id: string): Promise<Payout> {
    return fetchAPI<Payout>(`/payments/payouts/${id}`);
  },

  async updateStatus(id: string, status: PaymentStatus): Promise<Payout> {
    return fetchAPI<Payout>(`/payments/payouts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getMerchantBalance(merchantId: string): Promise<{
    availableBalance: number;
    pendingBalance: number;
    totalEarnings: number;
    currency: string;
  }> {
    return fetchAPI(`/payments/payouts/balance/${merchantId}`);
  },

  async requestPayout(merchantId: string, amount: number, payoutMethod: string, accountDetails: any): Promise<Payout> {
    return fetchAPI('/payments/payouts/request', {
      method: 'POST',
      body: JSON.stringify({ merchantId, amount, payoutMethod, accountDetails }),
    });
  },
};

// Payment Analytics API
export const paymentAnalyticsAPI = {
  async getSummary(filters?: {
    merchantId?: string;
    userId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<{
    totalTransactions: number;
    totalAmount: number;
    successfulPayments: number;
    failedPayments: number;
    refundedAmount: number;
    averageTransactionValue: number;
    paymentMethodBreakdown: Record<PaymentMethod, number>;
  }> {
    const params = new URLSearchParams();
    if (filters?.merchantId) params.append('merchantId', filters.merchantId);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/payments/analytics/summary${query}`);
  },

  async getRevenueChart(period: 'day' | 'week' | 'month', merchantId?: string): Promise<any[]> {
    const query = merchantId ? `?merchantId=${merchantId}` : '';
    return fetchAPI(`/payments/analytics/revenue/${period}${query}`);
  },

  async getFraudAlerts(): Promise<any[]> {
    return fetchAPI('/payments/analytics/fraud-alerts');
  },
};

// Webhook handlers (for backend integration)
export const webhooksAPI = {
  async handleGCashWebhook(payload: any): Promise<void> {
    return fetchAPI('/payments/webhooks/gcash', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async handlePayMayaWebhook(payload: any): Promise<void> {
    return fetchAPI('/payments/webhooks/paymaya', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async handlePayPalWebhook(payload: any): Promise<void> {
    return fetchAPI('/payments/webhooks/paypal', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async handleRazorpayWebhook(payload: any): Promise<void> {
    return fetchAPI('/payments/webhooks/razorpay', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// Utility functions
export const paymentUtils = {
  getGatewayConfig(method: GatewayMethod) {
    return GATEWAY_CONFIGS[method];
  },

  isGatewayEnabled(method: GatewayMethod): boolean {
    return GATEWAY_CONFIGS[method]?.enabled || false;
  },

  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },

  getPaymentMethodIcon(method: PaymentMethod): string {
    const icons: Record<PaymentMethod, string> = {
      gcash: '💳',
      paymaya: '💰',
      paypal: '🅿️',
      razorpay: '💵',
      card: '💳',
      cod: '💵',
      wallet: '👛',
    };
    return icons[method] || '💰';
  },

  getStatusColor(status: PaymentStatus): string {
    const colors: Record<PaymentStatus, string> = {
      pending: '#F39C12',
      processing: '#3498DB',
      completed: '#27AE60',
      failed: '#E74C3C',
      refunded: '#9B59B6',
      cancelled: '#7F8C8D',
    };
    return colors[status] || '#7F8C8D';
  },
};

export default {
  transactions: paymentTransactionsAPI,
  processing: paymentProcessingAPI,
  gcash: gcashAPI,
  paymaya: paymayaAPI,
  paypal: paypalAPI,
  razorpay: razorpayAPI,
  refunds: refundsAPI,
  payouts: payoutsAPI,
  analytics: paymentAnalyticsAPI,
  webhooks: webhooksAPI,
  utils: paymentUtils,
};
