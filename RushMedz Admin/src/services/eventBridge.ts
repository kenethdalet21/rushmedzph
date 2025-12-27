/**
 * Event Bridge Service
 * Real-time event communication between Admin and all other apps
 * Uses WebSocket or Server-Sent Events for real-time updates
 */

import { APP_URLS, EVENT_CHANNELS, type AppType } from '../config/appConfig';

// Event types that can be broadcast
export type EventType =
  | 'order:created'
  | 'order:updated'
  | 'order:cancelled'
  | 'order:delivered'
  | 'driver:status_changed'
  | 'driver:assigned'
  | 'merchant:status_changed'
  | 'merchant:payout_requested'
  | 'doctor:status_changed'
  | 'doctor:consultation_started'
  | 'doctor:prescription_created'
  | 'user:registered'
  | 'user:wallet_topup'
  | 'product:added'
  | 'product:updated'
  | 'product:deleted'
  | 'notification:sent'
  | 'system:config_changed';

export interface BridgeEvent {
  type: EventType;
  source: AppType;
  target?: AppType | 'all';
  payload: Record<string, any>;
  timestamp: string;
}

type EventHandler = (event: BridgeEvent) => void;

class EventBridge {
  private handlers: Map<EventType | '*', Set<EventHandler>> = new Map();
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  /**
   * Connect to WebSocket server for real-time events
   */
  connect(): void {
    const wsUrl = APP_URLS.api.replace('http', 'ws') + '/ws/events';
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('EventBridge: Connected to WebSocket server');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Identify as admin app
        this.send({
          type: 'system:config_changed' as EventType,
          source: 'admin',
          target: 'all',
          payload: { action: 'identify', appType: 'admin' },
          timestamp: new Date().toISOString(),
        });
      };

      this.ws.onmessage = (message) => {
        try {
          const event: BridgeEvent = JSON.parse(message.data);
          this.emit(event);
        } catch (error) {
          console.error('EventBridge: Failed to parse message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('EventBridge: Disconnected from WebSocket server');
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('EventBridge: WebSocket error:', error);
      };
    } catch (error) {
      console.error('EventBridge: Failed to connect:', error);
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect after disconnection
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`EventBridge: Reconnecting (attempt ${this.reconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('EventBridge: Max reconnect attempts reached');
    }
  }

  /**
   * Subscribe to events
   */
  subscribe(eventType: EventType | '*', handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Emit event to local handlers
   */
  private emit(event: BridgeEvent): void {
    // Call specific event handlers
    const specificHandlers = this.handlers.get(event.type);
    if (specificHandlers) {
      specificHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`EventBridge: Handler error for ${event.type}:`, error);
        }
      });
    }

    // Call wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error('EventBridge: Wildcard handler error:', error);
        }
      });
    }
  }

  /**
   * Send event to server for distribution
   */
  send(event: BridgeEvent): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn('EventBridge: Not connected, event not sent:', event);
      // Queue event for later or use REST fallback
      this.sendViaRest(event);
    }
  }

  /**
   * REST fallback for sending events
   */
  private async sendViaRest(event: BridgeEvent): Promise<void> {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${APP_URLS.api}/api/events/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('EventBridge: REST fallback failed:', error);
    }
  }

  /**
   * Publish event from Admin to other apps
   */
  publish(type: EventType, payload: Record<string, any>, target?: AppType | 'all'): void {
    const event: BridgeEvent = {
      type,
      source: 'admin',
      target: target || 'all',
      payload,
      timestamp: new Date().toISOString(),
    };
    this.send(event);
    this.emit(event); // Also emit locally
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }
}

// Singleton instance
export const eventBridge = new EventBridge();

// Helper functions for common events
export const publishOrderUpdate = (orderId: string | number, status: string, data?: any) => {
  eventBridge.publish('order:updated', { orderId, status, ...data });
};

export const publishDriverAssignment = (orderId: string | number, driverId: string | number, driverName: string) => {
  eventBridge.publish('driver:assigned', { orderId, driverId, driverName });
};

export const publishNotification = (target: AppType | 'all', title: string, message: string, data?: any) => {
  eventBridge.publish('notification:sent', { title, message, ...data }, target);
};

export const publishSystemConfigChange = (configKey: string, configValue: any) => {
  eventBridge.publish('system:config_changed', { key: configKey, value: configValue });
};

export default eventBridge;
