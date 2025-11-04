// Manual cleanup script for test data
// Run with: npx tsx scripts/cleanup-test-data.ts

import { redis } from '../lib/redis/client';
import connectDB from '../lib/db/mongodb';
import GameRoom from '../lib/db/models/GameRoom';

async function cleanup() {
  console.log('🧹 Starting test data cleanup...\n');

  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Clear all Redis keys related to rooms and matchmaking
    const keys = await redis.keys('*');
    console.log(`📊 Found ${keys.length} total Redis keys`);

    const roomKeys = keys.filter(key =>
      key.startsWith('room:') ||
      key.startsWith('player:') ||
      key.startsWith('online:') ||
      key.startsWith('matchmaking:') ||
      key.startsWith('queue:')
    );

    console.log(`🎯 Found ${roomKeys.length} room/player/matchmaking keys to delete`);

    if (roomKeys.length > 0) {
      await redis.del(...roomKeys);
      console.log(`✅ Deleted ${roomKeys.length} Redis keys`);
    }

    // Delete all rooms from database
    const result = await GameRoom.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} rooms from MongoDB`);

    console.log('\n🎉 Cleanup completed successfully!\n');
    console.log('Summary:');
    console.log(`  - Redis keys deleted: ${roomKeys.length}`);
    console.log(`  - Rooms deleted: ${result.deletedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup();
