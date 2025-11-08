// Centralized lobby event management
// All lobby state changes and system messages are handled here

import { TypedServer } from './socketServer';
import { sendSystemMessage } from './socketHandlers/chatHandlers';
import { redis } from '@/lib/redis/client';

/**
 * LobbyEventManager - Single source of truth for lobby events
 *
 * Core principle: All lobby system messages are triggered by server-side state changes,
 * not by client requests. This prevents duplicate messages and centralizes logic.
 */
export class LobbyEventManager {
  /**
   * Handle player joining the lobby
   * Automatically sends system message when player connects
   */
  static async handlePlayerJoin(
    io: TypedServer,
    params: {
      playerId: string;
      playerName: string;
      socketId: string;
    }
  ): Promise<void> {
    console.log(`🚪 [LOBBY] Player ${params.playerName} joining lobby`);

    // Check if player is already in lobby (prevent duplicate join messages)
    const isOnline = await redis.sismember('online:players', params.playerId);

    if (isOnline) {
      console.log(`⚠️ [LOBBY] Player ${params.playerName} already in lobby, skipping join message`);
      return;
    }

    console.log(`✅ [LOBBY] Player ${params.playerName} is new, processing join`);

    // 1. Update state - Add to online players
    await redis.sadd('online:players', params.playerId);
    await redis.set(`player:${params.playerId}:socketId`, params.socketId, 'EX', 86400);

    // 2. Broadcast updated online players list
    await LobbyEventManager.broadcastOnlinePlayers(io);

    // 3. Send system message
    console.log(`📢 [LOBBY] Sending join message for ${params.playerName}`);
    await sendSystemMessage(io, 'lobby', `${params.playerName} joined the lobby`);
  }

  /**
   * Handle player leaving the lobby
   * Automatically sends system message when player disconnects
   *
   * This is the ONLY place where "left the lobby" messages are sent.
   */
  static async handlePlayerLeave(
    io: TypedServer,
    params: {
      playerId: string;
      playerName: string;
    }
  ): Promise<void> {
    console.log(`🚪 [LOBBY] Player ${params.playerName} leaving lobby`);

    // Check if player is actually in lobby (prevent duplicate leave messages)
    const isOnline = await redis.sismember('online:players', params.playerId);

    if (!isOnline) {
      console.log(`⚠️ [LOBBY] Player ${params.playerName} not in lobby, skipping leave message`);
      return;
    }

    console.log(`✅ [LOBBY] Player ${params.playerName} is online, processing leave`);

    // 1. Update state - Remove from online players
    await redis.srem('online:players', params.playerId);
    await redis.del(`player:${params.playerId}:socketId`);

    // 2. Broadcast updated online players list
    await LobbyEventManager.broadcastOnlinePlayers(io);

    // 3. Send system message (ONLY place for "left" messages)
    console.log(`📢 [LOBBY] Sending leave message for ${params.playerName}`);
    await sendSystemMessage(io, 'lobby', `${params.playerName} left the lobby`);
  }

  /**
   * Broadcast the list of online players to all clients
   */
  static async broadcastOnlinePlayers(io: TypedServer): Promise<void> {
    try {
      const { RoomManager } = await import('./roomManager');
      const onlinePlayerIds = await redis.smembers('online:players');

      const players = (await Promise.all(
        onlinePlayerIds.map(async (pid) => {
          const socketId = await redis.get(`player:${pid}:socketId`);
          const socket = io.sockets.sockets.get(socketId || '');

          // Skip players whose sockets can't be found (stale Redis data)
          if (!socket) {
            console.log(`⚠️ [LOBBY] Stale player in Redis, removing: ${pid}`);
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
      io.emit('lobby:players', { players });

      console.log(`📊 [LOBBY] Broadcasted online players count: ${players.length}`);
    } catch (error) {
      console.error('Error broadcasting online players:', error);
    }
  }

  /**
   * Get current online players count
   */
  static async getOnlinePlayersCount(): Promise<number> {
    try {
      return await redis.scard('online:players');
    } catch (error) {
      console.error('Error getting online players count:', error);
      return 0;
    }
  }
}
