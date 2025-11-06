'use client';

import { useEffect, useState } from 'react';
import RoomTable from '@/components/admin/RoomTable';

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [gameTypeFilter, setGameTypeFilter] = useState('');

  const fetchRooms = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (statusFilter) params.append('status', statusFilter);
      if (gameTypeFilter) params.append('gameType', gameTypeFilter);

      const response = await fetch(`/api/admin/rooms?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRooms(data.rooms);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch rooms:', data.error);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms(1);
  }, [statusFilter, gameTypeFilter]);

  const handleUpdateRoom = async (roomId: string, updates: Partial<Room>) => {
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state
        setRooms(rooms.map(r => r._id === roomId ? { ...r, ...updates } : r));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating room:', error);
      alert('Failed to update room');
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // Remove from local state
        setRooms(rooms.filter(r => r._id !== roomId));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Room Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage all game rooms on your platform
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="waiting">Waiting</option>
            <option value="playing">Playing</option>
            <option value="finished">Finished</option>
          </select>

          <select
            value={gameTypeFilter}
            onChange={(e) => setGameTypeFilter(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Game Types</option>
            <option value="falling-blocks">Falling Blocks</option>
            <option value="blink">Blink</option>
            <option value="typing-walk">Typing Walk</option>
            <option value="falling-words">Falling Words</option>
          </select>

          <button
            onClick={() => {
              setStatusFilter('');
              setGameTypeFilter('');
            }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No rooms found
          </div>
        ) : (
          <>
            <RoomTable
              rooms={rooms}
              onUpdateRoom={handleUpdateRoom}
              onDeleteRoom={handleDeleteRoom}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total rooms)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchRooms(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchRooms(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
