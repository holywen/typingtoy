'use client';

// Multiplayer Leaderboard Page
// Display rankings, friend leaderboards, and player statistics

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LeaderboardPanel from '@/components/leaderboard/LeaderboardPanel';
import FriendLeaderboard from '@/components/leaderboard/FriendLeaderboard';
import PlayerStats from '@/components/leaderboard/PlayerStats';
import type { GameType } from '@/types/multiplayer';
import { ArrowLeft, Users, BarChart3, Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'global' | 'friends' | 'stats'>('global');
  const [selectedGame, setSelectedGame] = useState<GameType>('falling-blocks');

  const playerId = session?.user?.id;

  // Redirect to signin if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/multiplayer/leaderboard');
    return null;
  }

  const tabs = [
    { id: 'global' as const, label: 'Global Rankings', icon: Trophy },
    { id: 'friends' as const, label: 'Friends', icon: Users, requiresAuth: true },
    { id: 'stats' as const, label: 'My Stats', icon: BarChart3, requiresAuth: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/multiplayer')}
            className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Lobby
          </button>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Leaderboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View rankings, compare with friends, and track your progress
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isDisabled = tab.requiresAuth && status !== 'authenticated';

            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`
                  px-6 py-3 rounded-lg font-semibold transition-all
                  flex items-center gap-2
                  ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {tab.requiresAuth && status !== 'authenticated' && (
                  <span className="text-xs opacity-75">(Sign in required)</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'global' && (
            <LeaderboardPanel
              currentPlayerId={playerId}
              showGameTypeSelector={true}
            />
          )}

          {activeTab === 'friends' && status === 'authenticated' && playerId && (
            <>
              {/* Game Type Selector for Friends */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Select Game
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'falling-blocks' as GameType, label: 'Falling Blocks' },
                    { value: 'blink' as GameType, label: 'Blink' },
                    { value: 'falling-words' as GameType, label: 'Falling Words' },
                    { value: 'speed-race' as GameType, label: 'Speed Race' },
                  ].map((game) => (
                    <button
                      key={game.value}
                      onClick={() => setSelectedGame(game.value)}
                      className={`
                        px-4 py-2 rounded-lg font-medium transition-colors
                        ${selectedGame === game.value
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      {game.label}
                    </button>
                  ))}
                </div>
              </div>

              <FriendLeaderboard gameType={selectedGame} period="all-time" />
            </>
          )}

          {activeTab === 'stats' && status === 'authenticated' && playerId && (
            <PlayerStats playerId={playerId} />
          )}

          {activeTab === 'friends' && status !== 'authenticated' && (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Sign In Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sign in to view your friend leaderboard
              </p>
              <button
                onClick={() => router.push('/auth/signin?callbackUrl=/multiplayer/leaderboard')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          )}

          {activeTab === 'stats' && status !== 'authenticated' && (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-12 text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Sign In Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Sign in to view your statistics
              </p>
              <button
                onClick={() => router.push('/auth/signin?callbackUrl=/multiplayer/leaderboard')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
