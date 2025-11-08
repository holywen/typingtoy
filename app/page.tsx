'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getLastPosition } from '@/lib/services/progressStorage';
import { availableKeyboardLayouts } from '@/lib/data/keyboardLayout';
import { getUserSettings, updateSetting } from '@/lib/services/userSettings';
import { KeyboardLayout } from '@/types';
import UserMenu from '@/components/UserMenu';
import TipsBanner from '@/components/TipsBanner';
import LanguageSelector from '@/components/LanguageSelector';
import SocialShareButtons from '@/components/SocialShareButtons';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  const [resumeLink, setResumeLink] = useState('/lessons/1');
  // Always initialize with 'qwerty' to avoid hydration mismatch
  // The real value will be loaded in useEffect
  const [selectedLayout, setSelectedLayout] = useState<KeyboardLayout>('qwerty');
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);

  useEffect(() => {
    // First, immediately load from localStorage to minimize flash
    // This runs synchronously on first render (client-side only)
    if (!hasLoadedSettings) {
      const settings = getUserSettings();
      const localLayout = settings.keyboardLayout;
      setSelectedLayout(localLayout);

      // Update resume link based on local layout
      const lastPosition = getLastPosition(localLayout);
      if (lastPosition) {
        setResumeLink(`/lessons/${lastPosition.lessonId}`);
      }
    }

    async function loadFromDatabase() {
      // Wait for session to load
      if (status === 'loading') {
        return;
      }

      // Only load from database once
      if (hasLoadedSettings) {
        return;
      }

      // Try to load from database if authenticated
      if (status === 'authenticated' && session?.user) {
        try {
          const response = await fetch('/api/user/settings');
          if (response.ok) {
            const data = await response.json();
            const dbLayout = (data.settings?.keyboardLayout as KeyboardLayout) || null;

            // Update if database has a different value
            if (dbLayout && dbLayout !== selectedLayout) {
              setSelectedLayout(dbLayout);

              // Update resume link
              const lastPosition = getLastPosition(dbLayout);
              if (lastPosition) {
                setResumeLink(`/lessons/${lastPosition.lessonId}`);
              } else {
                setResumeLink('/lessons/1');
              }
            }
          }
        } catch (error) {
          console.error('Failed to load keyboard layout from database:', error);
        }
      }

      setHasLoadedSettings(true);
    }

    loadFromDatabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleLayoutSelect = async (layoutId: KeyboardLayout) => {
    setSelectedLayout(layoutId);
    // Always save to localStorage
    updateSetting('keyboardLayout', layoutId);

    // Also save to database if authenticated
    if (status === 'authenticated' && session?.user) {
      try {
        await fetch('/api/user/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            settings: { keyboardLayout: layoutId },
          }),
        });
      } catch (error) {
        console.error('Failed to save keyboard layout to database:', error);
      }
    }

    // Update resume link for the newly selected layout
    const lastPosition = getLastPosition(layoutId);
    if (lastPosition) {
      setResumeLink(`/lessons/${lastPosition.lessonId}`);
    } else {
      setResumeLink('/lessons/1');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Social Share Buttons */}
      <SocialShareButtons />

      {/* Tips Banner for unregistered users */}
      <TipsBanner />

      <div className="container mx-auto px-4 py-16">
        {/* User Menu and Language Selector */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageSelector />
          <UserMenu />
        </div>
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            {t.home.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t.home.description}
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <Link href={resumeLink} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-block">
            {t.home.startResume}
          </Link>
        </div>

        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t.home.keyboardLayout}</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {availableKeyboardLayouts.map((layout) => (
              <button
                key={layout.id}
                onClick={() => handleLayoutSelect(layout.id)}
                className={`px-6 py-3 rounded-lg border-2 transition-all ${
                  selectedLayout === layout.id
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                }`}
                title={layout.description}
              >
                <div className="font-medium">{layout.name}</div>
                <div className="text-xs opacity-75 mt-1">{layout.language}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
          <a href="/lessons" className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{t.home.features.lessons}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{t.home.features.lessonsDesc}</p>
          </a>
          <a href="/games" className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{t.home.features.games}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{t.home.features.gamesDesc}</p>
          </a>
          <a href="/multiplayer" className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{t.home.features.multiplayer}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{t.home.features.multiplayerDesc}</p>
          </a>
          <a href="/test" className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{t.home.features.speedTests}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{t.home.features.speedTestsDesc}</p>
          </a>
          <a href="/practice" className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{t.home.features.practice}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{t.home.features.practiceDesc}</p>
          </a>
          <a href="/progress" className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{t.home.features.progress}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{t.home.features.progressDesc}</p>
          </a>
        </div>
      </div>
    </main>
  );
}
