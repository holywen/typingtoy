'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getSocket, emitSocketEvent, onSocketEvent } from '@/lib/services/socketClient';
import { getUserSettings } from '@/lib/services/userSettings';
import { convertTextToLayout } from '@/lib/utils/layoutMapping';
import { playKeystrokeSound, playVictorySound, playDefeatSound } from '@/lib/services/soundEffects';
import type { SerializedGameState } from '@/lib/game-engine/GameState';
import type { PlayerState as GamePlayerState } from '@/lib/game-engine/PlayerState';
import type { SpeedRaceGameState, SpeedRacePlayerData, GridCell, Position } from '@/lib/game-engine/SpeedRaceMultiplayer';

const GRID_ROWS = 10;
const GRID_COLS = 22;

interface MultiplayerSpeedRaceProps {
  roomId: string;
  playerId: string;
  displayName: string;
  onGameEnd: () => void;
  onReturnToLobby: () => void;
}

export default function MultiplayerSpeedRace({
  roomId,
  playerId,
  displayName,
  onGameEnd,
  onReturnToLobby,
}: MultiplayerSpeedRaceProps) {
  const [gameState, setGameState] = useState<SerializedGameState | null>(null);
  const [playerStates, setPlayerStates] = useState<Map<string, GamePlayerState>>(new Map());
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'correct' | 'error' | 'neutral' } | null>(null);
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

  // Convert user input from their layout back to QWERTY for server validation
  const convertInputToQwerty = useCallback((key: string): string => {
    if (keyboardLayout === 'qwerty') return key;
    const qwertyKeys = 'abcdefghijklmnopqrstuvwxyz;'.split('');
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

      // Update player states
      const newPlayerStates = new Map<string, GamePlayerState>();
      Object.entries(state.players).forEach(([pid, player]) => {
        newPlayerStates.set(pid, player as GamePlayerState);
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

    const cleanupState = onSocketEvent('game:state', handleGameState);
    const cleanupEnded = onSocketEvent('game:ended', handleGameEnded);

    return () => {
      cleanupState();
      cleanupEnded();
    };
  }, [roomId, playerId]);

  // Convert grid for display in user's layout - MUST be before any conditional returns
  const displayGrid = useMemo(() => {
    const raceState = gameState?.gameSpecificState as SpeedRaceGameState | undefined;
    if (!raceState || !raceState.grid) {
      return [];
    }
    return raceState.grid.map(row =>
      row.map(cell => ({
        ...cell,
        displayChar: convertTextToLayout(cell.char, keyboardLayout)
      }))
    );
  }, [gameState, keyboardLayout]);

  // Handle keyboard input
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Only handle letter keys
      if (key.length !== 1 || !key.match(/[a-z;]/)) return;

      e.preventDefault();

      // Convert user input from their layout to QWERTY
      const qwertyKey = convertInputToQwerty(key);

      // Send QWERTY key to server
      emitSocketEvent('game:input', {
        roomId,
        input: {
          inputType: 'keystroke',
          timestamp: Date.now(),
          data: { key: qwertyKey },
        },
      }, (response: any) => {
        if (response.success) {
          // Play correct keystroke sound - use ref to get latest value
          if (soundEnabledRef.current) {
            playKeystrokeSound(true);
          }

          // Show feedback for correct keystroke
          setFeedback({
            message: response.feedback?.message || 'Correct!',
            type: 'correct',
          });

          setTimeout(() => setFeedback(null), 500);
        } else {
          // Play incorrect keystroke sound - use ref to get latest value
          if (soundEnabledRef.current) {
            playKeystrokeSound(false);
          }

          // Show feedback for error
          setFeedback({
            message: response.feedback?.message || response.error || 'Wrong!',
            type: 'error',
          });

          setTimeout(() => setFeedback(null), 1000);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameEnded, roomId, convertInputToQwerty]);

  if (!gameStarted || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-900 to-teal-900">
        <div className="text-white text-2xl">Waiting for game to start...</div>
      </div>
    );
  }

  const raceState = gameState.gameSpecificState as SpeedRaceGameState;

  // Safety check - wait for game state to be fully initialized
  if (!raceState || !raceState.grid || !raceState.pathSequence) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="text-white text-2xl">Loading game...</div>
      </div>
    );
  }

  const currentPlayerState = playerStates.get(playerId);
  const currentPlayerData = currentPlayerState?.gameSpecificData as SpeedRacePlayerData | undefined;

  // Get all players sorted by progress (for ranking)
  const sortedPlayers = Array.from(playerStates.entries())
    .sort((a, b) => {
      const aData = a[1].gameSpecificData as SpeedRacePlayerData;
      const bData = b[1].gameSpecificData as SpeedRacePlayerData;
      return bData.pathIndex - aData.pathIndex; // Higher index = further along
    });

  // For split-screen: arrange players so current player is always on the left
  const arrangedPlayers = gameEnded
    ? sortedPlayers // Show rankings when game ends
    : (() => {
        const current = sortedPlayers.find(([pid]) => pid === playerId);
        const others = sortedPlayers.filter(([pid]) => pid !== playerId);
        return current ? [current, ...others] : sortedPlayers;
      })();

  // Check if current player finished but game is still ongoing
  const isWaitingForOthers = currentPlayerState?.isFinished && !gameEnded;

  // Determine number of players for layout
  const playerCount = playerStates.size;

  // Show waiting screen if current player finished but others are still playing
  if (isWaitingForOthers) {
    const activePlayers = Array.from(playerStates.values()).filter(p => !p.isFinished);
    const finishedPlayers = Array.from(playerStates.values()).filter(p => p.isFinished).sort((a, b) => b.score - a.score);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-900 to-teal-900">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center max-w-2xl">
          <div className="text-6xl mb-6">⏳</div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Waiting for Other Players...
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            You've finished! Please wait while others complete the race.
          </p>

          {/* Your Stats */}
          <div className="mb-8 p-6 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-500">
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
                <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentPlayerData?.pathIndex}/{raceState.totalPathLength}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{currentPlayerState?.accuracy.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Players Still Playing */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
              Players Still Racing ({activePlayers.length})
            </h3>
            <div className="space-y-2">
              {activePlayers.map(player => {
                const playerData = player.gameSpecificData as SpeedRacePlayerData;
                return (
                  <div key={player.playerId} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-semibold text-gray-900 dark:text-white">{player.displayName}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {playerData.pathIndex}/{raceState.totalPathLength}
                    </div>
                  </div>
                );
              })}
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-teal-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-4">
          🏁 Speed Race - Multiplayer
        </h1>

        {/* Game Over Modal */}
        {gameEnded && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-2xl w-full mx-4">
              <h2 className="text-4xl font-bold text-center mb-6">
                {winner && playerStates.get(winner)?.displayName === displayName ? '🎉 You Won!' : '🏁 Race Finished!'}
              </h2>

              {/* Final Rankings */}
              <div className="space-y-3 mb-6">
                {sortedPlayers.map(([pid, pState], index) => {
                  const pData = pState.gameSpecificData as SpeedRacePlayerData;
                  const isMe = pid === playerId;
                  const isWinner = pid === winner;

                  return (
                    <div
                      key={pid}
                      className={`p-4 rounded-lg ${
                        isWinner ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500' :
                        isMe ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500' :
                        'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </span>
                          <div>
                            <div className="font-bold">
                              {pState.displayName} {isMe && '(You)'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Progress: {pData.pathIndex}/{raceState.totalPathLength} | Lives: {pData.remainingLives}/{pData.maxLives}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">{pState.score} pts</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {pState.accuracy.toFixed(1)}% accuracy
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
        )}

        {/* Split-screen layout */}
        <div className={`grid gap-4 ${
          playerCount === 2 ? 'grid-cols-2' :
          playerCount === 3 ? 'grid-cols-3' :
          'grid-cols-2'
        }`}>
          {arrangedPlayers.map(([pid, pState], displayIndex) => {
            const pData = pState.gameSpecificData as SpeedRacePlayerData;
            const isCurrentPlayer = pid === playerId;
            // Find actual rank in sorted list
            const rank = sortedPlayers.findIndex(([p]) => p === pid) + 1;

            return (
              <div
                key={pid}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 ${
                  isCurrentPlayer ? 'ring-4 ring-green-500' : ''
                }`}
              >
                {/* Player Header */}
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </span>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {pState.displayName} {isCurrentPlayer && '(You)'}
                      </h3>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Progress: {pData.pathIndex}/{raceState.totalPathLength}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {pState.score}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      ❤️ {pData.remainingLives}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(pData.pathIndex / raceState.totalPathLength) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Mini Grid View */}
                <div
                  className="grid gap-[1px] bg-gray-300 dark:bg-gray-700 p-1 rounded"
                  style={{
                    gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                    fontSize: playerCount > 2 ? '0.5rem' : '0.6rem',
                  }}
                >
                  {(isCurrentPlayer ? displayGrid : raceState.grid).map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                      const isPlayer = pData.currentRow === rowIndex && pData.currentCol === colIndex;
                      const isVisited = pData.visitedCells.some(v => v.row === rowIndex && v.col === colIndex);
                      const isNextTarget = pData.pathIndex + 1 < raceState.pathSequence.length &&
                        raceState.pathSequence[pData.pathIndex + 1].row === rowIndex &&
                        raceState.pathSequence[pData.pathIndex + 1].col === colIndex;

                      return (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`
                            aspect-square flex items-center justify-center font-bold
                            ${isPlayer ? 'bg-green-500 text-white scale-110 z-10' : ''}
                            ${!isPlayer && isNextTarget && isCurrentPlayer ? 'bg-yellow-400 text-gray-900 animate-pulse' : ''}
                            ${!isPlayer && !isNextTarget && isVisited ? 'bg-green-200 dark:bg-green-800 text-gray-700 dark:text-gray-300' : ''}
                            ${!isPlayer && !isNextTarget && !isVisited && cell.isPath ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white' : ''}
                            ${!isPlayer && !isNextTarget && !isVisited && !cell.isPath ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-600' : ''}
                          `}
                        >
                          {'displayChar' in cell ? (cell as any).displayChar : cell.char}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Stats */}
                <div className="mt-3 flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Accuracy: {pState.accuracy.toFixed(1)}%</span>
                  <span>Keystrokes: {pState.keystrokeCount}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current player feedback */}
        {feedback && currentPlayerData && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40">
            <div
              className={`px-8 py-4 rounded-lg font-bold text-xl shadow-lg ${
                feedback.type === 'correct'
                  ? 'bg-green-500 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {feedback.message}
            </div>
          </div>
        )}

        {/* Current player's next target hint */}
        {currentPlayerData && !gameEnded && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Next character:
              </div>
              <div className="text-6xl font-bold text-green-600 dark:text-green-400">
                {currentPlayerData.pathIndex + 1 < raceState.pathSequence.length
                  ? (displayGrid[raceState.pathSequence[currentPlayerData.pathIndex + 1].row][
                      raceState.pathSequence[currentPlayerData.pathIndex + 1].col
                    ] as any).displayChar
                  : '🏁'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
