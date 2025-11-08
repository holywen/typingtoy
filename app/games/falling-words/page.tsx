'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { lessonsData } from '@/lib/data/lessons';

interface FallingWord {
  id: number;
  word: string;
  x: number;
  y: number;
  speed: number;
  typed: string; // Characters typed so far
}

export default function FallingWordsGame() {
  const { t } = useLanguage();
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [words, setWords] = useState<FallingWord[]>([]);
  const [chars, setChars] = useState<string[]>([]);
  const [wordList, setWordList] = useState<string[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [maxErrors] = useState(10);
  const wordIdRef = useRef(0);
  const gameLoopRef = useRef<number | undefined>(undefined);

  // Get characters from selected lesson and generate word list
  useEffect(() => {
    if (selectedLesson !== null) {
      const lesson = lessonsData.find(l => l.lessonNumber === selectedLesson);
      if (lesson) {
        setChars(lesson.focusKeys);
        // Generate words from lesson characters
        const generatedWords = generateWords(lesson.focusKeys, 20);
        setWordList(generatedWords);
      }
    } else {
      // All keys
      const allChars = 'abcdefghijklmnopqrstuvwxyz'.split('');
      setChars(allChars);
      // Common English words for all keys mode
      setWordList([
        'type', 'code', 'word', 'game', 'fast', 'quick', 'jump', 'play',
        'test', 'skill', 'speed', 'learn', 'practice', 'master', 'focus',
        'key', 'text', 'letter', 'typing', 'keyboard', 'finger', 'hand',
      ]);
    }
  }, [selectedLesson]);

  // Generate words using available characters
  const generateWords = (availableChars: string[], count: number): string[] => {
    const words: string[] = [];
    const charSet = new Set(availableChars);

    // Try to create simple 2-4 letter combinations
    for (let i = 0; i < count; i++) {
      const length = Math.floor(Math.random() * 3) + 2; // 2-4 letters
      let word = '';
      for (let j = 0; j < length; j++) {
        const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
        word += randomChar;
      }
      words.push(word);
    }

    return words;
  };

  const spawnWord = useCallback(() => {
    if (wordList.length === 0) return;

    const newWord: FallingWord = {
      id: wordIdRef.current++,
      word: wordList[Math.floor(Math.random() * wordList.length)],
      x: Math.random() * 70 + 10, // 10-80% of width
      y: 0,
      speed: 0.3 + level * 0.05,
      typed: '',
    };

    setWords(prev => [...prev, newWord]);
  }, [wordList, level]);

  const gameLoop = useCallback(() => {
    setWords(prev => {
      const updated = prev.map(word => ({
        ...word,
        y: word.y + word.speed,
      }));

      // Check for words that reached bottom
      const reachedBottom = updated.some(word => word.y >= 85);
      if (reachedBottom) {
        setGameOver(true);
        return prev;
      }

      return updated.filter(word => word.y < 85);
    });
  }, []);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      // Spawn words periodically
      const spawnInterval = setInterval(() => {
        spawnWord();
      }, 3000 - level * 150);

      // Game loop
      gameLoopRef.current = window.setInterval(gameLoop, 50);

      return () => {
        clearInterval(spawnInterval);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [gameStarted, gameOver, level, spawnWord, gameLoop]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setWords([]);
    setErrorCount(0);
  }, []);

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
    if (key.length !== 1 || !key.match(/[a-z]/)) return;

    setWords(prev => {
      // Find the first word that matches the typed character
      const matchIndex = prev.findIndex(word => {
        const nextChar = word.word[word.typed.length];
        return nextChar === key;
      });

      if (matchIndex !== -1) {
        // Match found
        const updatedWords = [...prev];
        const matchedWord = { ...updatedWords[matchIndex] };
        matchedWord.typed += key;

        // Check if word is complete
        if (matchedWord.typed === matchedWord.word) {
          // Word completed!
          setScore(s => {
            const newScore = s + matchedWord.word.length * 5;
            // Level up every 100 points
            if (newScore % 100 === 0 && newScore > 0) {
              setLevel(l => l + 1);
            }
            return newScore;
          });
          // Remove the completed word
          updatedWords.splice(matchIndex, 1);
        } else {
          updatedWords[matchIndex] = matchedWord;
        }

        return updatedWords;
      } else {
        // No match found - increment error count
        setErrorCount(prevErrors => {
          const newErrorCount = prevErrors + 1;
          if (newErrorCount >= maxErrors) {
            setGameOver(true);
          }
          return newErrorCount;
        });
        return prev;
      }
    });
  }, [gameStarted, gameOver, startGame, maxErrors]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setWords([]);
    setSelectedLesson(null);
  };

  if (!gameStarted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/games"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-8"
          >
            {t.games?.backToGames || '← Back to Games'}
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
            <div className="text-6xl mb-6">📝</div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t.games?.fallingWords?.name || 'Falling Words'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              {t.games?.fallingWords?.instructions || 'Type the complete words before they reach the bottom. Accuracy matters!'}
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
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-pink-300'
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
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30'
                        : 'border-gray-300 dark:border-gray-600 hover:border-pink-300'
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
              className="w-full bg-pink-600 hover:bg-pink-700 text-white py-4 rounded-lg font-bold text-lg transition-colors"
            >
              {t.games?.startGame || 'Start Game'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-900 to-purple-900 overflow-hidden">
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
        {words.map(word => (
          <div
            key={word.id}
            className="absolute text-2xl font-bold transition-all"
            style={{
              left: `${word.x}%`,
              top: `${word.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg px-6 py-3 shadow-lg">
              {/* Typed portion (green) */}
              <span className="text-green-600 dark:text-green-400">
                {word.typed}
              </span>
              {/* Remaining portion (gray) */}
              <span className="text-gray-900 dark:text-white">
                {word.word.substring(word.typed.length)}
              </span>
            </div>
          </div>
        ))}

        {/* Instruction */}
        {words.length === 0 && !gameOver && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-white text-2xl font-bold bg-black/50 rounded-lg px-6 py-3">
              {t.games?.getReady || 'Get ready! Words are coming...'}
            </p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center max-w-md">
              <div className="text-6xl mb-6">📝</div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {t.games?.gameOver || 'Game Over!'}
              </h2>
              <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8">
                {t.games?.score || 'Score'}: {score}
              </p>
              <div className="space-y-4">
                <button
                  onClick={startGame}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-lg font-bold transition-colors"
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
