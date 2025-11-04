// Redis room cache operations

import { redis } from './client';
import { GameRoom } from '@/types/multiplayer';

const ROOM_PREFIX = 'room:';
const ROOM_LIST_KEY = 'rooms:active';
const ROOM_TTL = 24 * 60 * 60; // 24 hours

export class RoomCache {
  // Save room to cache
  static async saveRoom(room: GameRoom): Promise<void> {
    const key = `${ROOM_PREFIX}${room.roomId}`;
    const data = {
      roomData: JSON.stringify(room),
      players: JSON.stringify(room.players),
      status: room.status,
    };

    await redis.hset(key, data);
    await redis.expire(key, ROOM_TTL);

    // Add to active rooms list
    await redis.sadd(ROOM_LIST_KEY, room.roomId);
  }

  // Get room from cache
  static async getRoom(roomId: string): Promise<GameRoom | null> {
    const key = `${ROOM_PREFIX}${roomId}`;
    const data = await redis.hgetall(key);

    if (!data || !data.roomData) {
      return null;
    }

    return JSON.parse(data.roomData) as GameRoom;
  }

  // Update room status
  static async updateRoomStatus(roomId: string, status: string): Promise<void> {
    const key = `${ROOM_PREFIX}${roomId}`;
    await redis.hset(key, 'status', status);
  }

  // Delete room from cache
  static async deleteRoom(roomId: string): Promise<void> {
    const key = `${ROOM_PREFIX}${roomId}`;
    await redis.del(key);
    await redis.srem(ROOM_LIST_KEY, roomId);
  }

  // Get all active rooms
  static async getAllRooms(): Promise<GameRoom[]> {
    const roomIds = await redis.smembers(ROOM_LIST_KEY);
    const rooms: GameRoom[] = [];

    for (const roomId of roomIds) {
      const room = await this.getRoom(roomId);
      if (room) {
        rooms.push(room);
      } else {
        // Clean up stale room ID
        await redis.srem(ROOM_LIST_KEY, roomId);
      }
    }

    return rooms;
  }

  // Get rooms by game type
  static async getRoomsByGameType(gameType: string): Promise<GameRoom[]> {
    const allRooms = await this.getAllRooms();
    return allRooms.filter(room => room.gameType === gameType && room.status === 'waiting');
  }

  // Check if room exists
  static async roomExists(roomId: string): Promise<boolean> {
    const key = `${ROOM_PREFIX}${roomId}`;
    return (await redis.exists(key)) === 1;
  }

  // Update room players
  static async updatePlayers(roomId: string, players: any[]): Promise<void> {
    const key = `${ROOM_PREFIX}${roomId}`;
    await redis.hset(key, 'players', JSON.stringify(players));

    // Update the full room data as well
    const room = await this.getRoom(roomId);
    if (room) {
      room.players = players;
      await redis.hset(key, 'roomData', JSON.stringify(room));
    }
  }

  // Refresh room TTL
  static async refreshTTL(roomId: string): Promise<void> {
    const key = `${ROOM_PREFIX}${roomId}`;
    await redis.expire(key, ROOM_TTL);
  }
}
