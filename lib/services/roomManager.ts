// Room management service

import { GameRoom, PlayerInRoom } from '@/types/multiplayer';
import GameRoomModel from '@/lib/db/models/GameRoom';
import { RoomCache } from '@/lib/redis/roomCache';
import connectDB from '@/lib/db/mongodb';
import { nanoid } from 'nanoid';

export class RoomManager {
  /**
   * Create a new game room
   */
  static async createRoom(params: {
    gameType: string;
    roomName: string;
    password?: string;
    maxPlayers: number;
    hostId: string;
    hostName: string;
    settings?: any;
  }): Promise<GameRoom> {
    await connectDB();
    const roomId = nanoid(10);

    const host: PlayerInRoom = {
      playerId: params.hostId,
      displayName: params.hostName,
      isHost: true,
      isReady: false,
      joinedAt: new Date(),
      isConnected: true,
    };

    const room: GameRoom = {
      roomId,
      gameType: params.gameType as any,
      roomName: params.roomName,
      password: params.password,
      maxPlayers: params.maxPlayers,
      players: [host],
      spectators: [],
      status: 'waiting',
      settings: {
        seed: Math.floor(Math.random() * 1000000),
        ...params.settings,
      },
      createdAt: new Date(),
    };

    // Save to database
    await GameRoomModel.create(room);

    // Cache in Redis
    await RoomCache.saveRoom(room);

    return room;
  }

  /**
   * Get room by ID
   */
  static async getRoom(roomId: string): Promise<GameRoom | null> {
    // Try cache first
    let room = await RoomCache.getRoom(roomId);
    if (room) {
      return room;
    }

    // Fallback to database
    await connectDB();
    const dbRoom = await GameRoomModel.findOne({ roomId });
    if (dbRoom) {
      room = dbRoom.toObject() as GameRoom;
      // Update cache
      await RoomCache.saveRoom(room);
      return room;
    }

    return null;
  }

  /**
   * Join a room
   */
  static async joinRoom(params: {
    roomId: string;
    playerId: string;
    playerName: string;
    password?: string;
  }): Promise<{ success: boolean; room?: GameRoom; error?: string }> {
    const room = await this.getRoom(params.roomId);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // Check if player already in room
    const existingPlayer = room.players.find(p => p.playerId === params.playerId);
    if (existingPlayer) {
      // Player already in room (e.g., duplicate join request)
      console.log(`👤 Player ${params.playerName} already in room`);
      return { success: true, room };
    }

    // New player joining - check status (only allow joining waiting rooms)
    if (room.status !== 'waiting') {
      return { success: false, error: 'Cannot join - game already in progress' };
    }

    // Check password
    if (room.password && room.password !== params.password) {
      return { success: false, error: 'Incorrect password' };
    }

    // Check if room is full (after checking existing player)
    console.log(`🚪 Join check: ${params.playerName} trying to join room ${params.roomId}`);
    console.log(`   Current players: ${room.players.length}/${room.maxPlayers}`);
    console.log(`   Players:`, room.players.map(p => `${p.displayName} (${p.playerId})`));

    if (room.players.length >= room.maxPlayers) {
      console.log(`❌ Room is full: ${room.players.length} >= ${room.maxPlayers}`);
      return { success: false, error: 'Room is full' };
    }

    // Add player
    const newPlayer: PlayerInRoom = {
      playerId: params.playerId,
      displayName: params.playerName,
      isHost: false,
      isReady: false,
      joinedAt: new Date(),
      isConnected: true,
    };

    room.players.push(newPlayer);

    // Update database and cache
    await connectDB();
    await GameRoomModel.findOneAndUpdate(
      { roomId: params.roomId },
      { $set: { players: room.players } }
    );
    await RoomCache.saveRoom(room);

    return { success: true, room };
  }

  /**
   * Leave a room
   */
  static async leaveRoom(roomId: string, playerId: string): Promise<GameRoom | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    // Remove player
    const wasHost = room.players.find(p => p.playerId === playerId)?.isHost;
    room.players = room.players.filter(p => p.playerId !== playerId);

    // If no players left, delete room
    if (room.players.length === 0) {
      await this.deleteRoom(roomId);
      return null;
    }

    // If host left, assign new host
    if (wasHost && room.players.length > 0) {
      room.players[0].isHost = true;
    }

    // Update database and cache
    await connectDB();
    await GameRoomModel.findOneAndUpdate(
      { roomId },
      { $set: { players: room.players } }
    );
    await RoomCache.saveRoom(room);

    return room;
  }

  /**
   * Toggle player ready status
   */
  static async toggleReady(roomId: string, playerId: string, isReady: boolean): Promise<GameRoom | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.playerId === playerId);
    if (!player) return null;

    player.isReady = isReady;

    // Update database and cache
    await connectDB();
    await GameRoomModel.findOneAndUpdate(
      { roomId },
      { $set: { players: room.players } }
    );
    await RoomCache.saveRoom(room);

    return room;
  }

  /**
   * Kick player from room (host only)
   */
  static async kickPlayer(roomId: string, hostId: string, targetId: string): Promise<GameRoom | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    // Verify host
    const host = room.players.find(p => p.playerId === hostId);
    if (!host || !host.isHost) {
      throw new Error('Only host can kick players');
    }

    // Remove target player
    room.players = room.players.filter(p => p.playerId !== targetId);

    // Update database and cache
    await connectDB();
    await GameRoomModel.findOneAndUpdate(
      { roomId },
      { $set: { players: room.players } }
    );
    await RoomCache.saveRoom(room);

    return room;
  }

  /**
   * Start game (host only)
   * Room must be in waiting status with all players ready
   */
  static async startGame(roomId: string, hostId: string): Promise<{ success: boolean; error?: string }> {
    const room = await this.getRoom(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // Verify host
    const host = room.players.find(p => p.playerId === hostId);
    if (!host || !host.isHost) {
      return { success: false, error: 'Only host can start game' };
    }

    // Check if enough players
    if (room.players.length < 2) {
      return { success: false, error: 'Need at least 2 players' };
    }

    // Check if all players are ready
    const allReady = room.players.every(p => p.isReady || p.isHost);
    if (!allReady) {
      return { success: false, error: 'All players must be ready' };
    }

    // Update room status to playing
    room.status = 'playing';
    room.startedAt = new Date();

    // Update database and cache
    await connectDB();
    await GameRoomModel.findOneAndUpdate(
      { roomId },
      { $set: { status: room.status, startedAt: room.startedAt, players: room.players } }
    );
    await RoomCache.updateRoomStatus(roomId, 'playing');

    return { success: true };
  }

  /**
   * Get all active rooms
   */
  static async getActiveRooms(gameType?: string): Promise<GameRoom[]> {
    // Try cache first
    let rooms = await RoomCache.getAllRooms();

    // Filter by game type and status
    if (gameType) {
      rooms = rooms.filter(r => r.gameType === gameType && r.status === 'waiting');
    } else {
      rooms = rooms.filter(r => r.status === 'waiting');
    }

    return rooms;
  }

  /**
   * Update room
   */
  static async updateRoom(room: GameRoom): Promise<void> {
    await connectDB();
    await GameRoomModel.findOneAndUpdate(
      { roomId: room.roomId },
      { $set: room }
    );
    await RoomCache.saveRoom(room);
  }

  /**
   * Delete room
   */
  static async deleteRoom(roomId: string): Promise<void> {
    await connectDB();
    await GameRoomModel.findOneAndDelete({ roomId });
    await RoomCache.deleteRoom(roomId);
  }

  /**
   * Check if all players are ready
   */
  static async areAllPlayersReady(roomId: string): Promise<boolean> {
    const room = await this.getRoom(roomId);
    if (!room || room.players.length < 2) return false;

    return room.players.every(p => p.isReady || p.isHost);
  }

  /**
   * Get room by player ID
   */
  static async getRoomByPlayerId(playerId: string): Promise<GameRoom | null> {
    await connectDB();
    const dbRoom = await GameRoomModel.findOne({
      'players.playerId': playerId,
      status: { $in: ['waiting', 'playing'] },
    });

    if (dbRoom) {
      return dbRoom.toObject() as GameRoom;
    }

    return null;
  }

  /**
   * Get room by host ID (find rooms where the player is the host)
   */
  static async getRoomByHostId(hostId: string): Promise<GameRoom | null> {
    await connectDB();
    const dbRoom = await GameRoomModel.findOne({
      'players.playerId': hostId,
      'players.isHost': true,
      status: { $in: ['waiting', 'playing'] },
    });

    if (dbRoom) {
      return dbRoom.toObject() as GameRoom;
    }

    return null;
  }

  /**
   * Clean up stale rooms (no activity for 30 minutes)
   */
  static async cleanupStaleRooms(): Promise<number> {
    await connectDB();
    
    // Clean up waiting rooms older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const waitingResult = await GameRoomModel.deleteMany({
      status: 'waiting',
      createdAt: { $lt: thirtyMinutesAgo },
    });

    // Clean up playing rooms older than 2 hours (games shouldn't last that long)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const playingResult = await GameRoomModel.deleteMany({
      status: 'playing',
      createdAt: { $lt: twoHoursAgo },
    });

    const totalCleaned = (waitingResult.deletedCount || 0) + (playingResult.deletedCount || 0);
    return totalCleaned;
  }
}
