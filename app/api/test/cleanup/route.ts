// API endpoint for cleaning up test data
// Only available in development mode

import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis/client';
import connectDB from '@/lib/db/mongodb';
import GameRoom from '@/lib/db/models/GameRoom';

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // Connect to database
    await connectDB();

    // Only clear room/matchmaking related keys - avoid broad key deletion
    const keys = await redis.keys('room:*');
    const matchmakingKeys = await redis.keys('matchmaking:*');
    const queueKeys = await redis.keys('queue:*');

    const allKeys = [...keys, ...matchmakingKeys, ...queueKeys];

    if (allKeys.length > 0) {
      await redis.del(...allKeys);
    }

    // Delete all rooms from database
    const result = await GameRoom.deleteMany({});

    console.log('🧹 Test cleanup completed:', {
      redisKeysDeleted: allKeys.length,
      roomsDeleted: result.deletedCount,
    });

    return NextResponse.json({
      success: true,
      message: 'Test data cleaned up successfully',
      details: {
        redisKeysDeleted: allKeys.length,
        roomsDeleted: result.deletedCount,
      },
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup test data' },
      { status: 500 }
    );
  }
}
