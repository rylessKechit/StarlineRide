// src/services/socket/index.ts

import { io, Socket } from 'socket.io-client';
import { API_CONFIG, SOCKET_EVENTS } from '../../constants';
import { getToken } from '../storage';
import { showMessage } from 'react-native-flash-message';
import { SocketMessage, Location, Booking } from '../../types';

type SocketEventCallback = (...args: any[]) => void;

interface SocketEventHandlers {
  [key: string]: SocketEventCallback[];
}

class SocketService {
  private socket: Socket | null = null;
  private eventHandlers: SocketEventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isManualDisconnect = false;

  // ================================
  // CONNEXION ET DÉCONNEXION
  // ================================

  async connect(): Promise<void> {
    try {
      const token = await getToken();
      
      if (!token) {
        console.warn('⚠️ No token available for socket connection');
        return;
      }

      if (this.socket?.connected) {
        console.log('🔌 Socket already connected');
        return;
      }

      this.socket = io(API_CONFIG.SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventListeners();
      this.isManualDisconnect = false;
      
      if (__DEV__) {
        console.log('🚀 Socket connection initiated');
      }

    } catch (error) {
      console.error('❌ Socket connection error:', error);
      this.handleConnectionError();
    }
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.reconnectAttempts = 0;
    
    if (__DEV__) {
      console.log('🔌 Socket manually disconnected');
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Événements de connexion
    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.reconnectAttempts = 0;
      this.emit('socket_connected', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.emit('socket_disconnected', { connected: false, reason });
      
      if (!this.isManualDisconnect && reason === 'io server disconnect') {
        this.attemptReconnection();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.handleConnectionError();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      this.emit('socket_reconnected', { attemptNumber });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after max attempts');
      this.handleReconnectionFailed();
    });

    // Événements métier
    this.setupBusinessEventListeners();
  }

  private setupBusinessEventListeners(): void {
    if (!this.socket) return;

    // Événements de réservation
    this.socket.on(SOCKET_EVENTS.RIDE_ACCEPTED, (data) => {
      if (__DEV__) {
        console.log('🚗 Ride accepted:', data);
      }
      this.emit('ride_accepted', data);
      
      showMessage({
        message: 'Course acceptée !',
        description: `${data.driver?.firstName} arrive dans ${data.estimatedArrival} minutes`,
        type: 'success',
        duration: 5000,
      });
    });

    this.socket.on(SOCKET_EVENTS.RIDE_CANCELLED, (data) => {
      if (__DEV__) {
        console.log('❌ Ride cancelled:', data);
      }
      this.emit('ride_cancelled', data);
      
      showMessage({
        message: 'Course annulée',
        description: data.reason || 'La course a été annulée',
        type: 'warning',
        duration: 5000,
      });
    });

    this.socket.on(SOCKET_EVENTS.BOOKING_STATUS_UPDATE, (data) => {
      if (__DEV__) {
        console.log('📱 Booking status update:', data);
      }
      this.emit('booking_status_update', data);
    });

    // Événements de géolocalisation
    this.socket.on(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, (data) => {
      this.emit('driver_location_update', data);
    });

    // Événements de chat
    this.socket.on(SOCKET_EVENTS.NEW_MESSAGE, (data) => {
      if (__DEV__) {
        console.log('💬 New message:', data);
      }
      this.emit('new_message', data);
    });

    // Événements de paiement
    this.socket.on(SOCKET_EVENTS.PAYMENT_RECEIVED, (data) => {
      if (__DEV__) {
        console.log('💳 Payment received:', data);
      }
      this.emit('payment_received', data);
      
      showMessage({
        message: 'Paiement confirmé',
        description: `Montant: ${data.amount}€`,
        type: 'success',
      });
    });

    // Événements d'avis
    this.socket.on(SOCKET_EVENTS.REVIEW_RESPONSE, (data) => {
      if (__DEV__) {
        console.log('⭐ Review response:', data);
      }
      this.emit('review_response', data);
      
      showMessage({
        message: 'Réponse à votre avis',
        description: 'Le chauffeur a répondu à votre avis',
        type: 'info',
      });
    });
  }

  private handleConnectionError(): void {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      this.attemptReconnection();
    } else {
      this.handleReconnectionFailed();
    }
  }

  private attemptReconnection(): void {
    if (this.isManualDisconnect) return;
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimeout = setTimeout(async () => {
      console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      await this.connect();
    }, delay);
  }

  private handleReconnectionFailed(): void {
    console.error('❌ Socket reconnection failed permanently');
    
    showMessage({
      message: 'Connexion perdue',
      description: 'Impossible de se reconnecter au service temps réel',
      type: 'danger',
      duration: 0,
    });
    
    this.emit('socket_connection_failed', { 
      reconnectAttempts: this.reconnectAttempts 
    });
  }

  // ================================
  // GESTION DES ÉVÉNEMENTS
  // ================================

  on(event: string, callback: SocketEventCallback): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
  }

  off(event: string, callback?: SocketEventCallback): void {
    if (!this.eventHandlers[event]) return;

    if (callback) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(
        handler => handler !== callback
      );
    } else {
      delete this.eventHandlers[event];
    }
  }

  emit(event: string, data?: any): void {
    const handlers = this.eventHandlers[event];
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // ================================
  // MÉTHODES MÉTIER
  // ================================

  // Suivi de chauffeur
  trackDriver(driverId: string): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.TRACK_DRIVER, driverId);
      if (__DEV__) {
        console.log('📍 Tracking driver:', driverId);
      }
    }
  }

  stopTrackingDriver(driverId: string): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.STOP_TRACKING, driverId);
      if (__DEV__) {
        console.log('🛑 Stopped tracking driver:', driverId);
      }
    }
  }

  // Chat et messaging
  joinRideChat(bookingId: string): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.JOIN_RIDE, bookingId);
      if (__DEV__) {
        console.log('💬 Joined ride chat:', bookingId);
      }
    }
  }

  leaveRideChat(bookingId: string): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.LEAVE_RIDE, bookingId);
      if (__DEV__) {
        console.log('👋 Left ride chat:', bookingId);
      }
    }
  }

  sendMessage(message: SocketMessage): void {
    if (this.socket?.connected) {
      this.socket.emit(SOCKET_EVENTS.RIDE_MESSAGE, message);
      if (__DEV__) {
        console.log('📤 Message sent:', message);
      }
    }
  }

  // Partage de position (pour sécurité)
  shareLocation(location: Location, bookingId?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('share_location', {
        location,
        bookingId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // ================================
  // UTILITAIRES
  // ================================

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getConnectionStatus(): {
    connected: boolean;
    reconnectAttempts: number;
    socketId?: string;
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id,
    };
  }

  // Méthode pour émettre des événements côté serveur (si besoin)
  emitToServer(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      if (__DEV__) {
        console.log(`📡 Emitted to server: ${event}`, data);
      }
    } else {
      console.warn(`⚠️ Cannot emit ${event}: socket not connected`);
    }
  }

  // Ping pour tester la connexion
  ping(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const startTime = Date.now();
      
      this.socket.emit('ping', (response: any) => {
        const duration = Date.now() - startTime;
        resolve(duration);
      });

      // Timeout après 5 secondes
      setTimeout(() => {
        reject(new Error('Ping timeout'));
      }, 5000);
    });
  }

  // Méthodes de debugging
  getDebugInfo(): any {
    return {
      connected: this.isConnected(),
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      isManualDisconnect: this.isManualDisconnect,
      activeEventHandlers: Object.keys(this.eventHandlers).map(event => ({
        event,
        handlerCount: this.eventHandlers[event].length,
      })),
      transport: this.socket?.io?.engine?.transport?.name,
      serverUrl: API_CONFIG.SOCKET_URL,
    };
  }

  // Cleanup pour éviter les fuites mémoire
  cleanup(): void {
    this.eventHandlers = {};
    this.disconnect();
  }
}

// Export singleton
export const socketService = new SocketService();

// Export des méthodes principales
export const {
  connect: connectSocket,
  disconnect: disconnectSocket,
  on: onSocketEvent,
  off: offSocketEvent,
  trackDriver,
  stopTrackingDriver,
  joinRideChat,
  leaveRideChat,
  sendMessage,
  shareLocation,
  isConnected: isSocketConnected,
  getConnectionStatus,
  ping: pingSocket,
  getDebugInfo: getSocketDebugInfo,
  cleanup: cleanupSocket,
} = socketService;

// Types pour les événements spécifiques
export interface RideAcceptedEvent {
  bookingId: string;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    rating: number;
  };
  vehicle: {
    brand: string;
    model: string;
    color: string;
    licensePlate: string;
  };
  estimatedArrival: Date;
}

export interface LocationUpdateEvent {
  bookingId: string;
  location: Location;
  timestamp: string;
}

export interface BookingStatusUpdateEvent {
  bookingId: string;
  status: string;
  timestamp: string;
  location?: Location;
}

export interface NewMessageEvent {
  bookingId: string;
  message: string;
  sender: {
    id: string;
    type: 'user' | 'driver';
  };
  timestamp: string;
}

export interface PaymentReceivedEvent {
  bookingId: string;
  amount: number;
  tip: number;
  finalAmount: number;
}

// Hooks personnalisés pour faciliter l'utilisation dans React
export const useSocketEvent = (
  event: string, 
  callback: SocketEventCallback,
  deps: any[] = []
) => {
  const { useEffect } = require('react');
  
  useEffect(() => {
    socketService.on(event, callback);
    
    return () => {
      socketService.off(event, callback);
    };
  }, deps);
};

export const useSocketConnection = () => {
  const { useState, useEffect } = require('react');
  
  const [connectionStatus, setConnectionStatus] = useState(
    socketService.getConnectionStatus()
  );

  useEffect(() => {
    const updateStatus = () => {
      setConnectionStatus(socketService.getConnectionStatus());
    };

    socketService.on('socket_connected', updateStatus);
    socketService.on('socket_disconnected', updateStatus);
    socketService.on('socket_reconnected', updateStatus);

    return () => {
      socketService.off('socket_connected', updateStatus);
      socketService.off('socket_disconnected', updateStatus);
      socketService.off('socket_reconnected', updateStatus);
    };
  }, []);

  return connectionStatus;
};