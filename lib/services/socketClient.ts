// Socket.IO client connection manager

'use client';

import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@/types/socket';

type TypedClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedClientSocket | null = null;

export interface SocketClientOptions {
  userId?: string;
  deviceId: string;
  displayName: string;
}

// Initialize socket connection
export function initSocketClient(options: SocketClientOptions): TypedClientSocket {
  // If socket exists and is connected, return it
  if (socket && socket.connected) {
    return socket;
  }

  // If socket exists but is disconnected, reconnect it
  if (socket && !socket.connected) {
    console.log('🔄 Reconnecting existing socket...');
    socket.connect();
    return socket;
  }

  // Create new socket connection
  // In production, socket connects to same origin (window.location.origin)
  // In development, use NEXT_PUBLIC_SOCKET_URL or default to localhost:3000
  const socketUrl = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000');

  socket = io(socketUrl, {
    auth: {
      userId: options.userId,
      deviceId: options.deviceId,
      displayName: options.displayName,
    },
    // Start with polling for better Safari compatibility, then upgrade to websocket
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    // Allow upgrade from polling to websocket
    upgrade: true,
  });

  // Connection events
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('error', (data) => {
    console.error('Socket error:', data);
  });

  return socket;
}

// Get current socket instance
export function getSocket(): TypedClientSocket | null {
  return socket;
}

// Check if socket is connected
export function isSocketConnected(): boolean {
  return socket !== null && socket.connected;
}

// Disconnect socket
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Reconnect socket
export function reconnectSocket(): void {
  if (socket && !socket.connected) {
    socket.connect();
  }
}

// Emit event with type safety (supports callbacks)
export function emitSocketEvent<K extends keyof ClientToServerEvents>(
  event: K,
  data?: any,
  callback?: (...args: any[]) => void
): void {
  if (socket && socket.connected) {
    console.log(`📤 [SOCKET CLIENT] Emitting event: ${String(event)}`, data);
    if (callback) {
      socket.emit(event as any, data, callback);
    } else {
      socket.emit(event as any, data);
    }
  } else {
    console.warn('⚠️ [SOCKET CLIENT] Socket not connected, cannot emit event:', event);
    if (callback) {
      callback({ success: false, error: 'Socket not connected' });
    }
  }
}

// Listen to event with type safety
export function onSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K]
): () => void {
  if (socket) {
    console.log(`👂 [SOCKET CLIENT] Registering listener for event: ${String(event)}`);

    // Wrap handler to log when event is received
    const wrappedHandler = (...args: any[]) => {
      console.log(`📥 [SOCKET CLIENT] Received event: ${String(event)}`, args[0]);
      (handler as any)(...args);
    };

    socket.on(event as any, wrappedHandler as any);

    // Return cleanup function
    return () => {
      console.log(`🗑️ [SOCKET CLIENT] Removing listener for event: ${String(event)}`);
      socket?.off(event as any, wrappedHandler as any);
    };
  }

  console.warn(`⚠️ [SOCKET CLIENT] No socket available to register listener for: ${String(event)}`);
  return () => {}; // No-op cleanup
}

// Remove event listener
export function offSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  handler?: ServerToClientEvents[K]
): void {
  if (socket) {
    if (handler) {
      socket.off(event as any, handler as any);
    } else {
      socket.off(event as any);
    }
  }
}

// Wait for socket to connect
export function waitForConnection(timeout: number = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket && socket.connected) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('Socket connection timeout'));
    }, timeout);

    socket?.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });

    socket?.once('connect_error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
