'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { lessonsData } from '@/lib/data/lessons';
import { getUserSettings } from '@/lib/services/userSettings';
import { playKeystrokeSound, playGameStartSound, playDefeatSound, playErrorSound } from '@/lib/services/soundEffects';

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
  const [errorCount, setErrorCount] = useState(0);
  const [maxErrors] = useState(10);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const blockIdRef = useRef(0);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const blocksAtBottomRef = useRef(0);
  const foundMatchRef = useRef(false);

  // Load sound settings
  useEffect(() => {
    const settings = getUserSettings();
    setSoundEnabled(settings.soundEnabled);
  }, []);

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

    setBlocks(prev => {
      // Find occupied x positions in the top 30% of screen
      const occupiedX = prev
        .filter(block => block.y < 30)
        .map(block => block.x);

      // Generate x position that doesn't overlap with existing blocks
      let x: number;
      let attempts = 0;
      const maxAttempts = 20;

      do {
        x = Math.random() * 80 + 10; // 10-90% of width
        attempts++;

        // Check if this x is too close to any occupied position (within 15%)
        const isTooClose = occupiedX.some(occupied => Math.abs(occupied - x) < 15);

        if (!isTooClose || attempts >= maxAttempts) {
          break;
        }
      } while (attempts < maxAttempts);

      const newBlock: FallingBlock = {
        id: blockIdRef.current++,
        char: chars[Math.floor(Math.random() * chars.length)],
        x,
        y: 0,
        speed: 0.5 + level * 0.1,
      };

      return [...prev, newBlock];
    });
  }, [chars, level]);

  const gameLoop = useCallback(() => {
    setBlocks(prev => {
      const updated = prev.map(block => ({
        ...block,
        y: block.y + block.speed,
      }));

      // Check for blocks that reached bottom (y >= 100 to match multiplayer)
      const blocksAtBottom = updated.filter(block => block.y >= 100);

      // Store count in ref (only set on FIRST call in Strict Mode, won't be overwritten by second call)
      if (blocksAtBottom.length > 0 && blocksAtBottomRef.current === 0) {
        blocksAtBottomRef.current = blocksAtBottom.length;
      }

      // Remove blocks that reached bottom
      return updated.filter(block => block.y < 100);
    });

    // Increment error count OUTSIDE setBlocks callback
    // This runs after BOTH Strict Mode calls of setBlocks, so ref has the correct value
    if (blocksAtBottomRef.current > 0) {
      const missedCount = blocksAtBottomRef.current;
      // Reset ref IMMEDIATELY before setErrorCount (to prepare for next cycle)
      blocksAtBottomRef.current = 0;

      // Play error sound for missed blocks
      if (soundEnabled) {
        playErrorSound();
      }

      setErrorCount(prevErrors => {
        const newErrorCount = prevErrors + missedCount;
        if (newErrorCount >= maxErrors) {
          setGameOver(true);
          // Play game over sound
          if (soundEnabled) {
            playDefeatSound();
          }
        }
        return newErrorCount;
      });
    }
  }, [maxErrors, soundEnabled]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Spawn blocks periodically with exponential decrease
      // Each level reduces interval by 10% with minimum of 200ms
      const baseInterval = 2000;
      const interval = Math.max(200, baseInterval * Math.pow(0.9, level - 1));
      const spawnInterval = setInterval(() => {
        spawnBlock();
      }, interval);

      // Game loop
      gameLoopRef.current = window.setInterval(gameLoop, 50);

      return () => {
        clearInterval(spawnInterval);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [gameStarted, gameOver, level, spawnBlock, gameLoop]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setBlocks([]);
    setErrorCount(0);

    // Play game start sound
    if (soundEnabled) {
      playGameStartSound();
    }
  }, [soundEnabled]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Handle Enter key on game over screen
    if (gameOver && e.key === 'Enter') {
      e.preventDefault();
      startGame();
      return;
    }

    if (!gameStarted || gameOver) return;

    const key = e.key.toLowerCase();

    // Ignore non-letter keys
    if (key.length !== 1 || !key.match(/[a-z;]/)) return;

    // Reset the ref at the start (for this new keystroke)
    foundMatchRef.current = false;

    setBlocks(prev => {
      const hitIndex = prev.findIndex(block => block.char === key);

      if (hitIndex !== -1) {
        // Set ref to true to indicate match found
        foundMatchRef.current = true;

        // Play correct keystroke sound
        if (soundEnabled) {
          playKeystrokeSound(true);
        }

        // Match found - update score
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

    // Use setTimeout to ensure this runs AFTER all setBlocks callbacks complete
    // (including both Strict Mode calls)
    setTimeout(() => {
      if (!foundMatchRef.current) {
        // Play incorrect keystroke sound
        if (soundEnabled) {
          playKeystrokeSound(false);
        }

        // No match was found - increment error count
        setErrorCount(prevErrors => {
          const newErrorCount = prevErrors + 1;
          if (newErrorCount >= maxErrors) {
            setGameOver(true);
            // Play game over sound
            if (soundEnabled) {
              playDefeatSound();
            }
          }
          return newErrorCount;
        });
      }
    }, 0);
  }, [gameStarted, gameOver, startGame, maxErrors, soundEnabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

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
        <div className="text-2xl font-bold">
          {t.games?.errors || 'Errors'}: {errorCount}/{maxErrors}
        </div>
      </div>

      {/* Game Area */}
      <div className="relative w-full h-screen">
        {blocks.map(block => (
          <div
            key={block.id}
            className="absolute text-4xl font-bold text-white bg-blue-600 rounded-lg px-6 py-3 shadow-lg will-change-transform"
            style={{
              left: '0',
              top: '0',
              transform: `translate3d(calc(${block.x}vw - 50%), calc(${block.y}vh - 50%), 0)`,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
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
