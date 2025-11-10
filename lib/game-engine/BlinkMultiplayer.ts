// Blink multiplayer game engine
// All players see the same character sequence and compete for fastest response

import { BaseMultiplayerGame, PlayerInfo } from './BaseMultiplayerGame';
import { PlayerInput, InputResult } from './PlayerState';
import { GameSettings, SerializedGameState, serializeGameState } from './GameState';
import { lessonsData } from '@/lib/data/lessons';

/**
 * Blink-specific game state
 */
export interface BlinkGameState {
  timeLimit: number;              // Time limit per character (ms)
  charSequence: string[];         // Pre-generated character sequence
  totalChars: number;             // Total characters in game
  charHistory: {                  // History of which player answered first for each char
    char: string;
    fastestPlayer: string | null;
    responseTime: number;
  }[];
}

/**
 * Blink-specific player data
 */
export interface BlinkPlayerData {
  streak: number;                 // Current consecutive correct answers
  bestStreak: number;             // Best streak in this game
  responseTime: number;           // Most recent response time (ms)
  avgResponseTime: number;        // Average response time
  totalResponseTime: number;      // Sum of all response times (for average calculation)
  correctAnswers: number;         // Total correct answers
  timeouts: number;               // Number of timed-out characters
  firstAnswers: number;           // Number of times answered first
  currentCharIndex: number;       // Each player's position in sequence
  charStartTime: number;          // Each player's character start time (adjusted on errors for time penalty)
  currentChar?: string;           // Current character for this player (only in serialized state)
}

/**
 * Blink Multiplayer Game
 *
 * Mechanics:
 * - All players see the same character at the same time
 * - First correct answer gets full points (100)
 * - Subsequent correct answers get reduced points (50, 30, 10)
 * - Faster response time = bonus points
 * - Wrong answer breaks streak and gives 0 points
 * - Timeout (no answer) = 0 points
 * - Maintains streak counter for consecutive correct answers
 */
export class BlinkMultiplayer extends BaseMultiplayerGame {
  private charAnswers: Map<number, { playerId: string; responseTime: number; correct: boolean }[]>;

  constructor(params: {
    roomId: string;
    players: PlayerInfo[];
    seed: number;
    settings?: GameSettings;
  }) {
    super({
      ...params,
      gameType: 'blink',
    });

    this.charAnswers = new Map();
  }

  protected initGame(): void {
    const customSettings = this.settings.customRules as { totalChars?: number; charTimeLimit?: number; lessonNumber?: number } | undefined;
    const totalChars = customSettings?.totalChars || 50; // Default 50 characters
    const timeLimit = customSettings?.charTimeLimit || 2000; // Default 2 seconds per char

    console.log(`🎯 Blink initGame: lessonNumber=${customSettings?.lessonNumber}`);

    // Get character set based on lesson selection
    let chars: string[];
    if (customSettings?.lessonNumber) {
      const lesson = lessonsData.find(l => l.lessonNumber === customSettings.lessonNumber);
      chars = lesson ? lesson.focusKeys : 'abcdefghijklmnopqrstuvwxyz'.split('');
      console.log(`📚 Using lesson ${customSettings.lessonNumber} keys:`, chars);
    } else {
      chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
      console.log(`🔤 Using all keys:`, chars.length, 'characters');
    }

    // Generate character sequence using RNG for fairness
    const sequence: string[] = [];

    for (let i = 0; i < totalChars; i++) {
      const charIndex = Math.floor(this.rng.next() * chars.length);
      sequence.push(chars[charIndex]);
    }

    // Initialize Blink-specific state
    const blinkState: BlinkGameState = {
      timeLimit,
      charSequence: sequence,
      totalChars,
      charHistory: [],
    };

    this.gameState.gameSpecificState = blinkState;

    // Initialize player-specific data
    for (const [playerId, playerState] of this.gameState.players) {
      playerState.gameSpecificData = {
        streak: 0,
        bestStreak: 0,
        responseTime: 0,
        avgResponseTime: 0,
        totalResponseTime: 0,
        correctAnswers: 0,
        timeouts: 0,
        firstAnswers: 0,
        currentCharIndex: 0,
        charStartTime: 0, // Will be set when game starts
      } as BlinkPlayerData;
    }
  }

  protected onGameStart(): void {
    const now = Date.now();
    // Set start time for all players
    for (const [playerId, playerState] of this.gameState.players) {
      const playerData = playerState.gameSpecificData as BlinkPlayerData;
      playerData.charStartTime = now;
    }
    console.log(`🎮 Blink game started for room ${this.roomId}`);
  }

  public updateGameState(deltaTime: number): void {
    const state = this.gameState.gameSpecificState as BlinkGameState;
    const now = Date.now();

    // Check each player's character timeout independently
    for (const [playerId, playerState] of this.gameState.players) {
      const playerData = playerState.gameSpecificData as BlinkPlayerData;
      const elapsedSinceChar = now - playerData.charStartTime;

      // Check if this player's current character timed out (using base time limit)
      if (elapsedSinceChar >= state.timeLimit && playerData.charStartTime > 0) {
        // Character timed out for this player - move to next character
        this.handlePlayerCharTimeout(playerId);
      }
    }
  }

  private handlePlayerCharTimeout(playerId: string): void {
    const state = this.gameState.gameSpecificState as BlinkGameState;
    const playerState = this.gameState.players.get(playerId);
    if (!playerState) return;

    const playerData = playerState.gameSpecificData as BlinkPlayerData;
    const currentChar = state.charSequence[playerData.currentCharIndex];

    console.log(`⏰ Character '${currentChar}' timed out for player ${playerState.displayName}`);

    // Mark player as timed out
    playerData.timeouts++;
    playerData.streak = 0; // Break streak

    // Increment error count for timeout
    playerState.errorCount++;

    // Check if player exceeded max errors (10 errors = game over for this player)
    if (playerState.errorCount >= 10) {
      this.updatePlayerState(playerId, {
        isFinished: true,
      });
      console.log(`❌ Player ${playerState.displayName} reached 10 errors - Game Over!`);
      return; // Don't move to next character, player is finished
    }

    // Move player to next character
    this.movePlayerToNextChar(playerId);
  }

  private movePlayerToNextChar(playerId: string): void {
    const state = this.gameState.gameSpecificState as BlinkGameState;
    const playerState = this.gameState.players.get(playerId);
    if (!playerState) return;

    const playerData = playerState.gameSpecificData as BlinkPlayerData;
    playerData.currentCharIndex++;

    // Check if this player finished the game
    if (playerData.currentCharIndex >= state.totalChars) {
      console.log(`🏁 Player ${playerState.displayName} completed all characters - GAME OVER!`);
      // End the game immediately when the first player finishes (race mode)
      this.gameState.status = 'finished';
      return;
    }

    // Set next character start time for this player
    playerData.charStartTime = Date.now();

    const nextChar = state.charSequence[playerData.currentCharIndex];
    console.log(`   Player ${playerState.displayName} next character (${playerData.currentCharIndex + 1}/${state.totalChars}): ${nextChar}`);
  }

  handlePlayerInput(playerId: string, input: PlayerInput): InputResult {
    if (this.gameState.status !== 'playing') {
      return { success: false, error: 'Game not in progress' };
    }

    const playerState = this.gameState.players.get(playerId);
    if (!playerState) {
      return { success: false, error: 'Player not found' };
    }

    const state = this.gameState.gameSpecificState as BlinkGameState;
    const playerData = playerState.gameSpecificData as BlinkPlayerData;

    // Safety check
    if (!state || !state.charSequence || !playerData) {
      console.error('❌ Invalid game state:', {
        hasState: !!state,
        hasCharSequence: !!state?.charSequence,
        charSequenceLength: state?.charSequence?.length,
        hasPlayerData: !!playerData
      });
      return { success: false, error: 'Invalid game state' };
    }

    // Validate input type
    if (input.inputType !== 'keystroke' || !input.data?.key) {
      return { success: false, error: 'Invalid input type' };
    }

    // Check if player already finished
    if (playerData.currentCharIndex >= state.totalChars) {
      return { success: false, error: 'Already completed all characters' };
    }

    const key = input.data.key.toLowerCase();
    const now = Date.now();
    const responseTime = now - playerData.charStartTime;

    // Get player's current character
    const currentChar = state.charSequence[playerData.currentCharIndex];

    // Check correctness
    const correct = key === currentChar;

    if (correct) {
      // Correct answer!
      playerData.correctAnswers++;
      playerData.streak++;
      playerData.bestStreak = Math.max(playerData.bestStreak, playerData.streak);
      playerData.responseTime = responseTime;
      playerData.totalResponseTime += responseTime;
      playerData.avgResponseTime = playerData.totalResponseTime / playerData.correctAnswers;

      // Calculate points based on speed and streak
      let points = 100;
      let bonus = 0;

      // Speed bonus (up to 50 bonus points) - use base time limit
      const speedRatio = 1 - (responseTime / state.timeLimit);
      bonus = Math.floor(speedRatio * 50);

      // Streak bonus (10 points per consecutive correct)
      if (playerData.streak >= 3) {
        bonus += (playerData.streak - 2) * 10;
      }

      const totalPoints = points + bonus;
      playerState.score += totalPoints;

      // Update typing metrics
      playerState.keystrokeCount++;
      playerState.correctKeystrokes++;
      playerState.accuracy = (playerState.correctKeystrokes / playerState.keystrokeCount) * 100;

      // Move this player to next character
      this.movePlayerToNextChar(playerId);

      return {
        success: true,
      };
    } else {
      // Wrong answer
      playerState.keystrokeCount++;
      playerState.errorCount++;
      playerState.accuracy = (playerState.correctKeystrokes / playerState.keystrokeCount) * 100;
      playerData.streak = 0; // Break streak

      // Check if player exceeded max errors (10 errors = game over for this player)
      if (playerState.errorCount >= 10) {
        this.updatePlayerState(playerId, {
          isFinished: true,
        });
        return {
          success: false,
          error: 'Game over! Too many errors.',
        };
      }

      // Penalty: Reduce current remaining time immediately by adjusting charStartTime
      // Moving charStartTime back makes the elapsed time appear longer
      const timePenalty = 300; // Reduce remaining time by 300ms
      playerData.charStartTime -= timePenalty;

      return {
        success: false,
        error: 'Wrong character',
      };
    }
  }

  checkWinCondition(): string | null {
    if (this.gameState.status !== 'finished') {
      return null;
    }

    // Find player with highest score
    const sortedPlayers = Array.from(this.gameState.players.entries())
      .sort(([, a], [, b]) => b.score - a.score);

    if (sortedPlayers.length === 0) {
      return null;
    }

    // Check for draw - if top players have same score
    if (sortedPlayers.length > 1 && sortedPlayers[0][1].score === sortedPlayers[1][1].score) {
      return null; // Draw
    }

    return sortedPlayers[0][0]; // Winner's playerId
  }

  serialize(): SerializedGameState {
    const blinkState = this.gameState.gameSpecificState as BlinkGameState;

    // Serialize base state using the helper function
    const baseState = serializeGameState(this.gameState);

    // Add currentChar to each player's gameSpecificData
    const playersWithCurrentChar: Record<string, any> = {};
    Object.entries(baseState.players).forEach(([playerId, player]) => {
      const playerData = player.gameSpecificData as BlinkPlayerData;
      const currentChar = blinkState.charSequence[playerData.currentCharIndex];

      playersWithCurrentChar[playerId] = {
        ...player,
        gameSpecificData: {
          ...playerData,
          currentChar, // Add current character for this player
        }
      };
    });

    // Include Blink-specific state but hide future characters
    return {
      ...baseState,
      players: playersWithCurrentChar,
      gameSpecificState: {
        timeLimit: blinkState.timeLimit,
        totalChars: blinkState.totalChars,
        charHistory: blinkState.charHistory,
        // Don't send charSequence to prevent cheating
        // currentChar is now in each player's gameSpecificData
      }
    };
  }
}
