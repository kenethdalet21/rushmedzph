/**
 * Unified Database Service for RushMedz Ecosystem
 * 
 * This service provides a centralized interface for all apps to interact
 * with the unified backend database. It handles:
 * - User authentication across all apps
 * - Product management (Merchant <-> User)
 * - Prescription management (Doctor <-> User <-> Merchant)
 * - Delivery management (Driver <-> Merchant <-> User)
 * - Real-time updates via WebSocket
 */

// Configuration - declare process for Node/Expo environments
declare const process: { env: Record<string, string | undefined> } | undefined;

const getEnv = (key: string, defaultValue: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

const API_BASE_URL = getEnv('EXPO_PUBLIC_API_URL', 'http://localhost:8080/api');
const WS_BASE_URL = getEnv('EXPO_PUBLIC_WS_URL', 'ws://localhost:8080/ws');

// Types
export type UserRole = 'ADMIN' | 'USER' | 'MERCHANT' | 'DOCTOR' | 'DRIVER';
export type PrescriptionStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'USED' | 'CANCELLED';
export type ConsultationStatus = 'REQUESTED' | 'SCHEDULED' | 'WAITING_ROOM' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type ConsultationType = 'CHAT' | 'VIDEO' | 'AUDIO' | 'IN_PERSON';
export type DeliveryStatus = 'ASSIGNED' | 'ACCEPTED' | 'PICKING_UP' | 'PICKED_UP' | 'EN_ROUTE' | 'ARRIVED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type DriverStatus = 'OFFLINE' | 'ONLINE_AVAILABLE' | 'ONLINE_BUSY' | 'EN_ROUTE_TO_PICKUP' | 'AT_PICKUP' | 'EN_ROUTE_TO_DELIVERY' | 'AT_DELIVERY';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  isActive: boolean;
  requiresPrescription: boolean;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Prescription {
  id: string;
  userId: string;
  doctorId?: string;
  imageUrl: string;
  notes?: string;
  status: PrescriptionStatus;
  validFrom: string;
  validUntil?: string;
  diagnosis?: string;
  linkedOrderId?: string;
  items: PrescriptionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItem {
  id: string;
  productId?: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions?: string;
  isSubstitutable: boolean;
}

export interface Consultation {
  id: string;
  userId: string;
  doctorId: string;
  consultationType: ConsultationType;
  status: ConsultationStatus;
  scheduledAt?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  consultationFee: number;
  roomId?: string;
  linkedPrescriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  consultationId: string;
  senderId: string;
  senderType: 'DOCTOR' | 'USER' | 'SYSTEM';
  messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'PRESCRIPTION';
  content: string;
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DeliveryAssignment {
  id: string;
  orderId: string;
  driverId: string;
  merchantId: string;
  userId: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  currentLat?: number;
  currentLng?: number;
  status: DeliveryStatus;
  estimatedDeliveryTime?: string;
  estimatedDuration?: number;
  actualDistance?: number;
  deliveryFee: number;
  driverEarnings: number;
  proofOfDeliveryUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverLocation {
  id: string;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  status: DriverStatus;
  currentAssignmentId?: string;
  lastUpdated: string;
}

export interface PatientRecord {
  id: string;
  userId: string;
  dateOfBirth?: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  emergencyContact?: string;
  emergencyPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  primaryDoctorId?: string;
  lastVisitDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  userRole: UserRole;
  title: string;
  message: string;
  notificationType: string;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  createdAt: string;
}

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Token Storage
let authToken: string | null = null;

// WebSocket Connection - using native WebSocket
let wsConnection: WebSocket | null = null;
let wsReconnectInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Sets the authentication token for API requests
 */
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

/**
 * Gets headers for authenticated requests
 */
const getHeaders = (contentType = 'application/json'): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': contentType,
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

/**
 * Generic API request handler
 */
const apiRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: any
): Promise<ApiResponse<T>> => {
  try {
    const options: RequestInit = {
      method,
      headers: getHeaders(),
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
};

// ==================== PRODUCT SERVICES ====================

export const productService = {
  /**
   * Get all products with optional filtering
   */
  getAll: async (params?: {
    category?: string;
    merchantId?: string;
    search?: string;
    requiresPrescription?: boolean;
  }): Promise<ApiResponse<Product[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.set('category', params.category);
    if (params?.merchantId) queryParams.set('merchantId', params.merchantId);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.requiresPrescription !== undefined) {
      queryParams.set('requiresPrescription', params.requiresPrescription.toString());
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest<Product[]>(`/products${query}`);
  },

  /**
   * Get a single product by ID
   */
  getById: async (id: string): Promise<ApiResponse<Product>> => {
    return apiRequest<Product>(`/products/${id}`);
  },

  /**
   * Create a new product (Merchant only)
   */
  create: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'images'>): Promise<ApiResponse<Product>> => {
    return apiRequest<Product>('/products', 'POST', product);
  },

  /**
   * Update an existing product (Merchant only)
   */
  update: async (id: string, product: Partial<Product>): Promise<ApiResponse<Product>> => {
    return apiRequest<Product>(`/products/${id}`, 'PUT', product);
  },

  /**
   * Delete a product (Merchant only)
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(`/products/${id}`, 'DELETE');
  },

  /**
   * Add image to product
   */
  addImage: async (productId: string, imageData: { imageUrl: string; isPrimary?: boolean }): Promise<ApiResponse<ProductImage>> => {
    return apiRequest<ProductImage>(`/products/${productId}/images`, 'POST', imageData);
  },

  /**
   * Remove image from product
   */
  removeImage: async (productId: string, imageId: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(`/products/${productId}/images/${imageId}`, 'DELETE');
  },

  /**
   * Get products by merchant
   */
  getByMerchant: async (merchantId: string): Promise<ApiResponse<Product[]>> => {
    return apiRequest<Product[]>(`/products/merchant/${merchantId}`);
  },

  /**
   * Get prescription-required products
   */
  getPrescriptionProducts: async (): Promise<ApiResponse<Product[]>> => {
    return apiRequest<Product[]>('/products/prescription-required');
  },
};

// ==================== PRESCRIPTION SERVICES ====================

export const prescriptionService = {
  /**
   * Upload a new prescription (User)
   */
  upload: async (prescription: {
    imageUrl: string;
    notes?: string;
    items?: Omit<PrescriptionItem, 'id'>[];
  }): Promise<ApiResponse<Prescription>> => {
    return apiRequest<Prescription>('/prescriptions', 'POST', prescription);
  },

  /**
   * Get user's prescriptions
   */
  getUserPrescriptions: async (userId: string): Promise<ApiResponse<Prescription[]>> => {
    return apiRequest<Prescription[]>(`/prescriptions/user/${userId}`);
  },

  /**
   * Get prescription by ID
   */
  getById: async (id: string): Promise<ApiResponse<Prescription>> => {
    return apiRequest<Prescription>(`/prescriptions/${id}`);
  },

  /**
   * Get pending prescriptions for review (Doctor)
   */
  getPending: async (): Promise<ApiResponse<Prescription[]>> => {
    return apiRequest<Prescription[]>('/prescriptions/pending');
  },

  /**
   * Approve prescription (Doctor)
   */
  approve: async (id: string, data: {
    validUntil: string;
    notes?: string;
    items?: Omit<PrescriptionItem, 'id'>[];
  }): Promise<ApiResponse<Prescription>> => {
    return apiRequest<Prescription>(`/prescriptions/${id}/approve`, 'POST', data);
  },

  /**
   * Reject prescription (Doctor)
   */
  reject: async (id: string, reason: string): Promise<ApiResponse<Prescription>> => {
    return apiRequest<Prescription>(`/prescriptions/${id}/reject`, 'POST', { reason });
  },

  /**
   * Link prescription to order (Merchant/System)
   */
  linkToOrder: async (prescriptionId: string, orderId: string): Promise<ApiResponse<Prescription>> => {
    return apiRequest<Prescription>(`/prescriptions/${prescriptionId}/link-order`, 'POST', { orderId });
  },

  /**
   * Validate prescription for product purchase
   */
  validate: async (prescriptionId: string, productId: string): Promise<ApiResponse<{ valid: boolean; message: string }>> => {
    return apiRequest(`/prescriptions/${prescriptionId}/validate/${productId}`);
  },

  /**
   * Get expiring prescriptions (Doctor)
   */
  getExpiring: async (days: number = 7): Promise<ApiResponse<Prescription[]>> => {
    return apiRequest<Prescription[]>(`/prescriptions/expiring?days=${days}`);
  },
};

// ==================== CONSULTATION SERVICES ====================

export const consultationService = {
  /**
   * Request a new consultation (User)
   */
  request: async (data: {
    doctorId?: string;
    consultationType: ConsultationType;
    chiefComplaint: string;
    scheduledAt?: string;
  }): Promise<ApiResponse<Consultation>> => {
    return apiRequest<Consultation>('/consultations', 'POST', data);
  },

  /**
   * Get user's consultations
   */
  getUserConsultations: async (userId: string): Promise<ApiResponse<Consultation[]>> => {
    return apiRequest<Consultation[]>(`/consultations/user/${userId}`);
  },

  /**
   * Get doctor's consultations
   */
  getDoctorConsultations: async (doctorId: string): Promise<ApiResponse<Consultation[]>> => {
    return apiRequest<Consultation[]>(`/consultations/doctor/${doctorId}`);
  },

  /**
   * Get consultation by ID
   */
  getById: async (id: string): Promise<ApiResponse<Consultation>> => {
    return apiRequest<Consultation>(`/consultations/${id}`);
  },

  /**
   * Accept consultation (Doctor)
   */
  accept: async (id: string): Promise<ApiResponse<Consultation>> => {
    return apiRequest<Consultation>(`/consultations/${id}/accept`, 'POST');
  },

  /**
   * Start consultation (Doctor)
   */
  start: async (id: string): Promise<ApiResponse<Consultation>> => {
    return apiRequest<Consultation>(`/consultations/${id}/start`, 'POST');
  },

  /**
   * End consultation (Doctor)
   */
  end: async (id: string, data: {
    diagnosis: string;
    treatmentPlan: string;
    createPrescription?: boolean;
  }): Promise<ApiResponse<Consultation>> => {
    return apiRequest<Consultation>(`/consultations/${id}/end`, 'POST', data);
  },

  /**
   * Cancel consultation
   */
  cancel: async (id: string, reason: string): Promise<ApiResponse<Consultation>> => {
    return apiRequest<Consultation>(`/consultations/${id}/cancel`, 'POST', { reason });
  },

  /**
   * Get chat messages for consultation
   */
  getMessages: async (consultationId: string): Promise<ApiResponse<ChatMessage[]>> => {
    return apiRequest<ChatMessage[]>(`/consultations/${consultationId}/messages`);
  },

  /**
   * Send chat message
   */
  sendMessage: async (consultationId: string, message: {
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT';
    attachmentUrl?: string;
  }): Promise<ApiResponse<ChatMessage>> => {
    return apiRequest<ChatMessage>(`/consultations/${consultationId}/messages`, 'POST', message);
  },

  /**
   * Get pending consultations for doctor
   */
  getPendingForDoctor: async (doctorId: string): Promise<ApiResponse<Consultation[]>> => {
    return apiRequest<Consultation[]>(`/consultations/doctor/${doctorId}/pending`);
  },
};

// ==================== DELIVERY SERVICES ====================

export const deliveryService = {
  /**
   * Create delivery assignment (System/Admin)
   */
  createAssignment: async (data: {
    orderId: string;
    merchantId: string;
    userId: string;
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    deliveryAddress: string;
    deliveryLat: number;
    deliveryLng: number;
    deliveryFee: number;
  }): Promise<ApiResponse<DeliveryAssignment>> => {
    return apiRequest<DeliveryAssignment>('/deliveries', 'POST', data);
  },

  /**
   * Get delivery by ID
   */
  getById: async (id: string): Promise<ApiResponse<DeliveryAssignment>> => {
    return apiRequest<DeliveryAssignment>(`/deliveries/${id}`);
  },

  /**
   * Get driver's active deliveries
   */
  getDriverDeliveries: async (driverId: string): Promise<ApiResponse<DeliveryAssignment[]>> => {
    return apiRequest<DeliveryAssignment[]>(`/deliveries/driver/${driverId}`);
  },

  /**
   * Get user's deliveries (order history)
   */
  getUserDeliveries: async (userId: string): Promise<ApiResponse<DeliveryAssignment[]>> => {
    return apiRequest<DeliveryAssignment[]>(`/deliveries/user/${userId}`);
  },

  /**
   * Update delivery status (Driver)
   */
  updateStatus: async (id: string, status: DeliveryStatus, notes?: string): Promise<ApiResponse<DeliveryAssignment>> => {
    return apiRequest<DeliveryAssignment>(`/deliveries/${id}/status`, 'PUT', { status, notes });
  },

  /**
   * Update driver location
   */
  updateLocation: async (driverId: string, location: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  }): Promise<ApiResponse<DriverLocation>> => {
    return apiRequest<DriverLocation>(`/deliveries/driver/${driverId}/location`, 'PUT', location);
  },

  /**
   * Get driver location
   */
  getDriverLocation: async (driverId: string): Promise<ApiResponse<DriverLocation>> => {
    return apiRequest<DriverLocation>(`/deliveries/driver/${driverId}/location`);
  },

  /**
   * Find nearby available drivers
   */
  findNearbyDrivers: async (lat: number, lng: number, radiusKm: number = 5): Promise<ApiResponse<DriverLocation[]>> => {
    return apiRequest<DriverLocation[]>(`/deliveries/drivers/nearby?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
  },

  /**
   * Accept delivery assignment (Driver)
   */
  accept: async (id: string): Promise<ApiResponse<DeliveryAssignment>> => {
    return apiRequest<DeliveryAssignment>(`/deliveries/${id}/accept`, 'POST');
  },

  /**
   * Complete delivery with proof (Driver)
   */
  complete: async (id: string, proofOfDeliveryUrl: string): Promise<ApiResponse<DeliveryAssignment>> => {
    return apiRequest<DeliveryAssignment>(`/deliveries/${id}/complete`, 'POST', { proofOfDeliveryUrl });
  },

  /**
   * Get driver earnings
   */
  getDriverEarnings: async (driverId: string, startDate: string, endDate: string): Promise<ApiResponse<{ total: number; count: number }>> => {
    return apiRequest(`/deliveries/driver/${driverId}/earnings?startDate=${startDate}&endDate=${endDate}`);
  },

  /**
   * Update driver availability status
   */
  setDriverStatus: async (driverId: string, status: DriverStatus): Promise<ApiResponse<DriverLocation>> => {
    return apiRequest<DriverLocation>(`/deliveries/driver/${driverId}/status`, 'PUT', { status });
  },
};

// ==================== PATIENT RECORD SERVICES ====================

export const patientRecordService = {
  /**
   * Get patient record (Doctor)
   */
  getByUserId: async (userId: string): Promise<ApiResponse<PatientRecord>> => {
    return apiRequest<PatientRecord>(`/patients/${userId}`);
  },

  /**
   * Create or update patient record (Doctor)
   */
  upsert: async (userId: string, data: Partial<PatientRecord>): Promise<ApiResponse<PatientRecord>> => {
    return apiRequest<PatientRecord>(`/patients/${userId}`, 'PUT', data);
  },

  /**
   * Get patients by doctor
   */
  getByDoctor: async (doctorId: string): Promise<ApiResponse<PatientRecord[]>> => {
    return apiRequest<PatientRecord[]>(`/patients/doctor/${doctorId}`);
  },

  /**
   * Add medical history entry
   */
  addMedicalHistory: async (userId: string, entry: {
    type: 'allergy' | 'condition' | 'medication';
    value: string;
  }): Promise<ApiResponse<PatientRecord>> => {
    return apiRequest<PatientRecord>(`/patients/${userId}/medical-history`, 'POST', entry);
  },
};

// ==================== NOTIFICATION SERVICES ====================

export const notificationService = {
  /**
   * Get user notifications
   */
  getAll: async (userId: string): Promise<ApiResponse<Notification[]>> => {
    return apiRequest<Notification[]>(`/notifications/user/${userId}`);
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (userId: string): Promise<ApiResponse<{ count: number }>> => {
    return apiRequest(`/notifications/user/${userId}/unread-count`);
  },

  /**
   * Mark as read
   */
  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    return apiRequest<Notification>(`/notifications/${id}/read`, 'PUT');
  },

  /**
   * Mark all as read
   */
  markAllAsRead: async (userId: string): Promise<ApiResponse<void>> => {
    return apiRequest<void>(`/notifications/user/${userId}/read-all`, 'PUT');
  },
};

// ==================== REAL-TIME SERVICES ====================

type EventCallback<T = any> = (data: T) => void;

// Order update payload type
export interface OrderUpdate {
  id: string;
  userId: string;
  merchantId: string;
  driverId?: string;
  status: string;
  totalAmount: number;
  currency: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  items: unknown[];
  eventType?: string;
  newStatus?: string;
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
}

// Driver location update payload
export interface DriverLocationUpdate {
  orderId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

// Payment update payload type
export interface PaymentUpdate {
  orderId: string;
  transactionId?: string;
  amount?: number;
  paymentMethod?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reason?: string;
  timestamp: string;
}

interface RealtimeSubscriptions {
  'product:update': EventCallback<Product>;
  'product:delete': EventCallback<{ productId: string }>;
  'prescription:update': EventCallback<Prescription>;
  'consultation:update': EventCallback<Consultation>;
  'consultation:message': EventCallback<ChatMessage>;
  'delivery:update': EventCallback<DeliveryAssignment>;
  'delivery:location': EventCallback<DriverLocation>;
  'notification:new': EventCallback<Notification>;
  // Order events - real-time sync across all apps
  'order:update': EventCallback<OrderUpdate>;
  'order:created': EventCallback<OrderUpdate>;
  'order:status_changed': EventCallback<OrderUpdate>;
  'order:ready_for_pickup': EventCallback<OrderUpdate>;
  'order:delivered': EventCallback<OrderUpdate>;
  'order:cancelled': EventCallback<OrderUpdate>;
  // Driver events
  'driver:assigned': EventCallback<OrderUpdate>;
  'driver:location_updated': EventCallback<DriverLocationUpdate>;
  // Payment events - real-time sync across all apps
  'payment:completed': EventCallback<PaymentUpdate>;
  'payment:failed': EventCallback<PaymentUpdate>;
  'payment:pending': EventCallback<PaymentUpdate>;
  'payment:refunded': EventCallback<PaymentUpdate>;
}

const subscriptions: Map<keyof RealtimeSubscriptions, Set<EventCallback>> = new Map();

// Track connection state
let isWsConnected = false;

export const realtimeService = {
  /**
   * Connect to WebSocket server
   */
  connect: async (userId: string, userRole: UserRole): Promise<void> => {
    if (wsConnection?.readyState === WebSocket.OPEN) return;

    return new Promise((resolve, reject) => {
      try {
        // Using native WebSocket
        const wsUrl = `${WS_BASE_URL}?userId=${userId}&role=${userRole}`;
        
        wsConnection = new WebSocket(wsUrl);

        wsConnection.onopen = () => {
          console.log('WebSocket connected');
          isWsConnected = true;
          
          // Subscribe to user-specific channel
          if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
            wsConnection.send(JSON.stringify({ type: 'subscribe', userId, role: userRole }));
          }
          
          resolve();
        };

        wsConnection.onclose = (event: CloseEvent) => {
          console.log('WebSocket disconnected:', event.reason);
          isWsConnected = false;
        };

        wsConnection.onerror = (event: Event) => {
          console.error('WebSocket error:', event);
          isWsConnected = false;
        };

        wsConnection.onmessage = (event: MessageEvent) => {
          try {
            const message = JSON.parse(event.data as string) as { type: string; data: unknown };
            const eventType = message.type as keyof RealtimeSubscriptions;
            
            if (subscriptions.has(eventType)) {
              emitToSubscribers(eventType, message.data);
            }
          } catch (e) {
            console.error('Error parsing WebSocket message:', e);
          }
        };

        // Timeout connection attempt
        setTimeout(() => {
          if (wsConnection?.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Disconnect from WebSocket server
   */
  disconnect: () => {
    if (wsReconnectInterval) {
      clearInterval(wsReconnectInterval);
      wsReconnectInterval = null;
    }
    if (wsConnection) {
      wsConnection.close();
      wsConnection = null;
    }
    isWsConnected = false;
    subscriptions.clear();
  },

  /**
   * Subscribe to real-time events
   */
  subscribe: <K extends keyof RealtimeSubscriptions>(
    event: K,
    callback: RealtimeSubscriptions[K]
  ): (() => void) => {
    if (!subscriptions.has(event)) {
      subscriptions.set(event, new Set());
    }
    subscriptions.get(event)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      subscriptions.get(event)?.delete(callback as EventCallback);
    };
  },

  /**
   * Check if connected
   */
  isConnected: (): boolean => {
    return isWsConnected && wsConnection?.readyState === WebSocket.OPEN;
  },

  /**
   * Subscribe to specific delivery tracking
   */
  trackDelivery: (deliveryId: string, callback: EventCallback<DriverLocation>): (() => void) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({ type: 'track:delivery', deliveryId }));
    }
    
    const handler = (data: DriverLocation) => {
      if (data.currentAssignmentId === deliveryId) {
        callback(data);
      }
    };

    return realtimeService.subscribe('delivery:location', handler);
  },

  /**
   * Subscribe to consultation chat
   */
  joinConsultationChat: (consultationId: string, callback: EventCallback<ChatMessage>): (() => void) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({ type: 'join:consultation', consultationId }));
    }
    
    const handler = (data: ChatMessage) => {
      if (data.consultationId === consultationId) {
        callback(data);
      }
    };

    return realtimeService.subscribe('consultation:message', handler);
  },

  /**
   * Leave consultation chat
   */
  leaveConsultationChat: (consultationId: string) => {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({ type: 'leave:consultation', consultationId }));
    }
  },
};

// Helper function to emit to subscribers
const emitToSubscribers = <K extends keyof RealtimeSubscriptions>(
  event: K,
  data: unknown
) => {
  const callbacks = subscriptions.get(event);
  if (callbacks) {
    callbacks.forEach((callback) => callback(data));
  }
};

// ==================== UNIFIED DATABASE CONTEXT ====================

export interface EcosystemState {
  user: User | null;
  isAuthenticated: boolean;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
}

// Export all services as a unified interface
export const unifiedDatabase = {
  products: productService,
  prescriptions: prescriptionService,
  consultations: consultationService,
  deliveries: deliveryService,
  patients: patientRecordService,
  notifications: notificationService,
  realtime: realtimeService,
  setAuthToken,
};

export default unifiedDatabase;
