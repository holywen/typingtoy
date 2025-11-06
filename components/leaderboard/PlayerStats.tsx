'use client';

// PlayerStats Component
// Displays detailed statistics and rankings for a player

import React, { useState, useEffect } from 'react';
import type { GameType, LeaderboardPeriod } from '@/types/multiplayer';
import {
  Trophy,
  TrendingUp,
  Target,
  Zap,
  Award,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface PlayerStatsProps {
  playerId: string;
}

interface LeaderboardStats {
  totalGames: number;
  totalWins: number;
  bestScore: number;
  avgWPM: number;
  avgAccuracy: number;
  favoriteGame?: GameType;
  gamesPerType: Record<GameType, number>;
  skillRatings: Record<GameType, number>;
}

interface PlayerRanking {
  rank: number;
  totalPlayers: number;
  percentile: number;
}

export default function PlayerStats({ playerId }: PlayerStatsProps) {
  const { t } = useLanguage();
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [rankings, setRankings] = useState<{
    gameType: GameType;
    period: LeaderboardPeriod;
    ranking: PlayerRanking | null;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playerId) {
      fetchPlayerStats();
    }
  }, [playerId]);

  const fetchPlayerStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leaderboard/player?playerId=${playerId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch player stats');
      }

      const data = await response.json();
      setStats(data.stats);
      setRankings(data.rankings || []);
    } catch (err) {
      console.error('Error fetching player stats:', err);
      setError('Failed to load player statistics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">
            {error || t.leaderboard.noEntries}
          </p>
          <button
            onClick={fetchPlayerStats}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.leaderboard.refresh}
          </button>
        </div>
      </div>
    );
  }

  const gameTypeLabels: Record<GameType, string> = {
    'falling-blocks': t.multiplayer.gameTypes.fallingBlocks,
    'blink': t.multiplayer.gameTypes.blink,
    'falling-words': t.multiplayer.gameTypes.fallingWords,
    'speed-race': t.multiplayer.gameTypes.speedRace,
    'typing-walk': t.multiplayer.gameTypes.typingWalk,
  };

  const periodLabels: Record<LeaderboardPeriod, string> = {
    'all-time': t.leaderboard.periods.allTime,
    'daily': t.leaderboard.periods.daily,
    'weekly': t.leaderboard.periods.weekly,
    'monthly': t.leaderboard.periods.monthly,
  };

  // Get best rankings for display
  const bestRankings = rankings
    .filter(r => r.ranking !== null)
    .sort((a, b) => (a.ranking?.rank || 999) - (b.ranking?.rank || 999))
    .slice(0, 4);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          {t.leaderboard.myStats}
        </h3>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Trophy className="w-6 h-6 text-yellow-500" />}
            label={t.leaderboard.stats.totalGames}
            value={stats.totalGames.toLocaleString()}
          />
          <StatCard
            icon={<Award className="w-6 h-6 text-green-500" />}
            label={t.leaderboard.stats.totalWins}
            value={stats.totalWins.toLocaleString()}
          />
          <StatCard
            icon={<Zap className="w-6 h-6 text-blue-500" />}
            label={t.leaderboard.stats.avgWPM}
            value={stats.avgWPM.toString()}
          />
          <StatCard
            icon={<Target className="w-6 h-6 text-purple-500" />}
            label={t.leaderboard.stats.avgAccuracy}
            value={`${stats.avgAccuracy}%`}
          />
        </div>

        {/* Best Score */}
        <div className="mb-8 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t.leaderboard.stats.bestScore}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.bestScore.toLocaleString()}
              </p>
            </div>
            <Trophy className="w-12 h-12 text-yellow-500" />
          </div>
          {stats.favoriteGame && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t.leaderboard.stats.favoriteGame}: <span className="font-semibold">{gameTypeLabels[stats.favoriteGame]}</span>
            </p>
          )}
        </div>

        {/* Best Rankings */}
        {bestRankings.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t.leaderboard.stats.topRankings}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bestRankings.map((r) => (
                <div
                  key={`${r.gameType}-${r.period}`}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {gameTypeLabels[r.gameType]}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {periodLabels[r.period]}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      #{r.ranking?.rank}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      of {r.ranking?.totalPlayers} (Top {r.ranking?.percentile}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Games Per Type */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.leaderboard.stats.gamesPlayed}
          </h4>
          <div className="space-y-3">
            {(Object.entries(stats.gamesPerType) as [GameType, number][]).map(([gameType, count]) => (
              <div key={gameType} className="flex items-center gap-3">
                <span className="w-32 text-sm text-gray-700 dark:text-gray-300">
                  {gameTypeLabels[gameType]}
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full flex items-center justify-end px-2"
                    style={{
                      width: `${Math.max(10, (count / stats.totalGames) * 100)}%`,
                    }}
                  >
                    <span className="text-xs font-bold text-white">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Ratings */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t.leaderboard.stats.skillRatings}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.entries(stats.skillRatings) as [GameType, number][]).map(([gameType, rating]) => (
              <div
                key={gameType}
                className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {gameTypeLabels[gameType]}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {rating}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
