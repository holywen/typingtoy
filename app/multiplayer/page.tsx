'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getDeviceIdentity } from '@/lib/services/deviceId';
import { initSocketClient, getSocket, disconnectSocket } from '@/lib/services/socketClient';
import GameLobby from '@/components/lobby/GameLobby';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function MultiplayerPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [deviceIdentity, setDeviceIdentity] = useState<any>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);

  useEffect(() => {
    // Don't initialize while session is still loading
    if (status === 'loading') {
      return;
    }

    // Require authentication - redirect to sign in if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/multiplayer');
      return;
    }

    async function initialize() {
      try {
        // Check if user is banned (only for authenticated users)
        if (session?.user?.id) {
          try {
            const response = await fetch('/api/user/ban-status');
            if (response.ok) {
              const data = await response.json();
              if (data.banned) {
                setIsBanned(true);
                setBanReason(data.banReason);
                setIsConnecting(false);
                return;
              }
            }
          } catch (error) {
            console.error('Failed to check ban status:', error);
          }
        }

        // Get device identity
        const identity = await getDeviceIdentity();
        setDeviceIdentity(identity);

        // Debug: Log session info
        console.log('🔍 Session info:', {
          hasSession: !!session,
          userId: session?.user?.id,
          userName: session?.user?.name,
          deviceId: identity.deviceId,
        });

        // Check if socket is already connected with the same auth
        const existingSocket = getSocket();
        if (existingSocket?.connected) {
          const currentAuth = existingSocket.auth as any;
          if (currentAuth?.userId === session?.user?.id) {
            console.log('✅ Socket already connected with same userId, skipping re-init');
            setIsConnecting(false);
            return;
          }
        }

        // Initialize socket connection with userId from session if available
        const socket = initSocketClient({
          userId: session?.user?.id,
          deviceId: identity.deviceId,
          displayName: session?.user?.name || identity.displayName,
        });

        // If already connected, resolve immediately
        if (socket.connected) {
          console.log('✅ Socket already connected, no need to wait');
          setIsConnecting(false);
          return;
        }

        console.log('⏳ Waiting for socket connection...');

        // Wait for connection
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            socket.off('connect', onConnect);
            socket.off('connect_error', onError);
            reject(new Error('Connection timeout'));
          }, 10000);

          const onConnect = () => {
            console.log('✅ Socket connect event received');
            clearTimeout(timeout);
            socket.off('connect', onConnect);
            socket.off('connect_error', onError);
            setIsConnecting(false);
            resolve();
          };

          // Handle auto-rejoin when reconnecting to a room
          const onAutoRejoin = (data: { roomId: string; room: any }) => {
            console.log('🔄 Auto-rejoining room:', data.roomId);
            router.push(`/multiplayer/room/${data.roomId}`);
          };

          socket.on('room:auto-rejoin', onAutoRejoin);

          const onError = (error: Error) => {
            console.error('❌ Socket connect_error event received:', error);
            clearTimeout(timeout);
            socket.off('connect', onConnect);
            socket.off('connect_error', onError);
            setConnectionError(error.message);
            setIsConnecting(false);
            reject(error);
          };

          socket.on('connect', onConnect);
          socket.on('connect_error', onError);

          // Check if socket connected while we were setting up listeners
          if (socket.connected) {
            console.log('✅ Socket connected during listener setup');
            clearTimeout(timeout);
            socket.off('connect', onConnect);
            socket.off('connect_error', onError);
            setIsConnecting(false);
            resolve();
          }
        });
      } catch (error) {
        console.error('Failed to initialize:', error);
        setConnectionError('Failed to connect to server');
        setIsConnecting(false);
      }
    }

    initialize();

    // Cleanup: Disconnect socket when user leaves multiplayer area
    return () => {
      // Check if user is navigating to another multiplayer page (room, leaderboard)
      // by checking if URL still contains '/multiplayer/'
      const isStayingInMultiplayer = window.location.pathname.startsWith('/multiplayer/');

      if (!isStayingInMultiplayer) {
        console.log('🚪 User leaving multiplayer area, disconnecting socket');
        disconnectSocket();
      } else {
        console.log('🔄 User navigating within multiplayer, keeping socket connected');
      }
    };

    // Note: Server automatically removes players from rooms when they connect to lobby
    // See socketServer.ts:139-159 - cleanups stale room memberships on connection
  }, [session?.user?.id, status]); // Wait for session to load, then init once with final userId

  if (isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-4">
            <div className="text-5xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">
              {t.admin.bannedFromMultiplayer}
            </h2>
            {banReason && (
              <p className="text-red-600 dark:text-red-300 mb-2">
                <strong>{t.admin.banReason}:</strong> {banReason}
              </p>
            )}
            <p className="text-red-600 dark:text-red-300 text-sm">
              {t.admin.contactAdmin}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.common.backToHome}
          </button>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
              Connection Failed
            </h2>
            <p className="text-red-600 dark:text-red-300">{connectionError}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.common.backToHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.common.backToHome}
          </button>
        </div>

        <GameLobby deviceIdentity={deviceIdentity} session={session} />
      </div>
    </div>
  );
}
