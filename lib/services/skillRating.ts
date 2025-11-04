// Skill rating calculation service

import GameSessionModel from '@/lib/db/models/GameSession';
import UserModel from '@/lib/db/models/User';
import connectDB from '@/lib/db/mongodb';
import { GameType } from '@/types/multiplayer';

export type SkillTier = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface PlayerSkillRating {
  playerId: string;
  gameType: GameType;
  rating: number;
  tier: SkillTier;
  gamesPlayed: number;
  avgWPM: number;
  avgAccuracy: number;
  winRate: number;
}

export class SkillRatingService {
  /**
   * Calculate skill rating for a player
   * Rating = (avgWPM * 0.7) + (avgAccuracy * 0.3)
   */
  static async calculateSkillRating(
    playerId: string,
    gameType: GameType
  ): Promise<PlayerSkillRating | null> {
    await connectDB();
    // Get recent game sessions (last 10 games)
    const sessions = await GameSessionModel.find({
      'players.playerId': playerId,
      gameType,
    })
      .sort({ endedAt: -1 })
      .limit(10);

    if (sessions.length === 0) {
      // New player - default to beginner
      return {
        playerId,
        gameType,
        rating: 0,
        tier: 'beginner',
        gamesPlayed: 0,
        avgWPM: 0,
        avgAccuracy: 0,
        winRate: 0,
      };
    }

    let totalWPM = 0;
    let totalAccuracy = 0;
    let wins = 0;

    sessions.forEach((session) => {
      const playerData = session.players.find(p => p.playerId === playerId);
      if (playerData) {
        totalWPM += playerData.metrics.netWPM;
        totalAccuracy += playerData.metrics.accuracy;
        if (playerData.rank === 1) wins++;
      }
    });

    const avgWPM = totalWPM / sessions.length;
    const avgAccuracy = totalAccuracy / sessions.length;
    const winRate = (wins / sessions.length) * 100;

    // Calculate composite rating
    const rating = avgWPM * 0.7 + avgAccuracy * 0.3;

    // Determine tier
    const tier = this.getRatingTier(rating);

    return {
      playerId,
      gameType,
      rating,
      tier,
      gamesPlayed: sessions.length,
      avgWPM,
      avgAccuracy,
      winRate,
    };
  }

  /**
   * Get skill tier from rating
   */
  static getRatingTier(rating: number): SkillTier {
    if (rating < 30) return 'beginner';
    if (rating < 50) return 'intermediate';
    if (rating < 70) return 'advanced';
    return 'expert';
  }

  /**
   * Get tier from WPM (quick estimation)
   */
  static getTierFromWPM(wpm: number): SkillTier {
    if (wpm < 30) return 'beginner';
    if (wpm < 50) return 'intermediate';
    if (wpm < 70) return 'advanced';
    return 'expert';
  }

  /**
   * Update user's skill rating in database
   */
  static async updateUserSkillRating(
    userId: string,
    gameType: GameType,
    rating: number
  ): Promise<void> {
    await connectDB();
    await UserModel.findByIdAndUpdate(userId, {
      $set: {
        [`gameStats.skillRating.${gameType}`]: rating,
      },
    });
  }

  /**
   * Get skill rating range for matchmaking
   * Returns min and max rating for acceptable matches
   */
  static getMatchmakingRange(rating: number, waitTime: number): { min: number; max: number } {
    // Base range: ±10 points
    let range = 10;

    // Expand range based on wait time (every 10 seconds, expand by 5 points)
    const waitSeconds = Math.floor(waitTime / 1000);
    range += Math.floor(waitSeconds / 10) * 5;

    // Maximum range: ±30 points
    range = Math.min(range, 30);

    return {
      min: Math.max(0, rating - range),
      max: rating + range,
    };
  }

  /**
   * Check if two players are suitable for matching
   */
  static arePlayersCompatible(rating1: number, rating2: number, waitTime: number): boolean {
    const range = this.getMatchmakingRange(rating1, waitTime);
    return rating2 >= range.min && rating2 <= range.max;
  }

  /**
   * Get all players in a tier
   */
  static async getPlayersInTier(gameType: GameType, tier: SkillTier): Promise<string[]> {
    await connectDB();
    const users = await UserModel.find({
      [`gameStats.skillRating.${gameType}`]: {
        $gte: this.getTierMinRating(tier),
        $lt: this.getTierMaxRating(tier),
      },
    }).select('_id');

    return users.map(u => u._id.toString());
  }

  /**
   * Get minimum rating for a tier
   */
  static getTierMinRating(tier: SkillTier): number {
    switch (tier) {
      case 'beginner':
        return 0;
      case 'intermediate':
        return 30;
      case 'advanced':
        return 50;
      case 'expert':
        return 70;
    }
  }

  /**
   * Get maximum rating for a tier
   */
  static getTierMaxRating(tier: SkillTier): number {
    switch (tier) {
      case 'beginner':
        return 30;
      case 'intermediate':
        return 50;
      case 'advanced':
        return 70;
      case 'expert':
        return 1000;
    }
  }

  /**
   * Calculate rating change after a game
   * Uses simplified ELO-like system
   */
  static calculateRatingChange(params: {
    currentRating: number;
    opponentRating: number;
    won: boolean;
    rank: number;
    totalPlayers: number;
  }): number {
    const { currentRating, opponentRating, won, rank, totalPlayers } = params;

    // K-factor (max rating change per game)
    const K = 10;

    // Expected score based on rating difference
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));

    // Actual score based on rank
    const actualScore = (totalPlayers - rank) / (totalPlayers - 1);

    // Rating change
    const change = K * (actualScore - expectedScore);

    return Math.round(change);
  }

  /**
   * Update ratings after a multiplayer game
   */
  static async updateRatingsAfterGame(
    sessionId: string
  ): Promise<Map<string, number>> {
    await connectDB();
    const session = await GameSessionModel.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    const ratingChanges = new Map<string, number>();

    // Calculate average rating of all players
    const avgRating =
      session.players.reduce((sum, p) => sum + (p.metrics.netWPM * 0.7 + p.metrics.accuracy * 0.3), 0) /
      session.players.length;

    // Update each player's rating
    for (const player of session.players) {
      const currentRating = player.metrics.netWPM * 0.7 + player.metrics.accuracy * 0.3;

      const change = this.calculateRatingChange({
        currentRating,
        opponentRating: avgRating,
        won: player.rank === 1,
        rank: player.rank,
        totalPlayers: session.players.length,
      });

      const newRating = Math.max(0, currentRating + change);
      ratingChanges.set(player.playerId, newRating);

      // Update user's rating in database if they have an account
      if (!player.playerId.startsWith('device_')) {
        await this.updateUserSkillRating(player.playerId, session.gameType, newRating);
      }
    }

    return ratingChanges;
  }
}
