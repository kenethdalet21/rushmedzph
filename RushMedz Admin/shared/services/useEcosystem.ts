/**
 * React Hook for Unified Database Access
 * 
 * This hook provides a convenient way for React Native apps to
 * access the unified database services with proper state management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  unifiedDatabase,
  realtimeService,
  User,
  UserRole,
  Product,
  Prescription,
  Consultation,
  DeliveryAssignment,
  DriverLocation,
  Notification,
  ChatMessage,
} from './unifiedDatabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@RushMedz:authToken';
const USER_KEY = '@RushMedz:user';

interface UseEcosystemOptions {
  autoConnect?: boolean;
}

interface UseEcosystemReturn {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Real-time state
  isConnected: boolean;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Auth methods
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  
  // Services
  products: typeof unifiedDatabase.products;
  prescriptions: typeof unifiedDatabase.prescriptions;
  consultations: typeof unifiedDatabase.consultations;
  deliveries: typeof unifiedDatabase.deliveries;
  patients: typeof unifiedDatabase.patients;
  notificationService: typeof unifiedDatabase.notifications;
  
  // Real-time methods
  connect: () => Promise<void>;
  disconnect: () => void;
  subscribe: typeof realtimeService.subscribe;
  trackDelivery: typeof realtimeService.trackDelivery;
  joinConsultationChat: typeof realtimeService.joinConsultationChat;
  leaveConsultationChat: typeof realtimeService.leaveConsultationChat;
  
  // Utility
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

export const useEcosystem = (options: UseEcosystemOptions = {}): UseEcosystemReturn => {
  const { autoConnect = true } = options;
  
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize from stored auth
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          unifiedDatabase.setAuthToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);

          // Auto-connect to real-time if enabled
          if (autoConnect) {
            try {
              await realtimeService.connect(parsedUser.id, parsedUser.role);
              setIsConnected(true);
              
              // Load initial notifications
              const result = await unifiedDatabase.notifications.getAll(parsedUser.id);
              if (result.success && result.data) {
                setNotifications(result.data);
                setUnreadCount(result.data.filter(n => !n.isRead).length);
              }
            } catch (error) {
              console.warn('Failed to auto-connect to real-time service:', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [autoConnect]);

  // Subscribe to real-time notifications when connected
  useEffect(() => {
    if (isConnected && user) {
      unsubscribeRef.current = realtimeService.subscribe('notification:new', (notification) => {
        setNotifications((prev: Notification[]) => [notification, ...prev]);
        if (!notification.isRead) {
          setUnreadCount((prev: number) => prev + 1);
        }
      });
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isConnected, user]);

  // Check connection status periodically
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(realtimeService.isConnected());
    };

    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const login = useCallback(async (token: string, userData: User) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(userData)),
      ]);
      
      unifiedDatabase.setAuthToken(token);
      setUser(userData);
      setIsAuthenticated(true);

      // Connect to real-time
      await realtimeService.connect(userData.id, userData.role);
      setIsConnected(true);

      // Load notifications
      const result = await unifiedDatabase.notifications.getAll(userData.id);
      if (result.success && result.data) {
        setNotifications(result.data);
        setUnreadCount(result.data.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      realtimeService.disconnect();
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      
      unifiedDatabase.setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!user) {
      throw new Error('User must be authenticated to connect');
    }
    await realtimeService.connect(user.id, user.role);
    setIsConnected(true);
  }, [user]);

  const disconnect = useCallback(() => {
    realtimeService.disconnect();
    setIsConnected(false);
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    
    const result = await unifiedDatabase.notifications.getAll(user.id);
    if (result.success && result.data) {
      setNotifications(result.data);
      setUnreadCount(result.data.filter(n => !n.isRead).length);
    }
  }, [user]);

  const markNotificationRead = useCallback(async (id: string) => {
    const result = await unifiedDatabase.notifications.markAsRead(id);
    if (result.success) {
      setNotifications((prev: Notification[]) =>
        prev.map((n: Notification) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (!user) return;
    
    const result = await unifiedDatabase.notifications.markAllAsRead(user.id);
    if (result.success) {
      setNotifications((prev: Notification[]) => prev.map((n: Notification) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  }, [user]);

  return {
    // Auth state
    user,
    isAuthenticated,
    isLoading,
    
    // Real-time state
    isConnected,
    
    // Notifications
    notifications,
    unreadCount,
    
    // Auth methods
    login,
    logout,
    
    // Services (directly exposed)
    products: unifiedDatabase.products,
    prescriptions: unifiedDatabase.prescriptions,
    consultations: unifiedDatabase.consultations,
    deliveries: unifiedDatabase.deliveries,
    patients: unifiedDatabase.patients,
    notificationService: unifiedDatabase.notifications,
    
    // Real-time methods
    connect,
    disconnect,
    subscribe: realtimeService.subscribe,
    trackDelivery: realtimeService.trackDelivery,
    joinConsultationChat: realtimeService.joinConsultationChat,
    leaveConsultationChat: realtimeService.leaveConsultationChat,
    
    // Utility
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  };
};

// ==================== SPECIALIZED HOOKS ====================

/**
 * Hook for product browsing and management
 */
export const useProducts = (merchantId?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = merchantId
        ? await unifiedDatabase.products.getByMerchant(merchantId)
        : await unifiedDatabase.products.getAll();
      
      if (result.success && result.data) {
        setProducts(result.data);
      } else {
        setError(result.error || 'Failed to load products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    loadProducts();
    
    // Subscribe to real-time updates
    const unsubUpdate = realtimeService.subscribe('product:update', (product) => {
      setProducts((prev: Product[]) => {
        const index = prev.findIndex((p: Product) => p.id === product.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = product;
          return updated;
        }
        return [...prev, product];
      });
    });

    const unsubDelete = realtimeService.subscribe('product:delete', ({ productId }) => {
      setProducts((prev: Product[]) => prev.filter((p: Product) => p.id !== productId));
    });

    return () => {
      unsubUpdate();
      unsubDelete();
    };
  }, [loadProducts]);

  return {
    products,
    isLoading,
    error,
    refresh: loadProducts,
    search: async (query: string) => {
      const result = await unifiedDatabase.products.getAll({ search: query });
      if (result.success && result.data) {
        setProducts(result.data);
      }
    },
    filterByCategory: async (category: string) => {
      const result = await unifiedDatabase.products.getAll({ category });
      if (result.success && result.data) {
        setProducts(result.data);
      }
    },
  };
};

/**
 * Hook for prescription management
 */
export const usePrescriptions = (userId?: string, isDoctorView: boolean = false) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrescriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = isDoctorView
        ? await unifiedDatabase.prescriptions.getPending()
        : userId
        ? await unifiedDatabase.prescriptions.getUserPrescriptions(userId)
        : { success: false, error: 'User ID required' };

      if (result.success && result.data) {
        setPrescriptions(result.data);
      } else {
        setError(result.error || 'Failed to load prescriptions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId, isDoctorView]);

  useEffect(() => {
    loadPrescriptions();

    const unsub = realtimeService.subscribe('prescription:update', (prescription) => {
      setPrescriptions((prev: Prescription[]) => {
        const index = prev.findIndex((p: Prescription) => p.id === prescription.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = prescription;
          return updated;
        }
        return [...prev, prescription];
      });
    });

    return () => unsub();
  }, [loadPrescriptions]);

  return {
    prescriptions,
    isLoading,
    error,
    refresh: loadPrescriptions,
    upload: unifiedDatabase.prescriptions.upload,
    approve: unifiedDatabase.prescriptions.approve,
    reject: unifiedDatabase.prescriptions.reject,
    validate: unifiedDatabase.prescriptions.validate,
  };
};

/**
 * Hook for delivery tracking
 */
export const useDeliveryTracking = (deliveryId: string) => {
  const [delivery, setDelivery] = useState<DeliveryAssignment | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDelivery = async () => {
      const result = await unifiedDatabase.deliveries.getById(deliveryId);
      if (result.success && result.data) {
        setDelivery(result.data);
      }
      setIsLoading(false);
    };

    loadDelivery();

    // Subscribe to real-time location updates
    const unsub = realtimeService.trackDelivery(deliveryId, (location) => {
      setDriverLocation(location);
    });

    // Subscribe to delivery status updates
    const unsubStatus = realtimeService.subscribe('delivery:update', (updated) => {
      if (updated.id === deliveryId) {
        setDelivery(updated);
      }
    });

    return () => {
      unsub();
      unsubStatus();
    };
  }, [deliveryId]);

  return {
    delivery,
    driverLocation,
    isLoading,
    estimatedArrival: delivery?.estimatedDeliveryTime,
    status: delivery?.status,
  };
};

/**
 * Hook for consultation chat
 */
export const useConsultationChat = (consultationId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [consultResult, msgResult] = await Promise.all([
        unifiedDatabase.consultations.getById(consultationId),
        unifiedDatabase.consultations.getMessages(consultationId),
      ]);

      if (consultResult.success && consultResult.data) {
        setConsultation(consultResult.data);
      }
      if (msgResult.success && msgResult.data) {
        setMessages(msgResult.data);
      }
      setIsLoading(false);
    };

    loadData();

    // Join chat room
    const unsub = realtimeService.joinConsultationChat(consultationId, (message) => {
      setMessages((prev: ChatMessage[]) => [...prev, message]);
    });

    // Subscribe to consultation updates
    const unsubConsult = realtimeService.subscribe('consultation:update', (updated) => {
      if (updated.id === consultationId) {
        setConsultation(updated);
      }
    });

    return () => {
      unsub();
      unsubConsult();
      realtimeService.leaveConsultationChat(consultationId);
    };
  }, [consultationId]);

  const sendMessage = async (content: string, messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' = 'TEXT', attachmentUrl?: string) => {
    const result = await unifiedDatabase.consultations.sendMessage(consultationId, {
      content,
      messageType,
      attachmentUrl,
    });
    
    if (result.success && result.data) {
      // The message will also come through real-time, but we add it immediately for responsiveness
      setMessages((prev: ChatMessage[]) => [...prev, result.data!]);
    }
    
    return result;
  };

  return {
    consultation,
    messages,
    isLoading,
    sendMessage,
    isActive: consultation?.status === 'IN_PROGRESS',
  };
};

/**
 * Hook for driver mode
 */
export const useDriverMode = (driverId: string) => {
  const [status, setStatus] = useState<DriverLocation['status']>('OFFLINE');
  const [activeDeliveries, setActiveDeliveries] = useState<DeliveryAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [locationResult, deliveriesResult] = await Promise.all([
        unifiedDatabase.deliveries.getDriverLocation(driverId),
        unifiedDatabase.deliveries.getDriverDeliveries(driverId),
      ]);

      if (locationResult.success && locationResult.data) {
        setStatus(locationResult.data.status);
      }
      if (deliveriesResult.success && deliveriesResult.data) {
        setActiveDeliveries(deliveriesResult.data);
      }
      setIsLoading(false);
    };

    loadData();

    // Subscribe to new delivery assignments
    const unsub = realtimeService.subscribe('delivery:update', (delivery) => {
      if (delivery.driverId === driverId) {
        setActiveDeliveries((prev: DeliveryAssignment[]) => {
          const index = prev.findIndex((d: DeliveryAssignment) => d.id === delivery.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = delivery;
            return updated;
          }
          return [...prev, delivery];
        });
      }
    });

    return () => unsub();
  }, [driverId]);

  const goOnline = async () => {
    const result = await unifiedDatabase.deliveries.setDriverStatus(driverId, 'ONLINE_AVAILABLE');
    if (result.success) {
      setStatus('ONLINE_AVAILABLE');
    }
    return result;
  };

  const goOffline = async () => {
    const result = await unifiedDatabase.deliveries.setDriverStatus(driverId, 'OFFLINE');
    if (result.success) {
      setStatus('OFFLINE');
    }
    return result;
  };

  const updateLocation = async (latitude: number, longitude: number, heading?: number, speed?: number) => {
    return unifiedDatabase.deliveries.updateLocation(driverId, {
      latitude,
      longitude,
      heading,
      speed,
    });
  };

  const acceptDelivery = async (deliveryId: string) => {
    const result = await unifiedDatabase.deliveries.accept(deliveryId);
    if (result.success && result.data) {
      setActiveDeliveries((prev: DeliveryAssignment[]) => {
        const index = prev.findIndex((d: DeliveryAssignment) => d.id === deliveryId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = result.data!;
          return updated;
        }
        return prev;
      });
    }
    return result;
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: DeliveryAssignment['status']) => {
    return unifiedDatabase.deliveries.updateStatus(deliveryId, newStatus);
  };

  return {
    status,
    activeDeliveries,
    isLoading,
    isOnline: status !== 'OFFLINE',
    goOnline,
    goOffline,
    updateLocation,
    acceptDelivery,
    updateDeliveryStatus,
    completeDelivery: unifiedDatabase.deliveries.complete,
  };
};

export default useEcosystem;
