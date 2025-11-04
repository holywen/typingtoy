'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, emitSocketEvent, onSocketEvent } from '@/lib/services/socketClient';
import type { SerializedGameState, PlayerState as GamePlayerState } from '@/lib/game-engine/GameState';

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
}

export default function MultiplayerFallingBlocks({
  roomId,
  playerId,
  displayName,
  onGameEnd,
}: MultiplayerFallingBlocksProps) {
  const [gameState, setGameState] = useState<SerializedGameState | null>(null);
  const [localBlocks, setLocalBlocks] = useState<FallingBlock[]>([]);
  const [playerStates, setPlayerStates] = useState<Map<string, GamePlayerState>>(new Map());
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const inputBufferRef = useRef<string>('');

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

    const handleGameEnded = (data: { winner: string | null; finalState: SerializedGameState }) => {
      setGameEnded(true);
      setWinner(data.winner);
      setGameState(data.finalState);
      console.log('🎮 Game ended, winner:', data.winner);
    };

    const handleGameError = (data: { code: string; message: string }) => {
      console.error('Game error:', data);
      alert(`Game error: ${data.message}`);
    };

    const cleanupState = onSocketEvent('game:state', handleGameState);
    const cleanupEnded = onSocketEvent('game:ended', handleGameEnded);
    const cleanupError = onSocketEvent('game:error', handleGameError);

    return () => {
      cleanupState();
      cleanupEnded();
      cleanupError();
    };
  }, []);

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!gameStarted || gameEnded) return;

      const key = e.key.toLowerCase();

      // Check if key matches any of this player's blocks
      const matchingBlock = localBlocks.find(
        (block) => block.char === key && block.playerId === playerId
      );
      if (matchingBlock) {
        // Send input to server
        emitSocketEvent('game:input', {
          roomId,
          input: {
            playerId,
            inputType: 'keystroke',
            timestamp: Date.now(),
            data: {
              key,
              isCorrect: true,
              blockId: matchingBlock.id,
            },
          },
        });

        // Optimistically remove block locally for instant feedback
        setLocalBlocks((prev) => prev.filter((b) => b.id !== matchingBlock.id));
      }
    },
    [gameStarted, gameEnded, localBlocks, roomId, playerId]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Get current player state
  const currentPlayerState = playerStates.get(playerId);
  const sortedPlayers = Array.from(playerStates.values()).sort((a, b) => b.score - a.score);

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 to-purple-900">
        <div className="text-white text-2xl font-bold animate-pulse">
          Waiting for game to start...
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
                        {Math.round(player.currentWPM)} WPM | {player.accuracy.toFixed(1)}% Accuracy
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

          <button
            onClick={onGameEnd}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg transition-colors"
          >
            Back to Room
          </button>
        </div>
      </div>
    );
  }

  // Determine grid layout based on player count
  const playerCount = sortedPlayers.length;
  const gridLayout = playerCount <= 2 ? 'grid-cols-1 md:grid-cols-2' :
                     playerCount === 3 ? 'grid-cols-1 md:grid-cols-3' :
                     'grid-cols-2 md:grid-cols-2';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 p-4">
      {/* Split-screen Grid for 2-4 players */}
      <div className={`grid ${gridLayout} gap-4 h-full`}>
        {sortedPlayers.map((player) => {
          const isCurrentPlayer = player.playerId === playerId;
          const playerBlocks = localBlocks.filter((block) => block.playerId === player.playerId);

          return (
            <div
              key={player.playerId}
              className={`relative bg-gradient-to-b from-gray-900/50 to-gray-800/50 rounded-lg border-2 overflow-hidden
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
                    Rank #{sortedPlayers.findIndex(p => p.playerId === player.playerId) + 1}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-white/80">
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
                    <div className="text-white/60">Lvl</div>
                    <div className="font-bold text-white">{player.level}</div>
                  </div>
                </div>
              </div>

              {/* Game Area */}
              <div className="relative w-full h-full pt-24">
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
                    {block.char}
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
