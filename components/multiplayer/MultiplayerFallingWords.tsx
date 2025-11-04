'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSocket, emitSocketEvent, onSocketEvent } from '@/lib/services/socketClient';
import type { SerializedGameState, PlayerState as GamePlayerState } from '@/lib/game-engine/GameState';
import type { FallingWordsGameState, FallingWordsPlayerData, FallingWord } from '@/lib/game-engine/FallingWordsMultiplayer';

interface MultiplayerFallingWordsProps {
  roomId: string;
  playerId: string;
  displayName: string;
  onGameEnd: () => void;
}

export default function MultiplayerFallingWords({
  roomId,
  playerId,
  displayName,
  onGameEnd,
}: MultiplayerFallingWordsProps) {
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
      console.log('📝 Falling Words game ended, winner:', data.winner);
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
      if (key.length !== 1 || !key.match(/[a-z]/)) return;

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-pink-900 to-purple-900">
        <div className="text-white text-2xl">Waiting for game to start...</div>
      </div>
    );
  }

  const wordsState = gameState.gameSpecificState as FallingWordsGameState;
  const currentPlayerState = playerStates.get(playerId);
  const currentPlayerData = currentPlayerState?.gameSpecificData as FallingWordsPlayerData | undefined;

  // Get all players sorted by score (for ranking)
  const sortedPlayers = Array.from(playerStates.entries())
    .sort((a, b) => b[1].score - a[1].score);

  // Determine number of players for layout
  const playerCount = playerStates.size;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-900 to-purple-900 overflow-hidden">
      {/* Game Over Modal */}
      {gameEnded && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-2xl w-full mx-4">
            <h2 className="text-4xl font-bold text-center mb-6">
              {winner && playerStates.get(winner)?.displayName === displayName ? '🎉 You Won!' : '📝 Game Over!'}
            </h2>

            {/* Final Rankings */}
            <div className="space-y-3 mb-6">
              {sortedPlayers.map(([pid, pState], index) => {
                const pData = pState.gameSpecificData as FallingWordsPlayerData;
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
                            Words: {pData.wordsCompleted} | Lost: {pData.wordsLost}
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
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Return to Lobby
            </button>
          </div>
        </div>
      )}

      {/* Top HUD with player stats */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10">
        <div className={`grid gap-3 ${
          playerCount === 2 ? 'grid-cols-2' :
          playerCount === 3 ? 'grid-cols-3' :
          'grid-cols-2'
        }`}>
          {sortedPlayers.map(([pid, pState], index) => {
            const pData = pState.gameSpecificData as FallingWordsPlayerData;
            const isCurrentPlayer = pid === playerId;
            const rank = index + 1;

            return (
              <div
                key={pid}
                className={`bg-white/10 backdrop-blur-md rounded-lg p-3 ${
                  isCurrentPlayer ? 'ring-2 ring-pink-400' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </span>
                      <span className="font-bold text-white">
                        {pState.displayName} {isCurrentPlayer && '(You)'}
                      </span>
                    </div>
                    <div className="text-sm text-white/70">
                      Words: {pData.wordsCompleted} | Lost: {pData.wordsLost}/{pData.maxLostWords}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{pState.score}</div>
                    <div className="text-xs text-white/70">{pState.accuracy.toFixed(1)}%</div>
                  </div>
                </div>

                {/* Progress bar showing words lost */}
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        pData.wordsLost >= pData.maxLostWords ? 'bg-red-500' :
                        pData.wordsLost >= pData.maxLostWords * 0.7 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${(pData.wordsLost / pData.maxLostWords) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Falling Words Area */}
      <div className="relative w-full h-screen pt-32">
        {wordsState.words.map((word) => {
          // Check which player (if any) is typing this word
          let typingPlayer: [string, GamePlayerState] | null = null;
          for (const [pid, pState] of playerStates) {
            const pData = pState.gameSpecificData as FallingWordsPlayerData;
            if (pData.currentWordId === word.id) {
              typingPlayer = [pid, pState];
              break;
            }
          }

          const isCurrentPlayerTyping = typingPlayer && typingPlayer[0] === playerId;
          const typedProgress = isCurrentPlayerTyping
            ? (currentPlayerData?.typedProgress || '')
            : typingPlayer
            ? (typingPlayer[1].gameSpecificData as FallingWordsPlayerData).typedProgress
            : '';

          return (
            <div
              key={word.id}
              className="absolute text-2xl font-bold transition-all duration-100"
              style={{
                left: `${word.x}%`,
                top: `${word.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className={`rounded-lg px-6 py-3 shadow-lg ${
                  isCurrentPlayerTyping ? 'bg-yellow-300 dark:bg-yellow-600 border-2 border-yellow-500' :
                  typingPlayer ? 'bg-gray-300 dark:bg-gray-600 border-2 border-gray-500' :
                  'bg-white dark:bg-gray-800'
                }`}
              >
                {/* Typed portion (green/colored) */}
                {typedProgress && (
                  <span className={isCurrentPlayerTyping ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}>
                    {typedProgress}
                  </span>
                )}
                {/* Remaining portion */}
                <span className="text-gray-900 dark:text-white">
                  {word.word.substring(typedProgress.length)}
                </span>

                {/* Show which player is typing (if not current player) */}
                {typingPlayer && !isCurrentPlayerTyping && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {typingPlayer[1].displayName}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Waiting message if no words */}
        {wordsState.words.length === 0 && !gameEnded && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-white text-2xl font-bold bg-black/50 rounded-lg px-6 py-3">
              Get ready! Words are coming...
            </p>
          </div>
        )}
      </div>

      {/* Current player feedback */}
      {feedback && currentPlayerData && (
        <div className="fixed top-40 left-1/2 transform -translate-x-1/2 z-40">
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

      {/* Current typing indicator for current player */}
      {currentPlayerData && currentPlayerData.currentWordId !== null && !gameEnded && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-2xl">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Currently typing:
            </div>
            <div className="text-3xl font-bold">
              <span className="text-green-600 dark:text-green-400">
                {currentPlayerData.typedProgress}
              </span>
              <span className="text-gray-900 dark:text-white">
                {wordsState.words.find(w => w.id === currentPlayerData.currentWordId)?.word.substring(currentPlayerData.typedProgress.length) || ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Speed indicator */}
      <div className="fixed bottom-8 right-8 bg-white/10 backdrop-blur-md text-white rounded-lg px-4 py-2">
        <div className="text-xs">Speed</div>
        <div className="text-xl font-bold">{wordsState.gameSpeed.toFixed(1)}x</div>
      </div>
    </div>
  );
}
