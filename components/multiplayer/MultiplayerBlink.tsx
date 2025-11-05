'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, emitSocketEvent, onSocketEvent } from '@/lib/services/socketClient';
import type { SerializedGameState, PlayerState as GamePlayerState } from '@/lib/game-engine/GameState';
import type { BlinkGameState, BlinkPlayerData } from '@/lib/game-engine/BlinkMultiplayer';

interface MultiplayerBlinkProps {
  roomId: string;
  playerId: string;
  displayName: string;
  onGameEnd: () => void;
  onReturnToLobby: () => void;
}

export default function MultiplayerBlink({
  roomId,
  playerId,
  displayName,
  onGameEnd,
  onReturnToLobby,
}: MultiplayerBlinkProps) {
  const [gameState, setGameState] = useState<SerializedGameState | null>(null);
  const [playerStates, setPlayerStates] = useState<Map<string, GamePlayerState>>(new Map());
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [currentChar, setCurrentChar] = useState<string>('');
  const [charStartTime, setCharStartTime] = useState<number>(0);
  const [timeLimit, setTimeLimit] = useState<number>(2000);
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
  const [totalChars, setTotalChars] = useState<number>(50);
  const [feedback, setFeedback] = useState<{ message: string; type: 'correct' | 'error' | 'neutral' } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(2000);

  // Listen for game state updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleGameState = (state: SerializedGameState) => {
      console.log('🔍 [Blink Client] Received game state:', {
        hasGameSpecificState: !!state.gameSpecificState,
        gameSpecificState: state.gameSpecificState,
        status: state.status
      });

      setGameState(state);
      setGameStarted(true);

      // Update Blink-specific state
      if (state.gameSpecificState) {
        const blinkState = state.gameSpecificState as BlinkGameState;
        setTimeLimit(blinkState.timeLimit);
        setTotalChars(blinkState.totalChars);

        // Get current player's data for per-player progress
        const currentPlayer = state.players[playerId];
        if (currentPlayer && currentPlayer.gameSpecificData) {
          const playerData = currentPlayer.gameSpecificData as BlinkPlayerData;

          console.log('🔍 [Blink Client] Player-specific data:', {
            currentCharIndex: playerData.currentCharIndex,
            charStartTime: playerData.charStartTime,
            hasCharSequence: !!blinkState.charSequence
          });

          setCurrentCharIndex(playerData.currentCharIndex);
          setCharStartTime(playerData.charStartTime);

          // Get current character from player data (server sends it)
          if (playerData.currentChar) {
            setCurrentChar(playerData.currentChar);
            console.log('🔍 [Blink Client] Current character for player:', playerData.currentChar);
          }

          // Calculate time remaining
          const now = Date.now();
          const elapsed = now - playerData.charStartTime;
          const remaining = Math.max(0, blinkState.timeLimit - elapsed);
          setTimeRemaining(remaining);
        } else {
          console.warn('⚠️  [Blink Client] No player-specific data found for current player!');
        }
      } else {
        console.warn('⚠️  [Blink Client] No gameSpecificState in received state!');
      }

      // Update player states
      const newPlayerStates = new Map<string, GamePlayerState>();
      Object.entries(state.players).forEach(([playerId, player]) => {
        newPlayerStates.set(playerId, player as GamePlayerState);
      });
      setPlayerStates(newPlayerStates);
    };

    const handleGameEnded = (data: { winner: string | null; finalState: SerializedGameState }) => {
      setGameEnded(true);
      setWinner(data.winner);
      setGameState(data.finalState);
      console.log('🎮 Blink game ended, winner:', data.winner);
    };

    const handleGameError = (data: { code: string; message: string }) => {
      console.error('Game error:', data);
      alert(`Game error: ${data.message}`);
    };

    const handleInputRejected = (data: { reason: string }) => {
      setFeedback({ message: data.reason, type: 'error' });
      setTimeout(() => setFeedback(null), 1000);
    };

    const cleanupState = onSocketEvent('game:state', handleGameState);
    const cleanupEnded = onSocketEvent('game:ended', handleGameEnded);
    const cleanupError = onSocketEvent('game:error', handleGameError);
    const cleanupRejected = onSocketEvent('game:input:rejected', handleInputRejected);

    return () => {
      cleanupState();
      cleanupEnded();
      cleanupError();
      cleanupRejected();
    };
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (!gameStarted || gameEnded || charStartTime === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - charStartTime;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeRemaining(remaining);
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [gameStarted, gameEnded, charStartTime, timeLimit]);

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!gameStarted || gameEnded || !currentChar) return;

      const key = e.key.toLowerCase();

      // Only process letter keys
      if (key.length !== 1 || !/[a-z]/.test(key)) return;

      // Send input to server
      emitSocketEvent('game:input', {
        roomId,
        input: {
          playerId,
          inputType: 'keystroke',
          timestamp: Date.now(),
          data: {
            key,
          },
        },
      });

      // Show immediate feedback
      if (key === currentChar.toLowerCase()) {
        setFeedback({ message: 'Correct!', type: 'correct' });
      } else {
        setFeedback({ message: `Wrong! Expected '${currentChar}'`, type: 'error' });
      }

      setTimeout(() => setFeedback(null), 500);
    },
    [gameStarted, gameEnded, currentChar, roomId, playerId]
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

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-900">
        <div className="text-white text-2xl font-bold animate-pulse">
          Waiting for game to start...
        </div>
      </div>
    );
  }

  if (gameEnded) {
    const winnerState = winner ? playerStates.get(winner) : null;
    const isDraw = !winner && sortedPlayers.length > 1 &&
                   sortedPlayers[0].score === sortedPlayers[1].score;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-900">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center max-w-2xl">
          <div className="text-6xl mb-6">⚡</div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Game Over!
          </h2>

          {/* Draw */}
          {isDraw && (
            <div className="mb-8 p-6 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg">
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
                Score: {winnerState.score} | Accuracy: {winnerState.accuracy.toFixed(1)}%
              </div>
              {winnerState.gameSpecificData && (
                <div className="text-lg text-white mt-2">
                  Best Streak: {(winnerState.gameSpecificData as BlinkPlayerData).bestStreak} |
                  First Answers: {(winnerState.gameSpecificData as BlinkPlayerData).firstAnswers}
                </div>
              )}
            </div>
          )}

          {/* Rankings */}
          <div className="space-y-3 mb-8">
            {sortedPlayers.map((player, index) => {
              const playerData = player.gameSpecificData as BlinkPlayerData;
              return (
                <div
                  key={player.playerId}
                  className={`p-4 rounded-lg ${
                    player.playerId === playerId
                      ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
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
                          {player.accuracy.toFixed(1)}% Accuracy |
                          Streak: {playerData?.bestStreak || 0} |
                          First: {playerData?.firstAnswers || 0}x
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {player.score}
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
    );
  }

  // Calculate timer percentage for visual indicator
  const timerPercent = (timeRemaining / timeLimit) * 100;
  const timerColor = timerPercent > 50 ? 'bg-green-500' :
                     timerPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  // Determine grid layout based on player count
  const playerCount = arrangedPlayers.length;
  const gridLayout = playerCount <= 2 ? 'grid-cols-1 md:grid-cols-2' :
                     playerCount === 3 ? 'grid-cols-1 md:grid-cols-3' :
                     'grid-cols-2 md:grid-cols-2';

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 p-4">
      {/* Split-screen Grid for 2-4 players */}
      <div className={`grid ${gridLayout} gap-4 min-h-[calc(100vh-2rem)]`}>
        {arrangedPlayers.map((player, displayIndex) => {
          const isCurrentPlayer = player.playerId === playerId;
          const playerData = player.gameSpecificData as BlinkPlayerData;
          // Find actual rank in sorted list
          const actualRank = sortedPlayers.findIndex(p => p.playerId === player.playerId) + 1;

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
                <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-white/80">
                  <div>
                    <div className="text-white/60">Score</div>
                    <div className="font-bold text-white">{player.score}</div>
                  </div>
                  <div>
                    <div className="text-white/60">Streak</div>
                    <div className="font-bold text-white">
                      {playerData?.streak || 0}/{playerData?.bestStreak || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/60">Acc</div>
                    <div className="font-bold text-white">{player.accuracy.toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-white/60">First</div>
                    <div className="font-bold text-white">{playerData?.firstAnswers || 0}x</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                    <span>Char {(playerData?.currentCharIndex ?? 0) + 1}/{totalChars}</span>
                    <span>{isCurrentPlayer ? (timeRemaining / 1000).toFixed(1) : '-'}s</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    {isCurrentPlayer && (
                      <div
                        className={`h-full ${timerColor} transition-all duration-100`}
                        style={{ width: `${timerPercent}%` }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Game Area - Character Display */}
              <div className="relative w-full flex-1 mt-32 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-white/60 text-lg mb-4 font-semibold">
                    Type this character:
                  </div>
                  <div className="text-white text-8xl md:text-9xl font-bold mb-6 animate-pulse">
                    {playerData?.currentChar || '...'}
                  </div>
                  {feedback && isCurrentPlayer && (
                    <div
                      className={`text-xl font-bold ${
                        feedback.type === 'correct' ? 'text-green-300' : 'text-red-300'
                      } animate-bounce`}
                    >
                      {feedback.message}
                    </div>
                  )}
                  {!playerData?.currentChar && (
                    <div className="text-white/60 text-sm">
                      Waiting for game state...
                    </div>
                  )}

                  {/* Response Time for current player */}
                  {isCurrentPlayer && playerData?.avgResponseTime > 0 && (
                    <div className="mt-6 text-white/60 text-sm">
                      Avg Response: {playerData.avgResponseTime.toFixed(0)}ms
                    </div>
                  )}
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
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center text-white/70 text-sm bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
        ⚡ Type the character as fast as you can! First correct answer gets the most points!
      </div>
    </div>
  );
}
