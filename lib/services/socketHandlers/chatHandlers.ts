// Chat-related socket event handlers

import { TypedServer, TypedSocket } from '../socketServer';
import { ChatCache } from '@/lib/redis/chatCache';
import { ChatMessage } from '@/types/multiplayer';
import { ProfanityFilter } from '@/lib/utils/profanityFilter';

/**
 * Send a system message to lobby or room chat
 */
export async function sendSystemMessage(
  io: TypedServer,
  type: 'lobby' | 'room',
  message: string,
  roomId?: string
): Promise<void> {
  const systemMessage: ChatMessage = {
    id: `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    roomId,
    playerId: 'system',
    displayName: 'System',
    message,
    timestamp: Date.now(),
    isSystem: true,
  };

  // Save to cache
  await ChatCache.saveMessage(systemMessage);

  // Broadcast message
  if (type === 'lobby') {
    console.log(`📢 [SYSTEM MSG] Sending to lobby: "${message}"`);
    io.emit('chat:message', systemMessage);
  } else if (type === 'room' && roomId) {
    // Get sockets in the room for debugging
    const socketsInRoom = await io.in(roomId).fetchSockets();
    console.log(`📢 [SYSTEM MSG] Sending to room ${roomId}: "${message}" (${socketsInRoom.length} sockets in room)`);
    socketsInRoom.forEach((s, i) => {
      console.log(`   Socket ${i + 1}: ${s.data.displayName} (${s.data.playerId})`);
    });

    io.to(roomId).emit('chat:message', systemMessage);
    console.log(`✅ [SYSTEM MSG] Message sent to room ${roomId}`);
  }
}

export function registerChatHandlers(io: TypedServer, socket: TypedSocket): void {
  // Send chat message
  socket.on('chat:send', async (data, callback) => {
    console.log('💬 chat:send received:', data);
    try {
      const { playerId, displayName } = socket.data;
      const { type, roomId, message } = data;
      console.log(`💬 From ${displayName} (${playerId}), type: ${type}, message: ${message}`);

      // Validate message
      if (!message || message.trim().length === 0) {
        console.log('⚠️  Empty message, ignoring');
        callback?.({ success: false, error: 'Empty message' });
        return;
      }

      if (message.length > 200) {
        socket.emit('chat:error', {
          code: 'TOO_LONG',
          message: 'Message too long (max 200 characters)',
        });
        callback?.({ success: false, error: 'Message too long (max 200 characters)' });
        return;
      }

      // Check rate limit
      const allowed = await ChatCache.checkRateLimit(playerId);
      if (!allowed) {
        socket.emit('chat:error', {
          code: 'RATE_LIMIT',
          message: 'Too many messages, please slow down',
        });
        callback?.({ success: false, error: 'Too many messages, please slow down' });
        return;
      }

      // Check if muted
      const isMuted = await ChatCache.isPlayerMuted(playerId);
      if (isMuted) {
        socket.emit('chat:error', {
          code: 'MUTED',
          message: 'You are temporarily muted',
        });
        callback?.({ success: false, error: 'You are temporarily muted' });
        return;
      }

      // Check for profanity
      const profanityCheck = ProfanityFilter.validate(message);
      if (!profanityCheck.isValid) {
        // Too much profanity - mute player for 1 minute
        await ChatCache.mutePlayer(playerId, 60000);
        socket.emit('chat:error', {
          code: 'BAD_WORD',
          message: 'Please keep chat respectful. You have been temporarily muted.',
        });
        callback?.({ success: false, error: 'Please keep chat respectful. You have been temporarily muted.' });
        return;
      }

      // Use filtered message
      const filteredMessage = profanityCheck.filtered;

      // Create chat message
      const chatMessage: ChatMessage = {
        id: `${Date.now()}_${playerId}`,
        type,
        roomId,
        playerId,
        displayName,
        message: filteredMessage.trim(),
        timestamp: Date.now(),
      };

      // Save to cache
      await ChatCache.saveMessage(chatMessage);

      // Broadcast message
      if (type === 'lobby') {
        console.log(`📢 Broadcasting lobby message to all clients`);
        io.emit('chat:message', chatMessage);
      } else if (type === 'room' && roomId) {
        console.log(`📢 Broadcasting room message to room ${roomId}`);
        io.to(roomId).emit('chat:message', chatMessage);
      }
      console.log('✅ Chat message broadcast successfully');

      // Send success acknowledgment to client
      callback?.({ success: true });
    } catch (error) {
      console.error('❌ Error handling chat message:', error);
      socket.emit('chat:error', {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send message',
      });
      callback?.({ success: false, error: 'Failed to send message' });
    }
  });
}
