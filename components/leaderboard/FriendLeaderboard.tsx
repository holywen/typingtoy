'use client';

// FriendLeaderboard Component
// Displays leaderboard comparing player with their friends

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import LeaderboardTable from './LeaderboardTable';
import type { LeaderboardEntry, GameType, LeaderboardPeriod } from '@/types/multiplayer';
import { Users, RefreshCw, UserPlus } from 'lucide-react';

interface FriendLeaderboardProps {
  gameType: GameType;
  period?: LeaderboardPeriod;
}

export default function FriendLeaderboard({
  gameType,
  period = 'all-time',
}: FriendLeaderboardProps) {
  const { data: session, status } = useSession();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playerId = session?.user?.id;

  useEffect(() => {
    if (status === 'authenticated' && playerId) {
      fetchFriendLeaderboard();
    }
  }, [gameType, period, playerId, status]);

  const fetchFriendLeaderboard = async () => {
    if (!playerId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/leaderboard/friends?gameType=${gameType}&period=${period}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view friend leaderboard');
        }
        throw new Error('Failed to fetch friend leaderboard');
      }

      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err: any) {
      console.error('Error fetching friend leaderboard:', err);
      setError(err.message || 'Failed to load friend leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchFriendLeaderboard();
  };

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Sign In Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sign in to compare your scores with friends
          </p>
          <button
            onClick={() => window.location.href = '/auth/signin'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Loading session
  if (status === 'loading') {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Friends Leaderboard
          </h3>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading friend leaderboard...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Friends Yet
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add friends to compare scores and compete together!
            </p>
            <button
              onClick={() => {/* Navigate to friends page */}}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Find Friends
            </button>
          </div>
        ) : (
          <LeaderboardTable
            entries={entries}
            currentPlayerId={playerId}
            showLevel={gameType === 'falling-blocks'}
            showTime={gameType === 'blink'}
          />
        )}
      </div>
    </div>
  );
}
