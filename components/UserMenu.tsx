'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { syncToServer, syncFromServer } from '@/lib/services/dataSync';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function UserMenu() {
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Auto-sync on login
  useEffect(() => {
    if (session?.user?.id && status === 'authenticated') {
      syncFromServer(session.user.id);
    }
  }, [session, status]);

  // Auto-sync before logout
  const handleSignOut = async () => {
    if (session?.user?.id) {
      setSyncing(true);
      await syncToServer(session.user.id);
      setSyncing(false);
    }
    signOut();
  };

  const handleManualSync = async () => {
    if (!session?.user?.id) return;

    setSyncing(true);
    await syncToServer(session.user.id);
    await syncFromServer(session.user.id);
    setSyncing(false);
  };

  if (status === 'loading') {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  if (!session) {
    return (
      <div className="flex gap-2">
        <Link
          href="/auth/signin"
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {t.common.signIn}
        </Link>
        <Link
          href="/auth/signup"
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {t.common.signUp}
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
          {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-white hidden sm:block">
          {session.user.name || session.user.email}
        </span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {session.user.email}
              </p>
            </div>

            <div className="py-2">
              <button
                onClick={handleManualSync}
                disabled={syncing}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg
                  className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {syncing ? t.userMenu.syncing : t.userMenu.syncData}
              </button>

              <Link
                href="/progress"
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setShowMenu(false)}
              >
                {t.userMenu.viewProgress}
              </Link>

              <button
                onClick={handleSignOut}
                disabled={syncing}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {syncing ? t.userMenu.signingOut : t.common.signOut}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
