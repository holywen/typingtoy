// GameSession model for storing completed multiplayer game results

import mongoose, { Schema, Model } from 'mongoose';
import type { GameSession as IGameSession, GameSessionPlayer } from '@/types/multiplayer';

interface GameSessionDocument extends mongoose.Document {
  sessionId: string;
  roomId: string;
  gameType: 'falling-blocks' | 'blink' | 'typing-walk' | 'falling-words';
  players: GameSessionPlayer[];
  winner?: string;
  gameData: {
    seed: number;
    duration: number;
    avgWPM: number;
    totalKeystrokes: number;
  };
  startedAt: Date;
  endedAt: Date;
}

const GameSessionPlayerSchema = new Schema<GameSessionPlayer>({
  playerId: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  rank: {
    type: Number,
    required: true,
    min: 1,
  },
  metrics: {
    grossWPM: {
      type: Number,
      default: 0,
    },
    netWPM: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    keystrokeCount: {
      type: Number,
      default: 0,
    },
    errorCount: {
      type: Number,
      default: 0,
    },
  },
  gameSpecificData: {
    type: Schema.Types.Mixed,
  },
  completedAt: {
    type: Date,
  },
  disconnectedAt: {
    type: Date,
  },
}, { _id: false });

const GameSessionSchema = new Schema<GameSessionDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    roomId: {
      type: String,
      required: true,
    },
    gameType: {
      type: String,
      required: true,
      enum: ['falling-blocks', 'blink', 'typing-walk', 'falling-words'],
    },
    players: {
      type: [GameSessionPlayerSchema],
      required: true,
      validate: {
        validator: function(players: GameSessionPlayer[]) {
          return players.length >= 1 && players.length <= 8;
        },
        message: 'Invalid number of players (1-8)',
      },
    },
    winner: {
      type: String,
    },
    gameData: {
      seed: {
        type: Number,
        required: true,
      },
      duration: {
        type: Number,
        required: true,
        min: 0,
      },
      avgWPM: {
        type: Number,
        default: 0,
      },
      totalKeystrokes: {
        type: Number,
        default: 0,
      },
    },
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: sessionId already has unique index from schema definition
// Note: roomId index is needed for queries
GameSessionSchema.index({ roomId: 1 });
GameSessionSchema.index({ gameType: 1, endedAt: -1 });
GameSessionSchema.index({ 'players.playerId': 1, gameType: 1 });
GameSessionSchema.index({ winner: 1 });
GameSessionSchema.index({ endedAt: -1 });

// Statics
GameSessionSchema.statics.findByPlayerId = function(playerId: string, gameType?: string, limit: number = 10) {
  const query: any = { 'players.playerId': playerId };
  if (gameType) {
    query.gameType = gameType;
  }
  return this.find(query)
    .sort({ endedAt: -1 })
    .limit(limit);
};

GameSessionSchema.statics.getPlayerStats = async function(playerId: string, gameType: string) {
  const sessions = await this.find({
    'players.playerId': playerId,
    gameType,
  });

  if (sessions.length === 0) {
    return null;
  }

  let totalGames = sessions.length;
  let totalWins = 0;
  let totalScore = 0;
  let totalWPM = 0;
  let totalAccuracy = 0;

  sessions.forEach((session: GameSessionDocument) => {
    const playerData = session.players.find((p: GameSessionPlayer) => p.playerId === playerId);
    if (playerData) {
      if (playerData.rank === 1) totalWins++;
      totalScore += playerData.score;
      totalWPM += playerData.metrics.netWPM;
      totalAccuracy += playerData.metrics.accuracy;
    }
  });

  return {
    totalGames,
    totalWins,
    winRate: (totalWins / totalGames) * 100,
    avgScore: totalScore / totalGames,
    avgWPM: totalWPM / totalGames,
    avgAccuracy: totalAccuracy / totalGames,
  };
};

GameSessionSchema.statics.getRecentSessions = function(gameType?: string, limit: number = 20) {
  const query: any = {};
  if (gameType) {
    query.gameType = gameType;
  }
  return this.find(query)
    .sort({ endedAt: -1 })
    .limit(limit);
};

// Methods
GameSessionSchema.methods.getPlayerResult = function(playerId: string): GameSessionPlayer | undefined {
  return this.players.find((p: GameSessionPlayer) => p.playerId === playerId);
};

GameSessionSchema.methods.getWinner = function(): GameSessionPlayer | undefined {
  return this.players.find((p: GameSessionPlayer) => p.rank === 1);
};

GameSessionSchema.methods.getDuration = function(): number {
  return Math.floor((this.endedAt.getTime() - this.startedAt.getTime()) / 1000);
};

// Create or retrieve the model
const GameSessionModel: Model<GameSessionDocument> =
  mongoose.models.GameSession || mongoose.model<GameSessionDocument>('GameSession', GameSessionSchema);

export default GameSessionModel;
export type { GameSessionDocument };
