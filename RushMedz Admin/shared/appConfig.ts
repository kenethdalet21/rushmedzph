/**
 * Shared App Configuration
 * This file should be copied to all apps in the RushMedz ecosystem
 * to ensure consistent cross-app communication
 */

// App Types
export type AppType = 'admin' | 'doctor' | 'driver' | 'merchant' | 'user';

// Helper to get environment variables safely (works in both Expo and web)
const getEnvVar = (key: string, fallback: string): string => {
  // For Vite (web)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteKey = key.replace('EXPO_PUBLIC_', 'VITE_');
    return (import.meta.env as Record<string, string | undefined>)[viteKey] || fallback;
  }
  // For Expo/React Native
  if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env) {
    return (globalThis as any).process.env[key] || fallback;
  }
  return fallback;
};

// Base URLs - Configure based on your environment
export const APP_CONFIG = {
  // API Backend
  API_BASE_URL: getEnvVar('EXPO_PUBLIC_API_BASE_URL', 'http://localhost:8086'),
  
  // App URLs (for web or deep linking)
  ADMIN_URL: getEnvVar('EXPO_PUBLIC_ADMIN_URL', 'http://localhost:5173'),
  DOCTOR_URL: getEnvVar('EXPO_PUBLIC_DOCTOR_URL', 'http://localhost:8081'),
  DRIVER_URL: getEnvVar('EXPO_PUBLIC_DRIVER_URL', 'http://localhost:8082'),
  MERCHANT_URL: getEnvVar('EXPO_PUBLIC_MERCHANT_URL', 'http://localhost:8083'),
  USER_URL: getEnvVar('EXPO_PUBLIC_USER_URL', 'http://localhost:8084'),
  
  // WebSocket for real-time events
  WS_URL: getEnvVar('EXPO_PUBLIC_WS_URL', 'ws://localhost:8086/ws/events'),
  
  // Supabase (if used)
  SUPABASE_URL: getEnvVar('EXPO_PUBLIC_SUPABASE_URL', ''),
  SUPABASE_ANON_KEY: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
};

// Deep link schemes for mobile apps
export const DEEP_LINK_SCHEMES = {
  admin: 'rushmedz-admin://',
  doctor: 'rushmedz-doctor://',
  driver: 'rushmedz-driver://',
  merchant: 'rushmedz-merchant://',
  user: 'rushmedz-user://',
};

// App metadata
export const APP_INFO: Record<AppType, { name: string; icon: string; description: string }> = {
  admin: {
    name: 'RushMedz Admin',
    icon: '🛡️',
    description: 'Administrative dashboard for managing the entire RushMedz ecosystem',
  },
  doctor: {
    name: 'RushMedz Doctor',
    icon: '⚕️',
    description: 'Telemedicine app for healthcare providers',
  },
  driver: {
    name: 'RushMedz Driver',
    icon: '🚗',
    description: 'Delivery management app for drivers',
  },
  merchant: {
    name: 'RushMedz Merchant',
    icon: '🏪',
    description: 'Pharmacy and merchant management app',
  },
  user: {
    name: 'RushMedz User',
    icon: '👤',
    description: 'Customer-facing app for ordering medications',
  },
};

// Event types for cross-app communication
export const EVENT_TYPES = {
  // Order events
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_CANCELLED: 'order:cancelled',
  ORDER_DELIVERED: 'order:delivered',
  
  // Driver events
  DRIVER_STATUS_CHANGED: 'driver:status_changed',
  DRIVER_ASSIGNED: 'driver:assigned',
  DRIVER_LOCATION_UPDATED: 'driver:location_updated',
  
  // Merchant events
  MERCHANT_STATUS_CHANGED: 'merchant:status_changed',
  MERCHANT_PAYOUT_REQUESTED: 'merchant:payout_requested',
  PRODUCT_ADDED: 'product:added',
  PRODUCT_UPDATED: 'product:updated',
  PRODUCT_DELETED: 'product:deleted',
  
  // Doctor events
  DOCTOR_STATUS_CHANGED: 'doctor:status_changed',
  CONSULTATION_STARTED: 'doctor:consultation_started',
  CONSULTATION_ENDED: 'doctor:consultation_ended',
  PRESCRIPTION_CREATED: 'doctor:prescription_created',
  
  // User events
  USER_REGISTERED: 'user:registered',
  USER_WALLET_TOPUP: 'user:wallet_topup',
  
  // System events
  NOTIFICATION_SENT: 'notification:sent',
  SYSTEM_CONFIG_CHANGED: 'system:config_changed',
} as const;

export default APP_CONFIG;
