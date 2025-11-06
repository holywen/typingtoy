'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface PlayerInRoom {
  playerId: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: string;
  isConnected: boolean;
}

interface Room {
  _id: string;
  roomId: string;
  gameType: 'falling-blocks' | 'blink' | 'typing-walk' | 'falling-words';
  roomName: string;
  maxPlayers: number;
  players: PlayerInRoom[];
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

interface RoomTableProps {
  rooms: Room[];
  onUpdateRoom: (roomId: string, updates: Partial<Room>) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
}

export default function RoomTable({
  rooms,
  onUpdateRoom,
  onDeleteRoom,
}: RoomTableProps) {
  const { t } = useLanguage();
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [updatingRoomId, setUpdatingRoomId] = useState<string | null>(null);

  const handleForceFinish = async (roomId: string) => {
    if (confirm(t.admin.confirmForceFinish)) {
      setUpdatingRoomId(roomId);
      try {
        await onUpdateRoom(roomId, { status: 'finished' });
      } finally {
        setUpdatingRoomId(null);
      }
    }
  };

  const handleDelete = async (roomId: string, roomName: string) => {
    if (confirm(t.admin.confirmDeleteRoom.replace('{name}', roomName))) {
      setUpdatingRoomId(roomId);
      try {
        await onDeleteRoom(roomId);
      } finally {
        setUpdatingRoomId(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
      playing: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      finished: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
    };
    return badges[status as keyof typeof badges] || badges.finished;
  };

  const getGameTypeDisplay = (gameType: string) => {
    const types: Record<string, string> = {
      'falling-blocks': '🧱 Falling Blocks',
      'blink': '👁️ Blink',
      'typing-walk': '🚶 Typing Walk',
      'falling-words': '💬 Falling Words',
    };
    return types[gameType] || gameType;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t.admin.room}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t.admin.gameTypeColumn}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t.admin.playersColumn}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t.admin.statusColumn}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t.admin.createdColumn}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t.admin.actionsColumn}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {rooms.map((room) => (
            <>
              <tr
                key={room._id}
                className={`${updatingRoomId === room._id ? 'opacity-50' : ''} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700`}
                onClick={() => setExpandedRoomId(expandedRoomId === room._id ? null : room._id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {room.roomName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {room.roomId}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getGameTypeDisplay(room.gameType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {room.players.length} / {room.maxPlayers}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(room.status)}`}>
                    {room.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(room.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {room.status !== 'finished' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleForceFinish(room._id);
                        }}
                        disabled={updatingRoomId === room._id}
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                      >
                        {t.admin.forceFinish}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(room._id, room.roomName);
                      }}
                      disabled={updatingRoomId === room._id}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      {t.admin.delete}
                    </button>
                  </div>
                </td>
              </tr>
              {expandedRoomId === room._id && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                    <div className="text-sm">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t.admin.playersLabel}</h4>
                      {room.players.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">{t.admin.noPlayersInRoom}</p>
                      ) : (
                        <ul className="space-y-2">
                          {room.players.map((player, index) => (
                            <li key={index} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <span>{player.displayName}</span>
                              {player.isHost && (
                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded">
                                  {t.admin.host}
                                </span>
                              )}
                              {player.isReady && (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded">
                                  {t.admin.ready}
                                </span>
                              )}
                              {!player.isConnected && (
                                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 rounded">
                                  {t.admin.disconnected}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {room.startedAt && (
                        <div className="mt-4 text-gray-600 dark:text-gray-400">
                          <strong>{t.admin.started}</strong> {formatDate(room.startedAt)}
                        </div>
                      )}
                      {room.endedAt && (
                        <div className="mt-2 text-gray-600 dark:text-gray-400">
                          <strong>{t.admin.ended}</strong> {formatDate(room.endedAt)}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
