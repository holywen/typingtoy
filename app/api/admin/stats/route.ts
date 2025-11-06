import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import GameRoom from '@/lib/db/models/GameRoom';

export async function GET() {
  try {
    // Verify admin access
    await requireAdmin();

    // Connect to database
    await connectDB();

    // Get statistics
    const [
      totalUsers,
      totalRooms,
      activeRooms,
      playingRooms,
      adminCount,
    ] = await Promise.all([
      User.countDocuments(),
      GameRoom.countDocuments(),
      GameRoom.countDocuments({ status: 'waiting' }),
      GameRoom.countDocuments({ status: 'playing' }),
      User.countDocuments({ role: 'admin' }),
    ]);

    // Get recent user registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get recent rooms created (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    const recentRooms = await GameRoom.countDocuments({
      createdAt: { $gte: oneDayAgo },
    });

    return NextResponse.json({
      totalUsers,
      totalRooms,
      activeRooms,
      playingRooms,
      finishedRooms: totalRooms - activeRooms - playingRooms,
      adminCount,
      recentUsers,
      recentRooms,
      onlineUsers: 0, // TODO: Implement with Redis
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);

    if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
