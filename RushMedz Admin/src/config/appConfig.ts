/**
 * Cross-App Configuration
 * Links the Admin web app to all other apps in the RushMedz ecosystem
 */

// App URLs configuration - can be set via environment variables
export const APP_URLS = {
  // Admin web app (this app)
  admin: import.meta.env.VITE_ADMIN_URL || 'http://localhost:5173',
  
  // Backend API
  api: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8086',
  
  // Other apps (when running as web or for deep linking)
  doctor: import.meta.env.VITE_DOCTOR_APP_URL || 'http://localhost:8081',
  driver: import.meta.env.VITE_DRIVER_APP_URL || 'http://localhost:8082',
  merchant: import.meta.env.VITE_MERCHANT_APP_URL || 'http://localhost:8083',
  user: import.meta.env.VITE_USER_APP_URL || 'http://localhost:8084',
};

// App directory paths on the local system
export const APP_DIRECTORIES = {
  admin: 'D:/RushMedz App_Final/RushMedz Admin',
  doctor: 'D:/RushMedz App_Final/RushMedz Doctor',
  driver: 'D:/RushMedz App_Final/RushMedz Driver',
  merchant: 'D:/RushMedz App_Final/RushMedz Merchant',
  user: 'D:/RushMedz App_Final/RushMedz User_Customer',
};

// App metadata
export const APP_INFO = {
  admin: {
    name: 'RushMedz Admin',
    icon: '🛡️',
    description: 'Administrative dashboard for managing the entire RushMedz ecosystem',
    features: ['User Management', 'Order Management', 'Analytics', 'System Config'],
  },
  doctor: {
    name: 'RushMedz Doctor',
    icon: '⚕️',
    description: 'Telemedicine app for healthcare providers',
    features: ['Consultations', 'Prescriptions', 'Patient Management', 'Appointments'],
  },
  driver: {
    name: 'RushMedz Driver',
    icon: '🚗',
    description: 'Delivery management app for drivers',
    features: ['Delivery Tracking', 'Earnings', 'Navigation', 'Order Pickup'],
  },
  merchant: {
    name: 'RushMedz Merchant',
    icon: '🏪',
    description: 'Pharmacy and merchant management app',
    features: ['Product Management', 'Inventory', 'Order Processing', 'Payouts'],
  },
  user: {
    name: 'RushMedz User',
    icon: '👤',
    description: 'Customer-facing app for ordering medications',
    features: ['Browse Products', 'Order Tracking', 'Wallet', 'Prescriptions'],
  },
};

// Deep link schemes for mobile apps
export const DEEP_LINK_SCHEMES = {
  doctor: 'rushmedz-doctor://',
  driver: 'rushmedz-driver://',
  merchant: 'rushmedz-merchant://',
  user: 'rushmedz-user://',
};

// WebSocket/Real-time event channels
export const EVENT_CHANNELS = {
  orders: 'orders',
  products: 'products',
  drivers: 'drivers',
  merchants: 'merchants',
  doctors: 'doctors',
  users: 'users',
  payments: 'payments',
  notifications: 'notifications',
};

export type AppType = 'admin' | 'doctor' | 'driver' | 'merchant' | 'user';

export default {
  APP_URLS,
  APP_DIRECTORIES,
  APP_INFO,
  DEEP_LINK_SCHEMES,
  EVENT_CHANNELS,
};
