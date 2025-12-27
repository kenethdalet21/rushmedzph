type EventHandler<T> = (payload: T) => void;

// Event payloads
export interface OrderAcceptedPayload { orderId: string; driverId?: string; timestamp?: string; }
export interface OrderStatusChangedPayload { orderId: string; status: string; driverId?: string; timestamp?: string; }
export interface OrderCompletedPayload { orderId: string; amount: number; driverId?: string; completedAt?: string; }
export interface OrderPlacedPayload { order: any; orderId?: string; }
export interface OrderReadyForPickupPayload { orderId: string; }
export interface OrderDeliveredPayload { 
  orderId: string; 
  driverId: string; 
  driverName?: string;
  deliveryFee?: number;
  deliveryTime?: string;
  userId?: string;
  merchantId?: string;
  timestamp?: string;
}
export interface DriverAcceptedOrderPayload {
  orderId: string;
  driverId: string;
  driverName?: string;
  vehicleType?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
  estimatedPickupTime?: string;
  timestamp?: string;
}
export interface MerchantAcceptedOrderPayload {
  orderId: string;
  merchantId: string;
  merchantName?: string;
  estimatedPrepTime?: string;
  timestamp?: string;
}
export interface UserRatedDriverPayload {
  driverId: string;
  rating: number;
  orderId?: string;
  userId?: string;
  feedback?: string;
  timestamp?: string;
}
export interface ProductAddedPayload { product: any; }
export interface ProductUpdatedPayload { product: any; }
export interface ProductDeletedPayload { productId: string; }
export interface DriverStatusChangedPayload { driverId: string; online: boolean; }
export interface PaymentInitiatedPayload { transactionId: string; orderId: string; amount: number; method: string; }
export interface PaymentCompletedPayload { transactionId: string; orderId: string; amount: number; method: string; }
export interface RefundRequestedPayload { transactionId: string; orderId: string; amount: number; reason: string; }
export interface NotificationComposedPayload { title: string; message: string; target: 'all'|'users'|'merchants'|'drivers'; }
export interface PrescriptionUploadedPayload { 
  prescription: { 
    id: string; 
    userId: string; 
    userName?: string;
    userEmail?: string;
    doctorId: string;
    doctorName?: string;
    imageUri: string; 
    uploadedAt: string; 
    notes?: string;
    status: 'pending' | 'approved' | 'rejected' | 'stored';
    isExternal: boolean;
  }; 
}
export interface PrescriptionStatusChangedPayload { 
  prescriptionId: string; 
  userId: string;
  status: 'pending' | 'approved' | 'rejected'; 
  doctorId?: string;
  doctorName?: string;
  doctorNotes?: string;
}
export interface PrescriptionDeletedPayload { prescriptionId: string; userId: string; doctorId: string; }

// Appointment/Consultation events
export interface AppointmentRequestedPayload {
  appointment: {
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    doctorId: string;
    doctorName?: string;
    concern: string;
    concernLabel?: string;
    requestedAt: string;
    status: 'pending' | 'accepted' | 'active' | 'completed' | 'cancelled' | 'rejected';
    consultationType: 'chat' | 'video';
  };
}
export interface AppointmentStatusChangedPayload {
  appointmentId: string;
  userId: string;
  doctorId: string;
  status: 'pending' | 'accepted' | 'active' | 'completed' | 'cancelled' | 'rejected';
  doctorNotes?: string;
  startedAt?: string;
  endedAt?: string;
}
export interface AppointmentCompletedPayload {
  appointmentId: string;
  userId: string;
  doctorId: string;
  duration: number; // in seconds
  summary?: string;
}

// Consultation events
export interface ConsultationRequestedPayload {
  consultationId: string;
  userId: string;
  userName?: string;
  userAge?: number;
  userGender?: string;
  doctorId: string;
  concern: string;
  description?: string;
}
export interface ConsultationAcceptedPayload {
  consultationId: string;
  userId: string;
  doctorId: string;
  doctorName?: string;
}
export interface ConsultationMessagePayload {
  consultationId: string;
  userId: string;
  doctorId: string;
  sender: 'patient' | 'doctor';
  message: string;
}
export interface ConsultationPrescriptionPayload {
  consultationId: string;
  userId: string;
  doctorId: string;
  prescription: string;
}
export interface ConsultationCompletedPayload {
  consultationId: string;
  userId: string;
  doctorId: string;
  doctorName?: string;
}
export interface ConsultationCancelledPayload {
  consultationId: string;
  userId: string;
  doctorId: string;
}

// Video call events
export interface ConsultationVideoCallPayload {
  consultationId: string;
  callId: string;
  type: 'initiate' | 'ring' | 'accept' | 'reject' | 'end' | 'ice_candidate' | 'sdp_offer' | 'sdp_answer';
  initiatorId: string;
  initiatorType: 'patient' | 'doctor';
  recipientId: string;
  recipientType: 'patient' | 'doctor';
  timestamp: string;
  data?: {
    roomCode?: string;
    sdp?: string;
    candidate?: any;
    reason?: string;
  };
}

// Typing indicator event
export interface ConsultationTypingPayload {
  consultationId: string;
  userId: string;
  userType: 'patient' | 'doctor';
  isTyping: boolean;
  timestamp: string;
}

// Messages read event
export interface ConsultationMessagesReadPayload {
  consultationId: string;
  readerId: string;
  readerType: 'patient' | 'doctor';
  messageIds: string[];
  timestamp: string;
}

export type EventMap = {
  orderAccepted: OrderAcceptedPayload;
  orderStatusChanged: OrderStatusChangedPayload;
  orderCompleted: OrderCompletedPayload;
  orderPlaced: OrderPlacedPayload;
  orderReadyForPickup: OrderReadyForPickupPayload;
  orderDelivered: OrderDeliveredPayload;
  driverAcceptedOrder: DriverAcceptedOrderPayload;
  merchantAcceptedOrder: MerchantAcceptedOrderPayload;
  userRatedDriver: UserRatedDriverPayload;
  productAdded: ProductAddedPayload;
  productUpdated: ProductUpdatedPayload;
  productDeleted: ProductDeletedPayload;
  driverStatusChanged: DriverStatusChangedPayload;
  paymentInitiated: PaymentInitiatedPayload;
  paymentCompleted: PaymentCompletedPayload;
  refundRequested: RefundRequestedPayload;
  notificationComposed: NotificationComposedPayload;
  prescriptionUploaded: PrescriptionUploadedPayload;
  prescriptionStatusChanged: PrescriptionStatusChangedPayload;
  prescriptionDeleted: PrescriptionDeletedPayload;
  appointmentRequested: AppointmentRequestedPayload;
  appointmentStatusChanged: AppointmentStatusChangedPayload;
  appointmentCompleted: AppointmentCompletedPayload;
  consultationRequested: ConsultationRequestedPayload;
  consultationAccepted: ConsultationAcceptedPayload;
  consultationMessage: ConsultationMessagePayload;
  consultationPrescription: ConsultationPrescriptionPayload;
  consultationCompleted: ConsultationCompletedPayload;
  consultationCancelled: ConsultationCancelledPayload;
  consultationVideoCall: ConsultationVideoCallPayload;
  consultationTyping: ConsultationTypingPayload;
  consultationMessagesRead: ConsultationMessagesReadPayload;
};

class EventBus {
  private listeners: { [K in keyof EventMap]?: Set<EventHandler<EventMap[K]>> } = {};

  subscribe<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
    if (!this.listeners[event]) {
      (this.listeners[event] as any) = new Set<EventHandler<EventMap[K]>>();
    }
    this.listeners[event]!.add(handler);
    return () => { this.listeners[event]!.delete(handler); };
  }

  publish<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const handlers = this.listeners[event];
    if (!handlers) return;
    handlers.forEach(h => {
      try { h(payload); } catch (e) { console.error(`EventBus handler error for ${String(event)}`, e); }
    });
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.publish(event, payload);
  }
}

export const eventBus = new EventBus();
