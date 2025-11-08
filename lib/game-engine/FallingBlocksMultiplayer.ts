// Falling Blocks Multiplayer Game Engine

import { BaseMultiplayerGame, PlayerInfo } from './BaseMultiplayerGame';
import {
  GameState,
  SerializedGameState,
  GameSettings,
  serializeGameState
} from './GameState';
import { PlayerInput, InputResult, PlayerKeystroke } from './PlayerState';
import { lessonsData } from '@/lib/data/lessons';
import { GameType } from '@/types/multiplayer';

/**
 * Falling block data structure
 */
export interface FallingBlock {
  id: number;
  char: string;
  x: number;          // Position percentage (0-100)
  y: number;          // Position percentage (0-100)
  speed: number;      // Pixels per tick
  playerId: string;   // Which player this block belongs to
  typedProgress: string;   // Characters typed so far
}

/**
 * Game-specific state for Falling Blocks
 */
export interface FallingBlocksGameState {
  blocks: FallingBlock[];
  nextBlockId: number;
  spawnInterval: number;     // Milliseconds between spawns
  gameSpeed: number;         // Multiplier for block speeds
  characters: string[];      // Available characters to spawn
  maxBlocksOnScreen: number;
  lastSpawnTime: number;
  totalBlocksMissed: number; // Total blocks that hit bottom
  maxMissedBlocks: number;   // Game over threshold
}

/**
 * Player-specific data for Falling Blocks
 */
export interface FallingBlocksPlayerData {
  activeTargetBlockId?: number;  // Block they're currently typing
  blocksDestroyed: number;
  blocksMissed: number;
  errorCount: number;             // Number of incorrect keystrokes
  maxErrors: number;              // Game over threshold for errors
}

/**
 * Falling Blocks Multiplayer Game
 * All players see the same blocks falling (shared RNG seed)
 * Players compete for highest score
 */
export class FallingBlocksMultiplayer extends BaseMultiplayerGame {
  private spawnTimer: number = 0;
  
  constructor(params: {
    roomId: string;
    players: PlayerInfo[];
    seed: number;
    settings?: GameSettings;
  }) {
    super({
      ...params,
      gameType: 'falling-blocks' as GameType,
    });
  }
  
  /**
   * Initialize Falling Blocks specific state
   */
  protected initGame(): void {
    // Get characters from lesson or use default
    const characters = this.getCharactersFromLesson();
    
    const gameSpecificState: FallingBlocksGameState = {
      blocks: [],
      nextBlockId: 0,
      spawnInterval: 2000, // 2 seconds initially
      gameSpeed: 1.0,
      characters,
      maxBlocksOnScreen: 10,
      lastSpawnTime: 0,
      totalBlocksMissed: 0,
      maxMissedBlocks: 10, // Game over after 10 missed blocks
    };
    
    this.gameState.gameSpecificState = gameSpecificState;
    
    // Initialize player-specific data
    for (const [playerId] of this.gameState.players) {
      const playerData: FallingBlocksPlayerData = {
        blocksDestroyed: 0,
        blocksMissed: 0,
        errorCount: 0,
        maxErrors: 10, // Game over after 10 typing errors
      };
      this.updatePlayerState(playerId, {
        gameSpecificData: playerData,
      });
    }
  }
  
  /**
   * Get characters based on lesson or settings
   */
  private getCharactersFromLesson(): string[] {
    const customSettings = this.settings.customRules as { lessonNumber?: number } | undefined;

    console.log(`🎯 FallingBlocks getCharactersFromLesson: lessonNumber=${customSettings?.lessonNumber}`);

    if (customSettings?.lessonNumber) {
      const lesson = lessonsData.find(l => l.lessonNumber === customSettings.lessonNumber);
      if (lesson && lesson.focusKeys.length > 0) {
        console.log(`📚 Using lesson ${customSettings.lessonNumber} keys:`, lesson.focusKeys);
        return lesson.focusKeys;
      }
    }

    // All lowercase letters
    console.log(`🔤 Using all 26 keys`);
    return 'abcdefghijklmnopqrstuvwxyz'.split('');
  }
  
  /**
   * Called when game starts
   */
  protected onGameStart(): void {
    console.log(`🎮 FallingBlocks onGameStart() called for room ${this.roomId}`);
    this.spawnTimer = 0;

    // Spawn 1 initial block (identical for all players)
    this.spawnBlockForPlayers();

    const state = this.gameState.gameSpecificState as FallingBlocksGameState;
    console.log(`✅ Spawned ${state.blocks.length} initial blocks for ${this.gameState.players.size} players`);
  }
  
  /**
   * Spawn new falling blocks - one copy for each player with identical properties
   */
  private spawnBlockForPlayers(): void {
    const state = this.gameState.gameSpecificState as FallingBlocksGameState;

    // Check if any player needs a block
    let needsBlock = false;
    for (const [playerId] of this.gameState.players) {
      const playerBlocks = state.blocks.filter(b => b.playerId === playerId);
      if (playerBlocks.length < state.maxBlocksOnScreen / this.gameState.players.size) {
        needsBlock = true;
        break;
      }
    }

    if (!needsBlock) {
      return;
    }

    // Generate block properties once using seeded RNG
    const char = state.characters[
      this.rng.nextInt(0, state.characters.length - 1)
    ];
    const x = this.rng.nextFloat(10, 90);
    const speed = (0.5 + this.gameState.players.size * 0.05) * state.gameSpeed;

    // Create identical block for each player
    for (const [playerId] of this.gameState.players) {
      const playerBlocks = state.blocks.filter(b => b.playerId === playerId);
      if (playerBlocks.length >= state.maxBlocksOnScreen / this.gameState.players.size) {
        continue;
      }

      const block: FallingBlock = {
        id: state.nextBlockId++,
        char,
        x,
        y: 0,
        speed,
        playerId, // Assign to specific player
        typedProgress: '',
      };

      state.blocks.push(block);
    }

    state.lastSpawnTime = this.gameState.currentTime;
  }
  
  /**
   * Update game state each tick
   */
  updateGameState(deltaTime: number): void {
    const state = this.gameState.gameSpecificState as FallingBlocksGameState;

    // Update spawn timer - spawn identical blocks for all players
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= state.spawnInterval) {
      this.spawnBlockForPlayers();
      this.spawnTimer = 0;
    }
    
    // Update block positions
    const blocksToRemove: number[] = [];

    for (const block of state.blocks) {
      block.y += block.speed * (deltaTime / 16.67); // Normalize to 60 FPS

      // Check if block reached bottom
      if (block.y >= 100) {
        blocksToRemove.push(block.id);
        state.totalBlocksMissed++;

        // Penalize the player who owns this block (if still active)
        const playerState = this.getPlayerState(block.playerId);
        if (playerState && !playerState.isFinished) {
          const playerData = playerState.gameSpecificData as FallingBlocksPlayerData;
          playerData.blocksMissed++;

          // Lose points for missed blocks
          this.updatePlayerState(block.playerId, {
            score: Math.max(0, playerState.score - 10),
          });
        }
      }
    }
    
    // Remove blocks that reached bottom
    state.blocks = state.blocks.filter(b => !blocksToRemove.includes(b.id));
    
    // Check if all players finished
    const allFinished = Array.from(this.gameState.players.values()).every(p => p.isFinished);
    if (allFinished) {
      console.log(`🏁 Falling Blocks ended - all players finished`);
      this.gameState.status = 'finished';
      return;
    }

    // Increase difficulty over time
    const minutesElapsed = this.gameState.elapsedTime / 60000;
    const newLevel = Math.floor(minutesElapsed / 0.5) + 1; // Level up every 30 seconds

    if (newLevel !== this.gameState.players.values().next().value?.level) {
      for (const [playerId] of this.gameState.players) {
        this.updatePlayerState(playerId, { level: newLevel });
      }

      // Adjust spawn rate and speed
      state.spawnInterval = Math.max(1000, 2000 - newLevel * 100);
      state.gameSpeed = 1 + newLevel * 0.1;
    }
  }
  
  /**
   * Handle player input
   */
  handlePlayerInput(playerId: string, input: PlayerInput): InputResult {
    if (input.inputType !== 'keystroke') {
      return { success: false, error: 'Invalid input type' };
    }
    
    const keystroke = input.data as PlayerKeystroke;
    const playerState = this.getPlayerState(playerId);
    
    if (!playerState) {
      return { success: false, error: 'Player not found' };
    }
    
    const state = this.gameState.gameSpecificState as FallingBlocksGameState;
    const playerData = playerState.gameSpecificData as FallingBlocksPlayerData;

    // Find blocks matching the typed character that belong to this player
    const matchingBlocks = state.blocks.filter(b =>
      b.char === keystroke.key && b.playerId === playerId
    );
    
    if (matchingBlocks.length === 0) {
      // Incorrect key - increment error counter
      playerData.errorCount++;

      // Check if player exceeded max errors
      if (playerData.errorCount >= playerData.maxErrors) {
        console.log(`❌ Player ${playerState.displayName} GAME OVER (too many errors: ${playerData.errorCount})`);
        this.updatePlayerState(playerId, {
          isFinished: true,
        });
      }

      // Update metrics
      return this.handleKeystroke(playerId, {
        ...keystroke,
        isCorrect: false,
      });
    }
    
    // Hit the closest matching block (lowest on screen)
    const closestBlock = matchingBlocks.reduce((closest, block) =>
      block.y > closest.y ? block : closest
    );

    closestBlock.typedProgress += keystroke.key;

    // Block destroyed!
    const blockIndex = state.blocks.findIndex(b => b.id === closestBlock.id);
    if (blockIndex !== -1) {
      state.blocks.splice(blockIndex, 1);
    }
    
    // Update player stats
    playerData.blocksDestroyed++;
    const pointsEarned = 10 + (closestBlock.y > 80 ? 5 : 0); // Bonus for last-second saves
    
    this.updatePlayerState(playerId, {
      score: playerState.score + pointsEarned,
      gameSpecificData: playerData,
    });
    
    // Update typing metrics
    return this.handleKeystroke(playerId, {
      ...keystroke,
      isCorrect: true,
    });
  }
  
  /**
   * Check win condition
   */
  checkWinCondition(): string | null {
    const state = this.gameState.gameSpecificState as FallingBlocksGameState;

    // Game ends if too many blocks missed
    if (state.totalBlocksMissed >= state.maxMissedBlocks) {
      // Find player with highest score
      const sortedPlayers = Array.from(this.gameState.players.entries())
        .sort(([, a], [, b]) => b.score - a.score);

      if (sortedPlayers.length === 0) {
        return null;
      }

      // Check for draw - if top players have same score
      if (sortedPlayers.length > 1 && sortedPlayers[0][1].score === sortedPlayers[1][1].score) {
        return null; // Return null for draw game
      }

      return sortedPlayers[0][0]; // Return winner
    }

    // Check if all players are disconnected
    const connectedPlayers = Array.from(this.gameState.players.values())
      .filter(p => p.isConnected);

    if (connectedPlayers.length === 0) {
      return null; // No winner if everyone disconnected
    }

    return null; // Continue until time limit or too many missed
  }
  
  /**
   * Serialize game state for network transmission
   */
  serialize(): SerializedGameState {
    return serializeGameState(this.gameState);
  }
  
  /**
   * Get blocks visible to a specific player
   */
  getPlayerView(playerId: string): FallingBlock[] {
    const state = this.gameState.gameSpecificState as FallingBlocksGameState;

    // All players see all blocks (shared view)
    return state.blocks;
  }
  
  /**
   * Get current level
   */
  getCurrentLevel(): number {
    const firstPlayer = this.gameState.players.values().next().value;
    return firstPlayer?.level || 1;
  }
  
  /**
   * Get leaderboard sorted by score
   */
  getLeaderboard(): Array<{ playerId: string; displayName: string; score: number; blocksDestroyed: number }> {
    return Array.from(this.gameState.players.values())
      .map(player => ({
        playerId: player.playerId,
        displayName: player.displayName,
        score: player.score,
        blocksDestroyed: (player.gameSpecificData as FallingBlocksPlayerData).blocksDestroyed,
      }))
      .sort((a, b) => b.score - a.score);
  }
}
