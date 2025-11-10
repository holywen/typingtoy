'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getSocket, emitSocketEvent, onSocketEvent } from '@/lib/services/socketClient';
import { getUserSettings } from '@/lib/services/userSettings';
import { convertTextToLayout } from '@/lib/utils/layoutMapping';
import { playKeystrokeSound, playVictorySound, playDefeatSound } from '@/lib/services/soundEffects';
import type { SerializedGameState } from '@/lib/game-engine/GameState';
import type { PlayerState as GamePlayerState } from '@/lib/game-engine/PlayerState';

interface FallingBlock {
  id: number;
  char: string;
  x: number;
  y: number;
  speed: number;
  playerId?: string; // Player who owns this block
}

interface MultiplayerFallingBlocksProps {
  roomId: string;
  playerId: string;
  displayName: string;
  onGameEnd: () => void;
  onReturnToLobby: () => void;
}

export default function MultiplayerFallingBlocks({
  roomId,
  playerId,
  displayName,
  onGameEnd,
  onReturnToLobby,
}: MultiplayerFallingBlocksProps) {
  const [gameState, setGameState] = useState<SerializedGameState | null>(null);
  const [localBlocks, setLocalBlocks] = useState<FallingBlock[]>([]);
  const [playerStates, setPlayerStates] = useState<Map<string, GamePlayerState>>(new Map());
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const inputBufferRef = useRef<string>('');
  const [keyboardLayout, setKeyboardLayout] = useState('qwerty');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);

  // Load keyboard layout and sound settings from user settings
  useEffect(() => {
    const settings = getUserSettings();
    setKeyboardLayout(settings.keyboardLayout);
    setSoundEnabled(settings.soundEnabled);
    soundEnabledRef.current = settings.soundEnabled;
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Convert blocks for display in user's layout
  const displayBlocks = useMemo(() => {
    return localBlocks.map(block => ({
      ...block,
      displayChar: convertTextToLayout(block.char, keyboardLayout)
    }));
  }, [localBlocks, keyboardLayout]);

  // Convert user input from their layout back to QWERTY for server validation
  const convertInputToQwerty = useCallback((key: string): string => {
    if (keyboardLayout === 'qwerty') return key;
    const qwertyKeys = 'abcdefghijklmnopqrstuvwxyz'.split('');
    for (const qwertyKey of qwertyKeys) {
      if (convertTextToLayout(qwertyKey, keyboardLayout) === key) {
        return qwertyKey;
      }
    }
    return key;
  }, [keyboardLayout]);

  // Listen for game state updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleGameState = (state: SerializedGameState) => {
      setGameState(state);
      setGameStarted(true);

      // Update blocks from game state
      if (state.gameSpecificState?.blocks) {
        setLocalBlocks(state.gameSpecificState.blocks);
      }

      // Update player states (state.players is a Record, not an array)
      const newPlayerStates = new Map<string, GamePlayerState>();
      Object.entries(state.players).forEach(([playerId, player]) => {
        newPlayerStates.set(playerId, player as GamePlayerState);
      });
      setPlayerStates(newPlayerStates);
    };

    const handleGameEnded = (data: { winner: string | null; finalState: any }) => {
      setGameEnded(true);
      setWinner(data.winner);

      // Play victory or defeat sound - use ref to get latest value
      if (soundEnabledRef.current) {
        if (data.winner === playerId) {
          playVictorySound();
        } else {
          playDefeatSound();
        }
      }
    };

    // TODO: Add 'game:error' to ServerToClientEvents in types/socket.ts
    // const handleGameError = (data: { code: string; message: string }) => {
    //   console.error('Game error:', data);
    //   alert(`Game error: ${data.message}`);
    // };

    const cleanupState = onSocketEvent('game:state', handleGameState);
    const cleanupEnded = onSocketEvent('game:ended', handleGameEnded);
    // const cleanupError = onSocketEvent('game:error', handleGameError);

    return () => {
      cleanupState();
      cleanupEnded();
      // cleanupError();
    };
  }, [playerId]);

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!gameStarted || gameEnded) return;

      const key = e.key.toLowerCase();

      // Only handle letter keys and semicolon
      if (key.length !== 1 || !key.match(/[a-z;]/)) return;

      // Convert user input from their layout to QWERTY
      const qwertyKey = convertInputToQwerty(key);

      // Check if converted key matches any of this player's blocks (in QWERTY)
      const matchingBlock = localBlocks.find(
        (block) => block.char === qwertyKey && block.playerId === playerId
      );

      if (matchingBlock) {
        // Play correct keystroke sound - use ref to get latest value
        if (soundEnabledRef.current) {
          playKeystrokeSound(true);
        }

        // Correct key - send to server
        emitSocketEvent('game:input', {
          roomId,
          input: {
            playerId,
            inputType: 'keystroke',
            timestamp: Date.now(),
            data: {
              key: qwertyKey,
              isCorrect: true,
              blockId: matchingBlock.id,
            },
          },
        });

        // Optimistically remove block locally for instant feedback
        setLocalBlocks((prev) => prev.filter((b) => b.id !== matchingBlock.id));
      } else {
        // Play incorrect keystroke sound - use ref to get latest value
        if (soundEnabledRef.current) {
          playKeystrokeSound(false);
        }

        // Wrong key - also send to server for error counting
        emitSocketEvent('game:input', {
          roomId,
          input: {
            playerId,
            inputType: 'keystroke',
            timestamp: Date.now(),
            data: {
              key: qwertyKey,
              isCorrect: false,
            },
          },
        });
      }
    },
    [gameStarted, gameEnded, localBlocks, roomId, playerId, convertInputToQwerty]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Get current player state
  const currentPlayerState = playerStates.get(playerId);
  const sortedPlayers = Array.from(playerStates.values()).sort((a, b) => b.score - a.score);

  // For split-screen: arrange players so current player is always on the left
  const arrangedPlayers = gameEnded
    ? sortedPlayers // Show rankings when game ends
    : (() => {
        const current = sortedPlayers.find(p => p.playerId === playerId);
        const others = sortedPlayers.filter(p => p.playerId !== playerId);
        return current ? [current, ...others] : sortedPlayers;
      })();

  // Check if current player finished but game is still ongoing
  const isWaitingForOthers = currentPlayerState?.isFinished && !gameEnded;

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900">
        <div className="text-white text-2xl font-bold animate-pulse">
          Waiting for game to start...
        </div>
      </div>
    );
  }

  // Show waiting screen if current player finished but others are still playing
  if (isWaitingForOthers) {
    const activePlayers = sortedPlayers.filter(p => !p.isFinished);
    const finishedPlayers = sortedPlayers.filter(p => p.isFinished);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center max-w-2xl">
          <div className="text-6xl mb-6">⏳</div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Waiting for Other Players...
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            You've finished! Please wait while others complete the game.
          </p>

          {/* Your Stats */}
          <div className="mb-8 p-6 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-2 border-blue-500">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Your Performance</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{currentPlayerState?.score}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">WPM</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(currentPlayerState?.currentWPM || 0)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{currentPlayerState?.accuracy.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(currentPlayerState?.gameSpecificData as any)?.errorCount || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Players Still Playing */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
              Players Still Playing ({activePlayers.length})
            </h3>
            <div className="space-y-2">
              {activePlayers.map(player => (
                <div key={player.playerId} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-semibold text-gray-900 dark:text-white">{player.displayName}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {player.score} pts | {Math.round(player.currentWPM)} WPM
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Finished Players */}
          {finishedPlayers.length > 1 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                Finished Players ({finishedPlayers.length})
              </h3>
              <div className="space-y-2">
                {finishedPlayers.map(player => (
                  <div key={player.playerId} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg opacity-75">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full" />
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {player.displayName}
                        {player.playerId === playerId && ' (You)'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {player.score} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameEnded) {
    const winnerState = winner ? playerStates.get(winner) : null;

    // Check if it's a draw (no winner but game ended)
    const isDraw = !winner && sortedPlayers.length > 1 &&
                   sortedPlayers[0].score === sortedPlayers[1].score;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center max-w-2xl">
          <div className="text-6xl mb-6">🎮</div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Game Over!
          </h2>

          {/* Draw */}
          {isDraw && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg">
              <div className="text-2xl font-bold text-white mb-2">
                🤝 It's a Draw!
              </div>
              <div className="text-xl text-white">
                Both players scored {sortedPlayers[0].score} points
              </div>
            </div>
          )}

          {/* Winner */}
          {winnerState && !isDraw && (
            <div className="mb-8 p-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
              <div className="text-2xl font-bold text-white mb-2">
                🏆 Winner: {winnerState.displayName}
              </div>
              <div className="text-xl text-white">
                Score: {winnerState.score} | WPM: {Math.round(winnerState.currentWPM)}
              </div>
            </div>
          )}

          {/* Rankings */}
          <div className="space-y-3 mb-8">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.playerId}
                className={`p-4 rounded-lg ${
                  player.playerId === playerId
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {player.displayName}
                        {player.playerId === playerId && ' (You)'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(player.currentWPM)} WPM | {player.accuracy.toFixed(1)}% Accuracy | {(player.gameSpecificData as any)?.errorCount || 0} Errors
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {player.score}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onGameEnd}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Return to Room
            </button>
            <button
              onClick={onReturnToLobby}
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine grid layout based on player count
  const playerCount = arrangedPlayers.length;
  const gridLayout = playerCount <= 2 ? 'grid-cols-1 md:grid-cols-2' :
                     playerCount === 3 ? 'grid-cols-1 md:grid-cols-3' :
                     'grid-cols-2 md:grid-cols-2';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 p-4">
      {/* Split-screen Grid for 2-4 players */}
      <div className={`grid ${gridLayout} gap-4 min-h-[calc(100vh-2rem)]`}>
        {arrangedPlayers.map((player) => {
          const actualRank = sortedPlayers.findIndex(p => p.playerId === player.playerId) + 1;
          const isCurrentPlayer = player.playerId === playerId;
          // Use displayBlocks for current player (shows converted chars), raw blocks for others
          const playerBlocks = isCurrentPlayer
            ? displayBlocks.filter((block) => block.playerId === player.playerId)
            : localBlocks.filter((block) => block.playerId === player.playerId);

          return (
            <div
              key={player.playerId}
              className={`relative bg-gradient-to-b from-gray-900/50 to-gray-800/50 rounded-lg border-2 overflow-hidden min-h-[500px] flex flex-col
                ${isCurrentPlayer ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-gray-600'}`}
            >
              {/* Player Header */}
              <div className="absolute top-0 left-0 right-0 p-3 bg-black/70 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${player.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="font-bold text-white">
                      {player.displayName}
                      {isCurrentPlayer && ' (You)'}
                    </div>
                  </div>
                  <div className="text-sm text-white/80">
                    Rank #{actualRank}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-2 grid grid-cols-5 gap-2 text-xs text-white/80">
                  <div>
                    <div className="text-white/60">Score</div>
                    <div className="font-bold text-white">{player.score}</div>
                  </div>
                  <div>
                    <div className="text-white/60">WPM</div>
                    <div className="font-bold text-white">{Math.round(player.currentWPM)}</div>
                  </div>
                  <div>
                    <div className="text-white/60">Acc</div>
                    <div className="font-bold text-white">{player.accuracy.toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-white/60">Errors</div>
                    <div className="font-bold text-white">
                      {(player.gameSpecificData as any)?.errorCount || 0}/{(player.gameSpecificData as any)?.maxErrors || 10}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60">Lvl</div>
                    <div className="font-bold text-white">{player.level}</div>
                  </div>
                </div>
              </div>

              {/* Game Area */}
              <div className="relative w-full flex-1 mt-24">
                {playerBlocks.map((block) => (
                  <div
                    key={block.id}
                    className={`absolute text-2xl md:text-3xl font-bold text-white rounded-lg px-4 py-2 shadow-lg transform -translate-x-1/2 -translate-y-1/2 transition-all
                      ${isCurrentPlayer ? 'bg-blue-600' : 'bg-gray-600'}`}
                    style={{
                      left: `${block.x}%`,
                      top: `${block.y}%`,
                    }}
                  >
                    {'displayChar' in block ? (block as any).displayChar : block.char}
                  </div>
                ))}

                {/* Danger Zone Indicator */}
                <div className="absolute bottom-8 left-0 right-0 h-0.5 bg-red-500/30" />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-red-400/50 text-xs font-bold">
                  DANGER
                </div>
              </div>

              {/* Current Player Indicator */}
              {isCurrentPlayer && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-yellow-400 text-xs font-bold animate-pulse">
                  ★ YOUR SCREEN ★
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Instructions Overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-white/70 text-sm bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
        Type the letters before they reach the bottom!
      </div>
    </div>
  );
}
