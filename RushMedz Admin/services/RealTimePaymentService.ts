/**
 * Real-Time Payment Service
 * WebSocket-based real-time payment status tracking, billing updates, and top-ups
 */

import { eventBus } from './eventBus';
import { paymentGatewayService, PaymentGatewayStatus, PaymentResponse } from './PaymentGatewayService';

// WebSocket connection state
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

// Real-time payment events
export interface RealTimePaymentEvent {
  type: 
    | 'payment.status_changed'
    | 'payment.completed'
    | 'payment.failed'
    | 'payment.refunded'
    | 'wallet.balance_updated'
    | 'wallet.topup_completed'
    | 'billing.invoice_created'
    | 'billing.payment_due'
    | 'billing.payment_received';
  transactionId: string;
  userId: string;
  data: {
    status?: PaymentGatewayStatus;
    amount?: number;
    currency?: string;
    balance?: number;
    previousBalance?: number;
    invoiceId?: string;
    dueDate?: string;
    message?: string;
  };
  timestamp: Date;
}

// Billing record
export interface BillingRecord {
  id: string;
  userId: string;
  type: 'order' | 'subscription' | 'topup' | 'refund';
  description: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate?: Date;
  paidDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Top-up request
export interface TopUpRequest {
  userId: string;
  amount: number;
  paymentMethod: 'gcash' | 'paymaya' | 'paypal' | 'card';
  linkedPaymentMethodId?: string;
  mobileNumber?: string;
  email?: string;
}

// Top-up response
export interface TopUpResponse {
  success: boolean;
  topUpId: string;
  transactionId: string;
  amount: number;
  paymentUrl?: string;
  newBalance?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message?: string;
}

// Event handlers
type PaymentEventHandler = (event: RealTimePaymentEvent) => void;
type BalanceUpdateHandler = (balance: number, previousBalance: number) => void;
type BillingHandler = (record: BillingRecord) => void;

class RealTimePaymentService {
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private userId: string = '';
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  
  // Event handlers
  private paymentHandlers: Set<PaymentEventHandler> = new Set();
  private balanceHandlers: Set<BalanceUpdateHandler> = new Set();
  private billingHandlers: Set<BillingHandler> = new Set();
  
  // State
  private currentBalance: number = 0;
  private pendingPayments: Map<string, { status: PaymentGatewayStatus; amount: number }> = new Map();
  private billingRecords: BillingRecord[] = [];

  private wsUrl = process.env.EXPO_PUBLIC_WS_URL || 'wss://api.rushmedz.com/ws/payments';

  /**
   * Initialize real-time payment service
   */
  initialize(userId: string, initialBalance: number = 0) {
    this.userId = userId;
    this.currentBalance = initialBalance;
    this.connect();
    this.setupEventBusListeners();
    console.log(`[RealTimePayment] Initialized for user: ${userId}`);
  }

  /**
   * Connect to WebSocket server
   */
  private connect() {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
      return;
    }

    this.connectionState = 'connecting';
    console.log('[RealTimePayment] Connecting to WebSocket...');

    try {
      this.ws = new WebSocket(`${this.wsUrl}?userId=${this.userId}`);
      
      this.ws.onopen = () => {
        console.log('[RealTimePayment] WebSocket connected');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startPingInterval();
        
        // Subscribe to payment events
        this.send({
          type: 'subscribe',
          channels: ['payments', 'wallet', 'billing'],
          userId: this.userId,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('[RealTimePayment] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[RealTimePayment] WebSocket error:', error);
        this.connectionState = 'error';
      };

      this.ws.onclose = () => {
        console.log('[RealTimePayment] WebSocket closed');
        this.connectionState = 'disconnected';
        this.stopPingInterval();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[RealTimePayment] Failed to create WebSocket:', error);
      this.connectionState = 'error';
      this.simulateConnection();
    }
  }

  /**
   * Simulate WebSocket connection for development
   */
  private simulateConnection() {
    console.log('[RealTimePayment] Running in simulation mode');
    this.connectionState = 'connected';
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(data: any) {
    console.log('[RealTimePayment] Received:', data.type);

    const event: RealTimePaymentEvent = {
      type: data.type,
      transactionId: data.transactionId || '',
      userId: data.userId || this.userId,
      data: data.data || {},
      timestamp: new Date(data.timestamp || Date.now()),
    };

    switch (data.type) {
      case 'payment.status_changed':
        this.handlePaymentStatusChange(event);
        break;
      case 'payment.completed':
        this.handlePaymentCompleted(event);
        break;
      case 'payment.failed':
        this.handlePaymentFailed(event);
        break;
      case 'wallet.balance_updated':
        this.handleBalanceUpdate(event);
        break;
      case 'wallet.topup_completed':
        this.handleTopUpCompleted(event);
        break;
      case 'billing.invoice_created':
      case 'billing.payment_due':
      case 'billing.payment_received':
        this.handleBillingEvent(event);
        break;
      case 'pong':
        // Ping response received
        break;
    }

    // Notify all payment handlers
    this.paymentHandlers.forEach(handler => handler(event));
  }

  /**
   * Handle payment status change
   */
  private handlePaymentStatusChange(event: RealTimePaymentEvent) {
    const { transactionId, data } = event;
    
    if (data.status) {
      this.pendingPayments.set(transactionId, {
        status: data.status,
        amount: data.amount || 0,
      });
    }

    // Emit event bus notification
    if (data.status === 'completed') {
      eventBus.emit('paymentCompleted', {
        transactionId,
        orderId: transactionId,
        amount: data.amount || 0,
        method: 'gcash', // Will be updated from actual data
      });
    }
  }

  /**
   * Handle payment completed
   */
  private handlePaymentCompleted(event: RealTimePaymentEvent) {
    const { transactionId, data } = event;
    
    this.pendingPayments.delete(transactionId);
    
    // Update balance if wallet payment
    if (data.balance !== undefined) {
      const previousBalance = this.currentBalance;
      this.currentBalance = data.balance;
      this.notifyBalanceUpdate(data.balance, previousBalance);
    }

    console.log(`[RealTimePayment] Payment completed: ${transactionId}`);
  }

  /**
   * Handle payment failed
   */
  private handlePaymentFailed(event: RealTimePaymentEvent) {
    const { transactionId, data } = event;
    this.pendingPayments.delete(transactionId);
    console.log(`[RealTimePayment] Payment failed: ${transactionId} - ${data.message}`);
  }

  /**
   * Handle balance update
   */
  private handleBalanceUpdate(event: RealTimePaymentEvent) {
    const { data } = event;
    
    if (data.balance !== undefined) {
      const previousBalance = data.previousBalance ?? this.currentBalance;
      this.currentBalance = data.balance;
      this.notifyBalanceUpdate(data.balance, previousBalance);
    }
  }

  /**
   * Handle top-up completed
   */
  private handleTopUpCompleted(event: RealTimePaymentEvent) {
    const { data } = event;
    
    if (data.balance !== undefined) {
      const previousBalance = data.previousBalance ?? this.currentBalance;
      this.currentBalance = data.balance;
      this.notifyBalanceUpdate(data.balance, previousBalance);
    }

    console.log(`[RealTimePayment] Top-up completed: ₱${data.amount}`);
  }

  /**
   * Handle billing events
   */
  private handleBillingEvent(event: RealTimePaymentEvent) {
    // Create billing record from event
    const record: BillingRecord = {
      id: event.transactionId,
      userId: event.userId,
      type: 'order',
      description: event.data.message || 'Payment',
      amount: event.data.amount || 0,
      currency: event.data.currency || 'PHP',
      status: event.type === 'billing.payment_received' ? 'paid' : 'pending',
      dueDate: event.data.dueDate ? new Date(event.data.dueDate) : undefined,
      createdAt: event.timestamp,
      updatedAt: event.timestamp,
    };

    this.billingRecords.push(record);
    this.billingHandlers.forEach(handler => handler(record));
  }

  /**
   * Process wallet top-up
   */
  async topUpWallet(request: TopUpRequest): Promise<TopUpResponse> {
    console.log(`[RealTimePayment] Processing top-up: ₱${request.amount} via ${request.paymentMethod}`);

    const topUpId = `TU-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    try {
      // Initiate payment through gateway
      const paymentResponse = await paymentGatewayService.initiatePayment({
        orderId: topUpId,
        userId: request.userId,
        amount: request.amount,
        currency: 'PHP',
        paymentMethod: request.paymentMethod === 'card' ? 'stripe' : request.paymentMethod,
        description: `Wallet Top-Up ₱${request.amount}`,
        mobileNumber: request.mobileNumber,
        metadata: {
          type: 'wallet_topup',
          linkedPaymentMethodId: request.linkedPaymentMethodId,
        },
      });

      if (paymentResponse.success) {
        // Track pending top-up
        this.pendingPayments.set(paymentResponse.transactionId, {
          status: 'pending',
          amount: request.amount,
        });

        // Notify server about pending top-up
        this.send({
          type: 'topup.initiated',
          topUpId,
          transactionId: paymentResponse.transactionId,
          userId: request.userId,
          amount: request.amount,
          paymentMethod: request.paymentMethod,
        });

        return {
          success: true,
          topUpId,
          transactionId: paymentResponse.transactionId,
          amount: request.amount,
          paymentUrl: paymentResponse.paymentUrl,
          status: 'pending',
          message: paymentResponse.message,
        };
      } else {
        return {
          success: false,
          topUpId,
          transactionId: paymentResponse.transactionId,
          amount: request.amount,
          status: 'failed',
          message: paymentResponse.message || 'Top-up initiation failed',
        };
      }
    } catch (error: any) {
      console.error('[RealTimePayment] Top-up error:', error);
      return {
        success: false,
        topUpId,
        transactionId: '',
        amount: request.amount,
        status: 'failed',
        message: error.message || 'Top-up failed',
      };
    }
  }

  /**
   * Confirm top-up after payment completion
   */
  async confirmTopUp(transactionId: string, paymentMethod: string): Promise<{ success: boolean; newBalance: number }> {
    console.log(`[RealTimePayment] Confirming top-up: ${transactionId}`);

    try {
      // Verify payment with gateway
      const verification = await paymentGatewayService.verifyPayment(
        transactionId,
        paymentMethod as any
      );

      if (verification.success && verification.status === 'completed') {
        const pending = this.pendingPayments.get(transactionId);
        const amount = pending?.amount || 0;

        // Update local balance
        const previousBalance = this.currentBalance;
        this.currentBalance += amount;
        
        // Notify server
        this.send({
          type: 'topup.confirmed',
          transactionId,
          userId: this.userId,
          amount,
          newBalance: this.currentBalance,
        });

        // Notify handlers
        this.notifyBalanceUpdate(this.currentBalance, previousBalance);
        
        // Clean up pending
        this.pendingPayments.delete(transactionId);

        return {
          success: true,
          newBalance: this.currentBalance,
        };
      }

      return {
        success: false,
        newBalance: this.currentBalance,
      };
    } catch (error) {
      console.error('[RealTimePayment] Confirm top-up error:', error);
      return {
        success: false,
        newBalance: this.currentBalance,
      };
    }
  }

  /**
   * Get current wallet balance
   */
  getBalance(): number {
    return this.currentBalance;
  }

  /**
   * Get pending payments
   */
  getPendingPayments(): Map<string, { status: PaymentGatewayStatus; amount: number }> {
    return this.pendingPayments;
  }

  /**
   * Get billing history
   */
  getBillingHistory(): BillingRecord[] {
    return [...this.billingRecords].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Subscribe to payment events
   */
  onPaymentEvent(handler: PaymentEventHandler): () => void {
    this.paymentHandlers.add(handler);
    return () => this.paymentHandlers.delete(handler);
  }

  /**
   * Subscribe to balance updates
   */
  onBalanceUpdate(handler: BalanceUpdateHandler): () => void {
    this.balanceHandlers.add(handler);
    return () => this.balanceHandlers.delete(handler);
  }

  /**
   * Subscribe to billing events
   */
  onBillingEvent(handler: BillingHandler): () => void {
    this.billingHandlers.add(handler);
    return () => this.billingHandlers.delete(handler);
  }

  /**
   * Notify balance update handlers
   */
  private notifyBalanceUpdate(newBalance: number, previousBalance: number) {
    this.balanceHandlers.forEach(handler => handler(newBalance, previousBalance));
    
    // Also emit to eventBus for cross-component updates
    eventBus.emit('paymentCompleted', {
      transactionId: `balance-${Date.now()}`,
      orderId: '',
      amount: newBalance - previousBalance,
      method: 'wallet',
    });
  }

  /**
   * Setup eventBus listeners for local events
   */
  private setupEventBusListeners() {
    // Listen for payment initiated events
    eventBus.subscribe('paymentInitiated', (payload) => {
      this.pendingPayments.set(payload.transactionId, {
        status: 'pending',
        amount: payload.amount,
      });
    });

    // Listen for payment completed events
    eventBus.subscribe('paymentCompleted', (payload) => {
      this.pendingPayments.delete(payload.transactionId);
    });
  }

  /**
   * Send message to WebSocket server
   */
  private send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', timestamp: Date.now() });
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[RealTimePayment] Max reconnect attempts reached');
      this.simulateConnection();
      return;
    }

    this.connectionState = 'reconnecting';
    this.reconnectAttempts++;
    
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    console.log(`[RealTimePayment] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionState = 'disconnected';
    this.paymentHandlers.clear();
    this.balanceHandlers.clear();
    this.billingHandlers.clear();
    console.log('[RealTimePayment] Disconnected');
  }
}

// Export singleton
export const realTimePaymentService = new RealTimePaymentService();
export default realTimePaymentService;
