'use client';

// LeaderboardPanel Component
// Main leaderboard interface with period tabs and game type selector

import React, { useState, useEffect } from 'react';
import LeaderboardTable from './LeaderboardTable';
import type { LeaderboardEntry, GameType, LeaderboardPeriod } from '@/types/multiplayer';
import { RefreshCw, Users, Clock, Calendar, TrendingUp } from 'lucide-react';

interface LeaderboardPanelProps {
  initialGameType?: GameType;
  currentPlayerId?: string;
  showGameTypeSelector?: boolean;
}

export default function LeaderboardPanel({
  initialGameType = 'falling-blocks',
  currentPlayerId,
  showGameTypeSelector = true,
}: LeaderboardPanelProps) {
  const [gameType, setGameType] = useState<GameType>(initialGameType);
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gameTypes: { value: GameType; label: string }[] = [
    { value: 'falling-blocks', label: 'Falling Blocks' },
    { value: 'blink', label: 'Blink' },
    { value: 'falling-words', label: 'Falling Words' },
    { value: 'speed-race', label: 'Speed Race' },
  ];

  const periods: { value: LeaderboardPeriod; label: string; icon: React.ReactNode }[] = [
    { value: 'all-time', label: 'All Time', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'monthly', label: 'This Month', icon: <Calendar className="w-4 h-4" /> },
    { value: 'weekly', label: 'This Week', icon: <Clock className="w-4 h-4" /> },
    { value: 'daily', label: 'Today', icon: <Users className="w-4 h-4" /> },
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, [gameType, period]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/leaderboard?gameType=${gameType}&period=${period}&limit=100`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchLeaderboard();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Leaderboard
          </h2>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            title="Refresh leaderboard"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Game Type Selector */}
        {showGameTypeSelector && (
          <div className="flex flex-wrap gap-2 mb-4">
            {gameTypes.map((gt) => (
              <button
                key={gt.value}
                onClick={() => setGameType(gt.value)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${gameType === gt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                {gt.label}
              </button>
            ))}
          </div>
        )}

        {/* Period Tabs */}
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                flex items-center gap-2
                ${period === p.value
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {p.icon}
              {p.label}
            </button>
          ))}
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
            <p className="text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
          </div>
        ) : (
          <LeaderboardTable
            entries={entries}
            currentPlayerId={currentPlayerId}
            showLevel={gameType === 'falling-blocks'}
            showTime={gameType === 'blink'}
          />
        )}
      </div>
    </div>
  );
}
