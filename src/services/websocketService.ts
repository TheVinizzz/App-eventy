import { io, Socket } from 'socket.io-client';
import { EvenLoveMessage, EvenLoveMatch, EvenLoveNotification } from '../types/evenLove';
import authService from './authService';
import { APP_CONFIG } from '../constants';

// Configure the WebSocket URL
const WS_URL = __DEV__ 
  ? APP_CONFIG.WS_URL.DEVELOPMENT
  : APP_CONFIG.WS_URL.PRODUCTION;

interface WebSocketEvents {
  // Message events
  'message:new': (message: EvenLoveMessage) => void;
  'message:read': (data: { matchId: string; messageIds: string[] }) => void;
  'message:typing': (data: { matchId: string; userId: string; isTyping: boolean }) => void;
  
  // Match events
  'match:new': (match: EvenLoveMatch) => void;
  'match:deleted': (data: { matchId: string }) => void;
  
  // User events
  'user:online': (data: { userId: string }) => void;
  'user:offline': (data: { userId: string }) => void;
  
  // Notification events
  'notification:new': (notification: EvenLoveNotification) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private eventId: string | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventHandlers: Map<string, Set<Function>> = new Map();

  // Connection Management
  async connect(eventId: string): Promise<void> {
    if (this.socket && this.isConnected && this.eventId === eventId) {
      return;
    }

    try {
      const token = await authService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Disconnect existing connection if any
      if (this.socket) {
        this.disconnect();
      }

      this.eventId = eventId;
      
      // Create new socket connection
      this.socket = io(WS_URL, {
        auth: {
          token,
          eventId,
        },
        transports: ['websocket'],
        timeout: 20000,
        forceNew: true,
      });

      // Setup event listeners
      this.setupEventListeners();

      // Wait for connection
      await this.waitForConnection();
      
      console.log('WebSocket connected successfully');
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.eventId = null;
    this.reconnectAttempts = 0;
    this.eventHandlers.clear();
    
    console.log('WebSocket disconnected');
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('WebSocket disconnected:', reason);
      
      // Auto-reconnect on unexpected disconnection
      if (reason === 'io server disconnect') {
        // Server disconnected, don't reconnect
        return;
      }
      
      this.handleReconnection();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection failed:', error);
    });

    // Custom events
    this.socket.on('message:new', (message: EvenLoveMessage) => {
      this.emit('message:new', message);
    });

    this.socket.on('message:read', (data: { matchId: string; messageIds: string[] }) => {
      this.emit('message:read', data);
    });

    this.socket.on('message:typing', (data: { matchId: string; userId: string; isTyping: boolean }) => {
      this.emit('message:typing', data);
    });

    this.socket.on('match:new', (match: EvenLoveMatch) => {
      this.emit('match:new', match);
    });

    this.socket.on('match:deleted', (data: { matchId: string }) => {
      this.emit('match:deleted', data);
    });

    this.socket.on('user:online', (data: { userId: string }) => {
      this.emit('user:online', data);
    });

    this.socket.on('user:offline', (data: { userId: string }) => {
      this.emit('user:offline', data);
    });

    this.socket.on('notification:new', (notification: EvenLoveNotification) => {
      this.emit('notification:new', notification);
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

    setTimeout(async () => {
      if (this.eventId) {
        try {
          await this.connect(this.eventId);
        } catch (error) {
          console.error('Reconnection attempt failed:', error);
        }
      }
    }, delay);
  }

  // Event Management
  on<K extends keyof WebSocketEvents>(event: K, handler: WebSocketEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off<K extends keyof WebSocketEvents>(event: K, handler: WebSocketEvents[K]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  private emit<K extends keyof WebSocketEvents>(event: K, data: Parameters<WebSocketEvents[K]>[0]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as any)(data);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      });
    }
  }

  // Message Operations
  sendMessage(matchId: string, content: string, type: 'text' | 'image' = 'text'): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('message:send', {
      matchId,
      content,
      type,
    });
  }

  markMessagesAsRead(matchId: string, messageIds: string[]): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('message:read', {
      matchId,
      messageIds,
    });
  }

  sendTypingIndicator(matchId: string, isTyping: boolean): void {
    if (!this.socket || !this.isConnected) {
      return; // Typing indicators are non-critical
    }

    this.socket.emit('message:typing', {
      matchId,
      isTyping,
    });
  }

  // Room Management
  joinMatchRoom(matchId: string): void {
    if (!this.socket || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('match:join', { matchId });
  }

  leaveMatchRoom(matchId: string): void {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('match:leave', { matchId });
  }

  // Status Methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getCurrentEventId(): string | null {
    return this.eventId;
  }

  getConnectionState(): {
    isConnected: boolean;
    eventId: string | null;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected,
      eventId: this.eventId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export default new WebSocketService(); 