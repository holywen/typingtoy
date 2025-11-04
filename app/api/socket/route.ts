// Socket.IO API route for Next.js App Router

import { NextRequest, NextResponse } from 'next/server';
import { Server as HTTPServer } from 'http';
import { Server as NetServer, Socket } from 'net';
import { initSocketServer, getSocketServer } from '@/lib/services/socketServer';

// Extend NextApiResponse to include socket server
interface SocketServer extends HTTPServer {
  io?: any;
}

interface SocketWithServer extends Socket {
  server: NetServer & {
    io?: any;
  };
}

// Initialize Socket.IO server
let socketInitialized = false;

export async function GET(req: NextRequest) {
  if (!socketInitialized) {
    try {
      // Note: In production, this should be handled differently
      // Socket.IO needs a proper HTTP server, which Next.js provides in custom server mode
      // For development, we'll return a message

      console.log('Socket.IO endpoint accessed');

      return NextResponse.json({
        message: 'Socket.IO server endpoint',
        status: 'ready',
        note: 'Socket.IO server should be initialized via custom server or in pages/api for proper WebSocket support',
      });
    } catch (error) {
      console.error('Socket.IO initialization error:', error);
      return NextResponse.json(
        { error: 'Failed to initialize Socket.IO' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    message: 'Socket.IO server is running',
    status: 'active',
  });
}

// Handle socket upgrade for WebSocket connections
export async function SOCKET(req: NextRequest) {
  const socketServer = getSocketServer();

  if (!socketServer) {
    return NextResponse.json(
      { error: 'Socket.IO server not initialized' },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: 'connected' });
}
