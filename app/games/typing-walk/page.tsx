'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { lessonsData } from '@/lib/data/lessons';

interface Obstacle {
  id: number;
  x: number;
  char: string;
}

export default function TypingWalkGame() {
  const { t } = useLanguage();
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [chars, setChars] = useState<string[]>([]);
  const [playerY, setPlayerY] = useState(50); // Vertical position (%)
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [currentTarget, setCurrentTarget] = useState<Obstacle | null>(null);
  const obstacleIdRef = useRef(0);
  const gameLoopRef = useRef<number>();

  // Get characters from selected lesson
  useEffect(() => {
    if (selectedLesson !== null) {
      const lesson = lessonsData.find(l => l.lessonNumber === selectedLesson);
      if (lesson) {
        setChars(lesson.focusKeys);
      }
    } else {
      // All keys
      setChars('abcdefghijklmnopqrstuvwxyz'.split(''));
    }
  }, [selectedLesson]);

  const spawnObstacle = useCallback(() => {
    if (chars.length === 0) return;

    const newObstacle: Obstacle = {
      id: obstacleIdRef.current++,
      x: 100, // Start from right side
      char: chars[Math.floor(Math.random() * chars.length)],
    };

    setObstacles(prev => [...prev, newObstacle]);
  }, [chars]);

  const gameLoop = useCallback(() => {
    setObstacles(prev => {
      const updated = prev.map(obstacle => ({
        ...obstacle,
        x: obstacle.x - 1, // Move obstacles to the left
      }));

      // Check for collision with player (player is at x: 20%)
      const collision = updated.some(
        obstacle => obstacle.x < 25 && obstacle.x > 15 && obstacle.id !== currentTarget?.id
      );

      if (collision) {
        setGameOver(true);
        return prev;
      }

      // Remove obstacles that went off screen
      return updated.filter(obstacle => obstacle.x > -10);
    });

    setDistance(d => d + 1);
  }, [currentTarget]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Spawn obstacles periodically
      const spawnInterval = setInterval(() => {
        spawnObstacle();
      }, 2000);

      // Game loop
      gameLoopRef.current = window.setInterval(gameLoop, 50);

      return () => {
        clearInterval(spawnInterval);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [gameStarted, gameOver, spawnObstacle, gameLoop]);

  // Set current target to the closest obstacle
  useEffect(() => {
    if (obstacles.length > 0 && !currentTarget) {
      const closest = obstacles.reduce((prev, curr) =>
        curr.x < prev.x ? curr : prev
      );
      setCurrentTarget(closest);
    } else if (currentTarget && !obstacles.find(o => o.id === currentTarget.id)) {
      setCurrentTarget(null);
    }
  }, [obstacles, currentTarget]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!gameStarted || gameOver) return;

    const key = e.key.toLowerCase();

    if (currentTarget && key === currentTarget.char) {
      // Correct key - jump over obstacle
      setPlayerY(20); // Jump up
      setTimeout(() => setPlayerY(50), 300); // Land back down

      setScore(s => s + 10);
      setObstacles(prev => prev.filter(o => o.id !== currentTarget.id));
      setCurrentTarget(null);
    }
  }, [gameStarted, gameOver, currentTarget]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setDistance(0);
    setObstacles([]);
    setCurrentTarget(null);
    setPlayerY(50);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setDistance(0);
    setObstacles([]);
    setCurrentTarget(null);
    setPlayerY(50);
    setSelectedLesson(null);
  };

  if (!gameStarted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/games"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-8"
          >
            {t.games?.backToGames || '← Back to Games'}
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
            <div className="text-6xl mb-6">🚶</div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t.games?.typingWalk?.name || 'Typing Walk'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              {t.games?.typingWalk?.instructions || 'Type the correct letters to jump over obstacles and keep walking!'}
            </p>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                {t.games?.selectLesson || 'Select Lesson'}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setSelectedLesson(null)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedLesson === null
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {t.games?.allKeys || 'All Keys'}
                  </div>
                </button>
                {lessonsData.map(lesson => (
                  <button
                    key={lesson.lessonNumber}
                    onClick={() => setSelectedLesson(lesson.lessonNumber)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedLesson === lesson.lessonNumber
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Lesson {lesson.lessonNumber}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {lesson.focusKeys.join(' ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg transition-colors"
            >
              {t.games?.startGame || 'Start Game'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-400 to-blue-500 overflow-hidden">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center text-white z-10">
        <div className="text-2xl font-bold">
          {t.games?.score || 'Score'}: {score}
        </div>
        <div className="text-2xl font-bold">
          Distance: {Math.floor(distance / 20)}m
        </div>
      </div>

      {/* Game Area */}
      <div className="relative w-full h-screen">
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-green-800" />
        <div className="absolute bottom-32 left-0 right-0 h-1 bg-green-900" />

        {/* Player */}
        <div
          className="absolute text-6xl transition-all duration-300 ease-out"
          style={{
            left: '20%',
            bottom: `${playerY}%`,
            transform: 'translateX(-50%)',
          }}
        >
          🚶
        </div>

        {/* Obstacles */}
        {obstacles.map(obstacle => (
          <div
            key={obstacle.id}
            className={`absolute bottom-32 transition-all ${
              currentTarget?.id === obstacle.id
                ? 'text-yellow-400 scale-125'
                : 'text-red-600'
            }`}
            style={{
              left: `${obstacle.x}%`,
            }}
          >
            <div className="text-5xl font-bold bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow-lg border-4 border-current">
              {obstacle.char}
            </div>
          </div>
        ))}

        {/* Instruction */}
        {currentTarget && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <p className="text-white text-2xl font-bold bg-black/50 rounded-lg px-6 py-3">
              Type: {currentTarget.char}
            </p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center max-w-md">
              <div className="text-6xl mb-6">🚶</div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t.games?.gameOver || 'Game Over!'}
              </h2>
              <div className="space-y-2 mb-8">
                <p className="text-2xl text-gray-600 dark:text-gray-300">
                  {t.games?.score || 'Score'}: {score}
                </p>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Distance: {Math.floor(distance / 20)}m
                </p>
              </div>
              <div className="space-y-4">
                <button
                  onClick={startGame}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors"
                >
                  {t.games?.playAgain || 'Play Again'}
                </button>
                <button
                  onClick={resetGame}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-bold transition-colors"
                >
                  {t.games?.backToGames || '← Back to Games'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
