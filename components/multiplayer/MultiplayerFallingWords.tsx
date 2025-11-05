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
  onReturnToLobby: () => void;
}

export default function MultiplayerFallingWords({
  roomId,
  playerId,
  displayName,
  onGameEnd,
  onReturnToLobby,
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

  // Safety check - wait for game state to be fully initialized
  if (!wordsState || !wordsState.words || !Array.isArray(wordsState.words)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-pink-900 to-purple-900">
        <div className="text-white text-2xl">Loading game...</div>
      </div>
    );
  }

  const currentPlayerState = playerStates.get(playerId);
  const currentPlayerData = currentPlayerState?.gameSpecificData as FallingWordsPlayerData | undefined;

  // Get all players sorted by score (for ranking)
  const sortedPlayers = Array.from(playerStates.entries())
    .sort((a, b) => b[1].score - a[1].score);

  // For split-screen: arrange players so current player is always on the left
  const arrangedPlayers = gameEnded
    ? sortedPlayers // Show rankings when game ends
    : (() => {
        const current = sortedPlayers.find(([pid]) => pid === playerId);
        const others = sortedPlayers.filter(([pid]) => pid !== playerId);
        return current ? [current, ...others] : sortedPlayers;
      })();

  // Determine number of players for layout
  const playerCount = playerStates.size;

  // Determine grid layout based on player count
  const gridLayout = playerCount <= 2 ? 'grid-cols-1 md:grid-cols-2' :
                     playerCount === 3 ? 'grid-cols-1 md:grid-cols-3' :
                     'grid-cols-2 md:grid-cols-2';

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-900 to-purple-900 p-4">
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

      {/* Split-screen Grid for 2-4 players */}
      <div className={`grid ${gridLayout} gap-4 min-h-[calc(100vh-2rem)]`}>
        {arrangedPlayers.map(([pid, pState], displayIndex) => {
          const isCurrentPlayer = pid === playerId;
          const pData = pState.gameSpecificData as FallingWordsPlayerData;
          // Find actual rank in sorted list
          const actualRank = sortedPlayers.findIndex(([p]) => p === pid) + 1;

          // Filter words for this specific player
          const playerWords = wordsState.words.filter((word) => {
            const completedIds = Array.isArray(pData.completedWordIds)
              ? pData.completedWordIds
              : Array.from(pData.completedWordIds || []);
            const lostIds = Array.isArray(pData.lostWordIds)
              ? pData.lostWordIds
              : Array.from(pData.lostWordIds || []);

            return !completedIds.includes(word.id) && !lostIds.includes(word.id);
          });

          return (
            <div
              key={pid}
              className={`relative bg-gradient-to-b from-pink-900/30 to-purple-900/30 rounded-lg border-2 overflow-hidden flex flex-col
                ${isCurrentPlayer ? 'border-pink-400 shadow-lg shadow-pink-400/50' : 'border-gray-600'}`}
            >
              {/* Player Header */}
              <div className="absolute top-0 left-0 right-0 p-3 bg-black/70 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${pState.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="font-bold text-white">
                      {pState.displayName}
                      {isCurrentPlayer && ' (You)'}
                    </div>
                  </div>
                  <div className="text-sm text-white/80">
                    Rank #{actualRank}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-white/80">
                  <div>
                    <div className="text-white/60">Score</div>
                    <div className="font-bold text-white">{pState.score}</div>
                  </div>
                  <div>
                    <div className="text-white/60">Words</div>
                    <div className="font-bold text-white">{pData.wordsCompleted}</div>
                  </div>
                  <div>
                    <div className="text-white/60">Acc</div>
                    <div className="font-bold text-white">{pState.accuracy.toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-white/60">Lost</div>
                    <div className="font-bold text-white">{pData.wordsLost}/{pData.maxLostWords}</div>
                  </div>
                </div>

                {/* Lives Progress Bar */}
                <div className="mt-2">
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        pData.wordsLost >= pData.maxLostWords ? 'bg-red-500' :
                        pData.wordsLost >= pData.maxLostWords * 0.7 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${((pData.maxLostWords - pData.wordsLost) / pData.maxLostWords) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Falling Words Area for this player */}
              <div className="relative w-full h-full flex-1 mt-32">
                {playerWords.map((word) => {
                  // Check if THIS player is typing this word
                  const isPlayerTyping = pData.currentWordId === word.id;
                  const typedProgress = isPlayerTyping ? pData.typedProgress : '';

                  return (
                    <div
                      key={word.id}
                      className="absolute text-xl md:text-2xl font-bold transition-all duration-100"
                      style={{
                        left: `${word.x}%`,
                        top: `${word.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 shadow-lg ${
                          isPlayerTyping ? 'bg-yellow-300 dark:bg-yellow-600 border-2 border-yellow-500' :
                          'bg-white/90 dark:bg-gray-800/90'
                        }`}
                      >
                        {/* Typed portion (green/colored) */}
                        {typedProgress && (
                          <span className={isPlayerTyping && isCurrentPlayer ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}>
                            {typedProgress}
                          </span>
                        )}
                        {/* Remaining portion */}
                        <span className="text-gray-900 dark:text-white">
                          {word.word.substring(typedProgress.length)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Waiting message if no words for this player */}
                {playerWords.length === 0 && !gameEnded && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-white text-lg font-bold bg-black/50 rounded-lg px-4 py-2">
                      {pData.wordsCompleted > 0 ? 'All caught up!' : 'Get ready!'}
                    </p>
                  </div>
                )}

                {/* Feedback area (only for current player) */}
                {feedback && isCurrentPlayer && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div
                      className={`text-sm font-bold px-3 py-1 rounded-lg shadow-lg ${
                        feedback.type === 'correct' ? 'bg-green-500 text-white' :
                        feedback.type === 'error' ? 'bg-red-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}
                    >
                      {feedback.message}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
