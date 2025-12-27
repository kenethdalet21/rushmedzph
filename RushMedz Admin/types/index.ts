export type UUID = string;
export type Currency = 'PHP';

export type Role = 'admin' | 'merchant' | 'driver' | 'user';

export interface BaseEntity {
  id: UUID;
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  role: Role;
  email: string;
  name: string;
  phone?: string;
}

export interface Merchant extends BaseEntity {
  ownerId: UUID;
  name: string;
  address: string;
  rating?: number;
}

export interface Driver extends BaseEntity {
  userId: UUID;
  licenseNumber?: string;
  vehicle?: string;
  earnings?: number;
}

export interface Product extends BaseEntity {
  merchantId: UUID;
  merchantName?: string; // Merchant business name for display in Browse tab
  merchantEmail?: string; // Merchant email for identification
  name: string;
  description?: string;
  price: number;
  currency: Currency;
  stock: number;
  category?: string;
  imageUrl?: string; // Added optional imageUrl property
  requiresPrescription?: boolean; // Flag to indicate if product requires prescription
}

export type OrderStatus = 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export type PaymentMethod = 'card' | 'gcash' | 'paymaya' | 'cod' | 'paypal' | 'razorpay' | 'wallet';

export type TransactionType = 'payment' | 'refund' | 'payout' | 'settlement';

export interface PaymentTransaction extends BaseEntity {
  orderId: UUID;
  userId: UUID;
  merchantId: UUID;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionType: TransactionType;
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  metadata?: Record<string, any>;
  refundedAmount?: number;
  refundReason?: string;
  processingFee?: number;
  netAmount?: number;
}

export interface PaymentGatewayConfig {
  gateway: PaymentMethod;
  merchantId?: string;
  apiKey?: string;
  secretKey?: string;
  webhookUrl?: string;
  enabled: boolean;
}

export interface Refund extends BaseEntity {
  transactionId: UUID;
  orderId: UUID;
  amount: number;
  currency: Currency;
  reason: string;
  status: PaymentStatus;
  processedBy?: UUID;
  gatewayRefundId?: string;
}

export interface Payout extends BaseEntity {
  merchantId: UUID;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  payoutMethod: 'bank_transfer' | 'gcash' | 'paymaya';
  accountDetails: Record<string, any>;
  scheduledDate?: string;
  completedDate?: string;
  transactionIds: UUID[];
}

export interface Order extends BaseEntity {
  userId: UUID;
  merchantId: UUID;
  driverId?: UUID;
  items: Array<{ productId: UUID; quantity: number; price: number; name?: string }>;
  status: OrderStatus;
  totalAmount: number;
  currency: Currency;
  eta?: string;
  address: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  transactionId?: UUID;
}

export interface AnalyticsSummary {
  totalSales: number;
  totalOrders: number;
  activeMerchants: number;
  activeDrivers: number;
}

// Wallet
export interface WalletBalance {
  userId: UUID;
  balance: number;
  currency: Currency;
}

export interface WalletTopUp extends BaseEntity {
  userId: UUID;
  amount: number;
  currency: Currency;
  paymentMethod: Exclude<PaymentMethod, 'wallet'>;
  status: PaymentStatus;
  reference?: string;
  type?: 'topup' | 'adjustment' | 'refund';
  adminNote?: string;
}
