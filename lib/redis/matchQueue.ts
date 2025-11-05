// Redis match queue operations

import { redis } from './client';
import { MatchQueueEntry, GameType } from '@/types/multiplayer';

const QUEUE_PREFIX = 'matchqueue:';
const QUEUE_TTL = 300; // 5 minutes

export class MatchQueue {
  // Build queue key
  private static getQueueKey(gameType: GameType, skillTier: string): string {
    return `${QUEUE_PREFIX}${gameType}:${skillTier}`;
  }

  // Add player to match queue
  static async addToQueue(entry: MatchQueueEntry): Promise<void> {
    const key = this.getQueueKey(entry.gameType, entry.skillTier);
    const score = entry.joinedAt;
    const member = JSON.stringify({
      playerId: entry.playerId,
      displayName: entry.displayName,
    });

    await redis.zadd(key, score, member);
    await redis.expire(key, QUEUE_TTL);
  }

  // Remove player from queue
  static async removeFromQueue(playerId: string, gameType: GameType, skillTier: string): Promise<void> {
    const key = this.getQueueKey(gameType, skillTier);
    const members = await redis.zrange(key, 0, -1);

    for (const member of members) {
      const data = JSON.parse(member);
      if (data.playerId === playerId) {
        await redis.zrem(key, member);
        break;
      }
    }
  }

  // Remove player from all queues (when they disconnect or cancel)
  static async removeFromAllQueues(playerId: string): Promise<void> {
    const pattern = `${QUEUE_PREFIX}*`;
    const keys = await redis.keys(pattern);

    for (const key of keys) {
      const members = await redis.zrange(key, 0, -1);
      for (const member of members) {
        const data = JSON.parse(member);
        if (data.playerId === playerId) {
          await redis.zrem(key, member);
        }
      }
    }
  }

  // Get waiting players from queue (ordered by join time)
  static async getWaitingPlayers(gameType: GameType, skillTier: string, limit: number = 10): Promise<MatchQueueEntry[]> {
    const key = this.getQueueKey(gameType, skillTier);
    const members = await redis.zrange(key, 0, limit - 1, 'WITHSCORES');

    const entries: MatchQueueEntry[] = [];
    for (let i = 0; i < members.length; i += 2) {
      const data = JSON.parse(members[i]);
      const score = parseInt(members[i + 1]);

      entries.push({
        playerId: data.playerId,
        displayName: data.displayName,
        gameType,
        skillTier,
        joinedAt: score,
      });
    }

    return entries;
  }

  // Find matches in queue (get oldest N players)
  static async findMatches(gameType: GameType, skillTier: string, count: number): Promise<MatchQueueEntry[]> {
    const players = await this.getWaitingPlayers(gameType, skillTier, count);

    // Remove matched players from queue
    if (players.length >= count) {
      const matched = players.slice(0, count);
      for (const player of matched) {
        await this.removeFromQueue(player.playerId, gameType, skillTier);
      }
      return matched;
    }

    return [];
  }

  // Get queue size
  static async getQueueSize(gameType: GameType, skillTier: string): Promise<number> {
    const key = this.getQueueKey(gameType, skillTier);
    return await redis.zcard(key);
  }

  // Check if player is in queue
  static async isInQueue(playerId: string, gameType: GameType, skillTier: string): Promise<boolean> {
    const key = this.getQueueKey(gameType, skillTier);
    const members = await redis.zrange(key, 0, -1);

    for (const member of members) {
      const data = JSON.parse(member);
      if (data.playerId === playerId) {
        return true;
      }
    }

    return false;
  }

  // Clean expired entries (called periodically)
  static async cleanExpired(gameType: GameType, skillTier: string): Promise<number> {
    const key = this.getQueueKey(gameType, skillTier);
    const now = Date.now();
    const expiredTime = now - (QUEUE_TTL * 1000);

    // Remove entries older than TTL
    return await redis.zremrangebyscore(key, '-inf', expiredTime);
  }
}
