// Matchmaking status API

import { NextRequest, NextResponse } from 'next/server';
import { MatchmakingService } from '@/lib/services/matchmaking';
import { GameType } from '@/types/multiplayer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameType = searchParams.get('gameType') as GameType;

    if (!gameType) {
      return NextResponse.json(
        { success: false, error: 'Game type is required' },
        { status: 400 }
      );
    }

    const queueSize = await MatchmakingService.getQueueSize(gameType);

    return NextResponse.json({
      success: true,
      gameType,
      queueSize,
      estimatedWaitTime: queueSize > 0 ? Math.max(5, 30 - queueSize * 5) : 30, // Estimate in seconds
    });
  } catch (error) {
    console.error('Error fetching matchmaking status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
