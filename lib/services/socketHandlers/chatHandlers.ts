// Chat-related socket event handlers

import { TypedServer, TypedSocket } from '../socketServer';
import { ChatCache } from '@/lib/redis/chatCache';
import { ChatMessage } from '@/types/multiplayer';
import { ProfanityFilter } from '@/lib/utils/profanityFilter';

export function registerChatHandlers(io: TypedServer, socket: TypedSocket): void {
  // Send chat message
  socket.on('chat:send', async (data) => {
    console.log('💬 chat:send received:', data);
    try {
      const { playerId, displayName } = socket.data;
      const { type, roomId, message } = data;
      console.log(`💬 From ${displayName} (${playerId}), type: ${type}, message: ${message}`);

      // Validate message
      if (!message || message.trim().length === 0) {
        console.log('⚠️  Empty message, ignoring');
        return;
      }

      if (message.length > 200) {
        socket.emit('chat:error', {
          code: 'TOO_LONG',
          message: 'Message too long (max 200 characters)',
        });
        return;
      }

      // Check rate limit
      const allowed = await ChatCache.checkRateLimit(playerId);
      if (!allowed) {
        socket.emit('chat:error', {
          code: 'RATE_LIMIT',
          message: 'Too many messages, please slow down',
        });
        return;
      }

      // Check if muted
      const isMuted = await ChatCache.isPlayerMuted(playerId);
      if (isMuted) {
        socket.emit('chat:error', {
          code: 'MUTED',
          message: 'You are temporarily muted',
        });
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
    } catch (error) {
      console.error('❌ Error handling chat message:', error);
      socket.emit('chat:error', {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send message',
      });
    }
  });
}
