'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const games = [
  {
    id: 'falling-blocks',
    translationKey: 'fallingBlocks',
    icon: '🧱',
    color: 'from-blue-500 to-purple-600',
  },
  {
    id: 'blink',
    translationKey: 'blink',
    icon: '⚡',
    color: 'from-yellow-500 to-orange-600',
  },
  {
    id: 'typing-walk',
    translationKey: 'typingWalk',
    icon: '🚶',
    color: 'from-green-500 to-teal-600',
  },
  {
    id: 'falling-words',
    translationKey: 'fallingWords',
    icon: '📝',
    color: 'from-pink-500 to-red-600',
  },
];

export default function GamesPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-8"
        >
          {t.games?.backToHome || '← Back to Home'}
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t.games?.title || 'Typing Games'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
          {t.games?.description || 'Practice your typing skills with fun games! Choose a lesson to focus on specific keys.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>

              <div className="p-8 relative z-10">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">
                  {game.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {(t.games?.[game.translationKey as keyof typeof t.games] as any)?.name || game.id}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {(t.games?.[game.translationKey as keyof typeof t.games] as any)?.description || 'Fun typing game'}
                </p>
              </div>

              <div className={`h-2 bg-gradient-to-r ${game.color}`}></div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
