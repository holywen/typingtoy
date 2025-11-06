'use client';

// Multiplayer Leaderboard Page
// Display rankings and player statistics

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LeaderboardPanel from '@/components/leaderboard/LeaderboardPanel';
import PlayerStats from '@/components/leaderboard/PlayerStats';
import { ArrowLeft, BarChart3, Trophy } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'global' | 'stats'>('global');

  const playerId = session?.user?.id;

  // Redirect to signin if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/multiplayer/leaderboard');
    return null;
  }

  const tabs = [
    { id: 'global' as const, label: t.leaderboard.globalRankings, icon: Trophy },
    { id: 'stats' as const, label: t.leaderboard.myStats, icon: BarChart3, requiresAuth: true },
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
            {t.multiplayer.backToLobby}
          </button>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t.leaderboard.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.leaderboard.description}
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
                  <span className="text-xs opacity-75">({t.auth.signInButton} required)</span>
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

          {activeTab === 'stats' && status === 'authenticated' && playerId && (
            <PlayerStats playerId={playerId} />
          )}

          {activeTab === 'stats' && status !== 'authenticated' && (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-12 text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t.auth.signInButton} Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t.leaderboard.signInRequired}
              </p>
              <button
                onClick={() => router.push('/auth/signin?callbackUrl=/multiplayer/leaderboard')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t.auth.signInButton}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
