// Speed Race (TypingWalk) Multiplayer Game Engine
// All players race through the same path/map, competing for fastest completion

import { BaseMultiplayerGame, PlayerInfo } from './BaseMultiplayerGame';
import { PlayerInput, InputResult } from './PlayerState';
import { GameSettings, SerializedGameState, serializeGameState } from './GameState';
import { GameType } from '@/types/multiplayer';

const GRID_ROWS = 10;
const GRID_COLS = 22;

/**
 * Grid cell data structure
 */
export interface GridCell {
  char: string;
  isPath: boolean;
}

/**
 * Position in the grid
 */
export interface Position {
  row: number;
  col: number;
}

/**
 * Speed Race-specific game state (shared by all players)
 */
export interface SpeedRaceGameState {
  grid: GridCell[][];          // The shared map
  pathSequence: Position[];    // Pre-generated path all players follow
  gridSeed: number;            // Seed used to generate the grid
  characters: string[];        // Available characters for the grid
  totalPathLength: number;     // Length of the path to complete
}

/**
 * Speed Race-specific player data (per-player progress)
 */
export interface SpeedRacePlayerData {
  currentRow: number;          // Current position row
  currentCol: number;          // Current position col
  pathIndex: number;           // Current position in path (0 = start)
  visitedCells: Position[];    // Cells player has visited
  remainingLives: number;      // Lives left
  maxLives: number;            // Starting lives
}

/**
 * Speed Race Multiplayer Game
 *
 * Mechanics:
 * - All players race through the SAME generated path/map
 * - Players must type the correct characters to move forward on the path
 * - Each player progresses at their own pace (independent position tracking)
 * - First player to reach the end wins
 * - Wrong keystroke = lose 1 life
 * - Game over if lives reach 0
 * - Race is complete when first player finishes OR all players game over
 */
export class SpeedRaceMultiplayer extends BaseMultiplayerGame {
  constructor(params: {
    roomId: string;
    players: PlayerInfo[];
    seed: number;
    settings?: GameSettings;
  }) {
    super({
      ...params,
      gameType: 'speed-race' as GameType,
    });
  }

  protected initGame(): void {
    const customSettings = this.settings.customRules as { characters?: string[] } | undefined;
    const characters = customSettings?.characters || 'abcdefghijklmnopqrstuvwxyz'.split('');
    const maxLives = 5;

    // Generate shared grid and path using seeded RNG
    const { grid, pathSequence } = this.generateSharedGrid(characters);

    // Initialize game-specific state
    const raceState: SpeedRaceGameState = {
      grid,
      pathSequence,
      gridSeed: this.gameState.seed,
      characters,
      totalPathLength: pathSequence.length,
    };

    this.gameState.gameSpecificState = raceState;

    // Initialize player-specific data
    for (const [playerId, playerState] of this.gameState.players) {
      const startPos = pathSequence[0];

      const playerData: SpeedRacePlayerData = {
        currentRow: startPos.row,
        currentCol: startPos.col,
        pathIndex: 0,
        visitedCells: [startPos],
        remainingLives: maxLives,
        maxLives,
      };

      playerState.gameSpecificData = playerData;
      playerState.lives = maxLives;
    }

    console.log(`🏁 Speed Race game initialized for room ${this.roomId}`);
    console.log(`   Path length: ${pathSequence.length} cells`);
    console.log(`   Grid: ${GRID_ROWS}x${GRID_COLS}`);
    console.log(`   Characters: ${characters.join('')}`);
  }

  /**
   * Generate a shared grid and path for all players using seeded RNG
   */
  private generateSharedGrid(characters: string[]): { grid: GridCell[][], pathSequence: Position[] } {
    const grid: GridCell[][] = [];
    const pathSequence: Position[] = [];

    // Generate path using seeded RNG - starts on left, winds to right
    let currentRow = Math.floor(this.rng.next() * GRID_ROWS);
    let currentCol = 1; // Start at column 1

    pathSequence.push({ row: currentRow, col: currentCol });

    // Generate winding path across the grid
    while (currentCol < GRID_COLS - 1) {
      currentCol++;

      // Randomly move up, down, or stay (using seeded RNG)
      const move = this.rng.next();
      if (move < 0.3 && currentRow > 0) {
        currentRow--;
      } else if (move > 0.7 && currentRow < GRID_ROWS - 1) {
        currentRow++;
      }

      pathSequence.push({ row: currentRow, col: currentCol });
    }

    // Create grid with path marked
    const pathSet = new Set(pathSequence.map(p => `${p.row},${p.col}`));

    for (let row = 0; row < GRID_ROWS; row++) {
      grid[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        const isPath = pathSet.has(`${row},${col}`);
        const char = characters[Math.floor(this.rng.next() * characters.length)];

        grid[row][col] = {
          char,
          isPath,
        };
      }
    }

    return { grid, pathSequence };
  }

  protected onGameStart(): void {
    const now = Date.now();
    console.log(`🏁 Speed Race started for room ${this.roomId}`);
  }

  public updateGameState(deltaTime: number): void {
    // Check if any player has completed the race
    const state = this.gameState.gameSpecificState as SpeedRaceGameState;

    for (const [playerId, playerState] of this.gameState.players) {
      const playerData = playerState.gameSpecificData as SpeedRacePlayerData;

      // Check if player completed the race
      if (playerData.pathIndex >= state.totalPathLength - 1) {
        console.log(`🏆 Player ${playerState.displayName} completed the race!`);
        this.gameState.status = 'finished';
        playerState.isFinished = true;
        return;
      }

      // Check if player ran out of lives
      if (playerData.remainingLives <= 0) {
        console.log(`💀 Player ${playerState.displayName} ran out of lives`);
        playerState.isFinished = true;
      }
    }

    // Check if all players are finished (game over for all)
    const allFinished = Array.from(this.gameState.players.values()).every(p => p.isFinished);
    if (allFinished) {
      console.log(`🏁 Speed Race ended - all players finished or game over`);
      this.gameState.status = 'finished';
    }
  }

  handlePlayerInput(playerId: string, input: PlayerInput): InputResult {
    const playerState = this.gameState.players.get(playerId);
    if (!playerState) {
      return { success: false, error: 'Player not found' };
    }

    // Check if player already finished
    if (playerState.isFinished) {
      return { success: false, error: 'Player already finished' };
    }

    const state = this.gameState.gameSpecificState as SpeedRaceGameState;
    const playerData = playerState.gameSpecificData as SpeedRacePlayerData;

    // Validate input type
    if (input.inputType !== 'keystroke' || !input.data?.key) {
      return { success: false, error: 'Invalid input type' };
    }

    const key = input.data.key.toLowerCase();
    const now = Date.now();

    // Get next position in path
    const nextPathIndex = playerData.pathIndex + 1;
    if (nextPathIndex >= state.pathSequence.length) {
      // Player reached the end!
      playerState.isFinished = true;
      this.gameState.status = 'finished';

      return {
        success: true,
      };
    }

    const nextPos = state.pathSequence[nextPathIndex];
    const nextCell = state.grid[nextPos.row][nextPos.col];

    // Check if key matches the character at next position
    const correct = key === nextCell.char;

    playerState.keystrokeCount++;

    if (correct) {
      // Correct keystroke - move player forward!
      playerState.correctKeystrokes++;
      playerState.accuracy = (playerState.correctKeystrokes / playerState.keystrokeCount) * 100;

      playerData.pathIndex = nextPathIndex;
      playerData.currentRow = nextPos.row;
      playerData.currentCol = nextPos.col;
      playerData.visitedCells.push(nextPos);

      // Award points
      const points = 10;
      playerState.score += points;

      return {
        success: true,
      };
    } else {
      // Wrong keystroke - lose a life!
      playerData.remainingLives--;
      playerState.lives = playerData.remainingLives;
      playerState.accuracy = (playerState.correctKeystrokes / playerState.keystrokeCount) * 100;

      if (playerData.remainingLives <= 0) {
        playerState.isFinished = true;
      }

      return {
        success: false,
        error: `Wrong key! Expected: ${nextCell.char}`,
      };
    }
  }

  public checkWinCondition(): string | null {
    // Winner is the first player to complete the race
    for (const [playerId, playerState] of this.gameState.players) {
      const playerData = playerState.gameSpecificData as SpeedRacePlayerData;
      const state = this.gameState.gameSpecificState as SpeedRaceGameState;

      if (playerData.pathIndex >= state.totalPathLength - 1) {
        return playerId;
      }
    }

    return null;
  }

  serialize(): SerializedGameState {
    const state = this.gameState.gameSpecificState as SpeedRaceGameState;

    // Use base serialization
    const baseState = serializeGameState(this.gameState);

    // Include Speed Race-specific state
    // Send full grid and path to all players (no cheating concerns - everyone knows the path)
    return {
      ...baseState,
      gameSpecificState: {
        grid: state.grid,
        pathSequence: state.pathSequence,
        gridSeed: state.gridSeed,
        characters: state.characters,
        totalPathLength: state.totalPathLength,
      }
    };
  }
}
