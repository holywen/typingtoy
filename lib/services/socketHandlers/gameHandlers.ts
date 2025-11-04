// Game-related socket event handlers

import { TypedServer, TypedSocket } from '../socketServer';
import { RoomManager } from '../roomManager';
import { FallingBlocksMultiplayer } from '@/lib/game-engine/FallingBlocksMultiplayer';
import type { PlayerInput } from '@/lib/game-engine/GameState';
import { AntiCheatValidator } from '../antiCheat';

// Store active game instances
const activeGames = new Map<string, FallingBlocksMultiplayer>();

// Store last keystroke timestamp for each player (for anti-cheat)
const playerLastKeystroke = new Map<string, number>();

/**
 * Start a game for a given room
 * This can be called directly from other handlers
 */
export async function startGameForRoom(io: TypedServer, roomId: string): Promise<void> {
  try {
    const room = await RoomManager.getRoom(roomId);
    if (!room) {
      console.error(`Cannot start game: Room ${roomId} not found`);
      return;
    }

    console.log(`🎮 Starting FallingBlocks game for room ${roomId}`);

    // Create game instance
    const gameConfig = {
      lessonId: room.settings?.lessonId,
      difficulty: room.settings?.difficulty,
      timeLimit: room.settings?.timeLimit || 120, // Default 2 minutes
    };

    const game = new FallingBlocksMultiplayer({
      roomId,
      players: room.players.map(p => ({ playerId: p.playerId, displayName: p.displayName })),
      seed: room.settings?.seed || Date.now(),
      settings: gameConfig,
    });

    activeGames.set(roomId, game);

    // Start the game immediately (countdown already handled by room handler)
    game.startImmediate();

    // Broadcast game state to all players every 100ms
    const broadcastLoop = setInterval(() => {
      const state = game.serialize();
      io.to(roomId).emit('game:state', state);

      // Check if game is over
      if (game.isGameOver()) {
        clearInterval(broadcastLoop);
        game.stop(); // Stop the game's internal update loop
        const winner = game.getWinner();
        console.log(`🏁 Game ended in room ${roomId}, winner: ${winner}`);
        io.to(roomId).emit('game:ended', {
          winner,
          finalState: state,
        });
        activeGames.delete(roomId);
        // TODO: Update room status back to waiting when implementing game end
      }
    }, 100);

    // Emit game started event
    io.to(roomId).emit('game:started', {
      roomId,
      seed: room.settings?.seed || Date.now(),
      config: gameConfig,
    });

    console.log(`✅ Game started in room ${roomId}`);
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
}

export function registerGameHandlers(io: TypedServer, socket: TypedSocket): void {
  const playerId = socket.data.playerId;
  const displayName = socket.data.displayName;

  // Start game
  socket.on('game:start', async ({ roomId }) => {
    try {
      const room = await RoomManager.getRoom(roomId);
      if (!room) {
        socket.emit('game:error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
        return;
      }

      // Only host can start
      const player = room.players.find(p => p.playerId === playerId);
      if (!player?.isHost) {
        socket.emit('game:error', { code: 'NOT_HOST', message: 'Only host can start game' });
        return;
      }

      // Check if all players are ready
      const allReady = room.players.every(p => p.isReady);
      if (!allReady) {
        socket.emit('game:error', { code: 'NOT_ALL_READY', message: 'Not all players are ready' });
        return;
      }

      // Create game instance
      const gameConfig = {
        lessonId: room.settings?.lessonId,
        difficulty: room.settings?.difficulty,
        timeLimit: room.settings?.timeLimit || 120, // Default 2 minutes
      };

      const game = new FallingBlocksMultiplayer({
        roomId,
        players: room.players.map(p => ({ playerId: p.playerId, displayName: p.displayName })),
        seed: room.settings?.seed || Date.now(),
        settings: gameConfig,
      });

      activeGames.set(roomId, game);

      // Update room status
      await RoomManager.updateRoomStatus(roomId, 'playing');

      // Start game loop - broadcast state every 100ms
      const gameLoop = setInterval(() => {
        const state = game.getSerializedState();
        io.to(roomId).emit('game:state', state);

        // Check if game is over
        if (game.isGameOver()) {
          clearInterval(gameLoop);
          const winner = game.getWinner();
          io.to(roomId).emit('game:ended', {
            winner,
            finalState: state,
          });
          activeGames.delete(roomId);
          // Update room status back to waiting
          RoomManager.updateRoomStatus(roomId, 'waiting').catch(console.error);
        }
      }, 100);

      // Emit game started event
      io.to(roomId).emit('game:started', {
        roomId,
        seed: room.settings?.seed || Date.now(),
        config: gameConfig,
      });

      console.log(`✅ Game started in room ${roomId}`);
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('game:error', { code: 'START_ERROR', message: 'Failed to start game' });
    }
  });

  // Game input (keystroke)
  socket.on('game:input', async ({ roomId, input }: { roomId: string; input: PlayerInput }) => {
    try {
      const game = activeGames.get(roomId);
      if (!game) {
        socket.emit('game:error', { code: 'GAME_NOT_FOUND', message: 'Game not found' });
        return;
      }

      // Anti-cheat: Validate keystroke timing
      const now = Date.now();
      const lastTimestamp = playerLastKeystroke.get(playerId);

      const validation = AntiCheatValidator.validateKeystroke({
        char: input.char,
        timestamp: now,
        previousTimestamp: lastTimestamp,
        expectedChar: input.char, // Game engine will validate correctness
      });

      if (!validation.valid) {
        AntiCheatValidator.logSuspiciousActivity(playerId, displayName, validation);
        socket.emit('game:input:rejected', {
          reason: validation.reason || 'Anti-cheat validation failed',
          input,
        });
        console.log(`⚠️ Anti-cheat rejected input from ${displayName}: ${validation.reason}`);
        return;
      }

      // Update last keystroke timestamp
      playerLastKeystroke.set(playerId, now);

      // Process player input
      console.log(`🎮 Processing input from ${playerId}:`, input);
      const result = game.handlePlayerInput(playerId, input);
      console.log(`📊 Input result:`, result);

      // Broadcast updated player state to all players in room
      if (result.success) {
        const playerState = game.getPlayerState(playerId);
        io.to(roomId).emit('game:player:update', {
          playerId,
          playerState,
        });
        console.log(`✅ Block destroyed! Player ${playerId} score: ${playerState?.score}`);
      } else {
        socket.emit('game:input:rejected', {
          reason: result.error,
          input,
        });
        console.log(`❌ Input rejected: ${result.error}`);
      }
    } catch (error) {
      console.error('Error handling game input:', error);
      socket.emit('game:error', { code: 'INPUT_ERROR', message: 'Failed to process input' });
    }
  });

  // Player disconnected during game
  socket.on('disconnect', async () => {
    try {
      // Clean up anti-cheat data
      playerLastKeystroke.delete(playerId);

      // Find if player was in any active game
      for (const [roomId, game] of activeGames.entries()) {
        const playerState = game.getPlayerState(playerId);
        if (playerState) {
          // TODO: Implement handlePlayerDisconnect in FallingBlocksMultiplayer
          // For now, just notify other players

          // Notify other players
          io.to(roomId).emit('game:player:disconnected', {
            playerId,
            displayName,
          });

          console.log(`Player ${displayName} disconnected from game in room ${roomId}`);
        }
      }
    } catch (error) {
      console.error('Error handling disconnect in game:', error);
    }
  });
}

// Export helper to clean up game on room deletion
export function cleanupGame(roomId: string): void {
  const game = activeGames.get(roomId);
  if (game) {
    activeGames.delete(roomId);
    console.log(`🧹 Cleaned up game for room ${roomId}`);
  }
}
