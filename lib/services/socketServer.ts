// Socket.IO server logic

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@/types/socket';
import { redis } from '@/lib/redis/client';

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedServer = SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let io: TypedServer | null = null;

export function initSocketServer(httpServer: HTTPServer): TypedServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Connection middleware - player identification
  io.use(async (socket, next) => {
    try {
      const { userId, deviceId, displayName } = socket.handshake.auth;

      if (!deviceId) {
        return next(new Error('Device ID required'));
      }

      // Set socket data
      socket.data.deviceId = deviceId;
      socket.data.displayName = displayName || 'Guest';
      socket.data.playerId = userId || deviceId;
      socket.data.userId = userId;

      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', async (socket: TypedSocket) => {
    const { playerId, displayName } = socket.data;
    console.log(`✅ Player connected: ${displayName} (${playerId})`);

    // Clean up any stale room memberships from previous sessions
    try {
      const { RoomManager } = await import('./roomManager');
      const existingRoom = await RoomManager.getRoomByPlayerId(playerId);
      
      if (existingRoom) {
        console.log(`🧹 Cleaning up stale room membership for ${displayName}`);
        await RoomManager.leaveRoom(existingRoom.roomId, playerId);
        
        // Notify others in the room if it still exists
        const room = await RoomManager.getRoom(existingRoom.roomId);
        if (room) {
          io.to(existingRoom.roomId).emit('room:updated', { room });
          io.to(existingRoom.roomId).emit('player:left', { 
            roomId: existingRoom.roomId, 
            playerId 
          });
        } else {
          io.emit('room:deleted', { roomId: existingRoom.roomId });
        }
      }
    } catch (error) {
      console.error('Error cleaning up stale room:', error);
    }

    // Add to online players set
    await redis.sadd('online:players', playerId);
    await redis.setex(`player:${playerId}:socketId`, 3600, socket.id);

    // Emit connection confirmation
    socket.emit('player:connected', { playerId });

    // Handle player identification
    socket.on('player:identify', (data) => {
      socket.data.userId = data.userId;
      socket.data.deviceId = data.deviceId;
      socket.data.displayName = data.displayName;
      socket.data.playerId = data.userId || data.deviceId;
    });

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      console.log(`❌ Player disconnected: ${displayName} (${reason})`);

      try {
        // Remove from online players
        await redis.srem('online:players', playerId);
        await redis.del(`player:${playerId}:socketId`);

        // Leave current room if in one
        if (socket.data.currentRoomId) {
          const roomId = socket.data.currentRoomId;
          console.log(`🚪 Player ${displayName} leaving room ${roomId} due to disconnect`);
          
          // Import RoomManager
          const { RoomManager } = await import('./roomManager');
          
          // Leave room
          const room = await RoomManager.leaveRoom(roomId, playerId);

          // Leave socket room
          socket.leave(roomId);

          if (room) {
            // Notify remaining players
            io.to(roomId).emit('room:updated', { room });
            io.to(roomId).emit('player:left', { roomId, playerId });
          } else {
            // Room was deleted
            io.emit('room:deleted', { roomId });
          }

          socket.data.currentRoomId = undefined;
        }

        // Remove from matchmaking queue if in one
        if (socket.data.inMatchmaking) {
          console.log(`🎯 Removing ${displayName} from matchmaking queue`);
          const { MatchmakingService } = await import('./matchmaking');
          await MatchmakingService.removeFromQueue(playerId);
          socket.data.inMatchmaking = false;
          socket.data.matchmakingGameType = undefined;
        }
      } catch (error) {
        console.error(`Error during disconnect cleanup for ${displayName}:`, error);
      }

      socket.emit('player:disconnected', { playerId });
    });

    // Import and register event handlers
    // These will be implemented in separate files
    await import('./socketHandlers/roomHandlers').then(module =>
      module.registerRoomHandlers(io!, socket)
    );
    await import('./socketHandlers/matchHandlers').then(module =>
      module.registerMatchHandlers(io!, socket)
    );
    await import('./socketHandlers/gameHandlers').then(module =>
      module.registerGameHandlers(io!, socket)
    );
    await import('./socketHandlers/chatHandlers').then(module =>
      module.registerChatHandlers(io!, socket)
    );
    await import('./socketHandlers/spectatorHandlers').then(module =>
      module.registerSpectatorHandlers(io!, socket)
    );
  });

  return io;
}

export function getSocketServer(): TypedServer | null {
  return io;
}

export async function closeSocketServer(): Promise<void> {
  if (io) {
    await io.close();
    io = null;
  }
}
