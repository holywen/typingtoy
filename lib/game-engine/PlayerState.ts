// Player state types for multiplayer games

/**
 * Base player state interface
 * Tracks individual player progress in a multiplayer game
 */
export interface PlayerState {
  // Identity
  playerId: string;
  displayName: string;
  
  // Connection status
  isConnected: boolean;
  lastActiveTime: number;    // Unix timestamp of last input
  
  // Game progress
  isFinished: boolean;
  finishedAt?: number;       // Unix timestamp when player finished
  
  // Common metrics (applicable to all typing games)
  score: number;
  level: number;
  lives?: number;
  
  // Typing metrics
  keystrokeCount: number;
  correctKeystrokes: number;
  errorCount: number;
  currentWPM: number;
  accuracy: number;
  
  // Real-time position (for games like Typing Walk)
  position?: {
    x: number;
    y: number;
  };
  
  // Game-specific data (extended by each game)
  gameSpecificData: any;
}

/**
 * Keystroke event from a player
 */
export interface PlayerKeystroke {
  playerId: string;
  key: string;
  timestamp: number;
  isCorrect: boolean;
  position?: number;         // Position in target text/sequence
}

/**
 * Player input event (generic)
 */
export interface PlayerInput {
  playerId: string;
  inputType: 'keystroke' | 'action' | 'movement';
  timestamp: number;
  data: any;                 // Input-specific data
}

/**
 * Result of processing a player input
 */
export interface InputResult {
  success: boolean;
  newState?: Partial<PlayerState>;
  events?: GameEvent[];
  error?: string;
  wordCompleted?: boolean;
  feedback?: {
    message: string;
  };
}

/**
 * Game events that can be broadcast to players
 */
export type GameEventType = 
  | 'player_scored'
  | 'player_died'
  | 'player_finished'
  | 'player_disconnected'
  | 'player_reconnected'
  | 'level_up'
  | 'game_over'
  | 'milestone_reached';

export interface GameEvent {
  type: GameEventType;
  playerId?: string;
  timestamp: number;
  data: any;
}

/**
 * Create initial player state
 */
export function createInitialPlayerState(params: {
  playerId: string;
  displayName: string;
}): PlayerState {
  return {
    playerId: params.playerId,
    displayName: params.displayName,
    isConnected: true,
    lastActiveTime: Date.now(),
    isFinished: false,
    score: 0,
    level: 1,
    keystrokeCount: 0,
    correctKeystrokes: 0,
    errorCount: 0,
    currentWPM: 0,
    accuracy: 100,
    gameSpecificData: {},
  };
}

/**
 * Update player typing metrics
 */
export function updateTypingMetrics(
  state: PlayerState,
  keystroke: PlayerKeystroke,
  elapsedTimeMs: number
): PlayerState {
  const newState = { ...state };
  
  newState.keystrokeCount++;
  if (keystroke.isCorrect) {
    newState.correctKeystrokes++;
  } else {
    newState.errorCount++;
  }
  
  // Calculate accuracy
  newState.accuracy = newState.keystrokeCount > 0
    ? (newState.correctKeystrokes / newState.keystrokeCount) * 100
    : 100;
  
  // Calculate WPM (assuming 5 characters per word)
  const elapsedMinutes = elapsedTimeMs / 60000;
  if (elapsedMinutes > 0) {
    const grossWPM = (newState.keystrokeCount / 5) / elapsedMinutes;
    const netWPM = grossWPM - (newState.errorCount / elapsedMinutes);
    newState.currentWPM = Math.max(0, Math.round(netWPM));
  }
  
  newState.lastActiveTime = keystroke.timestamp;
  
  return newState;
}

/**
 * Check if player has been inactive for too long
 */
export function isPlayerInactive(state: PlayerState, timeoutMs: number = 30000): boolean {
  return Date.now() - state.lastActiveTime > timeoutMs;
}

/**
 * Mark player as disconnected
 */
export function markPlayerDisconnected(state: PlayerState): PlayerState {
  return {
    ...state,
    isConnected: false,
  };
}

/**
 * Mark player as reconnected
 */
export function markPlayerReconnected(state: PlayerState): PlayerState {
  return {
    ...state,
    isConnected: true,
    lastActiveTime: Date.now(),
  };
}
