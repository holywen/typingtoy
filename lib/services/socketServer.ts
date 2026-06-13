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
import { RoomManager } from './roomManager';

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
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
          return callback(null, true);
        }
        // In development, allow localhost
        if (process.env.NODE_ENV !== 'production') {
          if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
          }
          return callback(null, true);
        }
        // In production, only allow the configured app URL
        const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
        if (allowedOrigin && origin === allowedOrigin) {
          return callback(null, true);
        }
        // Allow same-origin (no origin header)
        callback(new Error('Origin not allowed'), false);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Match client transport order for better browser compatibility
    transports: ['polling', 'websocket'],
    allowUpgrades: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Connection middleware - player identification
  io.use(async (socket, next) => {
    try {
      const { deviceId, displayName } = socket.handshake.auth;
      let userId: string | undefined;

      if (!deviceId) {
        return next(new Error('Device ID required'));
      }

      // Verify authentication server-side rather than trusting client-provided userId
      // Extract session cookie from handshake headers and decode JWT
      const cookies = socket.handshake.headers.cookie;
      if (cookies) {
        try {
          const { getToken } = await import('@auth/core/jwt');
          const token = await getToken({
            req: { headers: { cookie: cookies } },
            secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET!,
          });
          if (token?.sub) {
            userId = token.sub;
          }
        } catch (err) {
          // Fall through: treat as guest if session verification fails
        }
      }

      // Set socket data - use server-verified userId, never trust client-provided one
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

  // Helper function to broadcast online players list
  const broadcastOnlinePlayers = async () => {
    try {
      if (!io) return;

      const { RoomManager } = await import('./roomManager');
      const onlinePlayerIds = await redis.smembers('online:players');

      const players = (await Promise.all(
        onlinePlayerIds.map(async (pid) => {
          const socketId = await redis.get(`player:${pid}:socketId`);
          const socket = io!.sockets.sockets.get(socketId || '');

          // Skip players whose sockets can't be found (stale Redis data)
          if (!socket) {
            console.log(`⚠️ Stale player in Redis, removing: ${pid}`);
            await redis.srem('online:players', pid);
            await redis.del(`player:${pid}:socketId`);
            return null;
          }

          const displayName = socket.data?.displayName || 'Guest';

          // Check player status
          const room = await RoomManager.getRoomByPlayerId(pid);
          let status: 'online' | 'in-game' | 'in-room' = 'online';

          if (room) {
            status = room.status === 'playing' ? 'in-game' : 'in-room';
          }

          return {
            playerId: pid,
            displayName,
            status
          };
        })
      )).filter((player): player is NonNullable<typeof player> => player !== null);

      // Broadcast to all connected clients
      io!.emit('lobby:players', { players });
    } catch (error) {
      console.error('Error broadcasting online players:', error);
    }
  };

  // Connection handler
  io.on('connection', async (socket: TypedSocket) => {
    const { playerId, displayName } = socket.data;
    console.log(`✅ Player connected: ${displayName} (${playerId})`);

    // Emit connection confirmation
    socket.emit('player:connected', { playerId });

    // Player joins lobby (no auto-rejoin - players cannot return to games after disconnect)
    const { LobbyEventManager } = await import('./lobbyEventManager');
    await LobbyEventManager.handlePlayerJoin(io!, {
      playerId,
      playerName: displayName,
      socketId: socket.id,
    });

    // Handle player identification - only allow non-security-critical fields
    // userId is NEVER overridden from client; only the io.use middleware sets it via JWT
    socket.on('player:identify', (data) => {
      socket.data.displayName = data.displayName;
      socket.data.deviceId = data.deviceId;
    });

    // Handle lobby presence management for leaderboard viewing
    socket.on('lobby:viewing-leaderboard', async () => {
      console.log(`📊 Player ${displayName} viewing leaderboard`);
      const { LobbyEventManager } = await import('./lobbyEventManager');
      await LobbyEventManager.handlePlayerLeave(io!, {
        playerId,
        playerName: displayName,
      });
    });

    socket.on('lobby:left-leaderboard', async () => {
      console.log(`📊 Player ${displayName} left leaderboard, rejoining lobby`);
      const { LobbyEventManager } = await import('./lobbyEventManager');
      await LobbyEventManager.handlePlayerJoin(io!, {
        playerId,
        playerName: displayName,
        socketId: socket.id,
      });
    });

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      console.log(`❌ Player disconnected: ${displayName} (${reason})`);

      try {
        // Leave current room if in one
        if (socket.data.currentRoomId) {
          const roomId = socket.data.currentRoomId;

          // Leave socket room
          socket.leave(roomId);

          // Check room status before removing player
          const room = await RoomManager.getRoom(roomId);

          if (room && room.status === 'playing') {
            // Game is active - remove player from room but let game continue for others
            console.log(`🎮 Player ${displayName} disconnected during game - removing from room`);

            // Remove player from room
            await RoomManager.leaveRoom(roomId, playerId);

            // Check if room still exists (leaveRoom deletes if no players left)
            const updatedRoom = await RoomManager.getRoom(roomId);

            if (!updatedRoom) {
              // Last player left - stop game and delete room
              console.log(`🛑 Last player left - deleting room ${roomId}`);

              const { cleanupGame } = await import('./socketHandlers/gameHandlers');
              cleanupGame(roomId);

              io!.emit('room:deleted', { roomId });
            } else {
              // Other players still in room - let game continue
              console.log(`✅ Player ${displayName} removed from room, ${updatedRoom.players.length} players still in game`);

              // Notify other players
              io!.to(roomId).emit('player:left', { roomId, playerId });
              io!.to(roomId).emit('room:updated', { room: updatedRoom });
            }
          } else {
            // Game not active - remove player from room
            console.log(`🚪 Player ${displayName} disconnected from waiting room - removing`);

            // Import RoomEventManager
            const { RoomEventManager } = await import('./roomEventManager');

            // Use RoomEventManager - it handles duplicate check and system messages
            await RoomEventManager.handlePlayerLeave(io!, {
              roomId,
              playerId,
              playerName: displayName,
            });
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

        // Use LobbyEventManager - it handles state changes and system messages
        const { LobbyEventManager } = await import('./lobbyEventManager');
        await LobbyEventManager.handlePlayerLeave(io!, {
          playerId,
          playerName: displayName,
        });
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
