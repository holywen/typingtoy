// Utility script to clean up stale rooms from the database
import connectDB from '../lib/db/mongodb';
import GameRoomModel from '../lib/db/models/GameRoom';

async function cleanupStaleRooms() {
  try {
    await connectDB();
    
    // Find all rooms that are older than 1 hour in 'waiting' or 'playing' status
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const result = await GameRoomModel.deleteMany({
      status: { $in: ['waiting', 'playing'] },
      createdAt: { $lt: oneHourAgo }
    });
    
    console.log(`✅ Cleaned up ${result.deletedCount} stale rooms`);
    
    // Also clean up any rooms in 'completed' status older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const completedResult = await GameRoomModel.deleteMany({
      status: 'completed',
      createdAt: { $lt: oneDayAgo }
    });
    
    console.log(`✅ Cleaned up ${completedResult.deletedCount} old completed rooms`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up stale rooms:', error);
    process.exit(1);
  }
}

cleanupStaleRooms();
