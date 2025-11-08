import { LobbyEventManager } from '../lobbyEventManager';
import { redis } from '@/lib/redis/client';
import { sendSystemMessage } from '../socketHandlers/chatHandlers';

// Mock dependencies
jest.mock('@/lib/redis/client', () => ({
  redis: {
    sismember: jest.fn(),
    sadd: jest.fn(),
    set: jest.fn(),
    srem: jest.fn(),
    del: jest.fn(),
    smembers: jest.fn(),
    get: jest.fn(),
    scard: jest.fn(),
  },
}));

jest.mock('../socketHandlers/chatHandlers', () => ({
  sendSystemMessage: jest.fn(),
}));

jest.mock('../roomManager', () => ({
  RoomManager: {
    getRoomByPlayerId: jest.fn(),
  },
}));

describe('LobbyEventManager', () => {
  let mockIo: any;
  let mockSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock socket
    mockSocket = {
      id: 'socket-123',
      data: {
        displayName: 'TestPlayer',
      },
    };

    // Mock io
    mockIo = {
      emit: jest.fn(),
      sockets: {
        sockets: new Map([['socket-123', mockSocket]]),
      },
    };
  });

  describe('handlePlayerJoin', () => {
    it('should add new player to lobby and send join message', async () => {
      (redis.sismember as jest.Mock).mockResolvedValue(false);
      (redis.smembers as jest.Mock).mockResolvedValue(['player-123']);
      (redis.get as jest.Mock).mockResolvedValue('socket-123');

      await LobbyEventManager.handlePlayerJoin(mockIo, {
        playerId: 'player-123',
        playerName: 'TestPlayer',
        socketId: 'socket-123',
      });

      expect(redis.sadd).toHaveBeenCalledWith('online:players', 'player-123');
      expect(redis.set).toHaveBeenCalledWith(
        'player:player-123:socketId',
        'socket-123',
        'EX',
        86400
      );
      expect(sendSystemMessage).toHaveBeenCalledWith(
        mockIo,
        'lobby',
        'TestPlayer joined the lobby'
      );
    });

    it('should skip join message if player already in lobby', async () => {
      (redis.sismember as jest.Mock).mockResolvedValue(true);

      await LobbyEventManager.handlePlayerJoin(mockIo, {
        playerId: 'player-123',
        playerName: 'TestPlayer',
        socketId: 'socket-123',
      });

      expect(redis.sadd).not.toHaveBeenCalled();
      expect(sendSystemMessage).not.toHaveBeenCalled();
    });
  });

  describe('handlePlayerLeave', () => {
    it('should remove player from lobby and send leave message', async () => {
      (redis.sismember as jest.Mock).mockResolvedValue(true);
      (redis.smembers as jest.Mock).mockResolvedValue([]);

      await LobbyEventManager.handlePlayerLeave(mockIo, {
        playerId: 'player-123',
        playerName: 'TestPlayer',
      });

      expect(redis.srem).toHaveBeenCalledWith('online:players', 'player-123');
      expect(redis.del).toHaveBeenCalledWith('player:player-123:socketId');
      expect(sendSystemMessage).toHaveBeenCalledWith(
        mockIo,
        'lobby',
        'TestPlayer left the lobby'
      );
    });

    it('should skip leave message if player not in lobby', async () => {
      (redis.sismember as jest.Mock).mockResolvedValue(false);

      await LobbyEventManager.handlePlayerLeave(mockIo, {
        playerId: 'player-123',
        playerName: 'TestPlayer',
      });

      expect(redis.srem).not.toHaveBeenCalled();
      expect(sendSystemMessage).not.toHaveBeenCalled();
    });
  });

  describe('broadcastOnlinePlayers', () => {
    it('should broadcast list of online players', async () => {
      const { RoomManager } = await import('../roomManager');
      (redis.smembers as jest.Mock).mockResolvedValue(['player-123']);
      (redis.get as jest.Mock).mockResolvedValue('socket-123');
      (RoomManager.getRoomByPlayerId as jest.Mock).mockResolvedValue(null);

      await LobbyEventManager.broadcastOnlinePlayers(mockIo);

      expect(mockIo.emit).toHaveBeenCalledWith('lobby:players', {
        players: [
          {
            playerId: 'player-123',
            displayName: 'TestPlayer',
            status: 'online',
          },
        ],
      });
    });

    it('should remove stale players from Redis', async () => {
      (redis.smembers as jest.Mock).mockResolvedValue(['stale-player']);
      (redis.get as jest.Mock).mockResolvedValue('missing-socket');

      await LobbyEventManager.broadcastOnlinePlayers(mockIo);

      expect(redis.srem).toHaveBeenCalledWith('online:players', 'stale-player');
      expect(redis.del).toHaveBeenCalledWith('player:stale-player:socketId');
    });

    it('should set status to in-room for players in waiting rooms', async () => {
      const { RoomManager } = await import('../roomManager');
      (redis.smembers as jest.Mock).mockResolvedValue(['player-123']);
      (redis.get as jest.Mock).mockResolvedValue('socket-123');
      (RoomManager.getRoomByPlayerId as jest.Mock).mockResolvedValue({
        status: 'waiting',
      });

      await LobbyEventManager.broadcastOnlinePlayers(mockIo);

      expect(mockIo.emit).toHaveBeenCalledWith('lobby:players', {
        players: [
          {
            playerId: 'player-123',
            displayName: 'TestPlayer',
            status: 'in-room',
          },
        ],
      });
    });

    it('should set status to in-game for players in playing rooms', async () => {
      const { RoomManager } = await import('../roomManager');
      (redis.smembers as jest.Mock).mockResolvedValue(['player-123']);
      (redis.get as jest.Mock).mockResolvedValue('socket-123');
      (RoomManager.getRoomByPlayerId as jest.Mock).mockResolvedValue({
        status: 'playing',
      });

      await LobbyEventManager.broadcastOnlinePlayers(mockIo);

      expect(mockIo.emit).toHaveBeenCalledWith('lobby:players', {
        players: [
          {
            playerId: 'player-123',
            displayName: 'TestPlayer',
            status: 'in-game',
          },
        ],
      });
    });

    it('should handle errors gracefully', async () => {
      (redis.smembers as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(
        LobbyEventManager.broadcastOnlinePlayers(mockIo)
      ).resolves.not.toThrow();
    });
  });

  describe('getOnlinePlayersCount', () => {
    it('should return online players count', async () => {
      (redis.scard as jest.Mock).mockResolvedValue(5);

      const count = await LobbyEventManager.getOnlinePlayersCount();

      expect(count).toBe(5);
      expect(redis.scard).toHaveBeenCalledWith('online:players');
    });

    it('should return 0 on error', async () => {
      (redis.scard as jest.Mock).mockRejectedValue(new Error('Redis error'));

      const count = await LobbyEventManager.getOnlinePlayersCount();

      expect(count).toBe(0);
    });
  });
});
