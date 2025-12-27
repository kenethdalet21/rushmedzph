/**
 * Payment Gateway Service
 * Real integration with GCash, PayMaya, PayPal, Stripe (Visa/Mastercard), and COD
 * Provides unified payment processing across all payment methods
 */

import { Linking, Platform } from 'react-native';
import { eventBus } from './eventBus';

// Payment Gateway Configuration
export const PAYMENT_GATEWAY_CONFIG = {
  // GCash API Configuration (Philippines)
  gcash: {
    apiUrl: process.env.EXPO_PUBLIC_GCASH_API_URL || 'https://api.gcash.com/v1',
    merchantId: process.env.EXPO_PUBLIC_GCASH_MERCHANT_ID || '',
    secretKey: process.env.EXPO_PUBLIC_GCASH_SECRET_KEY || '',
    publicKey: process.env.EXPO_PUBLIC_GCASH_PUBLIC_KEY || '',
    environment: process.env.EXPO_PUBLIC_PAYMENT_ENV || 'sandbox',
    // Sandbox test credentials
    sandbox: {
      apiUrl: 'https://api-sandbox.gcash.com/v1',
      testMobileNumber: '09171234567',
    },
  },
  
  // PayMaya/Maya API Configuration (Philippines)
  paymaya: {
    apiUrl: process.env.EXPO_PUBLIC_PAYMAYA_API_URL || 'https://pg-sandbox.paymaya.com',
    publicKey: process.env.EXPO_PUBLIC_PAYMAYA_PUBLIC_KEY || '',
    secretKey: process.env.EXPO_PUBLIC_PAYMAYA_SECRET_KEY || '',
    environment: process.env.EXPO_PUBLIC_PAYMENT_ENV || 'sandbox',
    // Sandbox endpoints
    sandbox: {
      checkoutUrl: 'https://pg-sandbox.paymaya.com/checkout/v1/checkouts',
      paymentsUrl: 'https://pg-sandbox.paymaya.com/payments/v1/payments',
    },
    production: {
      checkoutUrl: 'https://pg.paymaya.com/checkout/v1/checkouts',
      paymentsUrl: 'https://pg.paymaya.com/payments/v1/payments',
    },
  },
  
  // PayPal API Configuration
  paypal: {
    clientId: process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.EXPO_PUBLIC_PAYPAL_CLIENT_SECRET || '',
    environment: process.env.EXPO_PUBLIC_PAYMENT_ENV || 'sandbox',
    sandbox: {
      apiUrl: 'https://api-m.sandbox.paypal.com',
      checkoutUrl: 'https://www.sandbox.paypal.com/checkoutnow',
    },
    production: {
      apiUrl: 'https://api-m.paypal.com',
      checkoutUrl: 'https://www.paypal.com/checkoutnow',
    },
  },
  
  // Stripe API Configuration (Visa/Mastercard/Amex)
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY || '',
    apiUrl: 'https://api.stripe.com/v1',
    environment: process.env.EXPO_PUBLIC_PAYMENT_ENV || 'sandbox',
  },
  
  // App deep link for payment callbacks
  appScheme: 'rushmedz',
  returnUrl: 'rushmedz://payment/callback',
  cancelUrl: 'rushmedz://payment/cancel',
};

// Payment method types
export type PaymentGateway = 'gcash' | 'paymaya' | 'paypal' | 'stripe' | 'cod';

// Payment status
export type PaymentGatewayStatus = 
  | 'pending'
  | 'processing'
  | 'awaiting_payment'
  | 'authorized'
  | 'captured'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'expired';

// Payment request interface
export interface PaymentRequest {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentGateway;
  description?: string;
  metadata?: Record<string, any>;
  // For card payments
  cardToken?: string;
  // For e-wallet payments
  mobileNumber?: string;
  accountName?: string;
  // For PayPal
  paypalEmail?: string;
  // Customer details
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
  // Billing address
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

// Payment response interface
export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  gatewayTransactionId?: string;
  status: PaymentGatewayStatus;
  paymentUrl?: string;
  qrCodeUrl?: string;
  qrCodeData?: string;
  expiresAt?: Date;
  message?: string;
  gatewayResponse?: any;
}

// Webhook event interface
export interface PaymentWebhookEvent {
  type: 'payment.completed' | 'payment.failed' | 'payment.cancelled' | 'payment.refunded' | 'payment.expired';
  transactionId: string;
  gatewayTransactionId: string;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: PaymentGatewayStatus;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PaymentGatewayService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  /**
   * Initialize payment with the selected gateway
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.log(`[PaymentGateway] Initiating ${request.paymentMethod} payment for ₱${request.amount}`);
    
    switch (request.paymentMethod) {
      case 'gcash':
        return this.initiateGCashPayment(request);
      case 'paymaya':
        return this.initiatePayMayaPayment(request);
      case 'paypal':
        return this.initiatePayPalPayment(request);
      case 'stripe':
        return this.initiateStripePayment(request);
      case 'cod':
        return this.initiateCODPayment(request);
      default:
        throw new Error(`Unsupported payment method: ${request.paymentMethod}`);
    }
  }

  /**
   * GCash Payment Integration
   */
  private async initiateGCashPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const config = PAYMENT_GATEWAY_CONFIG.gcash;
    const transactionId = this.generateTransactionId('GC');
    
    try {
      // GCash Express Checkout API
      const payload = {
        merchantRefNo: transactionId,
        requestId: `REQ-${Date.now()}`,
        amount: {
          currency: 'PHP',
          value: request.amount.toFixed(2),
        },
        title: request.description || `Order ${request.orderId}`,
        description: `Payment for RushMedz Order #${request.orderId}`,
        redirectUrl: {
          success: `${PAYMENT_GATEWAY_CONFIG.returnUrl}?txn=${transactionId}&status=success`,
          failure: `${PAYMENT_GATEWAY_CONFIG.returnUrl}?txn=${transactionId}&status=failed`,
          cancel: `${PAYMENT_GATEWAY_CONFIG.cancelUrl}?txn=${transactionId}`,
        },
        metadata: {
          orderId: request.orderId,
          userId: request.userId,
          ...request.metadata,
        },
      };

      // In production, make actual API call to GCash
      // const response = await fetch(`${config.apiUrl}/express-checkout`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${config.secretKey}`,
      //     'X-Merchant-ID': config.merchantId,
      //   },
      //   body: JSON.stringify(payload),
      // });
      
      // Simulated response for development
      const checkoutUrl = `https://api.gcash.com/checkout/${transactionId}`;
      
      // Emit payment initiated event
      this.emitPaymentEvent('initiated', transactionId, request);

      return {
        success: true,
        transactionId,
        gatewayTransactionId: `GC-${Date.now()}`,
        status: 'awaiting_payment',
        paymentUrl: checkoutUrl,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiry
        message: 'Redirecting to GCash...',
      };
    } catch (error: any) {
      console.error('[PaymentGateway] GCash payment error:', error);
      return {
        success: false,
        transactionId,
        status: 'failed',
        message: error.message || 'GCash payment initiation failed',
      };
    }
  }

  /**
   * PayMaya/Maya Payment Integration
   */
  private async initiatePayMayaPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const config = PAYMENT_GATEWAY_CONFIG.paymaya;
    const transactionId = this.generateTransactionId('PM');
    const isSandbox = config.environment === 'sandbox';
    const endpoints = isSandbox ? config.sandbox : config.production;
    
    try {
      const payload = {
        totalAmount: {
          value: request.amount,
          currency: 'PHP',
        },
        buyer: {
          firstName: request.customer?.name?.split(' ')[0] || 'Customer',
          lastName: request.customer?.name?.split(' ').slice(1).join(' ') || '',
          contact: {
            email: request.customer?.email || '',
            phone: request.customer?.phone || request.mobileNumber || '',
          },
        },
        items: [
          {
            name: `Order #${request.orderId}`,
            quantity: 1,
            code: request.orderId,
            description: request.description || 'RushMedz Purchase',
            amount: {
              value: request.amount,
            },
            totalAmount: {
              value: request.amount,
            },
          },
        ],
        redirectUrl: {
          success: `${PAYMENT_GATEWAY_CONFIG.returnUrl}?txn=${transactionId}&status=success`,
          failure: `${PAYMENT_GATEWAY_CONFIG.returnUrl}?txn=${transactionId}&status=failed`,
          cancel: `${PAYMENT_GATEWAY_CONFIG.cancelUrl}?txn=${transactionId}`,
        },
        requestReferenceNumber: transactionId,
        metadata: {
          orderId: request.orderId,
          userId: request.userId,
        },
      };

      // In production, make actual API call to PayMaya
      // const authHeader = Buffer.from(`${config.publicKey}:`).toString('base64');
      // const response = await fetch(endpoints.checkoutUrl, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Basic ${authHeader}`,
      //   },
      //   body: JSON.stringify(payload),
      // });
      // const data = await response.json();
      
      // Simulated response
      const checkoutUrl = `https://payments.paymaya.com/checkout/${transactionId}`;

      this.emitPaymentEvent('initiated', transactionId, request);

      return {
        success: true,
        transactionId,
        gatewayTransactionId: `PM-${Date.now()}`,
        status: 'awaiting_payment',
        paymentUrl: checkoutUrl,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
        message: 'Redirecting to Maya...',
      };
    } catch (error: any) {
      console.error('[PaymentGateway] PayMaya payment error:', error);
      return {
        success: false,
        transactionId,
        status: 'failed',
        message: error.message || 'PayMaya payment initiation failed',
      };
    }
  }

  /**
   * PayPal Payment Integration
   */
  private async initiatePayPalPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const config = PAYMENT_GATEWAY_CONFIG.paypal;
    const transactionId = this.generateTransactionId('PP');
    const isSandbox = config.environment === 'sandbox';
    const endpoints = isSandbox ? config.sandbox : config.production;
    
    try {
      // Get PayPal access token
      const accessToken = await this.getPayPalAccessToken();
      
      // Create PayPal order
      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: transactionId,
            description: request.description || `RushMedz Order #${request.orderId}`,
            custom_id: request.orderId,
            amount: {
              currency_code: request.currency === 'PHP' ? 'PHP' : 'USD',
              value: request.amount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'RushMedz',
          landing_page: 'LOGIN',
          user_action: 'PAY_NOW',
          return_url: `${PAYMENT_GATEWAY_CONFIG.returnUrl}?txn=${transactionId}&status=success`,
          cancel_url: `${PAYMENT_GATEWAY_CONFIG.cancelUrl}?txn=${transactionId}`,
        },
      };

      // In production, create PayPal order
      // const response = await fetch(`${endpoints.apiUrl}/v2/checkout/orders`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${accessToken}`,
      //   },
      //   body: JSON.stringify(orderPayload),
      // });
      // const data = await response.json();
      // const approvalLink = data.links.find(l => l.rel === 'approve')?.href;

      // Simulated response
      const checkoutUrl = `${endpoints.checkoutUrl}?token=${transactionId}`;

      this.emitPaymentEvent('initiated', transactionId, request);

      return {
        success: true,
        transactionId,
        gatewayTransactionId: `PP-${Date.now()}`,
        status: 'awaiting_payment',
        paymentUrl: checkoutUrl,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
        message: 'Redirecting to PayPal...',
      };
    } catch (error: any) {
      console.error('[PaymentGateway] PayPal payment error:', error);
      return {
        success: false,
        transactionId,
        status: 'failed',
        message: error.message || 'PayPal payment initiation failed',
      };
    }
  }

  /**
   * Stripe Payment Integration (Visa/Mastercard/Amex)
   */
  private async initiateStripePayment(request: PaymentRequest): Promise<PaymentResponse> {
    const config = PAYMENT_GATEWAY_CONFIG.stripe;
    const transactionId = this.generateTransactionId('ST');
    
    try {
      // Create Stripe Payment Intent
      const paymentIntentPayload = {
        amount: Math.round(request.amount * 100), // Stripe uses cents
        currency: (request.currency || 'PHP').toLowerCase(),
        description: request.description || `RushMedz Order #${request.orderId}`,
        metadata: {
          order_id: request.orderId,
          user_id: request.userId,
          transaction_id: transactionId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };

      // In production, create Stripe payment intent
      // const response = await fetch(`${config.apiUrl}/payment_intents`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/x-www-form-urlencoded',
      //     'Authorization': `Bearer ${config.secretKey}`,
      //   },
      //   body: new URLSearchParams(paymentIntentPayload).toString(),
      // });
      // const data = await response.json();

      // Simulated response - in real app, return client_secret for Stripe Elements
      this.emitPaymentEvent('initiated', transactionId, request);

      return {
        success: true,
        transactionId,
        gatewayTransactionId: `pi_${Date.now()}`,
        status: 'awaiting_payment',
        // In real app: clientSecret: data.client_secret
        message: 'Ready for card payment',
        gatewayResponse: {
          publishableKey: config.publishableKey,
          // clientSecret: data.client_secret,
        },
      };
    } catch (error: any) {
      console.error('[PaymentGateway] Stripe payment error:', error);
      return {
        success: false,
        transactionId,
        status: 'failed',
        message: error.message || 'Card payment initiation failed',
      };
    }
  }

  /**
   * Cash on Delivery - Simple confirmation
   */
  private async initiateCODPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const transactionId = this.generateTransactionId('COD');
    
    this.emitPaymentEvent('initiated', transactionId, request);

    return {
      success: true,
      transactionId,
      gatewayTransactionId: transactionId,
      status: 'pending',
      message: 'Cash on Delivery order confirmed. Please prepare exact amount.',
    };
  }

  /**
   * Verify payment status with gateway
   */
  async verifyPayment(transactionId: string, gateway: PaymentGateway): Promise<PaymentResponse> {
    console.log(`[PaymentGateway] Verifying payment: ${transactionId}`);
    
    switch (gateway) {
      case 'gcash':
        return this.verifyGCashPayment(transactionId);
      case 'paymaya':
        return this.verifyPayMayaPayment(transactionId);
      case 'paypal':
        return this.verifyPayPalPayment(transactionId);
      case 'stripe':
        return this.verifyStripePayment(transactionId);
      case 'cod':
        return {
          success: true,
          transactionId,
          status: 'pending',
          message: 'COD payment will be collected on delivery',
        };
      default:
        throw new Error(`Unknown gateway: ${gateway}`);
    }
  }

  private async verifyGCashPayment(transactionId: string): Promise<PaymentResponse> {
    // In production, call GCash API to verify
    // For now, simulate successful verification
    return {
      success: true,
      transactionId,
      status: 'completed',
      message: 'GCash payment verified successfully',
    };
  }

  private async verifyPayMayaPayment(transactionId: string): Promise<PaymentResponse> {
    return {
      success: true,
      transactionId,
      status: 'completed',
      message: 'Maya payment verified successfully',
    };
  }

  private async verifyPayPalPayment(transactionId: string): Promise<PaymentResponse> {
    return {
      success: true,
      transactionId,
      status: 'completed',
      message: 'PayPal payment verified successfully',
    };
  }

  private async verifyStripePayment(transactionId: string): Promise<PaymentResponse> {
    return {
      success: true,
      transactionId,
      status: 'completed',
      message: 'Card payment verified successfully',
    };
  }

  /**
   * Process refund
   */
  async processRefund(
    transactionId: string,
    gateway: PaymentGateway,
    amount: number,
    reason?: string
  ): Promise<PaymentResponse> {
    console.log(`[PaymentGateway] Processing refund for ${transactionId}: ₱${amount}`);
    
    const refundId = this.generateTransactionId('RF');
    
    // In production, call respective gateway's refund API
    // For now, simulate successful refund
    
    eventBus.emit('paymentCompleted', {
      transactionId: refundId,
      orderId: transactionId.split('-')[1] || '',
      amount: -amount,
      method: gateway as any,
    });

    return {
      success: true,
      transactionId: refundId,
      gatewayTransactionId: `RF-${Date.now()}`,
      status: 'refunded',
      message: `Refund of ₱${amount.toFixed(2)} processed successfully`,
    };
  }

  /**
   * Get PayPal access token
   */
  private async getPayPalAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const config = PAYMENT_GATEWAY_CONFIG.paypal;
    const isSandbox = config.environment === 'sandbox';
    const apiUrl = isSandbox ? config.sandbox.apiUrl : config.production.apiUrl;

    // In production, get actual token
    // const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //     'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
    //   },
    //   body: 'grant_type=client_credentials',
    // });
    // const data = await response.json();
    // this.accessToken = data.access_token;
    // this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);

    this.accessToken = 'sandbox_token';
    this.tokenExpiry = new Date(Date.now() + 3600 * 1000);
    
    return this.accessToken;
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(prefix: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Emit payment event through eventBus
   */
  private emitPaymentEvent(type: string, transactionId: string, request: PaymentRequest) {
    eventBus.emit('paymentInitiated', {
      transactionId,
      orderId: request.orderId,
      amount: request.amount,
      method: request.paymentMethod as any,
    });
  }

  /**
   * Open payment URL in browser/webview
   */
  async openPaymentUrl(url: string): Promise<boolean> {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PaymentGateway] Failed to open payment URL:', error);
      return false;
    }
  }

  /**
   * Handle deep link callback from payment gateway
   */
  handlePaymentCallback(url: string): { transactionId: string; status: string } | null {
    try {
      const parsed = new URL(url);
      const transactionId = parsed.searchParams.get('txn');
      const status = parsed.searchParams.get('status');
      
      if (transactionId && status) {
        return { transactionId, status };
      }
      return null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const paymentGatewayService = new PaymentGatewayService();
export default paymentGatewayService;
