'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSocket, emitSocketEvent, onSocketEvent } from '@/lib/services/socketClient';
import type { SerializedGameState, PlayerState as GamePlayerState } from '@/lib/game-engine/GameState';
import type { SpeedRaceGameState, SpeedRacePlayerData, GridCell, Position } from '@/lib/game-engine/SpeedRaceMultiplayer';

const GRID_ROWS = 10;
const GRID_COLS = 22;

interface MultiplayerSpeedRaceProps {
  roomId: string;
  playerId: string;
  displayName: string;
  onGameEnd: () => void;
}

export default function MultiplayerSpeedRace({
  roomId,
  playerId,
  displayName,
  onGameEnd,
}: MultiplayerSpeedRaceProps) {
  const [gameState, setGameState] = useState<SerializedGameState | null>(null);
  const [playerStates, setPlayerStates] = useState<Map<string, GamePlayerState>>(new Map());
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'correct' | 'error' | 'neutral' } | null>(null);

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

    const handleGameEnded = (data: { winner: string | null; finalState: SerializedGameState }) => {
      setGameEnded(true);
      setWinner(data.winner);
      setGameState(data.finalState);
      console.log('🏁 Speed Race game ended, winner:', data.winner);
    };

    onSocketEvent('game:state', handleGameState);
    onSocketEvent('game:ended', handleGameEnded);

    return () => {
      socket.off('game:state', handleGameState);
      socket.off('game:ended', handleGameEnded);
    };
  }, [roomId, playerId]);

  // Handle keyboard input
  useEffect(() => {
    if (!gameStarted || gameEnded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Only handle letter keys
      if (key.length !== 1 || !key.match(/[a-z;]/)) return;

      e.preventDefault();

      // Send keystroke to server
      emitSocketEvent('game:input', {
        roomId,
        input: {
          inputType: 'keystroke',
          timestamp: Date.now(),
          data: { key },
        },
      }, (response: any) => {
        if (response.success) {
          // Show feedback for correct keystroke
          setFeedback({
            message: response.feedback?.message || 'Correct!',
            type: 'correct',
          });

          setTimeout(() => setFeedback(null), 500);
        } else {
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
  }, [gameStarted, gameEnded, roomId]);

  if (!gameStarted || !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-900 to-teal-900">
        <div className="text-white text-2xl">Waiting for game to start...</div>
      </div>
    );
  }

  const raceState = gameState.gameSpecificState as SpeedRaceGameState;
  const currentPlayerState = playerStates.get(playerId);
  const currentPlayerData = currentPlayerState?.gameSpecificData as SpeedRacePlayerData | undefined;

  // Get all players sorted by progress (for ranking)
  const sortedPlayers = Array.from(playerStates.entries())
    .sort((a, b) => {
      const aData = a[1].gameSpecificData as SpeedRacePlayerData;
      const bData = b[1].gameSpecificData as SpeedRacePlayerData;
      return bData.pathIndex - aData.pathIndex; // Higher index = further along
    });

  // Determine number of players for layout
  const playerCount = playerStates.size;

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

              <button
                onClick={onGameEnd}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Return to Lobby
              </button>
            </div>
          </div>
        )}

        {/* Split-screen layout */}
        <div className={`grid gap-4 ${
          playerCount === 2 ? 'grid-cols-2' :
          playerCount === 3 ? 'grid-cols-3' :
          'grid-cols-2'
        }`}>
          {sortedPlayers.map(([pid, pState], index) => {
            const pData = pState.gameSpecificData as SpeedRacePlayerData;
            const isCurrentPlayer = pid === playerId;
            const rank = index + 1;

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
                  {raceState.grid.map((row, rowIndex) =>
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
                          {cell.char}
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
                  ? raceState.grid[raceState.pathSequence[currentPlayerData.pathIndex + 1].row][
                      raceState.pathSequence[currentPlayerData.pathIndex + 1].col
                    ].char
                  : '🏁'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
