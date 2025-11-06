import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import connectDB from '@/lib/db/mongodb';
import GameRoom from '@/lib/db/models/GameRoom';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin();

    // Connect to database
    await connectDB();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const gameType = searchParams.get('gameType') || '';

    // Build query
    const query: any = {};

    if (status && ['waiting', 'playing', 'finished'].includes(status)) {
      query.status = status;
    }

    if (gameType && ['falling-blocks', 'blink', 'typing-walk', 'falling-words'].includes(gameType)) {
      query.gameType = gameType;
    }

    // Get total count
    const total = await GameRoom.countDocuments(query);

    // Get rooms with pagination
    const rooms = await GameRoom.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      rooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);

    if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
