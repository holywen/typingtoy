import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import GameRoom from '@/lib/db/models/GameRoom';
import GameSession from '@/lib/db/models/GameSession';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    // Connect to database
    await connectDB();

    // Get time range from query params (default: 30 days)
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User Growth Data (last N days)
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Game Type Distribution
    const gameTypeDistribution = await GameRoom.aggregate([
      {
        $group: {
          _id: '$gameType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Room Status Distribution
    const roomStatusDistribution = await GameRoom.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Daily Room Creation (last N days)
    const dailyRoomCreation = await GameRoom.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Average players per room by game type
    const avgPlayersByGameType = await GameRoom.aggregate([
      {
        $match: {
          status: 'finished',
        },
      },
      {
        $group: {
          _id: '$gameType',
          avgPlayers: {
            $avg: { $size: '$players' },
          },
          totalGames: { $sum: 1 },
        },
      },
    ]);

    // Peak hours analysis (rooms created by hour)
    const peakHours = await GameRoom.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $hour: '$createdAt',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // User role distribution
    const userRoleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    // Email verification status
    const emailVerificationStatus = await User.aggregate([
      {
        $group: {
          _id: {
            $cond: [{ $ne: ['$emailVerified', null] }, 'verified', 'unverified'],
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Average game duration (for finished games)
    const avgGameDuration = await GameRoom.aggregate([
      {
        $match: {
          status: 'finished',
          startedAt: { $exists: true },
          endedAt: { $exists: true },
        },
      },
      {
        $group: {
          _id: '$gameType',
          avgDuration: {
            $avg: {
              $divide: [
                { $subtract: ['$endedAt', '$startedAt'] },
                60000, // Convert to minutes
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent activity summary
    const recentActivitySummary = {
      last24Hours: {
        newUsers: await User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
        newRooms: await GameRoom.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
        finishedGames: await GameRoom.countDocuments({
          status: 'finished',
          endedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
      },
      last7Days: {
        newUsers: await User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
        newRooms: await GameRoom.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
        finishedGames: await GameRoom.countDocuments({
          status: 'finished',
          endedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
      },
    };

    return NextResponse.json({
      userGrowth,
      gameTypeDistribution,
      roomStatusDistribution,
      dailyRoomCreation,
      avgPlayersByGameType,
      peakHours,
      userRoleDistribution,
      emailVerificationStatus,
      avgGameDuration,
      recentActivitySummary,
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);

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
