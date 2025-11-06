'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/admin/StatsCard';

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Overview of your Typing Toy platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon="👥"
          description={`${stats?.recentUsers || 0} new in last 7 days`}
          link="/admin/users"
        />
        <StatsCard
          title="Total Rooms"
          value={stats?.totalRooms || 0}
          icon="🎮"
          description={`${stats?.recentRooms || 0} created today`}
          link="/admin/rooms"
        />
        <StatsCard
          title="Active Rooms"
          value={stats?.activeRooms || 0}
          icon="⚡"
          description="Waiting for players"
        />
        <StatsCard
          title="Playing Now"
          value={stats?.playingRooms || 0}
          icon="🎯"
          description="Games in progress"
        />
        <StatsCard
          title="Online Users"
          value={stats?.onlineUsers || 0}
          icon="🟢"
          description="Currently active"
        />
        <StatsCard
          title="Finished Rooms"
          value={stats?.finishedRooms || 0}
          icon="✅"
          description="Completed games"
        />
        <StatsCard
          title="Administrators"
          value={stats?.adminCount || 0}
          icon="🔐"
          description="Admin accounts"
        />
        <StatsCard
          title="New Users (7d)"
          value={stats?.recentUsers || 0}
          icon="📈"
          description="Recent signups"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="mr-2">👥</span>
            Manage Users
          </a>
          <a
            href="/admin/rooms"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="mr-2">🎮</span>
            Manage Rooms
          </a>
          <a
            href="/admin/statistics"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="mr-2">📈</span>
            View Statistics
          </a>
        </div>
      </div>
    </div>
  );
}
