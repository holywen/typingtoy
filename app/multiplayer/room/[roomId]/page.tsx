'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { GameRoom } from '@/types/multiplayer';
import { initSocketClient, getSocket, emitSocketEvent, onSocketEvent } from '@/lib/services/socketClient';
import { getDeviceIdentity } from '@/lib/services/deviceId';
import ChatBox from '@/components/lobby/ChatBox';
import MultiplayerFallingBlocks from '@/components/multiplayer/MultiplayerFallingBlocks';

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const router = useRouter();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [gameActive, setGameActive] = useState(false);

  // Initialize player identity and socket connection
  useEffect(() => {
    async function init() {
      const identity = await getDeviceIdentity();
      setPlayerId(identity.deviceId);
      setDisplayName(identity.displayName);

      // Initialize socket if not already connected
      let socket = getSocket();
      if (!socket || !socket.connected) {
        socket = initSocketClient({
          deviceId: identity.deviceId,
          displayName: identity.displayName,
        });

        // Wait for connection
        socket.on('connect', () => {
          console.log('✅ Socket connected in room page');
          setSocketConnected(true);
        });

        socket.on('disconnect', () => {
          console.log('❌ Socket disconnected in room page');
          setSocketConnected(false);
        });
      } else {
        setSocketConnected(true);
      }
    }
    init();
  }, []);

  // Join room via socket when connected
  useEffect(() => {
    if (!socketConnected || !playerId || !displayName) return;

    const socket = getSocket();
    if (!socket) return;

    // Emit room join event
    emitSocketEvent('room:join', { roomId }, (response: any) => {
      if (response.success) {
        console.log('✅ Joined room via socket:', roomId);
        setRoom(response.room);
        const player = response.room.players.find((p: any) => p.playerId === playerId);
        setIsHost(player?.isHost || false);
        setLoading(false);
      } else {
        console.error('❌ Failed to join room:', response.error);
        setError(response.error || 'Failed to join room');
        setLoading(false);
      }
    });
  }, [socketConnected, playerId, displayName, roomId]);

  // Listen for room updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRoomUpdated = (data: { room: GameRoom }) => {
      if (data.room.roomId === roomId) {
        setRoom(data.room);
      }
    };

    const handlePlayerJoined = (data: { room: GameRoom }) => {
      if (data.room.roomId === roomId) {
        setRoom(data.room);
      }
    };

    const handlePlayerLeft = (data: { room: GameRoom }) => {
      if (data.room.roomId === roomId) {
        setRoom(data.room);
        const stillInRoom = data.room.players.some((p) => p.playerId === playerId);
        if (!stillInRoom) {
          router.push('/multiplayer');
        }
      }
    };

    const handlePlayerKicked = () => {
      router.push('/multiplayer');
    };

    const handleGameStarting = (data: { countdown: number }) => {
      setCountdown(data.countdown);
    };

    const handleGameStarted = (data: { roomId: string; seed: number; config: any }) => {
      setCountdown(null);
      setGameActive(true);
      console.log('Game started:', data);
    };

    const handleRoomDeleted = (data: { roomId: string }) => {
      if (data.roomId === roomId) {
        router.push('/multiplayer');
      }
    };

    const cleanupUpdated = onSocketEvent('room:updated', handleRoomUpdated);
    const cleanupJoined = onSocketEvent('room:player-joined', handlePlayerJoined);
    const cleanupLeft = onSocketEvent('room:player-left', handlePlayerLeft);
    const cleanupKicked = onSocketEvent('room:kicked', handlePlayerKicked);
    const cleanupStarting = onSocketEvent('game:starting', handleGameStarting);
    const cleanupStarted = onSocketEvent('game:started', handleGameStarted);
    const cleanupDeleted = onSocketEvent('room:deleted', handleRoomDeleted);

    return () => {
      cleanupUpdated();
      cleanupJoined();
      cleanupLeft();
      cleanupKicked();
      cleanupStarting();
      cleanupStarted();
      cleanupDeleted();
    };
  }, [roomId, playerId, router]);

  const handleLeaveRoom = () => {
    emitSocketEvent('room:leave', { roomId });
    router.push('/multiplayer');
  };

  const handleToggleReady = () => {
    const player = room?.players.find(p => p.playerId === playerId);
    const newReadyState = !player?.isReady;

    emitSocketEvent('room:ready', { roomId, isReady: newReadyState }, (response) => {
      if (response && !response.success) {
        setError(response.error || 'Failed to toggle ready');
        setTimeout(() => setError(null), 3000);
      }
    });
  };

  const handleStartGame = () => {
    emitSocketEvent('room:start', { roomId }, (response) => {
      if (response && !response.success) {
        setError(response.error || 'Failed to start game');
        setTimeout(() => setError(null), 3000);
      }
    });
  };

  const handleKickPlayer = (targetPlayerId: string) => {
    if (!confirm('Are you sure you want to kick this player?')) return;

    emitSocketEvent('room:kick', { roomId, playerId: targetPlayerId }, (response) => {
      if (response && !response.success) {
        setError(response.error || 'Failed to kick player');
        setTimeout(() => setError(null), 3000);
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading room...</p>
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
              Room Error
            </h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
          <button
            onClick={() => router.push('/multiplayer')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = room?.players.find((p) => p.playerId === playerId);
  // Check if all non-host players are ready (host doesn't need to be ready)
  const nonHostPlayers = room?.players.filter((p) => !p.isHost) || [];
  const allNonHostReady = nonHostPlayers.length === 0 || nonHostPlayers.every((p) => p.isReady);
  const canStart = isHost && allNonHostReady && (room?.players.length || 0) >= 2;

  // If game is active, show game component
  if (gameActive && room?.gameType === 'falling-blocks') {
    return (
      <MultiplayerFallingBlocks
        roomId={roomId}
        playerId={playerId}
        displayName={displayName}
        onGameEnd={() => {
          setGameActive(false);
          // Refresh room state
          emitSocketEvent('room:join', { roomId }, (response: any) => {
            if (response.success) {
              setRoom(response.room);
            }
          });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="text-9xl font-bold text-white mb-4 animate-pulse">
                {countdown}
              </div>
              <p className="text-2xl text-white">Game starting...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleLeaveRoom}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Leave Room
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Room Info and Players */}
          <div className="lg:col-span-2 space-y-6">
            {/* Room Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {room?.roomName}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">
                    Game: <span className="font-semibold capitalize">{room?.gameType.replace('-', ' ')}</span>
                  </p>
                </div>
                {room?.password && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Private</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {room?.players.length}/{room?.maxPlayers} Players
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  room?.status === 'waiting'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : room?.status === 'playing'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {room?.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Players List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Players</h2>
              <div className="space-y-3">
                {room?.players.map((player) => (
                  <div
                    key={player.playerId}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {player.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {player.displayName}
                            {player.playerId === playerId && ' (You)'}
                          </p>
                          {player.isHost && (
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded">
                              HOST
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {player.isReady ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">Ready</span>
                          ) : (
                            <span className="text-yellow-600 dark:text-yellow-400">Not Ready</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {isHost && !player.isHost && (
                      <button
                        onClick={() => handleKickPlayer(player.playerId)}
                        className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        Kick
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleToggleReady}
                  disabled={isHost}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    currentPlayer?.isReady
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {currentPlayer?.isReady ? 'Not Ready' : 'Ready'}
                </button>

                {isHost && (
                  <button
                    onClick={handleStartGame}
                    disabled={!canStart}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    {!allNonHostReady
                      ? 'Waiting for players...'
                      : (room?.players.length || 0) < 2
                      ? 'Need 2+ players'
                      : 'Start Game'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Chat */}
          <div>
            <ChatBox playerId={playerId} displayName={displayName} roomId={roomId} />
          </div>
        </div>
      </div>
    </div>
  );
}
