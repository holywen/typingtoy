'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameRoom, GameType } from '@/types/multiplayer';
import { getSocket, emitSocketEvent, onSocketEvent, offSocketEvent } from '@/lib/services/socketClient';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface RoomListProps {
  gameType: GameType;
  playerId: string;
  displayName: string;
}

export default function RoomList({ gameType, playerId, displayName }: RoomListProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  // Fetch rooms
  useEffect(() => {
    async function fetchRooms() {
      try {
        const response = await fetch(`/api/rooms?gameType=${gameType}`);
        const data = await response.json();

        if (data.success) {
          setRooms(data.rooms);
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [gameType]);

  // Listen for room updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRoomCreated = (data: { room: GameRoom }) => {
      if (data.room.gameType === gameType) {
        setRooms((prev) => [data.room, ...prev]);
      }
    };

    const handleRoomUpdated = (data: { room: GameRoom }) => {
      if (data.room.gameType === gameType) {
        setRooms((prev) =>
          prev.map((r) => (r.roomId === data.room.roomId ? data.room : r))
        );
      }
    };

    const handleRoomDeleted = (data: { roomId: string }) => {
      setRooms((prev) => prev.filter((r) => r.roomId !== data.roomId));
    };

    const cleanupCreated = onSocketEvent('room:created', handleRoomCreated);
    const cleanupUpdated = onSocketEvent('room:updated', handleRoomUpdated);
    const cleanupDeleted = onSocketEvent('room:deleted', handleRoomDeleted);

    return () => {
      cleanupCreated();
      cleanupUpdated();
      cleanupDeleted();
    };
  }, [gameType]);

  const handleJoinRoom = async (room: GameRoom) => {
    setJoiningRoomId(room.roomId);
    setJoinError(null);

    const socket = getSocket();
    if (!socket) {
      setJoinError('Not connected to server');
      setJoiningRoomId(null);
      return;
    }

    const password = room.password ? prompt('Enter room password:') : undefined;

    emitSocketEvent('room:join', { roomId: room.roomId, password }, (response) => {
      if (response.success) {
        // Navigate to room page
        router.push(`/multiplayer/room/${room.roomId}`);
      } else {
        setJoinError(response.error || 'Failed to join room');
        setJoiningRoomId(null);
      }
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.multiplayer.availableRooms}</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {t.multiplayer.availableRooms} ({rooms.length})
      </h2>

      {joinError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {joinError}
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-lg">{t.multiplayer.noRooms}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room.roomId}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {room.roomName}
                    </h3>
                    {room.password && (
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {room.players.length}/{room.maxPlayers}
                    </span>

                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t.multiplayer.host}: {room.players.find(p => p.isHost)?.displayName}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinRoom(room)}
                  disabled={room.players.length >= room.maxPlayers || joiningRoomId === room.roomId}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    room.players.length >= room.maxPlayers
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : joiningRoomId === room.roomId
                      ? 'bg-blue-400 text-white cursor-wait'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {joiningRoomId === room.roomId ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {t.multiplayer.join}...
                    </span>
                  ) : room.players.length >= room.maxPlayers ? (
                    t.multiplayer.roomFull
                  ) : (
                    t.multiplayer.join
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
