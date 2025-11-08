'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function TipsBanner() {
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const isDismissed = localStorage.getItem('tips_banner_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('tips_banner_dismissed', 'true');
  };

  // Don't show banner if user is logged in, loading, or dismissed
  if (status === 'loading' || session || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>

            <div className="flex-1">
              <p className="font-semibold text-sm sm:text-base mb-1">
                💡 {t.tipsBanner.title}
              </p>
              <ul className="text-xs sm:text-sm opacity-90 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>{t.tipsBanner.benefits.sync}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>{t.tipsBanner.benefits.layouts}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>{t.tipsBanner.benefits.history}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>{t.tipsBanner.benefits.resume}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>{t.tipsBanner.benefits.multiplayer}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/auth/signup"
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap"
            >
              {t.tipsBanner.signUpFree}
            </Link>
            <button
              onClick={handleDismiss}
              className="text-white hover:text-gray-200 transition-colors p-1"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
