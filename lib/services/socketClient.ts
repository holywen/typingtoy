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
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

  socket = io(socketUrl, {
    auth: {
      userId: options.userId,
      deviceId: options.deviceId,
      displayName: options.displayName,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
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
    if (callback) {
      socket.emit(event as any, data, callback);
    } else {
      socket.emit(event as any, data);
    }
  } else {
    console.warn('Socket not connected, cannot emit event:', event);
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
    socket.on(event as any, handler as any);

    // Return cleanup function
    return () => {
      socket?.off(event as any, handler as any);
    };
  }

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
