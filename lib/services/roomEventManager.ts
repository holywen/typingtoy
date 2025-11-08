// Centralized room event management
// All room state changes and system messages are handled here

import { TypedServer } from './socketServer';
import { RoomManager } from './roomManager';
import { sendSystemMessage } from './socketHandlers/chatHandlers';
import { GameRoom, PlayerInRoom } from '@/types/multiplayer';

/**
 * RoomEventManager - Single source of truth for room events
 *
 * Core principle: All system messages are triggered by server-side state changes,
 * not by client requests. This prevents duplicate messages and centralizes logic.
 */
export class RoomEventManager {
  /**
   * Handle player joining a room
   * Automatically sends system message when state changes
   */
  static async handlePlayerJoin(
    io: TypedServer,
    params: {
      roomId: string;
      playerId: string;
      playerName: string;
      password?: string;
    }
  ): Promise<{ success: boolean; room?: GameRoom; error?: string; isReconnect?: boolean }> {
    console.log(`🚪 [EVENT MGR] Player ${params.playerName} joining room ${params.roomId}`);

    // 1. Update state (RoomManager handles duplicate check)
    const result = await RoomManager.joinRoom(params);

    if (!result.success) {
      return result;
    }

    // 2. Remove player from lobby (they're now in a room)
    if (!result.isReconnect) {
      const { LobbyEventManager } = await import('./lobbyEventManager');
      await LobbyEventManager.handlePlayerLeave(io, {
        playerId: params.playerId,
        playerName: params.playerName,
      });
    }

    // 3. Emit Socket.io events to clients
    io.to(params.roomId).emit('room:updated', { room: result.room! });
    io.to(params.roomId).emit('player:joined', {
      roomId: params.roomId,
      player: result.room!.players.find(p => p.playerId === params.playerId),
    });

    // 4. Send system message (only if new join, not reconnect)
    if (!result.isReconnect) {
      console.log(`📢 [EVENT MGR] Sending join message for ${params.playerName}`);
      await sendSystemMessage(io, 'room', `${params.playerName} joined the room`, params.roomId);
    } else {
      console.log(`🔄 [EVENT MGR] Player ${params.playerName} reconnected, no message sent`);
    }

    return result;
  }

  /**
   * Handle player leaving a room
   * Automatically sends system message when state changes
   *
   * This is the ONLY place where "left the room" messages are sent.
   * Both explicit leave and disconnect call this method.
   */
  static async handlePlayerLeave(
    io: TypedServer,
    params: {
      roomId: string;
      playerId: string;
      playerName: string;
      socketId?: string; // Optional: only needed when returning to lobby
    }
  ): Promise<void> {
    console.log(`🚪 [EVENT MGR] Player ${params.playerName} leaving room ${params.roomId}`);

    // Check if player is actually in the room (prevents duplicate messages)
    const currentRoom = await RoomManager.getRoom(params.roomId);
    const playerInRoom = currentRoom?.players.find(p => p.playerId === params.playerId);

    if (!playerInRoom) {
      console.log(`⚠️ [EVENT MGR] Player ${params.playerName} not in room ${params.roomId}, skipping (already left)`);
      return;
    }

    console.log(`✅ [EVENT MGR] Player ${params.playerName} is in room, processing leave`);

    // 1. Update state
    const room = await RoomManager.leaveRoom(params.roomId, params.playerId);

    // 2. Emit Socket.io events
    if (room) {
      io.to(params.roomId).emit('room:updated', { room });
      io.to(params.roomId).emit('player:left', { roomId: params.roomId, playerId: params.playerId });

      // 3. Send system message (ONLY place for "left" messages)
      console.log(`📢 [EVENT MGR] Sending leave message for ${params.playerName}`);
      await sendSystemMessage(io, 'room', `${params.playerName} left the room`, params.roomId);
    } else {
      // Room was deleted (last player left)
      console.log(`🗑️ [EVENT MGR] Room ${params.roomId} deleted (last player left)`);
      io.emit('room:deleted', { roomId: params.roomId });
    }

    // 4. Player returns to lobby (only if socketId provided - means they're still connected)
    if (params.socketId) {
      console.log(`🔄 [EVENT MGR] Player ${params.playerName} returning to lobby`);
      const { LobbyEventManager } = await import('./lobbyEventManager');
      await LobbyEventManager.handlePlayerJoin(io, {
        playerId: params.playerId,
        playerName: params.playerName,
        socketId: params.socketId,
      });
    }
  }

  /**
   * Handle player being kicked from a room
   * Automatically sends system message when state changes
   */
  static async handlePlayerKick(
    io: TypedServer,
    params: {
      roomId: string;
      hostId: string;
      targetId: string;
      targetName: string;
      targetSocketId?: string; // Optional: for returning kicked player to lobby
    }
  ): Promise<void> {
    console.log(`👢 [EVENT MGR] Host kicking ${params.targetName} from room ${params.roomId}`);

    // 1. Update state
    const room = await RoomManager.kickPlayer(params.roomId, params.hostId, params.targetId);

    if (room) {
      // 2. Emit Socket.io events
      io.to(params.roomId).emit('room:updated', { room });
      io.to(params.roomId).emit('player:left', { roomId: params.roomId, playerId: params.targetId });

      // 3. Send system message
      console.log(`📢 [EVENT MGR] Sending kick message for ${params.targetName}`);
      await sendSystemMessage(io, 'room', `${params.targetName} was kicked from the room`, params.roomId);

      // 4. Kicked player returns to lobby
      if (params.targetSocketId) {
        console.log(`🔄 [EVENT MGR] Kicked player ${params.targetName} returning to lobby`);
        const { LobbyEventManager } = await import('./lobbyEventManager');
        await LobbyEventManager.handlePlayerJoin(io, {
          playerId: params.targetId,
          playerName: params.targetName,
          socketId: params.targetSocketId,
        });
      }
    }
  }

  /**
   * Handle player ready status toggle
   * No system message needed for this event
   */
  static async handlePlayerReady(
    io: TypedServer,
    params: {
      roomId: string;
      playerId: string;
      isReady: boolean;
    }
  ): Promise<void> {
    const room = await RoomManager.toggleReady(params.roomId, params.playerId, params.isReady);

    if (room) {
      io.to(params.roomId).emit('room:updated', { room });
      io.to(params.roomId).emit('player:ready', {
        roomId: params.roomId,
        playerId: params.playerId,
        isReady: params.isReady,
      });
    }
  }
}
