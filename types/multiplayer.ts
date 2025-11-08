// Multiplayer game types

export type GameType = 'falling-blocks' | 'blink' | 'typing-walk' | 'speed-race' | 'falling-words';
export type RoomStatus = 'waiting' | 'playing' | 'finished';
export type PlayerType = 'user' | 'guest';
export type LeaderboardPeriod = 'all-time' | 'daily' | 'weekly' | 'monthly';

// Player in a room
export interface PlayerInRoom {
  playerId: string;           // userId or deviceId
  displayName: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: Date;
  isConnected: boolean;
}

// Game Room
export interface GameRoom {
  roomId: string;
  gameType: GameType;
  roomName: string;
  password?: string;
  maxPlayers: number;
  players: PlayerInRoom[];
  spectators: string[];
  status: RoomStatus;
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

// Player State in Game
export interface PlayerState {
  playerId: string;
  displayName: string;
  isConnected: boolean;
  isFinished: boolean;

  // Common metrics
  score: number;
  level: number;
  lives?: number;

  // Typing metrics
  keystrokeCount: number;
  correctKeystrokes: number;
  errorCount: number;
  currentWPM: number;
  accuracy: number;

  // Game-specific data
  gameSpecificData?: any;
}

// Game State
export interface GameState {
  roomId: string;
  gameType: GameType;
  status: 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';
  startTime: number;
  currentTime: number;
  elapsedTime: number;
  seed: number;

  // Players state
  players: Map<string, PlayerState>;

  // Game-specific state
  gameSpecificState?: any;
}

// Game Input
export interface GameInput {
  playerId: string;
  timestamp: number;
  type: 'keypress' | 'action';
  key?: string;
  action?: string;
  data?: any;
}

// Game Session Record
export interface GameSessionPlayer {
  playerId: string;
  displayName: string;
  score: number;
  rank: number;
  metrics: {
    grossWPM: number;
    netWPM: number;
    accuracy: number;
    keystrokeCount: number;
    errorCount: number;
  };
  gameSpecificData?: any;
  completedAt?: Date;
  disconnectedAt?: Date;
}

export interface GameSession {
  sessionId: string;
  roomId: string;
  gameType: GameType;
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

// Leaderboard Entry
export interface LeaderboardEntry {
  _id?: string;
  gameType: GameType;
  period: LeaderboardPeriod;
  playerId: string;
  playerType: PlayerType;
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

// Device Identity for guest players
export interface DeviceIdentity {
  deviceId: string;
  displayName: string;
  createdAt: Date;
  lastUsedAt: Date;
}

// Skill Rating
export interface SkillRating {
  playerId: string;
  gameType: GameType;
  rating: number;
  tier: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  gamesPlayed: number;
  lastUpdated: Date;
}

// Match Queue Entry
export interface MatchQueueEntry {
  playerId: string;
  displayName: string;
  gameType: GameType;
  skillTier: string;
  joinedAt: number;
}

// Friend Request
export interface FriendRequest {
  from: string;
  to: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

// Chat Message
export interface ChatMessage {
  id: string;
  type: 'lobby' | 'room';
  roomId?: string;
  playerId: string;
  displayName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean; // System messages (join/leave notifications)
}
