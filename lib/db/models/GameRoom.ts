// GameRoom model for multiplayer game rooms

import mongoose, { Schema, Model } from 'mongoose';
import type { GameRoom as IGameRoom, PlayerInRoom } from '@/types/multiplayer';

interface GameRoomDocument extends mongoose.Document {
  roomId: string;
  gameType: 'falling-blocks' | 'blink' | 'typing-walk' | 'falling-words';
  roomName: string;
  password?: string;
  maxPlayers: number;
  players: PlayerInRoom[];
  spectators: string[];
  status: 'waiting' | 'playing' | 'finished';
  settings: {
    lessonId?: number;
    difficulty?: string;
    timeLimit?: number;
    seed?: number;
  };
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

const PlayerInRoomSchema = new Schema<PlayerInRoom>({
  playerId: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  isHost: {
    type: Boolean,
    default: false,
  },
  isReady: {
    type: Boolean,
    default: false,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  isConnected: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

const GameRoomSchema = new Schema<GameRoomDocument>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    gameType: {
      type: String,
      required: true,
      enum: ['falling-blocks', 'blink', 'typing-walk', 'falling-words'],
    },
    roomName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    password: {
      type: String,
      select: false, // Don't include password in queries by default
    },
    maxPlayers: {
      type: Number,
      required: true,
      min: 2,
      max: 8,
      default: 4,
    },
    players: {
      type: [PlayerInRoomSchema],
      default: [],
      validate: {
        validator: function(this: GameRoomDocument, players: PlayerInRoom[]) {
          return players.length <= this.maxPlayers;
        },
        message: 'Too many players in room',
      },
    },
    spectators: {
      type: [String],
      default: [],
      validate: {
        validator: function(spectators: string[]) {
          return spectators.length <= 20;
        },
        message: 'Too many spectators (max 20)',
      },
    },
    status: {
      type: String,
      enum: ['waiting', 'playing', 'finished'],
      default: 'waiting',
    },
    settings: {
      lessonId: {
        type: Number,
        min: 1,
        max: 15,
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
      },
      timeLimit: {
        type: Number,
        min: 60,
        max: 600,
      },
      seed: {
        type: Number,
      },
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: roomId already has unique index from schema definition
GameRoomSchema.index({ gameType: 1, status: 1 });
GameRoomSchema.index({ status: 1, createdAt: -1 });
GameRoomSchema.index({ 'players.playerId': 1 });

// Methods
GameRoomSchema.methods.addPlayer = function(player: PlayerInRoom) {
  if (this.players.length >= this.maxPlayers) {
    throw new Error('Room is full');
  }
  this.players.push(player);
  return this.save();
};

GameRoomSchema.methods.removePlayer = function(playerId: string) {
  this.players = this.players.filter((p: PlayerInRoom) => p.playerId !== playerId);

  // If no players left, mark room as finished
  if (this.players.length === 0) {
    this.status = 'finished';
    this.endedAt = new Date();
  }

  return this.save();
};

GameRoomSchema.methods.setPlayerReady = function(playerId: string, isReady: boolean) {
  const player = this.players.find((p: PlayerInRoom) => p.playerId === playerId);
  if (player) {
    player.isReady = isReady;
    return this.save();
  }
  throw new Error('Player not found in room');
};

GameRoomSchema.methods.areAllPlayersReady = function(): boolean {
  return this.players.length >= 2 && this.players.every((p: PlayerInRoom) => p.isReady);
};

GameRoomSchema.methods.getHost = function(): PlayerInRoom | undefined {
  return this.players.find((p: PlayerInRoom) => p.isHost);
};

// Statics
GameRoomSchema.statics.findActiveRooms = function(gameType?: string) {
  const query: any = { status: 'waiting' };
  if (gameType) {
    query.gameType = gameType;
  }
  return this.find(query).sort({ createdAt: -1 });
};

GameRoomSchema.statics.findByPlayerId = function(playerId: string) {
  return this.findOne({
    'players.playerId': playerId,
    status: { $in: ['waiting', 'playing'] },
  });
};

// Create or retrieve the model
const GameRoomModel: Model<GameRoomDocument> =
  mongoose.models.GameRoom || mongoose.model<GameRoomDocument>('GameRoom', GameRoomSchema);

export default GameRoomModel;
export type { GameRoomDocument };
