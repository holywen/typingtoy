// Match-related socket event handlers

import { TypedServer, TypedSocket } from '../socketServer';
import { MatchmakingService } from '../matchmaking';
import { RoomManager } from '../roomManager';
import { GameType } from '@/types/multiplayer';

export function registerMatchHandlers(io: TypedServer, socket: TypedSocket): void {
  // Queue for matchmaking
  socket.on('match:queue', async (data, callback) => {
    console.log('🎯 match:queue event received:', { playerId: socket.data.playerId, gameType: data.gameType });
    try {
      const { playerId, displayName } = socket.data;
      const { gameType } = data;

      // Check if already in a room
      const existingRoom = await RoomManager.getRoomByPlayerId(playerId);
      if (existingRoom) {
        callback({ success: false, error: 'Already in a room' });
        return;
      }

      // Check if already in queue
      const inQueue = await MatchmakingService.isPlayerInQueue(playerId, gameType as GameType);
      if (inQueue) {
        callback({ success: false, error: 'Already in matchmaking queue' });
        return;
      }

      // Add to queue
      const result = await MatchmakingService.addToQueue({
        playerId,
        displayName,
        gameType: gameType as GameType,
      });

      if (result.success) {
        // Store that player is in queue
        socket.data.inMatchmaking = true;
        socket.data.matchmakingGameType = gameType;

        // Set timeout for matchmaking (60 seconds)
        setTimeout(async () => {
          const stillInQueue = await MatchmakingService.isPlayerInQueue(playerId, gameType as GameType);
          if (stillInQueue) {
            // Remove from queue and notify
            await MatchmakingService.removeFromQueue(playerId);
            socket.emit('match:timeout');
            socket.data.inMatchmaking = false;
            socket.data.matchmakingGameType = undefined;
          }
        }, 60000);

        callback({ success: true });
      } else {
        callback(result);
      }
    } catch (error) {
      console.error('Error queuing for match:', error);
      callback({ success: false, error: 'Failed to queue' });
    }
  });

  // Cancel matchmaking
  socket.on('match:cancel', async () => {
    try {
      const { playerId } = socket.data;

      await MatchmakingService.removeFromQueue(playerId);
      socket.data.inMatchmaking = false;
      socket.data.matchmakingGameType = undefined;
    } catch (error) {
      console.error('Error canceling match:', error);
    }
  });
}

/**
 * Notify player about match found
 * This is called by the matchmaking service when a match is created
 */
export async function notifyMatchFound(io: TypedServer, playerId: string, roomId: string): Promise<void> {
  const room = await RoomManager.getRoom(roomId);
  if (!room) return;

  // Find player's socket
  const sockets = await io.fetchSockets();
  const playerSocket = sockets.find(s => s.data.playerId === playerId);

  if (playerSocket) {
    playerSocket.emit('match:found', { roomId, room });
    playerSocket.data.inMatchmaking = false;
    playerSocket.data.matchmakingGameType = undefined;

    // Auto-join the room
    playerSocket.join(roomId);
    playerSocket.data.currentRoomId = roomId;
  }
}
