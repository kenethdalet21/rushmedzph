/**
 * Shared Event Bus Service
 * This file should be copied to all apps in the RushMedz ecosystem
 * Enables real-time communication between Admin and all other apps
 */

import { APP_CONFIG, EVENT_TYPES, type AppType } from './appConfig';

// Event handler type
type EventHandler<T = any> = (payload: T) => void;

// Bridge event structure
export interface BridgeEvent {
  type: string;
  source: AppType;
  target?: AppType | 'all';
  payload: Record<string, any>;
  timestamp: string;
}

class CrossAppEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private appType: AppType;

  constructor(appType: AppType) {
    this.appType = appType;
    this.connect();
  }

  /**
   * Connect to WebSocket server for real-time events
   */
  connect(): void {
    try {
      this.ws = new WebSocket(APP_CONFIG.WS_URL);

      this.ws.onopen = () => {
        console.log(`[${this.appType}] EventBus: Connected to server`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Identify this app to the server
        this.send({
          type: 'system:identify',
          source: this.appType,
          target: 'admin',
          payload: { appType: this.appType },
          timestamp: new Date().toISOString(),
        });
      };

      this.ws.onmessage = (message) => {
        try {
          const event: BridgeEvent = JSON.parse(message.data);
          
          // Only process events targeted at this app or broadcast to all
          if (event.target === this.appType || event.target === 'all' || !event.target) {
            this.emit(event.type, event);
          }
        } catch (error) {
          console.error(`[${this.appType}] EventBus: Failed to parse message:`, error);
        }
      };

      this.ws.onclose = () => {
        console.log(`[${this.appType}] EventBus: Disconnected`);
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error(`[${this.appType}] EventBus: Error:`, error);
      };
    } catch (error) {
      console.error(`[${this.appType}] EventBus: Connection failed:`, error);
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect after disconnection
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[${this.appType}] EventBus: Reconnecting (${this.reconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  /**
   * Subscribe to an event
   */
  subscribe<T = any>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  /**
   * Emit event to local handlers
   */
  private emit(eventType: string, event: BridgeEvent): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`[${this.appType}] EventBus: Handler error:`, error);
        }
      });
    }

    // Also call wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`[${this.appType}] EventBus: Wildcard handler error:`, error);
        }
      });
    }
  }

  /**
   * Send event to server
   */
  send(event: BridgeEvent): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn(`[${this.appType}] EventBus: Not connected, using REST fallback`);
      this.sendViaRest(event);
    }
  }

  /**
   * REST fallback for sending events
   */
  private async sendViaRest(event: BridgeEvent): Promise<void> {
    try {
      await fetch(`${APP_CONFIG.API_BASE_URL}/api/events/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error(`[${this.appType}] EventBus: REST fallback failed:`, error);
    }
  }

  /**
   * Publish event to Admin app
   */
  publishToAdmin(eventType: string, payload: Record<string, any>): void {
    const event: BridgeEvent = {
      type: eventType,
      source: this.appType,
      target: 'admin',
      payload,
      timestamp: new Date().toISOString(),
    };
    this.send(event);
  }

  /**
   * Broadcast event to all apps
   */
  broadcast(eventType: string, payload: Record<string, any>): void {
    const event: BridgeEvent = {
      type: eventType,
      source: this.appType,
      target: 'all',
      payload,
      timestamp: new Date().toISOString(),
    };
    this.send(event);
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.handlers.clear();
  }
}

// Factory function to create event bus for specific app
export const createEventBus = (appType: AppType): CrossAppEventBus => {
  return new CrossAppEventBus(appType);
};

export { EVENT_TYPES };
export default CrossAppEventBus;
