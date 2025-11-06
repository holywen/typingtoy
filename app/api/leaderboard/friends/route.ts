// API Route: /api/leaderboard/friends
// GET: Get friend leaderboard for a player

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFriendLeaderboard } from '@/lib/services/leaderboardService';
import type { GameType, LeaderboardPeriod } from '@/types/multiplayer';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const searchParams = request.nextUrl.searchParams;
    const playerId = searchParams.get('playerId');
    const gameType = searchParams.get('gameType') as GameType;
    const period = (searchParams.get('period') || 'all-time') as LeaderboardPeriod;

    // Must be authenticated to view friend leaderboard
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // If no playerId provided, use authenticated user's ID
    const targetPlayerId = playerId || userId;

    // Users can only view their own friend leaderboard
    if (targetPlayerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!gameType) {
      return NextResponse.json(
        { error: 'Game type is required' },
        { status: 400 }
      );
    }

    const validGameTypes = ['falling-blocks', 'blink', 'falling-words', 'speed-race'];
    if (!validGameTypes.includes(gameType)) {
      return NextResponse.json(
        { error: 'Invalid game type' },
        { status: 400 }
      );
    }

    const entries = await getFriendLeaderboard(targetPlayerId, gameType, period);

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    console.error('Error fetching friend leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend leaderboard' },
      { status: 500 }
    );
  }
}
