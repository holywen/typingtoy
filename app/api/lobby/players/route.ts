import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis/client';
import { RoomManager } from '@/lib/services/roomManager';

export const dynamic = 'force-dynamic';

/**
 * GET /api/lobby/players
 * Returns list of all online players in the lobby
 */
export async function GET() {
  try {
    // Get all online player IDs from Redis
    const onlinePlayerIds = await redis.smembers('online:players');

    // Get player details and status
    const players = (await Promise.all(
      onlinePlayerIds.map(async (playerId) => {
        try {
          const socketId = await redis.get(`player:${playerId}:socketId`);

          // If no socket ID found, this is stale data - skip it
          if (!socketId) {
            console.log(`⚠️ [API] Stale player in Redis, skipping: ${playerId}`);
            await redis.srem('online:players', playerId);
            return null;
          }

          // Get display name from Redis (stored during connection)
          const displayName = await redis.get(`player:${playerId}:displayName`) || 'Guest';

          // Check if player is in a room
          const room = await RoomManager.getRoomByPlayerId(playerId);
          let status: 'online' | 'in-game' | 'in-room' = 'online';

          if (room) {
            status = room.status === 'playing' ? 'in-game' : 'in-room';
          }

          return {
            playerId,
            displayName,
            status,
          };
        } catch (error) {
          console.error(`Error fetching player ${playerId}:`, error);
          return null;
        }
      })
    )).filter((player): player is NonNullable<typeof player> => player !== null);

    return NextResponse.json({
      players,
      count: players.length,
    });
  } catch (error) {
    console.error('Error fetching lobby players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lobby players', players: [], count: 0 },
      { status: 500 }
    );
  }
}
