'use client';

import { useState, useEffect } from 'react';
import TypingTest from '@/components/TypingTest';
import Link from 'next/link';
import { saveProgress } from '@/lib/services/progressStorage';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TypingSession } from '@/types';

export default function TestPage() {
  const { t } = useLanguage();
  const [targetText, setTargetText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState<number>(0);

  useEffect(() => {
    loadRandomText();
  }, []);

  const loadRandomText = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-text?minWords=500&maxWords=1000');
      if (!response.ok) {
        throw new Error('Failed to load text');
      }
      const data = await response.json();
      setTargetText(data.text);
      setWordCount(data.wordCount);
    } catch (err) {
      setError('Failed to load typing text. Please refresh the page.');
      console.error('Error loading text:', err);
      // Fallback text
      setTargetText('The quick brown fox jumps over the lazy dog. This classic pangram contains every letter of the alphabet. Practice makes perfect. The more you type, the faster and more accurate you will become.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
            {t.test.backToHome}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {t.test.title}
          </h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Word count and refresh button */}
        {!loading && targetText && (
          <div className="flex justify-center items-center gap-4 mb-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {wordCount} {t.test.words}
            </div>
            <button
              onClick={loadRandomText}
              className="text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              🔄 {t.test.newText}
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">{t.test.loadingText}</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Typing test */}
        {!loading && targetText && (
          <TypingTest
            key={targetText} // Force re-render when text changes
            targetText={targetText}
            onComplete={(session: TypingSession) => {
              saveProgress(session, 'speed_test');
              console.log('Test completed!', session);
            }}
          />
        )}

        <div className="mt-12 text-center text-gray-600 dark:text-gray-400">
          <h3 className="text-xl font-semibold mb-4">{t.test.tipsTitle}</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg">
              <h4 className="font-bold mb-2">{t.test.tips.positionTitle}</h4>
              <p className="text-sm">{t.test.tips.positionText}</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg">
              <h4 className="font-bold mb-2">{t.test.tips.accuracyTitle}</h4>
              <p className="text-sm">{t.test.tips.accuracyText}</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg">
              <h4 className="font-bold mb-2">{t.test.tips.dontLookTitle}</h4>
              <p className="text-sm">{t.test.tips.dontLookText}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
