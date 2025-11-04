// Redis data structure types

export interface RoomCacheData {
  roomData: string;  // JSON string of GameRoom
  players: string;   // JSON string of PlayerInRoom[]
  status: string;
}

export interface OnlinePlayer {
  playerId: string;
  displayName: string;
  status: 'lobby' | 'in_room' | 'in_game';
  roomId?: string;
  lastSeen: number;
}

export interface CachedChatMessage {
  id: string;
  playerId: string;
  displayName: string;
  message: string;
  timestamp: number;
}
