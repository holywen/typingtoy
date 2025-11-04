'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { lessonsData } from '@/lib/data/lessons';

export default function BlinkGame() {
  const { t } = useLanguage();
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [chars, setChars] = useState<string[]>([]);
  const [currentChar, setCurrentChar] = useState('');
  const [displayChar, setDisplayChar] = useState(true);
  const [timeLeft, setTimeLeft] = useState(2000); // 2 seconds to type
  const [level, setLevel] = useState(1);

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

  const getRandomChar = useCallback(() => {
    if (chars.length === 0) return '';
    return chars[Math.floor(Math.random() * chars.length)];
  }, [chars]);

  const nextRound = useCallback(() => {
    const newChar = getRandomChar();
    setCurrentChar(newChar);
    setDisplayChar(true);
    setTimeLeft(Math.max(1000, 2000 - level * 100)); // Decrease time as level increases
  }, [getRandomChar, level]);

  useEffect(() => {
    if (gameStarted && !gameOver && currentChar) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 10) {
            setGameOver(true);
            return 0;
          }
          return prev - 10;
        });
      }, 10);

      return () => clearInterval(timer);
    }
  }, [gameStarted, gameOver, currentChar]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setStreak(0);
    setLevel(1);
    setCurrentChar('');
  }, []);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Handle Enter key on game over screen
    if (gameOver && e.key === 'Enter') {
      e.preventDefault();
      startGame();
      return;
    }

    if (!gameStarted || gameOver || !currentChar) return;

    const key = e.key.toLowerCase();

    if (key === currentChar) {
      // Correct key
      const newScore = score + 10 + streak;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }

      // Level up every 10 correct answers
      if (newScore % 100 === 0) {
        setLevel(l => l + 1);
      }

      nextRound();
    } else if (key.length === 1 && key.match(/[a-z]/)) {
      // Wrong key (only count letter keys)
      setStreak(0);
      setScore(s => Math.max(0, s - 5)); // Lose 5 points for wrong key
    }
  }, [gameStarted, gameOver, currentChar, score, streak, bestStreak, nextRound, startGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (gameStarted && !gameOver && chars.length > 0 && !currentChar) {
      nextRound();
    }
  }, [gameStarted, gameOver, chars, currentChar, nextRound]);

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setStreak(0);
    setLevel(1);
    setCurrentChar('');
    setSelectedLesson(null);
  };

  if (!gameStarted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/games"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-8"
          >
            {t.games?.backToGames || '← Back to Games'}
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
            <div className="text-6xl mb-6">⚡</div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t.games?.blink?.name || 'Blink'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              {t.games?.blink?.instructions || 'Type the character shown as fast as you can before time runs out!'}
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
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-yellow-300'
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
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:border-yellow-300'
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
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-4 rounded-lg font-bold text-lg transition-colors"
            >
              {t.games?.startGame || 'Start Game'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-900 to-orange-900 overflow-hidden">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center text-white z-10">
        <div className="text-2xl font-bold">
          {t.games?.score || 'Score'}: {score}
        </div>
        <div className="text-2xl font-bold">
          {t.games?.level || 'Level'}: {level}
        </div>
        <div className="text-2xl font-bold">
          {t.games?.streak || 'Streak'}: {streak}
        </div>
      </div>

      {/* Game Area */}
      <div className="relative w-full h-screen flex items-center justify-center">
        {!gameOver && currentChar && (
          <div className="text-center">
            {/* Timer Bar */}
            <div className="w-64 h-4 bg-gray-700 rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all duration-100"
                style={{ width: `${(timeLeft / (2000 - (level - 1) * 100)) * 100}%` }}
              />
            </div>

            {/* Character Display */}
            <div
              className={`text-9xl font-bold text-white bg-yellow-600 rounded-3xl px-16 py-12 shadow-2xl transition-all duration-200 ${
                displayChar ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
              }`}
            >
              {currentChar}
            </div>

            {/* Instruction */}
            <p className="text-white text-xl mt-8 opacity-75">
              {t.games?.typeTheCharacter || 'Type the character!'}
            </p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center max-w-md">
              <div className="text-6xl mb-6">⚡</div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t.games?.gameOver || 'Game Over!'}
              </h2>
              <div className="space-y-2 mb-8">
                <p className="text-2xl text-gray-600 dark:text-gray-300">
                  {t.games?.score || 'Score'}: {score}
                </p>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  {t.games?.bestStreak || 'Best Streak'}: {bestStreak}
                </p>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  {t.games?.level || 'Level'}: {level}
                </p>
              </div>
              <div className="space-y-4">
                <button
                  onClick={startGame}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-bold transition-colors"
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
