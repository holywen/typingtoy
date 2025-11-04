// Redis chat cache operations

import { redis } from './client';
import { ChatMessage } from '@/types/multiplayer';

const CHAT_LOBBY_KEY = 'chat:lobby';
const CHAT_ROOM_PREFIX = 'chat:room:';
const CHAT_HISTORY_SIZE = 50;
const CHAT_TTL = 3600; // 1 hour

// Rate limiting
const RATE_LIMIT_PREFIX = 'ratelimit:chat:';
const RATE_LIMIT_WINDOW = 1; // 1 second
const RATE_LIMIT_MAX = 2; // Max 2 messages per second

export class ChatCache {
  // Save message to chat history
  static async saveMessage(message: ChatMessage): Promise<void> {
    const key = message.type === 'lobby'
      ? CHAT_LOBBY_KEY
      : `${CHAT_ROOM_PREFIX}${message.roomId}`;

    // Add message to list (newest first)
    await redis.lpush(key, JSON.stringify(message));

    // Trim to keep only recent messages
    await redis.ltrim(key, 0, CHAT_HISTORY_SIZE - 1);

    // Set TTL
    await redis.expire(key, CHAT_TTL);
  }

  // Get recent messages
  static async getMessages(type: 'lobby' | 'room', roomId?: string, limit: number = 50): Promise<ChatMessage[]> {
    const key = type === 'lobby'
      ? CHAT_LOBBY_KEY
      : `${CHAT_ROOM_PREFIX}${roomId}`;

    const messages = await redis.lrange(key, 0, limit - 1);
    return messages.map(msg => JSON.parse(msg) as ChatMessage).reverse();
  }

  // Check rate limit for player
  static async checkRateLimit(playerId: string): Promise<boolean> {
    const key = `${RATE_LIMIT_PREFIX}${playerId}`;
    const count = await redis.incr(key);

    if (count === 1) {
      // First message in this window, set expiry
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }

    return count <= RATE_LIMIT_MAX;
  }

  // Clear chat history for a room
  static async clearRoomChat(roomId: string): Promise<void> {
    const key = `${CHAT_ROOM_PREFIX}${roomId}`;
    await redis.del(key);
  }

  // Clear lobby chat (admin function)
  static async clearLobbyChat(): Promise<void> {
    await redis.del(CHAT_LOBBY_KEY);
  }

  // Mute player (temporary ban from chat)
  static async mutePlayer(playerId: string, durationSeconds: number = 60): Promise<void> {
    const key = `mute:${playerId}`;
    await redis.setex(key, durationSeconds, '1');
  }

  // Check if player is muted
  static async isPlayerMuted(playerId: string): Promise<boolean> {
    const key = `mute:${playerId}`;
    return (await redis.exists(key)) === 1;
  }

  // Unmute player
  static async unmutePlayer(playerId: string): Promise<void> {
    const key = `mute:${playerId}`;
    await redis.del(key);
  }
}
