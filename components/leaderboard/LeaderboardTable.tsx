'use client';

// LeaderboardTable Component
// Displays rankings in a table format with player info and stats

import type { LeaderboardEntry } from '@/types/multiplayer';
import { Trophy, Medal, Award, Crown } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentPlayerId?: string;
  showLevel?: boolean;
  showTime?: boolean;
  emptyMessage?: string;
}

export default function LeaderboardTable({
  entries,
  currentPlayerId,
  showLevel = false,
  showTime = false,
  emptyMessage,
}: LeaderboardTableProps) {
  const { t } = useLanguage();

  const defaultEmptyMessage = emptyMessage || t.leaderboard.noEntries;

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>{defaultEmptyMessage}</p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return null;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500 text-white';
      case 2:
        return 'bg-gray-400 text-white';
      case 3:
        return 'bg-amber-700 text-white';
      default:
        return 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t.leaderboard.rank}
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t.leaderboard.player}
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t.leaderboard.score}
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t.leaderboard.wpm}
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t.leaderboard.accuracy}
            </th>
            {showLevel && (
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t.leaderboard.level}
              </th>
            )}
            {showTime && (
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t.leaderboard.time}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const rank = entry.rank || index + 1;
            const isCurrentPlayer = entry.playerId === currentPlayerId;

            return (
              <tr
                key={entry._id || `${entry.playerId}-${index}`}
                className={`
                  border-b border-gray-100 dark:border-gray-800
                  transition-colors
                  ${isCurrentPlayer
                    ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }
                `}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getRankIcon(rank)}
                    <span
                      className={`
                        inline-flex items-center justify-center
                        w-8 h-8 rounded-full text-sm font-bold
                        ${getRankBadgeColor(rank)}
                      `}
                    >
                      {rank}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 dark:text-gray-100">
                      {entry.displayName}
                    </span>
                    {isCurrentPlayer && (
                      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                        {t.multiplayer.you}
                      </span>
                    )}
                    {entry.playerType === 'guest' && (
                      <span className="px-2 py-0.5 bg-gray-400 text-white text-xs rounded-full">
                        {t.leaderboard.guest}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {entry.score.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-gray-700 dark:text-gray-300">
                    {Math.round(entry.metrics.wpm)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-gray-700 dark:text-gray-300">
                    {Math.round(entry.metrics.accuracy)}%
                  </span>
                </td>
                {showLevel && (
                  <td className="px-4 py-3 text-right">
                    <span className="text-gray-700 dark:text-gray-300">
                      {entry.metrics.level || '-'}
                    </span>
                  </td>
                )}
                {showTime && (
                  <td className="px-4 py-3 text-right">
                    <span className="text-gray-700 dark:text-gray-300">
                      {entry.metrics.time ? `${Math.round(entry.metrics.time)}s` : '-'}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
