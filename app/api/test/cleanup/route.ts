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

    // Clear all Redis keys related to rooms and matchmaking
    const keys = await redis.keys('*');

    const roomKeys = keys.filter(key =>
      key.startsWith('room:') ||
      key.startsWith('player:') ||
      key.startsWith('online:') ||
      key.startsWith('matchmaking:') ||
      key.startsWith('queue:')
    );

    if (roomKeys.length > 0) {
      await redis.del(...roomKeys);
    }

    // Delete all rooms from database
    const result = await GameRoom.deleteMany({});

    console.log('🧹 Test cleanup completed:', {
      redisKeysDeleted: roomKeys.length,
      roomsDeleted: result.deletedCount,
    });

    return NextResponse.json({
      success: true,
      message: 'Test data cleaned up successfully',
      details: {
        redisKeysDeleted: roomKeys.length,
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
