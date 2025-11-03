'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getProgressHistory,
  getOverallStats,
  getRecentProgress,
  clearProgressHistory,
  exportProgress,
  getProgressTrends,
  type ProgressRecord,
} from '@/lib/services/progressStorage';
import ProgressChart from '@/components/ProgressChart';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ProgressPage() {
  const { t } = useLanguage();
  const [history, setHistory] = useState<ProgressRecord[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageWPM: 0,
    averageAccuracy: 0,
    bestWPM: 0,
    totalTime: 0,
    lessonsCompleted: 0,
  });
  const [filter, setFilter] = useState<'all' | 'lesson' | 'speed_test'>('all');
  const [trendDays, setTrendDays] = useState(7);
  const [trends, setTrends] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allHistory = getProgressHistory();
    setHistory(allHistory);
    setStats(getOverallStats());
    setTrends(getProgressTrends(trendDays));
  };

  useEffect(() => {
    setTrends(getProgressTrends(trendDays));
  }, [trendDays]);

  const filteredHistory = filter === 'all'
    ? history
    : history.filter((record) => record.sessionType === filter);

  const handleClearHistory = () => {
    if (confirm(t.progress.clearHistoryConfirm)) {
      clearProgressHistory();
      loadData();
    }
  };

  const handleExportProgress = () => {
    const data = exportProgress();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typing-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
            {t.progress.backToHome}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {t.progress.title}
          </h1>
          <div className="w-24"></div>
        </div>

        {/* Progress Charts */}
        {trends.length > 0 && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.progress.progressTrends}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setTrendDays(7)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    trendDays === 7
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  7 {t.progress.days}
                </button>
                <button
                  onClick={() => setTrendDays(14)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    trendDays === 14
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  14 {t.progress.days}
                </button>
                <button
                  onClick={() => setTrendDays(30)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    trendDays === 30
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  30 {t.progress.days}
                </button>
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <ProgressChart data={trends} type="wpm" />
              <ProgressChart data={trends} type="accuracy" />
            </div>
          </div>
        )}

        {/* Overall Statistics */}
        <div className="max-w-6xl mx-auto mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t.progress.overallStats}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalSessions}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{t.progress.totalSessions}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.averageWPM}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{t.progress.averageWPM}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.averageAccuracy}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{t.progress.averageAccuracy}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-center">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.bestWPM}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{t.progress.bestWPM}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-center">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{formatTime(stats.totalTime)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{t.progress.totalTime}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md text-center">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.lessonsCompleted}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{t.progress.lessonsDone}</div>
            </div>
          </div>
        </div>

        {/* Filter and Actions */}
        <div className="max-w-6xl mx-auto mb-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t.progress.all}
            </button>
            <button
              onClick={() => setFilter('lesson')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'lesson'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t.progress.lessons}
            </button>
            <button
              onClick={() => setFilter('speed_test')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'speed_test'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t.progress.speedTests}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExportProgress}
              className="px-4 py-2 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
            >
              {t.progress.exportData}
            </button>
            <button
              onClick={handleClearHistory}
              className="px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              {t.progress.clearHistory}
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            {t.progress.recentSessions} ({filteredHistory.length})
          </h2>

          {filteredHistory.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {t.progress.noSessionsYet}
              </p>
              <div className="mt-4 flex gap-4 justify-center">
                <Link
                  href="/lessons"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {t.progress.startLearning}
                </Link>
                <Link
                  href="/test"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {t.progress.takeATest}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((record) => (
                <div
                  key={record.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            record.sessionType === 'lesson'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {record.sessionType === 'lesson' ? t.progress.sessionTypes.lesson : t.progress.sessionTypes.speed_test}
                        </span>
                        {record.lessonTitle && (
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {record.lessonTitle}
                          </span>
                        )}
                      </div>
                      {record.exerciseTitle && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {record.exerciseTitle}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatDate(record.completedAt)}
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {Math.round(record.metrics.netWPM)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{t.progress.wpm}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {Math.round(record.metrics.accuracy)}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{t.progress.accuracy}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {formatTime(record.metrics.duration)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{t.progress.time}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {record.metrics.errors}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{t.progress.errors}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
