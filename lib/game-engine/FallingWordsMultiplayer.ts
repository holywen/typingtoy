// Falling Words Multiplayer Game Engine
// All players see the same word sequence falling, compete for completion speed

import { BaseMultiplayerGame, PlayerInfo } from './BaseMultiplayerGame';
import { PlayerInput, InputResult } from './PlayerState';
import { GameSettings, SerializedGameState, serializeGameState } from './GameState';
import { GameType } from '@/types/multiplayer';
import { lessonsData } from '@/lib/data/lessons';

/**
 * Falling word data structure
 */
export interface FallingWord {
  id: number;
  word: string;
  x: number;              // Position percentage (0-100)
  y: number;              // Position percentage (0-100)
  speed: number;          // Fall speed (percentage per update)
  spawnTime: number;      // When word was spawned (server timestamp)
}

/**
 * Falling Words-specific game state (shared by all players)
 */
export interface FallingWordsGameState {
  words: FallingWord[];              // Currently falling words
  wordPool: string[];                // Pre-generated word pool for consistency
  nextWordId: number;                // ID for next word to spawn
  spawnInterval: number;             // Milliseconds between spawns
  fallSpeed: number;                 // Base fall speed
  maxWordsOnScreen: number;          // Max concurrent words
  lastSpawnTime: number;             // Last word spawn timestamp
  gameSpeed: number;                 // Game difficulty multiplier
  bottomThreshold: number;           // Y position where words are "lost" (percentage)
  nextWordIndex: number;             // Index in wordPool for next spawn
}

/**
 * Falling Words-specific player data (per-player progress)
 */
export interface FallingWordsPlayerData {
  currentWordId: number | null;     // Word player is currently typing
  typedProgress: string;             // Characters typed so far for current word
  wordsCompleted: number;            // Total words completed
  wordsLost: number;                 // Words that fell off screen
  maxLostWords: number;              // Game over threshold
  completedWordIds: Set<number>;    // IDs of words this player has completed
  lostWordIds: Set<number>;         // IDs of words this player has lost
  errorCount: number;                // Number of typing errors
  maxErrors: number;                 // Game over threshold for errors
}

/**
 * Falling Words Multiplayer Game
 *
 * Mechanics:
 * - All players see the SAME words falling in the SAME positions
 * - Each player types words independently at their own pace
 * - Players can work on different words simultaneously
 * - Words fall at a steady rate (faster each level)
 * - If a word reaches the bottom = player loses it (counts toward game over)
 * - Game over when player loses too many words (e.g., 5 words)
 * - Winner is last player standing OR highest score when time runs out
 */
export class FallingWordsMultiplayer extends BaseMultiplayerGame {
  private readonly UPDATE_INTERVAL = 50; // Update words every 50ms
  private lastUpdateTime: number = 0;

  constructor(params: {
    roomId: string;
    players: PlayerInfo[];
    seed: number;
    settings?: GameSettings;
  }) {
    super({
      ...params,
      gameType: 'falling-words' as GameType,
    });
  }

  protected initGame(): void {
    const customSettings = this.settings.customRules as { characters?: string[]; lessonNumber?: number } | undefined;

    console.log(`🎯 FallingWords initGame: lessonNumber=${customSettings?.lessonNumber}`);

    // Get character set based on lesson selection
    let characters: string[];
    if (customSettings?.lessonNumber) {
      const lesson = lessonsData.find(l => l.lessonNumber === customSettings.lessonNumber);
      characters = lesson && lesson.focusKeys.length > 0 ? lesson.focusKeys : 'abcdefghijklmnopqrstuvwxyz'.split('');
      console.log(`📚 Using lesson ${customSettings.lessonNumber} keys:`, characters);
    } else if (customSettings?.characters) {
      characters = customSettings.characters;
      console.log(`🔤 Using custom characters:`, characters);
    } else {
      characters = 'abcdefghijklmnopqrstuvwxyz'.split('');
      console.log(`🔤 Using all 26 keys`);
    }

    const maxLostWords = 5; // Lose after 5 words fall off screen

    // Generate word pool using seeded RNG for consistency
    const wordPool = this.generateWordPool(characters, 50);

    // Initialize game-specific state
    const wordsState: FallingWordsGameState = {
      words: [],
      wordPool,
      nextWordId: 1,
      spawnInterval: 2500, // Spawn word every 2.5 seconds
      fallSpeed: 0.5,      // Base speed: 0.5% per update (50ms)
      maxWordsOnScreen: 8,
      lastSpawnTime: 0,
      gameSpeed: 1.0,
      bottomThreshold: 90, // Words lost if y >= 90%
      nextWordIndex: 0,
    };

    this.gameState.gameSpecificState = wordsState;

    // Initialize player-specific data
    for (const [playerId, playerState] of this.gameState.players) {
      const playerData: FallingWordsPlayerData = {
        currentWordId: null,
        typedProgress: '',
        wordsCompleted: 0,
        wordsLost: 0,
        maxLostWords,
        completedWordIds: new Set(),
        lostWordIds: new Set(),
        errorCount: 0,
        maxErrors: 10, // Game over after 10 typing errors
      };

      playerState.gameSpecificData = playerData;
      playerState.lives = maxLostWords;
    }

    console.log(`📝 Falling Words game initialized for room ${this.roomId}`);
    console.log(`   Word pool size: ${wordPool.length}`);
    console.log(`   Max lost words: ${maxLostWords}`);
  }

  /**
   * Generate word pool using seeded RNG for consistency across all players
   */
  private generateWordPool(characters: string[], count: number): string[] {
    const words: string[] = [];
    const charSet = new Set(characters);

    // If we have common keys, try to use real words
    const commonWords = [
      'type', 'code', 'word', 'game', 'fast', 'quick', 'jump', 'play',
      'test', 'skill', 'speed', 'learn', 'master', 'focus', 'key',
      'text', 'letter', 'typing', 'finger', 'hand', 'race', 'win',
    ];

    // Filter words that only use available characters
    const validWords = commonWords.filter(word =>
      word.split('').every(char => charSet.has(char))
    );

    // Use valid words if we have enough
    if (validWords.length >= count / 2) {
      // Use valid words and fill rest with generated words
      for (let i = 0; i < count; i++) {
        if (i < validWords.length) {
          words.push(validWords[i]);
        } else {
          // Generate random word
          const length = Math.floor(this.rng.next() * 3) + 3; // 3-5 letters
          let word = '';
          for (let j = 0; j < length; j++) {
            word += characters[Math.floor(this.rng.next() * characters.length)];
          }
          words.push(word);
        }
      }
    } else {
      // Generate all words randomly
      for (let i = 0; i < count; i++) {
        const length = Math.floor(this.rng.next() * 3) + 3; // 3-5 letters
        let word = '';
        for (let j = 0; j < length; j++) {
          word += characters[Math.floor(this.rng.next() * characters.length)];
        }
        words.push(word);
      }
    }

    return words;
  }

  protected onGameStart(): void {
    this.lastUpdateTime = Date.now();
    console.log(`📝 Falling Words game started for room ${this.roomId}`);
  }

  public updateGameState(deltaTime: number): void {
    const state = this.gameState.gameSpecificState as FallingWordsGameState;
    const now = Date.now();

    // Spawn new words periodically
    if (now - state.lastSpawnTime >= state.spawnInterval &&
        state.words.length < state.maxWordsOnScreen &&
        state.nextWordIndex < state.wordPool.length) {

      this.spawnWord();
      state.lastSpawnTime = now;
    }

    // Update word positions (every UPDATE_INTERVAL ms)
    if (now - this.lastUpdateTime >= this.UPDATE_INTERVAL) {
      this.updateWordPositions();
      this.lastUpdateTime = now;
    }

    // Check for words that reached bottom (each player loses them independently)
    for (const [playerId, playerState] of this.gameState.players) {
      if (playerState.isFinished) continue;

      const playerData = playerState.gameSpecificData as FallingWordsPlayerData;

      // Check if player has any NEW words that reached bottom (not already lost/completed)
      const newLostWords = state.words.filter(word =>
        word.y >= state.bottomThreshold &&
        !playerData.lostWordIds.has(word.id) &&
        !playerData.completedWordIds.has(word.id)
      );

      if (newLostWords.length > 0) {
        // Create new playerData object with incremented counts (avoid mutation)
        // NOTE: Only increment wordsLost, not errorCount (they are separate counters)
        const updatedPlayerData: FallingWordsPlayerData = {
          ...playerData,
          wordsLost: playerData.wordsLost + newLostWords.length,
          lostWordIds: new Set(playerData.lostWordIds), // Copy the Set
        };

        // Add lost words to the new Set
        for (const word of newLostWords) {
          updatedPlayerData.lostWordIds.add(word.id);
        }

        // Check if player game over (either too many words lost OR too many errors)
        if (updatedPlayerData.wordsLost >= updatedPlayerData.maxLostWords) {
          this.updatePlayerState(playerId, {
            isFinished: true,
            lives: 0,
            gameSpecificData: updatedPlayerData,
          });
        } else if (updatedPlayerData.errorCount >= updatedPlayerData.maxErrors) {
          this.updatePlayerState(playerId, {
            isFinished: true,
            lives: updatedPlayerData.maxLostWords - updatedPlayerData.wordsLost,
            gameSpecificData: updatedPlayerData,
          });
        } else {
          // Update lives and game data
          this.updatePlayerState(playerId, {
            lives: updatedPlayerData.maxLostWords - updatedPlayerData.wordsLost,
            gameSpecificData: updatedPlayerData,
          });
        }
      }
    }

    // Remove words from shared state only when ALL players have completed or lost them
    state.words = state.words.filter(word => {
      // Keep words that passed bottom threshold but still need to be tracked
      if (word.y < state.bottomThreshold) {
        return true; // Keep active words
      }

      // For words past bottom, check if all players have processed them
      const allPlayersProcessed = Array.from(this.gameState.players.values()).every(p => {
        const pd = p.gameSpecificData as FallingWordsPlayerData;
        return pd.lostWordIds.has(word.id) || pd.completedWordIds.has(word.id) || p.isFinished;
      });

      return !allPlayersProcessed; // Remove only if all players processed
    });

    // Check if all players finished
    const allFinished = Array.from(this.gameState.players.values()).every(p => p.isFinished);
    if (allFinished) {
      console.log(`📝 Falling Words ended - all players finished`);
      this.gameState.status = 'finished';
    }

    // Increase difficulty over time (every 15 seconds)
    const elapsedTime = now - this.gameState.startTime;
    if (elapsedTime > 0 && elapsedTime % 15000 < this.UPDATE_INTERVAL) {
      state.gameSpeed += 0.1;
      state.spawnInterval = Math.max(1500, state.spawnInterval - 100);
      console.log(`⚡ Difficulty increased! Speed: ${state.gameSpeed.toFixed(1)}x, Spawn: ${state.spawnInterval}ms`);
    }
  }

  /**
   * Spawn a new word at the top of the screen
   */
  private spawnWord(): void {
    const state = this.gameState.gameSpecificState as FallingWordsGameState;

    if (state.nextWordIndex >= state.wordPool.length) {
      // Cycle back to beginning of word pool
      state.nextWordIndex = 0;
    }

    const word = state.wordPool[state.nextWordIndex];
    const newWord: FallingWord = {
      id: state.nextWordId++,
      word,
      x: this.rng.next() * 70 + 10, // Random X: 10-80%
      y: 0,
      speed: state.fallSpeed * state.gameSpeed,
      spawnTime: Date.now(),
    };

    state.words.push(newWord);
    state.nextWordIndex++;
  }

  /**
   * Update positions of all falling words
   */
  private updateWordPositions(): void {
    const state = this.gameState.gameSpecificState as FallingWordsGameState;

    for (const word of state.words) {
      word.y += word.speed;
    }
  }

  handlePlayerInput(playerId: string, input: PlayerInput): InputResult {
    const playerState = this.gameState.players.get(playerId);
    if (!playerState) {
      return { success: false, error: 'Player not found' };
    }

    if (playerState.isFinished) {
      return { success: false, error: 'Player already finished' };
    }

    const state = this.gameState.gameSpecificState as FallingWordsGameState;
    const playerData = playerState.gameSpecificData as FallingWordsPlayerData;

    // Validate input type
    if (input.inputType !== 'keystroke' || !input.data?.key) {
      return { success: false, error: 'Invalid input type' };
    }

    const key = input.data.key.toLowerCase();
    const now = Date.now();

    playerState.keystrokeCount++;

    // Find the word that matches this keystroke
    let targetWord: FallingWord | null = null;

    // If player is currently typing a word, check if key matches next character
    if (playerData.currentWordId !== null) {
      targetWord = state.words.find(w => w.id === playerData.currentWordId) || null;

      if (targetWord) {
        const nextChar = targetWord.word[playerData.typedProgress.length];

        if (key === nextChar) {
          // Correct character!
          playerData.typedProgress += key;
          playerState.correctKeystrokes++;

          // Check if word completed
          if (playerData.typedProgress === targetWord.word) {
            // Word completed!
            playerData.wordsCompleted++;
            playerState.score += targetWord.word.length * 10;

            // Track completed word ID (don't remove from shared state yet)
            playerData.completedWordIds.add(targetWord.id);

            // Reset player's current word
            playerData.currentWordId = null;
            playerData.typedProgress = '';

            playerState.accuracy = (playerState.correctKeystrokes / playerState.keystrokeCount) * 100;

            console.log(`✅ ${playerState.displayName} completed word "${targetWord.word}"! Words: ${playerData.wordsCompleted}`);

            // Check if all players have completed or lost this word, then remove it
            const completedWordId = targetWord.id;
            const allPlayersProcessed = Array.from(this.gameState.players.values()).every(p => {
              const pd = p.gameSpecificData as FallingWordsPlayerData;
              return pd.completedWordIds.has(completedWordId) || pd.lostWordIds.has(completedWordId) || p.isFinished;
            });

            if (allPlayersProcessed) {
              state.words = state.words.filter(w => w.id !== completedWordId);
            }

            return {
              success: true,
              wordCompleted: true,
              feedback: {
                message: `Word completed! +${targetWord.word.length * 10}`,
              },
            };
          }

          playerState.accuracy = (playerState.correctKeystrokes / playerState.keystrokeCount) * 100;

          return {
            success: true,
          };
        } else {
          // Wrong character - cancel current word and increment error count
          // Create new object to avoid mutation
          const updatedPlayerData: FallingWordsPlayerData = {
            ...playerData,
            currentWordId: null,
            typedProgress: '',
            errorCount: playerData.errorCount + 1,
          };
          playerState.accuracy = (playerState.correctKeystrokes / playerState.keystrokeCount) * 100;

          // Check if player exceeded max errors
          if (updatedPlayerData.errorCount >= updatedPlayerData.maxErrors) {
            this.updatePlayerState(playerId, {
              isFinished: true,
              accuracy: playerState.accuracy,
              gameSpecificData: updatedPlayerData,
            });
          } else {
            this.updatePlayerState(playerId, {
              accuracy: playerState.accuracy,
              gameSpecificData: updatedPlayerData,
            });
          }

          return {
            success: false,
            error: 'Wrong character',
          };
        }
      }
    }

    // No current word - find a word starting with this key
    targetWord = state.words.find(w => w.word[0] === key) || null;

    if (targetWord) {
      // Start typing this word
      playerData.currentWordId = targetWord.id;
      playerData.typedProgress = key;
      playerState.correctKeystrokes++;

      // Check if single-character word (complete immediately)
      if (targetWord.word === key) {
        playerData.wordsCompleted++;
        playerState.score += targetWord.word.length * 10;

        // Track completed word ID (don't remove from shared state yet)
        playerData.completedWordIds.add(targetWord.id);

        playerData.currentWordId = null;
        playerData.typedProgress = '';

        playerState.accuracy = (playerState.correctKeystrokes / playerState.keystrokeCount) * 100;

        // Check if all players have completed or lost this word, then remove it
        const completedWordId = targetWord.id;
        const allPlayersProcessed = Array.from(this.gameState.players.values()).every(p => {
          const pd = p.gameSpecificData as FallingWordsPlayerData;
          return pd.completedWordIds.has(completedWordId) || pd.lostWordIds.has(completedWordId) || p.isFinished;
        });

        if (allPlayersProcessed) {
          state.words = state.words.filter(w => w.id !== completedWordId);
        }

        return {
          success: true,
          wordCompleted: true,
          feedback: {
            message: `Word completed! +${targetWord.word.length * 10}`,
          },
        };
      }

      playerState.accuracy = (playerState.correctKeystrokes / playerState.keystrokeCount) * 100;

      return {
        success: true,
      };
    }

    // No matching word found - increment error count
    // Create new object to avoid mutation
    const updatedPlayerData: FallingWordsPlayerData = {
      ...playerData,
      errorCount: playerData.errorCount + 1,
    };
    playerState.accuracy = (playerState.correctKeystrokes / playerState.keystrokeCount) * 100;

    // Check if player exceeded max errors
    if (updatedPlayerData.errorCount >= updatedPlayerData.maxErrors) {
      this.updatePlayerState(playerId, {
        isFinished: true,
        accuracy: playerState.accuracy,
        gameSpecificData: updatedPlayerData,
      });
    } else {
      this.updatePlayerState(playerId, {
        accuracy: playerState.accuracy,
        gameSpecificData: updatedPlayerData,
      });
    }

    return {
      success: false,
      error: 'No matching word',
    };
  }

  public checkWinCondition(): string | null {
    // Winner is the last player standing OR player with highest score
    const activePlayers = Array.from(this.gameState.players.entries())
      .filter(([_, p]) => !p.isFinished);

    if (activePlayers.length === 1) {
      return activePlayers[0][0]; // Return winner ID
    }

    // If all finished, find highest score
    if (activePlayers.length === 0) {
      let maxScore = -1;
      let winnerId: string | null = null;

      for (const [playerId, playerState] of this.gameState.players) {
        if (playerState.score > maxScore) {
          maxScore = playerState.score;
          winnerId = playerId;
        }
      }

      return winnerId;
    }

    return null;
  }

  serialize(): SerializedGameState {
    const state = this.gameState.gameSpecificState as FallingWordsGameState;

    // Use the serializeGameState helper for base state
    const baseState = serializeGameState(this.gameState);

    // Convert player data with Sets to serializable format
    const serializedPlayers: Record<string, any> = {};
    for (const [playerId, playerState] of this.gameState.players) {
      const playerData = playerState.gameSpecificData as FallingWordsPlayerData;
      serializedPlayers[playerId] = {
        ...baseState.players[playerId],
        gameSpecificData: {
          ...playerData,
          completedWordIds: Array.from(playerData.completedWordIds),
          lostWordIds: Array.from(playerData.lostWordIds),
        }
      };
    }

    // Include Falling Words-specific state
    return {
      ...baseState,
      players: serializedPlayers,
      gameSpecificState: {
        words: state.words,
        nextWordId: state.nextWordId,
        spawnInterval: state.spawnInterval,
        fallSpeed: state.fallSpeed,
        maxWordsOnScreen: state.maxWordsOnScreen,
        lastSpawnTime: state.lastSpawnTime,
        gameSpeed: state.gameSpeed,
        bottomThreshold: state.bottomThreshold,
        nextWordIndex: state.nextWordIndex,
        // Don't send full wordPool to prevent cheating - just current words
      }
    };
  }
}
