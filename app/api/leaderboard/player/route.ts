// API Route: /api/leaderboard/player
// GET: Get player statistics and rankings

import { NextRequest, NextResponse } from 'next/server';
import { getPlayerStats, getPlayerAllRankings, getPlayerRank } from '@/lib/services/leaderboardService';
import type { GameType, LeaderboardPeriod } from '@/types/multiplayer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerId = searchParams.get('playerId');
    const gameType = searchParams.get('gameType') as GameType | null;
    const period = searchParams.get('period') as LeaderboardPeriod | null;

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    // If gameType and period are provided, get specific ranking
    if (gameType && period) {
      const ranking = await getPlayerRank(playerId, gameType, period);
      return NextResponse.json({ ranking }, { status: 200 });
    }

    // If only gameType is provided, get rankings for all periods
    if (gameType) {
      const periods: LeaderboardPeriod[] = ['all-time', 'daily', 'weekly', 'monthly'];
      const rankings = await Promise.all(
        periods.map(async (p) => ({
          period: p,
          ranking: await getPlayerRank(playerId, gameType, p),
        }))
      );
      return NextResponse.json({ rankings }, { status: 200 });
    }

    // Otherwise, get full stats and all rankings
    const stats = await getPlayerStats(playerId);
    const allRankings = await getPlayerAllRankings(playerId);

    return NextResponse.json(
      { stats, rankings: allRankings },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}
