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

// Simple in-memory rate limiter for score submissions
const scoreSubmissionMap = new Map<string, { count: number; resetAt: number }>();

function checkScoreRateLimit(playerId: string): boolean {
  const now = Date.now();
  const entry = scoreSubmissionMap.get(playerId);
  if (!entry || now > entry.resetAt) {
    scoreSubmissionMap.set(playerId, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 10) {
    return false; // Max 10 score submissions per minute
  }
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

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

    // Rate limiting per player
    if (!checkScoreRateLimit(playerId)) {
      return NextResponse.json(
        { error: 'Too many score submissions. Please wait.' },
        { status: 429 }
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

    // Clip score to reasonable bounds
    const sanitizedScore = Math.max(0, Math.min(999999, Number(score) || 0));

    // Validate/sanitize displayName
    const sanitizedName = String(displayName).replace(/[<>&'"]/g, '').trim().slice(0, 30);

    // For authenticated users, verify the playerId matches session
    // This check applies regardless of playerType to prevent score spoofing
    if (session?.user) {
      const userId = (session.user as any).id;
      if (!userId) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 403 });
      }
      // Authenticated users must submit scores under their own userId
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
      sanitizedName,
      gameType,
      sessionId,
      sanitizedScore,
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
