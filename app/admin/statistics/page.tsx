'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import ChartCard from '@/components/admin/ChartCard';
import StatsCard from '@/components/admin/StatsCard';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatisticsData {
  userGrowth: Array<{ _id: string; count: number }>;
  gameTypeDistribution: Array<{ _id: string; count: number }>;
  roomStatusDistribution: Array<{ _id: string; count: number }>;
  dailyRoomCreation: Array<{ _id: string; count: number }>;
  avgPlayersByGameType: Array<{ _id: string; avgPlayers: number; totalGames: number }>;
  peakHours: Array<{ _id: number; count: number }>;
  userRoleDistribution: Array<{ _id: string; count: number }>;
  emailVerificationStatus: Array<{ _id: string; count: number }>;
  avgGameDuration: Array<{ _id: string; avgDuration: number; count: number }>;
  recentActivitySummary: {
    last24Hours: {
      newUsers: number;
      newRooms: number;
      finishedGames: number;
    };
    last7Days: {
      newUsers: number;
      newRooms: number;
      finishedGames: number;
    };
  };
  dateRange: {
    start: string;
    end: string;
    days: number;
  };
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/statistics?days=${dateRange}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data);
      } else {
        console.error('Failed to fetch statistics:', data.error);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-600 dark:text-gray-400">
        Failed to load statistics
      </div>
    );
  }

  // Prepare User Growth Chart Data
  const userGrowthChartData = {
    labels: stats.userGrowth.map((item) => item._id),
    datasets: [
      {
        label: 'New Users',
        data: stats.userGrowth.map((item) => item.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Prepare Daily Room Creation Chart Data
  const dailyRoomChartData = {
    labels: stats.dailyRoomCreation.map((item) => item._id),
    datasets: [
      {
        label: 'Rooms Created',
        data: stats.dailyRoomCreation.map((item) => item.count),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Prepare Game Type Distribution Chart Data
  const gameTypeColors = {
    'falling-blocks': 'rgb(239, 68, 68)',
    'blink': 'rgb(59, 130, 246)',
    'typing-walk': 'rgb(16, 185, 129)',
    'falling-words': 'rgb(245, 158, 11)',
  };

  const gameTypeChartData = {
    labels: stats.gameTypeDistribution.map((item) => {
      const labels: Record<string, string> = {
        'falling-blocks': 'Falling Blocks',
        'blink': 'Blink',
        'typing-walk': 'Typing Walk',
        'falling-words': 'Falling Words',
      };
      return labels[item._id] || item._id;
    }),
    datasets: [
      {
        data: stats.gameTypeDistribution.map((item) => item.count),
        backgroundColor: stats.gameTypeDistribution.map(
          (item) => gameTypeColors[item._id as keyof typeof gameTypeColors] || 'rgb(156, 163, 175)'
        ),
      },
    ],
  };

  // Prepare Peak Hours Chart Data
  const peakHoursChartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Rooms Created',
        data: Array.from({ length: 24 }, (_, hour) => {
          const hourData = stats.peakHours.find((item) => item._id === hour);
          return hourData ? hourData.count : 0;
        }),
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
      },
    ],
  };

  // Prepare Room Status Distribution Chart Data
  const roomStatusChartData = {
    labels: stats.roomStatusDistribution.map((item) => {
      const labels: Record<string, string> = {
        waiting: 'Waiting',
        playing: 'Playing',
        finished: 'Finished',
      };
      return labels[item._id] || item._id;
    }),
    datasets: [
      {
        data: stats.roomStatusDistribution.map((item) => item.count),
        backgroundColor: [
          'rgb(245, 158, 11)', // waiting - yellow
          'rgb(16, 185, 129)', // playing - green
          'rgb(107, 114, 128)', // finished - gray
        ],
      },
    ],
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Statistics & Analytics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Platform insights and performance metrics
          </p>
        </div>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(parseInt(e.target.value))}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Recent Activity Summary */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Last 24 Hours
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <StatsCard
                title="New Users"
                value={stats.recentActivitySummary.last24Hours.newUsers}
                icon="👤"
              />
              <StatsCard
                title="New Rooms"
                value={stats.recentActivitySummary.last24Hours.newRooms}
                icon="🎮"
              />
              <StatsCard
                title="Finished Games"
                value={stats.recentActivitySummary.last24Hours.finishedGames}
                icon="✅"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Last 7 Days
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <StatsCard
                title="New Users"
                value={stats.recentActivitySummary.last7Days.newUsers}
                icon="👤"
              />
              <StatsCard
                title="New Rooms"
                value={stats.recentActivitySummary.last7Days.newRooms}
                icon="🎮"
              />
              <StatsCard
                title="Finished Games"
                value={stats.recentActivitySummary.last7Days.finishedGames}
                icon="✅"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Average Game Duration
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              {stats.avgGameDuration.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {stats.avgGameDuration.map((item) => (
                    <li
                      key={item._id}
                      className="flex justify-between text-gray-700 dark:text-gray-300"
                    >
                      <span className="capitalize">
                        {item._id.replace(/-/g, ' ')}:
                      </span>
                      <span className="font-semibold">
                        {item.avgDuration.toFixed(1)} min
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No finished games yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="User Growth"
          description={`New user registrations over the last ${dateRange} days`}
        >
          <div className="h-64">
            <Line data={userGrowthChartData} options={lineChartOptions} />
          </div>
        </ChartCard>

        <ChartCard
          title="Daily Room Creation"
          description={`Rooms created per day over the last ${dateRange} days`}
        >
          <div className="h-64">
            <Line data={dailyRoomChartData} options={lineChartOptions} />
          </div>
        </ChartCard>

        <ChartCard
          title="Game Type Popularity"
          description="Distribution of games by type"
        >
          <div className="h-64">
            <Doughnut data={gameTypeChartData} options={doughnutOptions} />
          </div>
        </ChartCard>

        <ChartCard
          title="Room Status Distribution"
          description="Current status of all rooms"
        >
          <div className="h-64">
            <Doughnut data={roomStatusChartData} options={doughnutOptions} />
          </div>
        </ChartCard>

        <ChartCard
          title="Peak Usage Hours"
          description="Room creation activity by hour of day"
          className="lg:col-span-2"
        >
          <div className="h-64">
            <Bar data={peakHoursChartData} options={barChartOptions} />
          </div>
        </ChartCard>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Average Players per Game
          </h3>
          {stats.avgPlayersByGameType.length > 0 ? (
            <div className="space-y-3">
              {stats.avgPlayersByGameType.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {item._id.replace(/-/g, ' ')}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.totalGames} total games
                    </p>
                  </div>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {item.avgPlayers.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No finished games yet
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            User Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Total Users
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {stats.userRoleDistribution.reduce((sum, item) => sum + item.count, 0)}
              </span>
            </div>
            {stats.userRoleDistribution.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {item._id}s
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.count}
                </span>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              {stats.emailVerificationStatus.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {item._id}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
