// Blink multiplayer game engine
// All players see the same character sequence and compete for fastest response

import { BaseMultiplayerGame, PlayerInfo } from './BaseMultiplayerGame';
import { PlayerInput, InputResult } from './PlayerState';
import { GameSettings, SerializedGameState } from './GameState';

/**
 * Blink-specific game state
 */
export interface BlinkGameState {
  currentChar: string;           // Current character to type
  charStartTime: number;          // When current char appeared (server timestamp)
  timeLimit: number;              // Time limit per character (ms)
  charSequence: string[];         // Pre-generated character sequence
  currentCharIndex: number;       // Current position in sequence
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
    const totalChars = this.settings.totalChars || 50; // Default 50 characters
    const timeLimit = this.settings.charTimeLimit || 2000; // Default 2 seconds per char

    // Generate character sequence using RNG for fairness
    const chars = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const sequence: string[] = [];

    for (let i = 0; i < totalChars; i++) {
      const charIndex = Math.floor(this.rng.random() * chars.length);
      sequence.push(chars[charIndex]);
    }

    // Initialize Blink-specific state
    const blinkState: BlinkGameState = {
      currentChar: sequence[0],
      charStartTime: 0, // Will be set when game starts
      timeLimit,
      charSequence: sequence,
      currentCharIndex: 0,
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
      } as BlinkPlayerData;
    }
  }

  protected onGameStart(): void {
    const state = this.gameState.gameSpecificState as BlinkGameState;
    state.charStartTime = Date.now();
    console.log(`🎮 Blink game started for room ${this.roomId}`);
    console.log(`   First character: ${state.currentChar}`);
  }

  protected updateGameState(deltaTime: number): void {
    const state = this.gameState.gameSpecificState as BlinkGameState;
    const now = Date.now();
    const elapsedSinceChar = now - state.charStartTime;

    // Check if current character timed out
    if (elapsedSinceChar >= state.timeLimit && state.charStartTime > 0) {
      // Character timed out - move to next character
      this.handleCharTimeout();
    }
  }

  private handleCharTimeout(): void {
    const state = this.gameState.gameSpecificState as BlinkGameState;

    console.log(`⏰ Character '${state.currentChar}' timed out (no one answered)`);

    // Mark all players who didn't answer as timed out
    const currentAnswers = this.charAnswers.get(state.currentCharIndex) || [];
    const answeredPlayerIds = new Set(currentAnswers.map(a => a.playerId));

    for (const [playerId, playerState] of this.gameState.players) {
      if (!answeredPlayerIds.has(playerId)) {
        const playerData = playerState.gameSpecificData as BlinkPlayerData;
        playerData.timeouts++;
        playerData.streak = 0; // Break streak
      }
    }

    // Record in history
    state.charHistory.push({
      char: state.currentChar,
      fastestPlayer: null,
      responseTime: state.timeLimit,
    });

    // Move to next character
    this.nextCharacter();
  }

  private nextCharacter(): void {
    const state = this.gameState.gameSpecificState as BlinkGameState;

    state.currentCharIndex++;

    // Check if game is over
    if (state.currentCharIndex >= state.totalChars) {
      console.log(`🏁 Blink game completed in room ${this.roomId}`);
      this.gameState.status = 'finished';
      return;
    }

    // Set next character
    state.currentChar = state.charSequence[state.currentCharIndex];
    state.charStartTime = Date.now();

    console.log(`   Next character (${state.currentCharIndex + 1}/${state.totalChars}): ${state.currentChar}`);
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

    // Validate input type
    if (input.inputType !== 'keystroke' || !input.data?.key) {
      return { success: false, error: 'Invalid input type' };
    }

    const key = input.data.key.toLowerCase();
    const now = Date.now();
    const responseTime = now - state.charStartTime;

    // Check if already answered this character
    const currentAnswers = this.charAnswers.get(state.currentCharIndex) || [];
    if (currentAnswers.some(a => a.playerId === playerId)) {
      return { success: false, error: 'Already answered this character' };
    }

    // Check correctness
    const correct = key === state.currentChar;

    // Record answer
    currentAnswers.push({ playerId, responseTime, correct });
    this.charAnswers.set(state.currentCharIndex, currentAnswers);

    if (correct) {
      // Correct answer!
      playerData.correctAnswers++;
      playerData.streak++;
      playerData.bestStreak = Math.max(playerData.bestStreak, playerData.streak);
      playerData.responseTime = responseTime;
      playerData.totalResponseTime += responseTime;
      playerData.avgResponseTime = playerData.totalResponseTime / playerData.correctAnswers;

      // Calculate points based on ranking (first, second, third, etc.)
      const correctAnswers = currentAnswers.filter(a => a.correct);
      const ranking = correctAnswers.length;

      let points = 0;
      let bonus = 0;

      if (ranking === 1) {
        points = 100;
        playerData.firstAnswers++;
        // Speed bonus for first answer (up to 50 bonus points)
        const speedRatio = 1 - (responseTime / state.timeLimit);
        bonus = Math.floor(speedRatio * 50);
      } else if (ranking === 2) {
        points = 50;
      } else if (ranking === 3) {
        points = 30;
      } else {
        points = 10;
      }

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

      console.log(`✅ ${playerState.displayName} answered correctly! Rank #${ranking}, +${totalPoints} points (${points} base + ${bonus} bonus), streak: ${playerData.streak}`);

      // If first correct answer, record in history and move to next char
      if (ranking === 1) {
        state.charHistory.push({
          char: state.currentChar,
          fastestPlayer: playerId,
          responseTime,
        });
        this.nextCharacter();
      }

      return {
        success: true,
        points: totalPoints,
        feedback: {
          message: `Rank #${ranking}! +${totalPoints} points`,
          type: 'correct',
          details: {
            basePoints: points,
            bonusPoints: bonus,
            streak: playerData.streak,
            responseTime,
          }
        }
      };
    } else {
      // Wrong answer
      playerState.keystrokeCount++;
      playerState.errorCount++;
      playerState.accuracy = (playerState.correctKeystrokes / playerState.keystrokeCount) * 100;
      playerData.streak = 0; // Break streak

      console.log(`❌ ${playerState.displayName} answered incorrectly (pressed '${key}' instead of '${state.currentChar}')`);

      return {
        success: false,
        error: 'Wrong character',
        feedback: {
          message: 'Wrong! Streak broken',
          type: 'error',
          details: {
            expected: state.currentChar,
            actual: key,
          }
        }
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
    const baseState = super.serialize();
    const blinkState = this.gameState.gameSpecificState as BlinkGameState;

    // Include Blink-specific state but hide future characters
    return {
      ...baseState,
      gameSpecificState: {
        currentChar: blinkState.currentChar,
        charStartTime: blinkState.charStartTime,
        timeLimit: blinkState.timeLimit,
        currentCharIndex: blinkState.currentCharIndex,
        totalChars: blinkState.totalChars,
        charHistory: blinkState.charHistory,
        // Don't send charSequence to prevent cheating
      }
    };
  }
}
