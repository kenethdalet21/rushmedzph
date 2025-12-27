/**
 * Admin API Service
 * This file provides methods to communicate with the Admin app
 * Copy to other apps (Doctor, Driver, Merchant, User) for cross-app integration
 */

import { APP_CONFIG, type AppType } from './appConfig';

// Get auth token (adjust based on your app's storage method)
const getAuthToken = (): string | null => {
  // For web apps - check localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem('authToken');
  }
  
  // For React Native apps - this should be replaced with async storage
  // In React Native, use: await AsyncStorage.getItem('authToken')
  // This sync version returns null as a fallback
  return null;
};

// Create authenticated fetch wrapper
const authenticatedFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(`${APP_CONFIG.API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
};

/**
 * Report status to Admin dashboard
 */
export const reportStatus = async (appType: AppType, status: 'online' | 'offline' | 'busy', metadata?: Record<string, any>) => {
  try {
    await authenticatedFetch('/api/apps/status', {
      method: 'POST',
      body: JSON.stringify({
        appType,
        status,
        metadata,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error(`Failed to report status to Admin:`, error);
  }
};

/**
 * Send notification to Admin
 */
export const notifyAdmin = async (title: string, message: string, priority: 'low' | 'normal' | 'high' = 'normal', data?: Record<string, any>) => {
  try {
    await authenticatedFetch('/api/notifications/admin', {
      method: 'POST',
      body: JSON.stringify({
        title,
        message,
        priority,
        data,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error(`Failed to notify Admin:`, error);
  }
};

/**
 * Get system configuration from Admin
 */
export const getSystemConfig = async (): Promise<Record<string, any>> => {
  try {
    const response = await authenticatedFetch('/api/config/system');
    if (response.ok) {
      return await response.json();
    }
    return {};
  } catch (error) {
    console.error(`Failed to get system config:`, error);
    return {};
  }
};

/**
 * Get app-specific configuration from Admin
 */
export const getAppConfig = async (appType: AppType): Promise<Record<string, any>> => {
  try {
    const response = await authenticatedFetch(`/api/config/apps/${appType}`);
    if (response.ok) {
      return await response.json();
    }
    return {};
  } catch (error) {
    console.error(`Failed to get app config for ${appType}:`, error);
    return {};
  }
};

/**
 * Report error to Admin for monitoring
 */
export const reportError = async (appType: AppType, error: Error | string, context?: Record<string, any>) => {
  try {
    await authenticatedFetch('/api/monitoring/errors', {
      method: 'POST',
      body: JSON.stringify({
        appType,
        error: typeof error === 'string' ? error : error.message,
        stack: typeof error === 'object' ? error.stack : undefined,
        context,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error(`Failed to report error to Admin:`, err);
  }
};

/**
 * Report analytics event to Admin
 */
export const reportAnalytics = async (appType: AppType, eventName: string, eventData?: Record<string, any>) => {
  try {
    await authenticatedFetch('/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        appType,
        eventName,
        eventData,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error(`Failed to report analytics:`, error);
  }
};

export default {
  reportStatus,
  notifyAdmin,
  getSystemConfig,
  getAppConfig,
  reportError,
  reportAnalytics,
};
