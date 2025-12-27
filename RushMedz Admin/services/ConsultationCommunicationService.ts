/**
 * Consultation Communication Service
 * Handles real-time chat and video call signaling between Doctor and User apps
 * Supports text messaging, typing indicators, read receipts, and video call signaling
 */

import { eventBus } from './eventBus';

// Message types
export interface ChatMessage {
  id: string;
  consultationId: string;
  senderId: string;
  senderType: 'patient' | 'doctor';
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'prescription' | 'system';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  metadata?: {
    fileName?: string;
    fileUrl?: string;
    fileSize?: number;
    mimeType?: string;
    prescriptionId?: string;
  };
}

// Video call states
export type VideoCallState = 
  | 'idle'
  | 'initiating'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'failed';

// Video call event types
export interface VideoCallEvent {
  consultationId: string;
  callId: string;
  type: 'initiate' | 'ring' | 'accept' | 'reject' | 'end' | 'ice_candidate' | 'sdp_offer' | 'sdp_answer';
  initiatorId: string;
  initiatorType: 'patient' | 'doctor';
  recipientId: string;
  recipientType: 'patient' | 'doctor';
  timestamp: Date;
  data?: {
    roomCode?: string;
    sdp?: string;
    candidate?: any;
    reason?: string;
  };
}

// Typing indicator
export interface TypingIndicator {
  consultationId: string;
  userId: string;
  userType: 'patient' | 'doctor';
  isTyping: boolean;
  timestamp: Date;
}

// Consultation session
export interface ConsultationSession {
  id: string;
  appointmentId?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  status: 'waiting' | 'active' | 'paused' | 'ended';
  startTime?: Date;
  endTime?: Date;
  type: 'chat' | 'video' | 'mixed';
  concern: string;
  messages: ChatMessage[];
  videoCallState: VideoCallState;
  activeCallId?: string;
}

// Event handlers
type MessageHandler = (message: ChatMessage) => void;
type TypingHandler = (indicator: TypingIndicator) => void;
type VideoCallHandler = (event: VideoCallEvent) => void;
type SessionHandler = (session: Partial<ConsultationSession>) => void;

class ConsultationCommunicationService {
  private currentSession: ConsultationSession | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private typingHandlers: Set<TypingHandler> = new Set();
  private videoCallHandlers: Set<VideoCallHandler> = new Set();
  private sessionHandlers: Set<SessionHandler> = new Set();
  private typingTimeout: NodeJS.Timeout | null = null;
  private unsubscribers: Array<() => void> = [];
  private userType: 'patient' | 'doctor' = 'patient';
  private userId: string = '';
  private userName: string = '';

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Initialize the service with user context
   */
  initialize(userId: string, userName: string, userType: 'patient' | 'doctor') {
    this.userId = userId;
    this.userName = userName;
    this.userType = userType;
    console.log(`[ConsultationComm] Initialized for ${userType}: ${userName}`);
  }

  /**
   * Setup event bus listeners for real-time events
   */
  private setupEventListeners() {
    // Listen for incoming messages
    const unsubMessage = eventBus.subscribe('consultationMessage', (payload) => {
      if (this.currentSession && 
          payload.consultationId === this.currentSession.id &&
          payload.sender !== this.userType.replace('patient', 'patient')) {
        const message: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          consultationId: payload.consultationId,
          senderId: payload.userId || payload.doctorId,
          senderType: payload.sender === 'patient' ? 'patient' : 'doctor',
          senderName: payload.senderName || 'Unknown',
          content: payload.message,
          type: 'text',
          timestamp: new Date(payload.timestamp || Date.now()),
          status: 'delivered',
        };
        this.currentSession.messages.push(message);
        this.notifyMessageHandlers(message);
      }
    });
    this.unsubscribers.push(unsubMessage);

    // Listen for typing indicators
    const unsubTyping = eventBus.subscribe('consultationTyping' as any, (payload: any) => {
      if (this.currentSession && payload.consultationId === this.currentSession.id) {
        const indicator: TypingIndicator = {
          consultationId: payload.consultationId,
          userId: payload.userId,
          userType: payload.userType,
          isTyping: payload.isTyping,
          timestamp: new Date(),
        };
        this.notifyTypingHandlers(indicator);
      }
    });
    this.unsubscribers.push(unsubTyping);

    // Listen for video call events
    const unsubVideoCall = eventBus.subscribe('consultationVideoCall' as any, (payload: any) => {
      if (this.currentSession && payload.consultationId === this.currentSession.id) {
        this.handleVideoCallEvent(payload);
      }
    });
    this.unsubscribers.push(unsubVideoCall);

    // Listen for session status updates
    const unsubAccepted = eventBus.subscribe('consultationAccepted', (payload) => {
      if (this.currentSession && payload.consultationId === this.currentSession.id) {
        this.currentSession.status = 'active';
        this.currentSession.startTime = new Date();
        this.notifySessionHandlers({ status: 'active', startTime: this.currentSession.startTime });
      }
    });
    this.unsubscribers.push(unsubAccepted);

    const unsubCompleted = eventBus.subscribe('consultationCompleted', (payload) => {
      if (this.currentSession && payload.consultationId === this.currentSession.id) {
        this.currentSession.status = 'ended';
        this.currentSession.endTime = new Date();
        this.notifySessionHandlers({ status: 'ended', endTime: this.currentSession.endTime });
      }
    });
    this.unsubscribers.push(unsubCompleted);

    // Listen for prescriptions
    const unsubPrescription = eventBus.subscribe('consultationPrescription', (payload) => {
      if (this.currentSession && payload.consultationId === this.currentSession.id) {
        const prescMessage: ChatMessage = {
          id: `presc-${Date.now()}`,
          consultationId: payload.consultationId,
          senderId: payload.doctorId,
          senderType: 'doctor',
          senderName: payload.doctorName || 'Doctor',
          content: payload.prescription,
          type: 'prescription',
          timestamp: new Date(),
          status: 'delivered',
          metadata: {
            prescriptionId: payload.prescriptionId,
          },
        };
        this.currentSession.messages.push(prescMessage);
        this.notifyMessageHandlers(prescMessage);
      }
    });
    this.unsubscribers.push(unsubPrescription);
  }

  /**
   * Start a new consultation session
   */
  startSession(params: {
    consultationId: string;
    appointmentId?: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    concern: string;
    type?: 'chat' | 'video' | 'mixed';
  }): ConsultationSession {
    this.currentSession = {
      id: params.consultationId,
      appointmentId: params.appointmentId,
      patientId: params.patientId,
      patientName: params.patientName,
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      status: 'waiting',
      type: params.type || 'chat',
      concern: params.concern,
      messages: [],
      videoCallState: 'idle',
    };

    // Add system message for session start
    const systemMessage: ChatMessage = {
      id: `sys-${Date.now()}`,
      consultationId: params.consultationId,
      senderId: 'system',
      senderType: 'doctor',
      senderName: 'System',
      content: `Consultation session started. Concern: ${params.concern}`,
      type: 'system',
      timestamp: new Date(),
      status: 'delivered',
    };
    this.currentSession.messages.push(systemMessage);

    console.log(`[ConsultationComm] Session started: ${params.consultationId}`);
    return this.currentSession;
  }

  /**
   * Send a chat message
   */
  sendMessage(content: string, type: 'text' | 'image' | 'file' = 'text', metadata?: ChatMessage['metadata']): ChatMessage | null {
    if (!this.currentSession) {
      console.error('[ConsultationComm] No active session');
      return null;
    }

    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      consultationId: this.currentSession.id,
      senderId: this.userId,
      senderType: this.userType,
      senderName: this.userName,
      content,
      type,
      timestamp: new Date(),
      status: 'sending',
      metadata,
    };

    // Add to local messages
    this.currentSession.messages.push(message);

    // Emit to eventBus for cross-app communication
    eventBus.emit('consultationMessage', {
      consultationId: this.currentSession.id,
      userId: this.userType === 'patient' ? this.userId : this.currentSession.patientId,
      doctorId: this.userType === 'doctor' ? this.userId : this.currentSession.doctorId,
      sender: this.userType,
      senderName: this.userName,
      message: content,
      messageType: type,
      messageId: message.id,
      timestamp: message.timestamp.toISOString(),
      metadata,
    });

    // Update status to sent
    setTimeout(() => {
      message.status = 'sent';
      this.notifyMessageHandlers(message);
    }, 100);

    this.notifyMessageHandlers(message);
    return message;
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(isTyping: boolean) {
    if (!this.currentSession) return;

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    // Emit typing indicator
    eventBus.emit('consultationTyping' as any, {
      consultationId: this.currentSession.id,
      userId: this.userId,
      userType: this.userType,
      isTyping,
      timestamp: new Date().toISOString(),
    });

    // Auto-clear typing after 3 seconds
    if (isTyping) {
      this.typingTimeout = setTimeout(() => {
        this.sendTypingIndicator(false);
      }, 3000);
    }
  }

  /**
   * Mark messages as read
   */
  markMessagesAsRead(messageIds: string[]) {
    if (!this.currentSession) return;

    eventBus.emit('consultationMessagesRead' as any, {
      consultationId: this.currentSession.id,
      readerId: this.userId,
      readerType: this.userType,
      messageIds,
      timestamp: new Date().toISOString(),
    });

    // Update local message status
    messageIds.forEach(id => {
      const msg = this.currentSession?.messages.find(m => m.id === id);
      if (msg) msg.status = 'read';
    });
  }

  /**
   * Initiate a video call
   */
  initiateVideoCall(): string | null {
    if (!this.currentSession) {
      console.error('[ConsultationComm] No active session for video call');
      return null;
    }

    const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const roomCode = `room-${this.currentSession.id.slice(-8)}`;

    this.currentSession.videoCallState = 'initiating';
    this.currentSession.activeCallId = callId;

    const videoEvent: VideoCallEvent = {
      consultationId: this.currentSession.id,
      callId,
      type: 'initiate',
      initiatorId: this.userId,
      initiatorType: this.userType,
      recipientId: this.userType === 'patient' ? this.currentSession.doctorId : this.currentSession.patientId,
      recipientType: this.userType === 'patient' ? 'doctor' : 'patient',
      timestamp: new Date(),
      data: { roomCode },
    };

    eventBus.emit('consultationVideoCall' as any, videoEvent);

    // Add system message
    this.sendSystemMessage(`${this.userName} started a video call...`);

    // Transition to ringing after a short delay
    setTimeout(() => {
      if (this.currentSession?.videoCallState === 'initiating') {
        this.currentSession.videoCallState = 'ringing';
        this.notifyVideoCallHandlers({ ...videoEvent, type: 'ring' });
      }
    }, 500);

    return callId;
  }

  /**
   * Accept an incoming video call
   */
  acceptVideoCall(callId: string) {
    if (!this.currentSession || this.currentSession.activeCallId !== callId) {
      console.error('[ConsultationComm] Invalid call to accept');
      return;
    }

    this.currentSession.videoCallState = 'connecting';

    const videoEvent: VideoCallEvent = {
      consultationId: this.currentSession.id,
      callId,
      type: 'accept',
      initiatorId: this.userId,
      initiatorType: this.userType,
      recipientId: this.userType === 'patient' ? this.currentSession.doctorId : this.currentSession.patientId,
      recipientType: this.userType === 'patient' ? 'doctor' : 'patient',
      timestamp: new Date(),
    };

    eventBus.emit('consultationVideoCall' as any, videoEvent);
    this.sendSystemMessage(`${this.userName} joined the video call`);

    // Simulate connection (in production, this would involve WebRTC signaling)
    setTimeout(() => {
      if (this.currentSession?.videoCallState === 'connecting') {
        this.currentSession.videoCallState = 'connected';
        this.notifyVideoCallHandlers({ ...videoEvent, type: 'accept' });
      }
    }, 1000);
  }

  /**
   * Reject an incoming video call
   */
  rejectVideoCall(callId: string, reason: string = 'declined') {
    if (!this.currentSession || this.currentSession.activeCallId !== callId) {
      return;
    }

    this.currentSession.videoCallState = 'ended';
    this.currentSession.activeCallId = undefined;

    const videoEvent: VideoCallEvent = {
      consultationId: this.currentSession.id,
      callId,
      type: 'reject',
      initiatorId: this.userId,
      initiatorType: this.userType,
      recipientId: this.userType === 'patient' ? this.currentSession.doctorId : this.currentSession.patientId,
      recipientType: this.userType === 'patient' ? 'doctor' : 'patient',
      timestamp: new Date(),
      data: { reason },
    };

    eventBus.emit('consultationVideoCall' as any, videoEvent);
    this.sendSystemMessage(`Video call declined: ${reason}`);
  }

  /**
   * End an active video call
   */
  endVideoCall(callId: string) {
    if (!this.currentSession || this.currentSession.activeCallId !== callId) {
      return;
    }

    this.currentSession.videoCallState = 'ended';
    this.currentSession.activeCallId = undefined;

    const videoEvent: VideoCallEvent = {
      consultationId: this.currentSession.id,
      callId,
      type: 'end',
      initiatorId: this.userId,
      initiatorType: this.userType,
      recipientId: this.userType === 'patient' ? this.currentSession.doctorId : this.currentSession.patientId,
      recipientType: this.userType === 'patient' ? 'doctor' : 'patient',
      timestamp: new Date(),
    };

    eventBus.emit('consultationVideoCall' as any, videoEvent);
    this.sendSystemMessage(`${this.userName} ended the video call`);
  }

  /**
   * Handle incoming video call events
   */
  private handleVideoCallEvent(payload: any) {
    if (!this.currentSession) return;

    const event: VideoCallEvent = {
      consultationId: payload.consultationId,
      callId: payload.callId,
      type: payload.type,
      initiatorId: payload.initiatorId,
      initiatorType: payload.initiatorType,
      recipientId: payload.recipientId,
      recipientType: payload.recipientType,
      timestamp: new Date(payload.timestamp),
      data: payload.data,
    };

    switch (event.type) {
      case 'initiate':
      case 'ring':
        if (event.initiatorId !== this.userId) {
          this.currentSession.videoCallState = 'ringing';
          this.currentSession.activeCallId = event.callId;
        }
        break;
      case 'accept':
        this.currentSession.videoCallState = 'connected';
        break;
      case 'reject':
      case 'end':
        this.currentSession.videoCallState = 'ended';
        setTimeout(() => {
          if (this.currentSession) {
            this.currentSession.videoCallState = 'idle';
            this.currentSession.activeCallId = undefined;
          }
        }, 2000);
        break;
    }

    this.notifyVideoCallHandlers(event);
  }

  /**
   * Send a system message
   */
  private sendSystemMessage(content: string) {
    if (!this.currentSession) return;

    const message: ChatMessage = {
      id: `sys-${Date.now()}`,
      consultationId: this.currentSession.id,
      senderId: 'system',
      senderType: 'doctor',
      senderName: 'System',
      content,
      type: 'system',
      timestamp: new Date(),
      status: 'delivered',
    };

    this.currentSession.messages.push(message);
    this.notifyMessageHandlers(message);
  }

  /**
   * End the consultation session
   */
  endSession() {
    if (!this.currentSession) return;

    this.currentSession.status = 'ended';
    this.currentSession.endTime = new Date();

    // End any active video call
    if (this.currentSession.activeCallId) {
      this.endVideoCall(this.currentSession.activeCallId);
    }

    eventBus.emit('consultationCompleted', {
      consultationId: this.currentSession.id,
      userId: this.currentSession.patientId,
      doctorId: this.currentSession.doctorId,
      doctorName: this.currentSession.doctorName,
    });

    this.sendSystemMessage('Consultation session ended');
    this.notifySessionHandlers({ status: 'ended', endTime: this.currentSession.endTime });

    console.log(`[ConsultationComm] Session ended: ${this.currentSession.id}`);
  }

  /**
   * Get current session
   */
  getSession(): ConsultationSession | null {
    return this.currentSession;
  }

  /**
   * Get messages for current session
   */
  getMessages(): ChatMessage[] {
    return this.currentSession?.messages || [];
  }

  // Subscription methods
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onTyping(handler: TypingHandler): () => void {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  onVideoCall(handler: VideoCallHandler): () => void {
    this.videoCallHandlers.add(handler);
    return () => this.videoCallHandlers.delete(handler);
  }

  onSessionUpdate(handler: SessionHandler): () => void {
    this.sessionHandlers.add(handler);
    return () => this.sessionHandlers.delete(handler);
  }

  // Notification methods
  private notifyMessageHandlers(message: ChatMessage) {
    this.messageHandlers.forEach(h => h(message));
  }

  private notifyTypingHandlers(indicator: TypingIndicator) {
    this.typingHandlers.forEach(h => h(indicator));
  }

  private notifyVideoCallHandlers(event: VideoCallEvent) {
    this.videoCallHandlers.forEach(h => h(event));
  }

  private notifySessionHandlers(session: Partial<ConsultationSession>) {
    this.sessionHandlers.forEach(h => h(session));
  }

  /**
   * Cleanup
   */
  destroy() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    this.messageHandlers.clear();
    this.typingHandlers.clear();
    this.videoCallHandlers.clear();
    this.sessionHandlers.clear();
    this.currentSession = null;
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }
}

// Export singleton instance
export const consultationCommService = new ConsultationCommunicationService();

// Export class for testing
export { ConsultationCommunicationService };
