// Room-related socket event handlers

import { TypedServer, TypedSocket } from '../socketServer';
import { RoomManager } from '../roomManager';
import { sendSystemMessage } from './chatHandlers';

export function registerRoomHandlers(io: TypedServer, socket: TypedSocket): void {
  // Room creation
  socket.on('room:create', async (data, callback) => {
    try {
      const { playerId, displayName, userId } = socket.data;

      console.log(`🏗️  room:create request from ${displayName}: gameType="${data.gameType}", roomName="${data.roomName}"`);

      // Restriction 1: In production, only authenticated users can create rooms
      const isProduction = process.env.NODE_ENV === 'production';
      console.log(`🔒 Room creation auth check: isProduction=${isProduction}, userId=${userId ? 'present' : 'missing'}, NODE_ENV=${process.env.NODE_ENV}`);

      if (isProduction && !userId) {
        console.log(`❌ Room creation denied: user not authenticated in production`);
        callback({
          success: false,
          error: 'You must be logged in to create a room. Please sign in to continue.'
        });
        return;
      }

      // Check if player is already in a room
      const existingRoom = await RoomManager.getRoomByPlayerId(playerId);
      if (existingRoom) {
        callback({ success: false, error: 'Already in a room' });
        return;
      }

      // Restriction 2: Each user can only host ONE room at a time
      // Use userId for authenticated users, deviceId for guests (in dev/test mode)
      const hostIdentifier = userId || playerId;
      const hostedRoom = await RoomManager.getRoomByHostId(hostIdentifier);
      if (hostedRoom) {
        callback({
          success: false,
          error: 'You already have an active room. Please close it first.'
        });
        return;
      }

      // Create room
      const room = await RoomManager.createRoom({
        gameType: data.gameType,
        roomName: data.roomName,
        password: data.password,
        maxPlayers: data.maxPlayers,
        hostId: playerId,
        hostName: displayName,
        settings: data.settings,
      });

      console.log(`✅ Room created: ${room.roomId}, gameType="${room.gameType}"`);

      // Join socket room
      socket.join(room.roomId);
      socket.data.currentRoomId = room.roomId;

      // Notify all clients about new room
      io.emit('room:created', { room });

      callback({ success: true, roomId: room.roomId });
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ success: false, error: 'Failed to create room' });
    }
  });

  // Room join
  socket.on('room:join', async (data, callback) => {
    try {
      const { playerId, displayName } = socket.data;

      // Check if player is already in a room
      const existingRoom = await RoomManager.getRoomByPlayerId(playerId);
      if (existingRoom && existingRoom.roomId !== data.roomId) {
        callback({ success: false, error: 'Already in another room' });
        return;
      }

      // Join room
      const result = await RoomManager.joinRoom({
        roomId: data.roomId,
        playerId,
        playerName: displayName,
        password: data.password,
      });

      if (!result.success) {
        callback(result);
        return;
      }

      // Join socket room
      socket.join(data.roomId);
      socket.data.currentRoomId = data.roomId;

      // Notify room about new player
      io.to(data.roomId).emit('room:updated', { room: result.room! });
      io.to(data.roomId).emit('player:joined', {
        roomId: data.roomId,
        player: result.room!.players.find(p => p.playerId === playerId),
      });

      // Send system message to room chat
      await sendSystemMessage(io, 'room', `${displayName} joined the room`, data.roomId);

      callback({ success: true, room: result.room! });
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ success: false, error: 'Failed to join room' });
    }
  });

  // Room leave
  socket.on('room:leave', async (data) => {
    try {
      const { playerId, displayName } = socket.data;
      const { roomId } = data;

      // Leave room
      const room = await RoomManager.leaveRoom(roomId, playerId);

      // Leave socket room
      socket.leave(roomId);
      socket.data.currentRoomId = undefined;

      if (room) {
        // Notify remaining players
        io.to(roomId).emit('room:updated', { room });
        io.to(roomId).emit('player:left', { roomId, playerId });

        // Send system message to room chat
        await sendSystemMessage(io, 'room', `${displayName} left the room`, roomId);
      } else {
        // Room was deleted
        io.emit('room:deleted', { roomId });
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Player ready
  socket.on('room:ready', async (data) => {
    try {
      const { playerId } = socket.data;
      const { roomId, isReady } = data;

      // Toggle ready status
      const room = await RoomManager.toggleReady(roomId, playerId, isReady);

      if (room) {
        // Notify room
        io.to(roomId).emit('room:updated', { room });
        io.to(roomId).emit('player:ready', { roomId, playerId, isReady });
      }
    } catch (error) {
      console.error('Error toggling ready:', error);
    }
  });

  // Start game
  socket.on('room:start', async (data, callback) => {
    try {
      const { playerId } = socket.data;
      const { roomId } = data;

      console.log(`🎮 room:start event received from ${socket.data.displayName} for room ${roomId}`);

      // Start game
      const result = await RoomManager.startGame(roomId, playerId);

      if (!result.success) {
        callback(result);
        return;
      }

      // Get updated room
      const room = await RoomManager.getRoom(roomId);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      // Notify room - countdown then start
      let countdown = 3;
      io.to(roomId).emit('game:countdown', { roomId, countdown });

      // Countdown
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          io.to(roomId).emit('game:countdown', { roomId, countdown });
        } else {
          clearInterval(countdownInterval);
        }
      }, 1000);

      // Wait for countdown then trigger actual game start
      setTimeout(async () => {
        console.log(`✅ Countdown finished, starting game for room ${roomId}`);

        try {
          // Import game handlers to start the game
          const { startGameForRoom } = await import('./gameHandlers');
          console.log(`📞 About to call startGameForRoom for room ${roomId}`);
          await startGameForRoom(io, roomId);
          console.log(`✅ startGameForRoom completed for room ${roomId}`);
        } catch (error) {
          console.error('❌ Error starting game after countdown:', error);
          io.to(roomId).emit('game:error', {
            code: 'START_ERROR',
            message: 'Failed to start game'
          });
        }
      }, 3000);

      callback({ success: true });
    } catch (error) {
      console.error('Error starting game:', error);
      callback({ success: false, error: 'Failed to start game' });
    }
  });

  // Kick player
  socket.on('room:kick', async (data) => {
    try {
      const { playerId: hostId } = socket.data;
      const { roomId, playerId: targetId } = data;

      // Get target player's name before kicking
      const targetSockets = await io.in(roomId).fetchSockets();
      const targetSocket = targetSockets.find(s => s.data.playerId === targetId);
      const targetName = targetSocket?.data.displayName || 'Player';

      // Kick player
      const room = await RoomManager.kickPlayer(roomId, hostId, targetId);

      if (room) {
        // Notify kicked player
        if (targetSocket) {
          targetSocket.leave(roomId);
          targetSocket.data.currentRoomId = undefined;
          targetSocket.emit('player:kicked', { roomId, playerId: targetId });
        }

        // Notify room
        io.to(roomId).emit('room:updated', { room });
        io.to(roomId).emit('player:left', { roomId, playerId: targetId });

        // Send system message to room chat
        await sendSystemMessage(io, 'room', `${targetName} was kicked from the room`, roomId);
      }
    } catch (error) {
      console.error('Error kicking player:', error);
    }
  });
}
