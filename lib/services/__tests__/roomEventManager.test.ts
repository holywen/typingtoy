import { RoomEventManager } from '../roomEventManager';
import { RoomManager } from '../roomManager';
import { sendSystemMessage } from '../socketHandlers/chatHandlers';
import { GameRoom } from '@/types/multiplayer';

// Mock dependencies
jest.mock('../roomManager', () => ({
  RoomManager: {
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    kickPlayer: jest.fn(),
    toggleReady: jest.fn(),
    getRoom: jest.fn(),
  },
}));

jest.mock('../socketHandlers/chatHandlers', () => ({
  sendSystemMessage: jest.fn(),
}));

jest.mock('../lobbyEventManager', () => ({
  LobbyEventManager: {
    handlePlayerLeave: jest.fn(),
    handlePlayerJoin: jest.fn(),
  },
}));

describe('RoomEventManager', () => {
  let mockIo: any;
  let mockRoom: GameRoom;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock io
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    // Mock room
    mockRoom = {
      roomId: 'room-123',
      roomName: 'Test Room',
      gameType: 'falling-blocks',
      maxPlayers: 4,
      players: [
        {
          playerId: 'player-123',
          displayName: 'TestPlayer',
          isHost: true,
          isReady: false,
          joinedAt: new Date(),
          isConnected: true,
        },
      ],
      spectators: [],
      status: 'waiting',
      settings: {},
      createdAt: new Date(),
    };
  });

  describe('handlePlayerJoin', () => {
    it('should handle new player joining room', async () => {
      const { LobbyEventManager } = await import('../lobbyEventManager');
      (RoomManager.joinRoom as jest.Mock).mockResolvedValue({
        success: true,
        room: mockRoom,
        isReconnect: false,
      });

      const result = await RoomEventManager.handlePlayerJoin(mockIo, {
        roomId: 'room-123',
        playerId: 'player-123',
        playerName: 'TestPlayer',
      });

      expect(result.success).toBe(true);
      expect(LobbyEventManager.handlePlayerLeave).toHaveBeenCalledWith(mockIo, {
        playerId: 'player-123',
        playerName: 'TestPlayer',
      });
      expect(mockIo.to).toHaveBeenCalledWith('room-123');
      expect(mockIo.emit).toHaveBeenCalledWith('room:updated', { room: mockRoom });
      expect(sendSystemMessage).toHaveBeenCalledWith(
        mockIo,
        'room',
        'TestPlayer joined the room',
        'room-123'
      );
    });

    // Reconnect functionality removed per user requirement "不要重连"
    // Test removed as it tested functionality that no longer exists

    it('should return error if join fails', async () => {
      (RoomManager.joinRoom as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Room is full',
      });

      const result = await RoomEventManager.handlePlayerJoin(mockIo, {
        roomId: 'room-123',
        playerId: 'player-123',
        playerName: 'TestPlayer',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Room is full');
      expect(sendSystemMessage).not.toHaveBeenCalled();
    });
  });

  describe('handlePlayerLeave', () => {
    it('should handle player leaving room', async () => {
      const { LobbyEventManager } = await import('../lobbyEventManager');
      (RoomManager.getRoom as jest.Mock).mockResolvedValue(mockRoom);
      (RoomManager.leaveRoom as jest.Mock).mockResolvedValue(mockRoom);

      await RoomEventManager.handlePlayerLeave(mockIo, {
        roomId: 'room-123',
        playerId: 'player-123',
        playerName: 'TestPlayer',
        socketId: 'socket-123',
      });

      expect(RoomManager.leaveRoom).toHaveBeenCalledWith('room-123', 'player-123');
      expect(mockIo.to).toHaveBeenCalledWith('room-123');
      expect(mockIo.emit).toHaveBeenCalledWith('room:updated', { room: mockRoom });
      expect(sendSystemMessage).toHaveBeenCalledWith(
        mockIo,
        'room',
        'TestPlayer left the room',
        'room-123'
      );
      expect(LobbyEventManager.handlePlayerJoin).toHaveBeenCalledWith(mockIo, {
        playerId: 'player-123',
        playerName: 'TestPlayer',
        socketId: 'socket-123',
      });
    });

    it('should skip if player not in room', async () => {
      (RoomManager.getRoom as jest.Mock).mockResolvedValue({
        ...mockRoom,
        players: [],
      });

      await RoomEventManager.handlePlayerLeave(mockIo, {
        roomId: 'room-123',
        playerId: 'player-123',
        playerName: 'TestPlayer',
      });

      expect(RoomManager.leaveRoom).not.toHaveBeenCalled();
      expect(sendSystemMessage).not.toHaveBeenCalled();
    });

    it('should emit room:deleted when room is deleted', async () => {
      (RoomManager.getRoom as jest.Mock).mockResolvedValue(mockRoom);
      (RoomManager.leaveRoom as jest.Mock).mockResolvedValue(null);

      await RoomEventManager.handlePlayerLeave(mockIo, {
        roomId: 'room-123',
        playerId: 'player-123',
        playerName: 'TestPlayer',
      });

      expect(mockIo.emit).toHaveBeenCalledWith('room:deleted', { roomId: 'room-123' });
    });

    it('should not return to lobby if no socketId provided', async () => {
      const { LobbyEventManager } = await import('../lobbyEventManager');
      (RoomManager.getRoom as jest.Mock).mockResolvedValue(mockRoom);
      (RoomManager.leaveRoom as jest.Mock).mockResolvedValue(mockRoom);

      await RoomEventManager.handlePlayerLeave(mockIo, {
        roomId: 'room-123',
        playerId: 'player-123',
        playerName: 'TestPlayer',
      });

      expect(LobbyEventManager.handlePlayerJoin).not.toHaveBeenCalled();
    });
  });

  describe('handlePlayerKick', () => {
    it('should handle player being kicked', async () => {
      const { LobbyEventManager } = await import('../lobbyEventManager');
      (RoomManager.kickPlayer as jest.Mock).mockResolvedValue(mockRoom);

      await RoomEventManager.handlePlayerKick(mockIo, {
        roomId: 'room-123',
        hostId: 'host-123',
        targetId: 'player-456',
        targetName: 'KickedPlayer',
        targetSocketId: 'socket-456',
      });

      expect(RoomManager.kickPlayer).toHaveBeenCalledWith(
        'room-123',
        'host-123',
        'player-456'
      );
      expect(mockIo.emit).toHaveBeenCalledWith('room:updated', { room: mockRoom });
      expect(sendSystemMessage).toHaveBeenCalledWith(
        mockIo,
        'room',
        'KickedPlayer was kicked from the room',
        'room-123'
      );
      expect(LobbyEventManager.handlePlayerJoin).toHaveBeenCalledWith(mockIo, {
        playerId: 'player-456',
        playerName: 'KickedPlayer',
        socketId: 'socket-456',
      });
    });

    it('should not process if kick fails', async () => {
      (RoomManager.kickPlayer as jest.Mock).mockResolvedValue(null);

      await RoomEventManager.handlePlayerKick(mockIo, {
        roomId: 'room-123',
        hostId: 'host-123',
        targetId: 'player-456',
        targetName: 'KickedPlayer',
      });

      expect(sendSystemMessage).not.toHaveBeenCalled();
    });
  });

  describe('handlePlayerReady', () => {
    it('should handle player ready toggle', async () => {
      (RoomManager.toggleReady as jest.Mock).mockResolvedValue(mockRoom);

      await RoomEventManager.handlePlayerReady(mockIo, {
        roomId: 'room-123',
        playerId: 'player-123',
        isReady: true,
      });

      expect(RoomManager.toggleReady).toHaveBeenCalledWith(
        'room-123',
        'player-123',
        true
      );
      expect(mockIo.emit).toHaveBeenCalledWith('room:updated', { room: mockRoom });
      expect(mockIo.emit).toHaveBeenCalledWith('player:ready', {
        roomId: 'room-123',
        playerId: 'player-123',
        isReady: true,
      });
    });

    it('should not emit if toggle fails', async () => {
      (RoomManager.toggleReady as jest.Mock).mockResolvedValue(null);

      await RoomEventManager.handlePlayerReady(mockIo, {
        roomId: 'room-123',
        playerId: 'player-123',
        isReady: true,
      });

      expect(mockIo.emit).not.toHaveBeenCalled();
    });
  });
});
