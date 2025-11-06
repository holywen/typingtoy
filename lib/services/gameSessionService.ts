// Game Session Service
// Handles saving completed game sessions and submitting scores to leaderboard

import GameSessionModel from '@/lib/db/models/GameSession';
import UserModel from '@/lib/db/models/User';
import { connectDB } from '@/lib/db/mongodb';
import { submitScore, updateWinCount } from './leaderboardService';
import type { GameState, GameType, PlayerState } from '@/types/multiplayer';
import { nanoid } from 'nanoid';

export interface GameSessionResult {
  sessionId: string;
  leaderboardEntries: any[];
}

/**
 * Save a completed game session to database and submit scores to leaderboard
 */
export async function saveGameSession(
  roomId: string,
  gameType: GameType,
  gameState: GameState
): Promise<GameSessionResult> {
  await connectDB();

  const sessionId = nanoid();
  const now = new Date();
  const duration = gameState.elapsedTime / 1000; // Convert to seconds

  // Convert player states to game session players and rank them
  const players = Array.from(gameState.players.values());

  // Sort by score (descending) to determine ranks
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Prepare session player data
  const sessionPlayers = sortedPlayers.map((player, index) => ({
    playerId: player.playerId,
    displayName: player.displayName,
    score: player.score,
    rank: index + 1,
    metrics: {
      grossWPM: player.currentWPM,
      netWPM: player.currentWPM, // Could calculate net WPM based on errors
      accuracy: player.accuracy,
      keystrokeCount: player.keystrokeCount,
      errorCount: player.errorCount,
    },
    gameSpecificData: player.gameSpecificData,
    completedAt: player.isFinished ? now : undefined,
    disconnectedAt: !player.isConnected ? now : undefined,
  }));

  // Calculate average metrics
  const totalWPM = sessionPlayers.reduce((sum, p) => sum + p.metrics.netWPM, 0);
  const totalKeystrokes = sessionPlayers.reduce((sum, p) => sum + p.metrics.keystrokeCount, 0);
  const avgWPM = sessionPlayers.length > 0 ? totalWPM / sessionPlayers.length : 0;

  const winner = sortedPlayers[0]?.playerId;

  // Create game session document
  const gameSession = await GameSessionModel.create({
    sessionId,
    roomId,
    gameType,
    players: sessionPlayers,
    winner,
    gameData: {
      seed: gameState.seed,
      duration,
      avgWPM,
      totalKeystrokes,
    },
    startedAt: new Date(gameState.startTime),
    endedAt: now,
  });

  console.log(`✅ Game session saved: ${sessionId}`);

  // Submit scores to leaderboard for each player
  const leaderboardEntries = [];

  for (const sessionPlayer of sessionPlayers) {
    try {
      // Determine player type (user vs guest)
      let playerType: 'user' | 'guest' = 'guest';

      // Check if this is a registered user
      const user = await UserModel.findById(sessionPlayer.playerId).lean();
      if (user) {
        playerType = 'user';

        // Update win count for winner
        if (sessionPlayer.rank === 1) {
          await updateWinCount(sessionPlayer.playerId);
        }
      }

      // Submit score to leaderboard
      const entries = await submitScore(
        sessionPlayer.playerId,
        playerType,
        sessionPlayer.displayName,
        gameType,
        sessionId,
        sessionPlayer.score,
        {
          wpm: Math.round(sessionPlayer.metrics.netWPM),
          accuracy: Math.round(sessionPlayer.metrics.accuracy),
          level: sessionPlayer.gameSpecificData?.level,
          time: duration,
        }
      );

      leaderboardEntries.push(...entries);
      console.log(`✅ Leaderboard entries created for ${sessionPlayer.displayName}`);
    } catch (error) {
      console.error(`Error submitting leaderboard score for ${sessionPlayer.playerId}:`, error);
      // Continue with other players even if one fails
    }
  }

  return {
    sessionId,
    leaderboardEntries,
  };
}

/**
 * Get game session by ID
 */
export async function getGameSession(sessionId: string) {
  await connectDB();
  return await GameSessionModel.findOne({ sessionId }).lean();
}

/**
 * Get recent game sessions for a player
 */
export async function getPlayerGameSessions(
  playerId: string,
  gameType?: GameType,
  limit: number = 10
) {
  await connectDB();
  return await GameSessionModel.findByPlayerId(playerId, gameType, limit);
}

/**
 * Get player statistics from game sessions
 */
export async function getPlayerGameStats(playerId: string, gameType: GameType) {
  await connectDB();
  return await GameSessionModel.getPlayerStats(playerId, gameType);
}
