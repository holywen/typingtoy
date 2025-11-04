'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { lessonsData } from '@/lib/data/lessons';

interface FallingBlock {
  id: number;
  char: string;
  x: number;
  y: number;
  speed: number;
}

export default function FallingBlocksGame() {
  const { t } = useLanguage();
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [blocks, setBlocks] = useState<FallingBlock[]>([]);
  const [chars, setChars] = useState<string[]>([]);
  const blockIdRef = useRef(0);
  const gameLoopRef = useRef<number | undefined>(undefined);

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

  const spawnBlock = useCallback(() => {
    if (chars.length === 0) return;

    const newBlock: FallingBlock = {
      id: blockIdRef.current++,
      char: chars[Math.floor(Math.random() * chars.length)],
      x: Math.random() * 80 + 10, // 10-90% of width
      y: 0,
      speed: 0.5 + level * 0.1,
    };

    setBlocks(prev => [...prev, newBlock]);
  }, [chars, level]);

  const gameLoop = useCallback(() => {
    setBlocks(prev => {
      const updated = prev.map(block => ({
        ...block,
        y: block.y + block.speed,
      }));

      // Check for blocks that reached bottom
      const reachedBottom = updated.some(block => block.y >= 90);
      if (reachedBottom) {
        setGameOver(true);
        return prev;
      }

      return updated.filter(block => block.y < 90);
    });
  }, []);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Spawn blocks periodically
      const spawnInterval = setInterval(() => {
        spawnBlock();
      }, 2000 - level * 100);

      // Game loop
      gameLoopRef.current = window.setInterval(gameLoop, 50);

      return () => {
        clearInterval(spawnInterval);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [gameStarted, gameOver, level, spawnBlock, gameLoop]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Handle Enter key on game over screen
    if (gameOver && e.key === 'Enter') {
      e.preventDefault();
      startGame();
      return;
    }

    if (!gameStarted || gameOver) return;

    const key = e.key.toLowerCase();
    setBlocks(prev => {
      const hitIndex = prev.findIndex(block => block.char === key);
      if (hitIndex !== -1) {
        setScore(s => {
          const newScore = s + 10;
          // Level up every 100 points
          if (newScore % 100 === 0) {
            setLevel(l => l + 1);
          }
          return newScore;
        });
        return prev.filter((_, i) => i !== hitIndex);
      }
      return prev;
    });
  }, [gameStarted, gameOver]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setBlocks([]);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setBlocks([]);
    setSelectedLesson(null);
  };

  if (!gameStarted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/games"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-8"
          >
            {t.games?.backToGames || '← Back to Games'}
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
            <div className="text-6xl mb-6">🧱</div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t.games?.fallingBlocks?.name || 'Falling Blocks'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              {t.games?.fallingBlocks?.instructions || 'Type the falling letters before they hit the bottom!'}
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
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
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
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg transition-colors"
            >
              {t.games?.startGame || 'Start Game'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 overflow-hidden">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center text-white z-10">
        <div className="text-2xl font-bold">
          {t.games?.score || 'Score'}: {score}
        </div>
        <div className="text-2xl font-bold">
          {t.games?.level || 'Level'}: {level}
        </div>
      </div>

      {/* Game Area */}
      <div className="relative w-full h-screen">
        {blocks.map(block => (
          <div
            key={block.id}
            className="absolute text-4xl font-bold text-white bg-blue-600 rounded-lg px-6 py-3 shadow-lg"
            style={{
              left: `${block.x}%`,
              top: `${block.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {block.char}
          </div>
        ))}

        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center max-w-md">
              <div className="text-6xl mb-6">🎮</div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t.games?.gameOver || 'Game Over!'}
              </h2>
              <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8">
                {t.games?.score || 'Score'}: {score}
              </p>
              <div className="space-y-4">
                <button
                  onClick={startGame}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors"
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
