'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameType } from '@/types/multiplayer';
import { emitSocketEvent, onSocketEvent, offSocketEvent } from '@/lib/services/socketClient';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface QuickMatchButtonProps {
  gameType: GameType;
  playerId: string;
  displayName: string;
}

export default function QuickMatchButton({ gameType, playerId, displayName }: QuickMatchButtonProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isMatching, setIsMatching] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleMatchFound = (data: { roomId: string }) => {
      setIsMatching(false);
      router.push(`/multiplayer/room/${data.roomId}`);
    };

    const handleMatchTimeout = () => {
      setIsMatching(false);
      setError('Match timeout - no players found. Please try again.');
    };

    const cleanupFound = onSocketEvent('match:found', handleMatchFound);
    const cleanupTimeout = onSocketEvent('match:timeout', handleMatchTimeout);

    return () => {
      cleanupFound();
      cleanupTimeout();
    };
  }, [router]);

  // Fetch queue status
  useEffect(() => {
    if (!isMatching) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/matchmaking/status?gameType=${gameType}`);
        const data = await response.json();
        if (data.success) {
          setQueueSize(data.queueSize);
        }
      } catch (error) {
        console.error('Failed to fetch queue status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => clearInterval(interval);
  }, [isMatching, gameType]);

  const handleQuickMatch = () => {
    setIsMatching(true);
    setError(null);

    emitSocketEvent('match:queue', { gameType }, (response) => {
      if (!response.success) {
        setError(response.error || 'Failed to join matchmaking');
        setIsMatching(false);
      }
    });
  };

  const handleCancel = () => {
    emitSocketEvent('match:cancel', {}, (response) => {
      setIsMatching(false);
      setError(null);
    });
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!isMatching ? (
        <button
          onClick={handleQuickMatch}
          className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {t.multiplayer.quickMatch}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-center text-sm text-blue-900 dark:text-blue-100 font-medium">
              {t.multiplayer.searching}
            </p>
            {queueSize > 0 && (
              <p className="text-center text-xs text-blue-700 dark:text-blue-300 mt-1">
                {queueSize} {t.multiplayer.players.toLowerCase()}{queueSize !== 1 ? '' : ''} in queue
              </p>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t.multiplayer.cancel}
          </button>
        </div>
      )}
    </div>
  );
}
