// Socket.IO event types

import { GameRoom, PlayerState, GameState, GameInput, ChatMessage, MatchQueueEntry } from './multiplayer';

// Client to Server Events
export interface ClientToServerEvents {
  // Room events
  'room:create': (data: {
    gameType: string;
    roomName: string;
    password?: string;
    maxPlayers: number;
    settings?: any;
  }, callback: (response: { success: boolean; roomId?: string; error?: string }) => void) => void;

  'room:join': (data: {
    roomId: string;
    password?: string;
  }, callback: (response: { success: boolean; room?: GameRoom; error?: string }) => void) => void;

  'room:leave': (data: { roomId: string }) => void;

  'room:ready': (data: { roomId: string; isReady: boolean }) => void;

  'room:start': (data: { roomId: string }, callback: (response: { success: boolean; error?: string }) => void) => void;

  'room:kick': (data: { roomId: string; playerId: string }) => void;

  // Match events
  'match:queue': (data: {
    gameType: string;
  }, callback: (response: { success: boolean; error?: string }) => void) => void;

  'match:cancel': () => void;

  // Game events
  'game:input': (data: GameInput) => void;

  'game:ready': (data: { roomId: string }) => void;

  // Chat events
  'chat:send': (data: {
    type: 'lobby' | 'room';
    roomId?: string;
    message: string;
  }) => void;

  // Spectator events
  'spectator:join': (data: { roomId: string }, callback: (response: { success: boolean; error?: string }) => void) => void;

  'spectator:leave': (data: { roomId: string }) => void;

  // Connection events
  'player:identify': (data: {
    userId?: string;
    deviceId: string;
    displayName: string;
  }) => void;
}

// Server to Client Events
export interface ServerToClientEvents {
  // Room events
  'room:created': (data: { room: GameRoom }) => void;

  'room:updated': (data: { room: GameRoom }) => void;

  'room:deleted': (data: { roomId: string }) => void;

  'player:joined': (data: { roomId: string; player: any }) => void;

  'player:left': (data: { roomId: string; playerId: string }) => void;

  'player:ready': (data: { roomId: string; playerId: string; isReady: boolean }) => void;

  'player:kicked': (data: { roomId: string; playerId: string }) => void;

  // Match events
  'match:found': (data: { roomId: string; room: GameRoom }) => void;

  'match:timeout': () => void;

  // Game events
  'game:countdown': (data: { roomId: string; countdown: number }) => void;

  'game:started': (data: { roomId: string; gameState: GameState }) => void;

  'game:state:update': (data: { roomId: string; gameState: Partial<GameState> }) => void;

  'game:player:update': (data: { roomId: string; playerId: string; playerState: Partial<PlayerState> }) => void;

  'game:ended': (data: {
    roomId: string;
    winner: string;
    results: Array<{
      playerId: string;
      displayName: string;
      rank: number;
      score: number;
      metrics: any;
    }>;
  }) => void;

  // Chat events
  'chat:message': (data: ChatMessage) => void;

  'chat:error': (data: { code: string; message: string }) => void;

  // Spectator events
  'spectator:joined': (data: { roomId: string; currentState: GameState }) => void;

  'spectator:playerCount': (data: { roomId: string; count: number }) => void;

  // Error events
  'error': (data: { code: string; message: string }) => void;

  // Connection events
  'player:connected': (data: { playerId: string }) => void;

  'player:disconnected': (data: { playerId: string }) => void;

  // Lobby events
  'lobby:players': (data: {
    players: Array<{
      playerId: string;
      displayName: string;
      status: 'online' | 'in-game' | 'in-room';
    }>;
  }) => void;
}

// Inter-server Events (for Socket.IO clusters)
export interface InterServerEvents {
  'room:sync': (data: { roomId: string; room: GameRoom }) => void;
}

// Socket Data
export interface SocketData {
  playerId: string;
  userId?: string;
  deviceId: string;
  displayName: string;
  currentRoomId?: string;
}
