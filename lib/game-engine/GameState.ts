// Core game state types for multiplayer games

import { GameType } from '@/types/multiplayer';

/**
 * Game status enum
 */
export type GameStatus = 'waiting' | 'countdown' | 'playing' | 'paused' | 'finished';

/**
 * Base game state interface
 * All multiplayer games must extend this
 */
export interface GameState {
  // Identity
  roomId: string;
  gameType: GameType;
  sessionId?: string;
  
  // Status
  status: GameStatus;
  
  // Timing
  startTime: number;         // Unix timestamp when game started
  currentTime: number;       // Current server time
  elapsedTime: number;       // Milliseconds since start
  endTime?: number;          // Unix timestamp when game ended
  
  // Seed for deterministic randomness
  seed: number;
  
  // Players
  players: Map<string, PlayerState>;
  
  // Game-specific state (extended by each game)
  gameSpecificState: any;
}

/**
 * Serialized version of GameState for network transmission
 */
export interface SerializedGameState {
  roomId: string;
  gameType: GameType;
  sessionId?: string;
  status: GameStatus;
  startTime: number;
  currentTime: number;
  elapsedTime: number;
  endTime?: number;
  seed: number;
  players: Record<string, PlayerState>; // Map converted to object
  gameSpecificState: any;
}

/**
 * Convert GameState to serializable format
 */
export function serializeGameState(state: GameState): SerializedGameState {
  return {
    ...state,
    players: Object.fromEntries(state.players),
  };
}

/**
 * Convert serialized state back to GameState
 */
export function deserializeGameState(data: SerializedGameState): GameState {
  return {
    ...data,
    players: new Map(Object.entries(data.players)),
  };
}

/**
 * Game settings that can be customized per room
 */
export interface GameSettings {
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  timeLimit?: number;        // Game duration in seconds (0 = unlimited)
  lessonId?: number;         // For character-restricted games
  seed?: number;             // Custom seed for reproducibility
  customRules?: Record<string, any>; // Game-specific custom rules
}

/**
 * Game result for a single player
 */
export interface GameResult {
  playerId: string;
  rank: number;              // 1 = winner, 2 = second place, etc.
  score: number;
  metrics: {
    grossWPM: number;
    netWPM: number;
    accuracy: number;
    keystrokeCount: number;
    correctKeystrokes: number;
    errorCount: number;
    totalTime: number;       // Milliseconds
  };
  gameSpecificData?: any;    // Game-specific completion data
  completedAt?: number;      // Unix timestamp
  disconnectedAt?: number;   // Unix timestamp if player disconnected
}

/**
 * Complete game session results
 */
export interface GameSessionResults {
  sessionId: string;
  roomId: string;
  gameType: GameType;
  startTime: number;
  endTime: number;
  duration: number;          // Milliseconds
  results: GameResult[];
  winner: string;            // playerId of winner
  settings: GameSettings;
}
