'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function BlinkGame() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/games"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-8"
        >
          {t.games?.backToGames || '← Back to Games'}
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-12 text-center">
          <div className="text-8xl mb-6">🚶</div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t.games?.typingWalk?.name || 'Typing Walk'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            {t.games?.typingWalk?.description || 'Guide your character by typing correctly!'}
          </p>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 rounded-lg p-6">
            <p className="text-yellow-800 dark:text-yellow-400">
              🚧 Coming Soon! This game is under development.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
