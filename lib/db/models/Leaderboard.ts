// Leaderboard model for game rankings

import mongoose, { Schema, Model } from 'mongoose';
import type { LeaderboardEntry } from '@/types/multiplayer';

interface LeaderboardDocument extends mongoose.Document {
  gameType: 'falling-blocks' | 'blink' | 'typing-walk' | 'falling-words';
  period: 'all-time' | 'daily' | 'weekly' | 'monthly';
  playerId: string;
  playerType: 'user' | 'guest';
  displayName: string;
  score: number;
  metrics: {
    wpm: number;
    accuracy: number;
    level?: number;
    time?: number;
  };
  sessionId: string;
  achievedAt: Date;
  periodStart: Date;
  periodEnd?: Date;
  rank?: number;
  friendIds?: string[];
}

// Model interface with static methods
interface LeaderboardModel extends Model<LeaderboardDocument> {
  getTopPlayers(gameType: string, period: string, limit?: number): Promise<LeaderboardDocument[]>;
  getPlayerRank(playerId: string, gameType: string, period: string): Promise<{ rank: number; total: number; entry: LeaderboardDocument | null }>;
  getFriendsLeaderboard(playerId: string, friendIds: string[], gameType: string, period: string): Promise<LeaderboardDocument[]>;
  submitScore(entry: Partial<LeaderboardEntry>): Promise<LeaderboardDocument>;
  cleanExpiredPeriods(): Promise<number>;
  updateRanks(gameType: string, period: string): Promise<void>;
}

const LeaderboardSchema = new Schema<LeaderboardDocument>(
  {
    gameType: {
      type: String,
      required: true,
      enum: ['falling-blocks', 'blink', 'typing-walk', 'falling-words'],
    },
    period: {
      type: String,
      required: true,
      enum: ['all-time', 'daily', 'weekly', 'monthly'],
    },
    playerId: {
      type: String,
      required: true,
    },
    playerType: {
      type: String,
      required: true,
      enum: ['user', 'guest'],
      default: 'guest',
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    metrics: {
      wpm: {
        type: Number,
        required: true,
        min: 0,
      },
      accuracy: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      level: {
        type: Number,
        min: 1,
      },
      time: {
        type: Number,
        min: 0,
      },
    },
    sessionId: {
      type: String,
      required: true,
      ref: 'GameSession',
    },
    achievedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
    },
    rank: {
      type: Number,
      min: 1,
    },
    friendIds: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
LeaderboardSchema.index({ gameType: 1, period: 1, score: -1 });
LeaderboardSchema.index({ gameType: 1, period: 1, achievedAt: -1 });
LeaderboardSchema.index({ playerId: 1, gameType: 1, period: 1 });
LeaderboardSchema.index({ periodStart: 1, periodEnd: 1 });
LeaderboardSchema.index({ friendIds: 1, gameType: 1, period: 1 });

// Statics
LeaderboardSchema.statics.getTopPlayers = function(
  gameType: string,
  period: string,
  limit: number = 100
) {
  const now = new Date();
  const query: any = {
    gameType,
    period,
  };

  // Filter by current period
  if (period !== 'all-time') {
    query.periodStart = { $lte: now };
    query.$or = [
      { periodEnd: { $exists: false } },
      { periodEnd: { $gte: now } },
    ];
  }

  return this.find(query)
    .sort({ score: -1, achievedAt: 1 })
    .limit(limit)
    .lean();
};

LeaderboardSchema.statics.getPlayerRank = async function(
  playerId: string,
  gameType: string,
  period: string
) {
  const playerEntry = await this.findOne({
    playerId,
    gameType,
    period,
  }).sort({ score: -1 });

  if (!playerEntry) {
    return null;
  }

  const rank = await this.countDocuments({
    gameType,
    period,
    score: { $gt: playerEntry.score },
  });

  return {
    rank: rank + 1,
    entry: playerEntry,
  };
};

LeaderboardSchema.statics.getFriendsLeaderboard = async function(
  playerId: string,
  friendIds: string[],
  gameType: string,
  period: string = 'all-time'
) {
  const allPlayerIds = [playerId, ...friendIds];

  const entries = await this.aggregate([
    {
      $match: {
        playerId: { $in: allPlayerIds },
        gameType,
        period,
      },
    },
    {
      $sort: { playerId: 1, score: -1 },
    },
    {
      $group: {
        _id: '$playerId',
        bestEntry: { $first: '$$ROOT' },
      },
    },
    {
      $replaceRoot: { newRoot: '$bestEntry' },
    },
    {
      $sort: { score: -1 },
    },
  ]);

  return entries;
};

LeaderboardSchema.statics.submitScore = async function(entry: Partial<LeaderboardEntry>) {
  const { playerId, gameType, period, score } = entry;

  // Check if this is player's best score for this period
  const existingBest = await this.findOne({
    playerId,
    gameType,
    period,
  }).sort({ score: -1 });

  if (!existingBest || typeof existingBest.score === 'undefined' || (score && score > existingBest.score)) {
    // Create new entry
    return this.create(entry);
  }

  return existingBest;
};

LeaderboardSchema.statics.cleanExpiredPeriods = async function() {
  const now = new Date();

  // Remove entries from expired periods
  const result = await this.deleteMany({
    period: { $ne: 'all-time' },
    periodEnd: { $lt: now },
  });

  return result.deletedCount;
};

LeaderboardSchema.statics.updateRanks = async function(gameType: string, period: string) {
  const entries = await this.find({ gameType, period })
    .sort({ score: -1, achievedAt: 1 })
    .lean();

  const updates = entries.map((entry: any, index: number) => ({
    updateOne: {
      filter: { _id: entry._id },
      update: { $set: { rank: index + 1 } },
    },
  }));

  if (updates.length > 0) {
    await this.bulkWrite(updates);
  }

  return updates.length;
};

// Methods
LeaderboardSchema.methods.isCurrentPeriod = function(): boolean {
  const now = new Date();
  if (this.period === 'all-time') return true;
  if (!this.periodEnd) return true;
  return now >= this.periodStart && now <= this.periodEnd;
};

// Utility function to calculate period boundaries
export function getPeriodBoundaries(period: 'daily' | 'weekly' | 'monthly' | 'all-time'): {
  start: Date;
  end: Date | null;
} {
  const now = new Date();
  const start = new Date(now);
  let end: Date | null = null;

  switch (period) {
    case 'daily':
      start.setUTCHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      break;

    case 'weekly':
      start.setUTCHours(0, 0, 0, 0);
      const day = start.getUTCDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1)); // Monday
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      break;

    case 'monthly':
      start.setUTCHours(0, 0, 0, 0);
      start.setDate(1);
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      break;

    case 'all-time':
      start.setFullYear(2020, 0, 1);
      end = null;
      break;
  }

  return { start, end };
}

// Create or retrieve the model with typed static methods
const LeaderboardModelInstance: LeaderboardModel =
  (mongoose.models.Leaderboard as LeaderboardModel) ||
  mongoose.model<LeaderboardDocument, LeaderboardModel>('Leaderboard', LeaderboardSchema);

export default LeaderboardModelInstance;
export type { LeaderboardDocument, LeaderboardModel };
