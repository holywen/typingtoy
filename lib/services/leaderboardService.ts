// Leaderboard Service
// Handles score submission, rankings, and statistics

import LeaderboardModel, { getPeriodBoundaries } from '@/lib/db/models/Leaderboard';
import UserModel from '@/lib/db/models/User';
import { connectDB } from '@/lib/db/mongodb';
import type { LeaderboardEntry, GameType, LeaderboardPeriod, GameSessionPlayer } from '@/types/multiplayer';

export interface LeaderboardStats {
  totalGames: number;
  totalWins: number;
  bestScore: number;
  avgWPM: number;
  avgAccuracy: number;
  favoriteGame?: GameType;
  gamesPerType: Record<GameType, number>;
  skillRatings: Record<GameType, number>;
}

export interface PlayerRanking {
  rank: number;
  entry: LeaderboardEntry;
  totalPlayers: number;
  percentile: number;
}

/**
 * Submit a score to the leaderboard for all periods
 */
export async function submitScore(
  playerId: string,
  playerType: 'user' | 'guest',
  displayName: string,
  gameType: GameType,
  sessionId: string,
  score: number,
  metrics: {
    wpm: number;
    accuracy: number;
    level?: number;
    time?: number;
  }
): Promise<LeaderboardEntry[]> {
  await connectDB();

  const periods: LeaderboardPeriod[] = ['all-time', 'daily', 'weekly', 'monthly'];
  const entries: LeaderboardEntry[] = [];

  for (const period of periods) {
    const boundaries = getPeriodBoundaries(period);

    const entryData: Partial<LeaderboardEntry> = {
      gameType,
      period,
      playerId,
      playerType,
      displayName,
      score,
      metrics,
      sessionId,
      achievedAt: new Date(),
      periodStart: boundaries.start,
      periodEnd: boundaries.end || undefined,
    };

    const savedEntry = await LeaderboardModel.submitScore(entryData);
    entries.push(savedEntry.toObject());
  }

  // Update ranks for each period
  for (const period of periods) {
    await LeaderboardModel.updateRanks(gameType, period);
  }

  // Update user stats if authenticated user
  if (playerType === 'user') {
    await updateUserStats(playerId, gameType, score, metrics.wpm);
  }

  return entries;
}

/**
 * Get top players for a specific game and period
 */
export async function getTopPlayers(
  gameType: GameType,
  period: LeaderboardPeriod = 'all-time',
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  await connectDB();

  const entries = await LeaderboardModel.getTopPlayers(gameType, period, limit);
  return entries as LeaderboardEntry[];
}

/**
 * Get a player's rank for a specific game and period
 */
export async function getPlayerRank(
  playerId: string,
  gameType: GameType,
  period: LeaderboardPeriod = 'all-time'
): Promise<PlayerRanking | null> {
  await connectDB();

  const result = await LeaderboardModel.getPlayerRank(playerId, gameType, period);

  if (!result) {
    return null;
  }

  // Get total players in this leaderboard
  const totalPlayers = await LeaderboardModel.countDocuments({ gameType, period });
  const percentile = Math.round((1 - (result.rank - 1) / totalPlayers) * 100);

  return {
    rank: result.rank,
    entry: result.entry ? (result.entry.toObject ? result.entry.toObject() : result.entry) : null,
    totalPlayers,
    percentile,
  };
}

/**
 * Get friend leaderboard (player + their friends)
 */
export async function getFriendLeaderboard(
  playerId: string,
  gameType: GameType,
  period: LeaderboardPeriod = 'all-time'
): Promise<LeaderboardEntry[]> {
  await connectDB();

  // Get user's friend list
  const user = await UserModel.findById(playerId).select('friends').lean();
  if (!user || !user.friends) {
    // No friends, return just the player's entry
    const playerRank = await getPlayerRank(playerId, gameType, period);
    return playerRank ? [playerRank.entry] : [];
  }

  const friendIds = user.friends.map(id => id.toString());
  const entries = await LeaderboardModel.getFriendsLeaderboard(playerId, friendIds, gameType, period);

  return entries as LeaderboardEntry[];
}

/**
 * Get comprehensive statistics for a player
 */
export async function getPlayerStats(playerId: string): Promise<LeaderboardStats | null> {
  await connectDB();

  // Get user data
  const user = await UserModel.findById(playerId).select('gameStats').lean();
  if (!user) {
    return null;
  }

  // Get best scores across all games
  const gameTypes: GameType[] = ['falling-blocks', 'blink', 'typing-walk', 'falling-words', 'speed-race'];
  const bestScores: Record<GameType, number> = {} as Record<GameType, number>;
  const gamesPerType: Record<GameType, number> = {} as Record<GameType, number>;

  let totalWPM = 0;
  let totalAccuracy = 0;
  let totalEntries = 0;

  for (const gameType of gameTypes) {
    const entries = await LeaderboardModel.find({
      playerId,
      gameType,
      period: 'all-time',
    })
      .sort({ score: -1 })
      .limit(1)
      .lean();

    if (entries.length > 0) {
      bestScores[gameType] = entries[0].score;
      totalWPM += entries[0].metrics.wpm;
      totalAccuracy += entries[0].metrics.accuracy;
      totalEntries++;
    } else {
      bestScores[gameType] = 0;
    }

    // Count games per type
    const gameCount = await LeaderboardModel.countDocuments({
      playerId,
      gameType,
      period: 'all-time',
    });
    gamesPerType[gameType] = gameCount;
  }

  const bestScore = Math.max(...Object.values(bestScores));
  const avgWPM = totalEntries > 0 ? Math.round(totalWPM / totalEntries) : 0;
  const avgAccuracy = totalEntries > 0 ? Math.round(totalAccuracy / totalEntries) : 0;

  return {
    totalGames: user.gameStats?.totalGamesPlayed || 0,
    totalWins: user.gameStats?.totalWins || 0,
    bestScore,
    avgWPM,
    avgAccuracy,
    favoriteGame: user.gameStats?.favoriteGame as GameType | undefined,
    gamesPerType,
    skillRatings: user.gameStats?.skillRating || {
      'falling-blocks': 0,
      'blink': 0,
      'typing-walk': 0,
      'falling-words': 0,
      'speed-race': 0,
    },
  };
}

/**
 * Get all rankings for a player across all games and periods
 */
export async function getPlayerAllRankings(playerId: string): Promise<{
  gameType: GameType;
  period: LeaderboardPeriod;
  ranking: PlayerRanking | null;
}[]> {
  await connectDB();

  const gameTypes: GameType[] = ['falling-blocks', 'blink', 'falling-words', 'speed-race'];
  const periods: LeaderboardPeriod[] = ['all-time', 'daily', 'weekly', 'monthly'];
  const rankings = [];

  for (const gameType of gameTypes) {
    for (const period of periods) {
      const ranking = await getPlayerRank(playerId, gameType, period);
      rankings.push({ gameType, period, ranking });
    }
  }

  return rankings;
}

/**
 * Update user statistics after a game
 */
async function updateUserStats(
  userId: string,
  gameType: GameType,
  score: number,
  wpm: number
): Promise<void> {
  await connectDB();

  // Increment total games played
  await UserModel.findByIdAndUpdate(userId, {
    $inc: {
      'gameStats.totalGamesPlayed': 1,
      [`gameStats.skillRating.${gameType}`]: Math.round((wpm * 0.7 + score * 0.3) / 10),
    },
  });

  // Update favorite game (game with most plays)
  const user = await UserModel.findById(userId).lean();
  if (user) {
    const allEntries = await LeaderboardModel.aggregate([
      { $match: { playerId: userId, period: 'all-time' } },
      { $group: { _id: '$gameType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    if (allEntries.length > 0) {
      await UserModel.findByIdAndUpdate(userId, {
        $set: { 'gameStats.favoriteGame': allEntries[0]._id },
      });
    }
  }
}

/**
 * Update win count for a player
 */
export async function updateWinCount(userId: string): Promise<void> {
  await connectDB();

  await UserModel.findByIdAndUpdate(userId, {
    $inc: { 'gameStats.totalWins': 1 },
  });
}

/**
 * Clean expired leaderboard periods
 */
export async function cleanExpiredPeriods(): Promise<number> {
  await connectDB();
  return await LeaderboardModel.cleanExpiredPeriods();
}

/**
 * Get leaderboard around a specific player (contextual leaderboard)
 */
export async function getLeaderboardAroundPlayer(
  playerId: string,
  gameType: GameType,
  period: LeaderboardPeriod = 'all-time',
  range: number = 5
): Promise<LeaderboardEntry[]> {
  await connectDB();

  const playerRank = await getPlayerRank(playerId, gameType, period);
  if (!playerRank) {
    return [];
  }

  const startRank = Math.max(1, playerRank.rank - range);
  const endRank = playerRank.rank + range;

  const entries = await LeaderboardModel.find({
    gameType,
    period,
    rank: { $gte: startRank, $lte: endRank },
  })
    .sort({ rank: 1 })
    .lean();

  return entries.map(entry => ({
    ...entry,
    _id: entry._id.toString(),
  })) as LeaderboardEntry[];
}
