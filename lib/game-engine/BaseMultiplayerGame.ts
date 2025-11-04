// Base abstract class for multiplayer games

import { GameType } from '@/types/multiplayer';
import { 
  GameState, 
  SerializedGameState, 
  GameSettings, 
  GameSessionResults,
  GameResult,
  serializeGameState 
} from './GameState';
import { 
  PlayerState, 
  PlayerInput, 
  InputResult, 
  GameEvent,
  createInitialPlayerState,
  updateTypingMetrics,
  PlayerKeystroke 
} from './PlayerState';
import { RNGGenerator } from './RNGGenerator';

/**
 * Player info for game initialization
 */
export interface PlayerInfo {
  playerId: string;
  displayName: string;
}

/**
 * Abstract base class for all multiplayer games
 * Provides common functionality and enforces implementation of game-specific logic
 */
export abstract class BaseMultiplayerGame {
  protected roomId: string;
  protected gameType: GameType;
  protected gameState: GameState;
  protected rng: RNGGenerator;
  protected settings: GameSettings;
  protected updateInterval?: NodeJS.Timeout;
  
  constructor(params: {
    roomId: string;
    gameType: GameType;
    players: PlayerInfo[];
    seed: number;
    settings?: GameSettings;
  }) {
    this.roomId = params.roomId;
    this.gameType = params.gameType;
    this.settings = params.settings || {};
    this.rng = new RNGGenerator(params.seed);
    
    // Initialize base game state
    this.gameState = {
      roomId: params.roomId,
      gameType: params.gameType,
      status: 'waiting',
      startTime: 0,
      currentTime: Date.now(),
      elapsedTime: 0,
      seed: params.seed,
      players: new Map(),
      gameSpecificState: {},
    };
    
    // Initialize players
    this.initPlayers(params.players);
    
    // Initialize game-specific state
    this.initGame();
  }
  
  /**
   * Initialize player states
   */
  protected initPlayers(players: PlayerInfo[]): void {
    for (const player of players) {
      const playerState = createInitialPlayerState(player);
      this.gameState.players.set(player.playerId, playerState);
    }
  }
  
  /**
   * Initialize game-specific state
   * Must be implemented by each game
   */
  protected abstract initGame(): void;
  
  /**
   * Handle player input
   * Must be implemented by each game
   */
  abstract handlePlayerInput(playerId: string, input: PlayerInput): InputResult;
  
  /**
   * Update game state (called periodically)
   * Must be implemented by each game
   */
  abstract updateGameState(deltaTime: number): void;
  
  /**
   * Check if game is over and return winner
   * Must be implemented by each game
   */
  abstract checkWinCondition(): string | null;
  
  /**
   * Serialize current game state for network transmission
   */
  abstract serialize(): SerializedGameState;
  
  /**
   * Get current game state
   */
  getGameState(): GameState {
    return this.gameState;
  }
  
  /**
   * Get player state
   */
  getPlayerState(playerId: string): PlayerState | undefined {
    return this.gameState.players.get(playerId);
  }
  
  /**
   * Get all player states
   */
  getAllPlayerStates(): PlayerState[] {
    return Array.from(this.gameState.players.values());
  }
  
  /**
   * Update player state
   */
  protected updatePlayerState(playerId: string, updates: Partial<PlayerState>): void {
    const currentState = this.gameState.players.get(playerId);
    if (currentState) {
      this.gameState.players.set(playerId, { ...currentState, ...updates });
    }
  }
  
  /**
   * Start the game with countdown
   */
  start(): void {
    this.gameState.status = 'countdown';
    this.gameState.startTime = Date.now() + 3000; // 3 second countdown

    // Start countdown
    setTimeout(() => {
      this.startImmediate();
    }, 3000);
  }

  /**
   * Start the game immediately without countdown
   */
  startImmediate(): void {
    this.gameState.status = 'playing';
    this.gameState.startTime = Date.now();
    this.onGameStart();

    // Start update loop (60 FPS)
    this.updateInterval = setInterval(() => {
      this.tick();
    }, 1000 / 60);
  }
  
  /**
   * Called when game actually starts (after countdown)
   */
  protected onGameStart(): void {
    // Override if needed
  }

  /**
   * Stop the game and clear update loop
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
    this.gameState.status = 'finished';
    this.gameState.endTime = Date.now();
  }
  
  /**
   * Game tick (called 60 times per second)
   */
  protected tick(): void {
    const now = Date.now();
    const deltaTime = now - this.gameState.currentTime;
    
    this.gameState.currentTime = now;
    this.gameState.elapsedTime = now - this.gameState.startTime;
    
    // Update game state
    this.updateGameState(deltaTime);
    
    // Check for time limit
    if (this.settings.timeLimit && this.settings.timeLimit > 0) {
      const timeLimitMs = this.settings.timeLimit * 1000;
      if (this.gameState.elapsedTime >= timeLimitMs) {
        this.endGame('time_limit');
      }
    }
    
    // Check win condition
    const winner = this.checkWinCondition();
    if (winner) {
      this.endGame('win', winner);
    }
  }
  
  /**
   * End the game
   */
  protected endGame(reason: 'win' | 'time_limit' | 'all_disconnected', winner?: string): void {
    if (this.gameState.status === 'finished') return;
    
    this.gameState.status = 'finished';
    this.gameState.endTime = Date.now();
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
    
    this.onGameEnd(reason, winner);
  }
  
  /**
   * Called when game ends
   */
  protected onGameEnd(reason: string, winner?: string): void {
    // Override if needed
  }
  
  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.gameState.status === 'finished';
  }
  
  /**
   * Get winner (if game is over)
   */
  getWinner(): string | null {
    if (!this.isGameOver()) return null;
    
    // Find player with highest score
    let maxScore = -1;
    let winner: string | null = null;
    
    for (const [playerId, state] of this.gameState.players) {
      if (state.score > maxScore) {
        maxScore = state.score;
        winner = playerId;
      }
    }
    
    return winner;
  }
  
  /**
   * Get game results
   */
  getResults(): GameSessionResults {
    const results: GameResult[] = [];
    
    // Sort players by score
    const sortedPlayers = Array.from(this.gameState.players.values())
      .sort((a, b) => b.score - a.score);
    
    // Create results for each player
    sortedPlayers.forEach((player, index) => {
      results.push({
        playerId: player.playerId,
        rank: index + 1,
        score: player.score,
        metrics: {
          grossWPM: player.currentWPM,
          netWPM: player.currentWPM,
          accuracy: player.accuracy,
          keystrokeCount: player.keystrokeCount,
          correctKeystrokes: player.correctKeystrokes,
          errorCount: player.errorCount,
          totalTime: this.gameState.elapsedTime,
        },
        gameSpecificData: player.gameSpecificData,
        completedAt: player.finishedAt,
        disconnectedAt: player.isConnected ? undefined : Date.now(),
      });
    });
    
    return {
      sessionId: this.gameState.sessionId || '',
      roomId: this.roomId,
      gameType: this.gameType,
      startTime: this.gameState.startTime,
      endTime: this.gameState.endTime || Date.now(),
      duration: this.gameState.elapsedTime,
      results,
      winner: this.getWinner() || '',
      settings: this.settings,
    };
  }
  
  /**
   * Handle keystroke (common for all typing games)
   */
  protected handleKeystroke(playerId: string, keystroke: PlayerKeystroke): InputResult {
    const playerState = this.getPlayerState(playerId);
    if (!playerState) {
      return { success: false, error: 'Player not found' };
    }
    
    if (playerState.isFinished) {
      return { success: false, error: 'Player already finished' };
    }
    
    // Update typing metrics
    const newState = updateTypingMetrics(
      playerState,
      keystroke,
      this.gameState.elapsedTime
    );
    
    this.gameState.players.set(playerId, newState);
    
    return {
      success: true,
      newState: newState,
    };
  }
  
  /**
   * Mark player as finished
   */
  protected finishPlayer(playerId: string): void {
    const playerState = this.getPlayerState(playerId);
    if (playerState && !playerState.isFinished) {
      this.updatePlayerState(playerId, {
        isFinished: true,
        finishedAt: Date.now(),
      });
    }
  }
  
  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }
}
