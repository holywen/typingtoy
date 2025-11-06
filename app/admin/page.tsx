'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/admin/StatsCard';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Stats {
  totalUsers: number;
  totalRooms: number;
  activeRooms: number;
  playingRooms: number;
  finishedRooms: number;
  adminCount: number;
  recentUsers: number;
  recentRooms: number;
  onlineUsers: number;
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load stats:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.admin.dashboard}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t.admin.overviewPlatform}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t.admin.totalUsers}
          value={stats?.totalUsers || 0}
          icon="👥"
          description={`${stats?.recentUsers || 0} ${t.admin.newInLast7Days}`}
          link="/admin/users"
        />
        <StatsCard
          title={t.admin.totalRooms}
          value={stats?.totalRooms || 0}
          icon="🎮"
          description={`${stats?.recentRooms || 0} ${t.admin.createdToday}`}
          link="/admin/rooms"
        />
        <StatsCard
          title={t.admin.activeRooms}
          value={stats?.activeRooms || 0}
          icon="⚡"
          description={t.admin.waitingForPlayers}
        />
        <StatsCard
          title={t.admin.playingNow}
          value={stats?.playingRooms || 0}
          icon="🎯"
          description={t.admin.gamesInProgress}
        />
        <StatsCard
          title={t.admin.onlineUsers}
          value={stats?.onlineUsers || 0}
          icon="🟢"
          description={t.admin.currentlyActive}
        />
        <StatsCard
          title={t.admin.finishedRooms}
          value={stats?.finishedRooms || 0}
          icon="✅"
          description={t.admin.completedGames}
        />
        <StatsCard
          title={t.admin.administrators}
          value={stats?.adminCount || 0}
          icon="🔐"
          description={t.admin.adminAccounts}
        />
        <StatsCard
          title={t.admin.newUsers7d}
          value={stats?.recentUsers || 0}
          icon="📈"
          description={t.admin.recentSignups}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.admin.quickActions}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="mr-2">👥</span>
            {t.admin.manageUsers}
          </a>
          <a
            href="/admin/rooms"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="mr-2">🎮</span>
            {t.admin.manageRooms}
          </a>
          <a
            href="/admin/statistics"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="mr-2">📈</span>
            {t.admin.viewStatistics}
          </a>
        </div>
      </div>
    </div>
  );
}
