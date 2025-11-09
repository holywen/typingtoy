'use client';

import { useState, useEffect } from 'react';
import { onSocketEvent, offSocketEvent, emitSocketEvent, getSocket } from '@/lib/services/socketClient';

interface OnlinePlayer {
  playerId: string;
  displayName: string;
  status: 'online' | 'in-game' | 'in-room';
}

export default function OnlinePlayerList() {
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);

  useEffect(() => {
    console.log('🎯 [OnlinePlayerList] Component mounted, setting up listener');

    // Listen for online players updates
    const handlePlayersUpdate = (data: { players: OnlinePlayer[] }) => {
      console.log('📥 [OnlinePlayerList] Received player update:', data.players.length, 'players');
      setPlayers(data.players);
    };

    const cleanupUpdate = onSocketEvent('lobby:players', handlePlayersUpdate);

    // Request initial player list - wait for socket connection
    const requestPlayerList = () => {
      const socket = getSocket();
      if (socket?.connected) {
        console.log('📤 [OnlinePlayerList] Requesting initial player list');
        emitSocketEvent('lobby:request-players');
      } else {
        console.log('⏳ [OnlinePlayerList] Socket not connected, waiting...');
        // Wait for connection and try again
        socket?.once('connect', () => {
          console.log('✅ [OnlinePlayerList] Socket connected, requesting player list');
          emitSocketEvent('lobby:request-players');
        });
      }
    };

    requestPlayerList();

    return () => {
      console.log('🧹 [OnlinePlayerList] Component unmounting, cleaning up');
      cleanupUpdate();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'in-game':
        return 'bg-yellow-500';
      case 'in-room':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'In Lobby';
      case 'in-game':
        return 'Playing';
      case 'in-room':
        return 'In Room';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Online Players
        </h2>
        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
          {players.length}
        </span>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {players.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-sm">No players online</p>
          </div>
        ) : (
          players.map((player) => (
            <div
              key={player.playerId}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {player.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(
                      player.status
                    )} rounded-full border-2 border-white dark:border-gray-800`}
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {player.displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getStatusText(player.status)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
