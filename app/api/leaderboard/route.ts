// API Route: /api/leaderboard
// GET: Get top players for a game type
// POST: Submit a score to leaderboard

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTopPlayers, submitScore } from '@/lib/services/leaderboardService';
import type { GameType, LeaderboardPeriod } from '@/types/multiplayer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameType = searchParams.get('gameType') as GameType;
    const period = (searchParams.get('period') || 'all-time') as LeaderboardPeriod;
    const limit = parseInt(searchParams.get('limit') || '100');

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

    const entries = await getTopPlayers(gameType, period, limit);

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const {
      playerId,
      playerType,
      displayName,
      gameType,
      sessionId,
      score,
      metrics,
    } = body;

    // Validate required fields
    if (!playerId || !displayName || !gameType || !sessionId || score === undefined || !metrics) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate game type
    const validGameTypes = ['falling-blocks', 'blink', 'falling-words', 'speed-race'];
    if (!validGameTypes.includes(gameType)) {
      return NextResponse.json(
        { error: 'Invalid game type' },
        { status: 400 }
      );
    }

    // Validate metrics
    if (typeof metrics.wpm !== 'number' || typeof metrics.accuracy !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metrics format' },
        { status: 400 }
      );
    }

    // For authenticated users, verify the playerId matches session
    if (session?.user && playerType === 'user') {
      const userId = (session.user as any).id;
      if (playerId !== userId) {
        return NextResponse.json(
          { error: 'Player ID mismatch' },
          { status: 403 }
        );
      }
    }

    // Submit score
    const entries = await submitScore(
      playerId,
      playerType || 'guest',
      displayName,
      gameType,
      sessionId,
      score,
      metrics
    );

    return NextResponse.json(
      { success: true, entries },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting score:', error);
    return NextResponse.json(
      { error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}
