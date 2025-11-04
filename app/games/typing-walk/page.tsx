'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { lessonsData } from '@/lib/data/lessons';

const GRID_ROWS = 10;
const GRID_COLS = 22;

interface GridCell {
  char: string;
  isPath: boolean;
  isVisited: boolean;
  isHighlight: boolean;
}

export default function TypingWalkGame() {
  const { t } = useLanguage();
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [time, setTime] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [chars, setChars] = useState<string[]>([]);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [playerRow, setPlayerRow] = useState(0);
  const [playerCol, setPlayerCol] = useState(1);
  const [currentPath, setCurrentPath] = useState<Array<{row: number, col: number}>>([]);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

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

  // Generate grid with path
  const generateGrid = useCallback(() => {
    if (chars.length === 0) return;

    const newGrid: GridCell[][] = [];
    const path: Array<{row: number, col: number}> = [];

    // Start from left side, random row
    let currentRow = Math.floor(Math.random() * GRID_ROWS);
    let currentCol = 1;

    path.push({ row: currentRow, col: currentCol });

    // Generate a winding path across the grid
    while (currentCol < GRID_COLS - 1) {
      currentCol++;

      // Randomly move up, down, or stay
      const move = Math.random();
      if (move < 0.3 && currentRow > 0) {
        currentRow--;
      } else if (move > 0.7 && currentRow < GRID_ROWS - 1) {
        currentRow++;
      }

      path.push({ row: currentRow, col: currentCol });
    }

    setCurrentPath(path);

    // Fill grid with random characters
    for (let row = 0; row < GRID_ROWS; row++) {
      newGrid[row] = [];
      for (let col = 0; col < GRID_COLS; col++) {
        const isOnPath = path.some(p => p.row === row && p.col === col);
        newGrid[row][col] = {
          char: chars[Math.floor(Math.random() * chars.length)],
          isPath: isOnPath,
          isVisited: false,
          isHighlight: false,
        };
      }
    }

    setGrid(newGrid);
    setPlayerRow(path[0].row);
    setPlayerCol(path[0].col);

    // Mark starting position as visited
    newGrid[path[0].row][path[0].col].isVisited = true;
  }, [chars]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      generateGrid();
    }
  }, [gameStarted, gameOver, generateGrid]);

  // Timer
  useEffect(() => {
    if (gameStarted && !gameOver) {
      timerRef.current = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameStarted, gameOver]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Handle Enter key on game over/win screen
    if ((gameOver || playerCol === GRID_COLS - 1) && e.key === 'Enter') {
      e.preventDefault();
      startGame();
      return;
    }

    if (!gameStarted || gameOver || grid.length === 0) return;

    const key = e.key.toLowerCase();

    // Ignore non-letter keys
    if (key.length !== 1 || !key.match(/[a-z;]/)) return;

    // Find current position in path
    const currentPathIndex = currentPath.findIndex(
      p => p.row === playerRow && p.col === playerCol
    );

    if (currentPathIndex === -1) return;

    // Get next position in path
    const nextPathIndex = currentPathIndex + 1;
    if (nextPathIndex >= currentPath.length) {
      // Won the game!
      setGameOver(true);
      return;
    }

    const nextPos = currentPath[nextPathIndex];
    const nextCell = grid[nextPos.row][nextPos.col];

    if (key === nextCell.char) {
      // Correct key!
      setScore(s => s + 10);
      setPlayerRow(nextPos.row);
      setPlayerCol(nextPos.col);

      // Mark as visited
      setGrid(prev => {
        const newGrid = prev.map(row => row.map(cell => ({ ...cell })));
        newGrid[nextPos.row][nextPos.col].isVisited = true;
        return newGrid;
      });
    } else {
      // Wrong key!
      setLives(l => {
        const newLives = l - 1;
        if (newLives <= 0) {
          setGameOver(true);
        }
        return newLives;
      });
    }
  }, [gameStarted, gameOver, grid, playerRow, playerCol, currentPath, startGame]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const startGame = useCallback(() => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setLives(5);
    setTime(0);
  }, []);

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setLives(5);
    setTime(0);
    setGrid([]);
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
              {t.games?.typingWalk?.instructions || 'Type the correct letters to walk through the grid. Follow the green path!'}
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

  // Check if won
  const isWon = playerCol === GRID_COLS - 1;

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          {t.games?.typingWalk?.name || 'Typing Walk Game'}
        </h1>

        {/* Game Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 border-4 border-gray-300 dark:border-gray-700">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}>
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isPlayer = rowIndex === playerRow && colIndex === playerCol;
                const isNextTarget = currentPath.findIndex(p => p.row === playerRow && p.col === playerCol) + 1 ===
                  currentPath.findIndex(p => p.row === rowIndex && p.col === colIndex);

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      aspect-square flex items-center justify-center text-lg font-semibold border border-gray-300 dark:border-gray-600
                      ${isPlayer ? 'bg-green-400 text-white scale-110 z-10' : ''}
                      ${!isPlayer && isNextTarget ? 'bg-yellow-300 text-gray-900 animate-pulse' : ''}
                      ${!isPlayer && !isNextTarget && cell.isVisited ? 'bg-green-100 dark:bg-green-900 text-gray-700 dark:text-gray-300' : ''}
                      ${!isPlayer && !isNextTarget && !cell.isVisited && cell.isPath ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white' : ''}
                      ${!isPlayer && !isNextTarget && !cell.isVisited && !cell.isPath ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' : ''}
                    `}
                  >
                    {cell.char}
                  </div>
                );
              })
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 flex justify-between items-center text-lg font-bold">
            <div className="text-gray-900 dark:text-white">
              {t.games?.score || 'Score'}: {score}
            </div>
            <div className="text-gray-900 dark:text-white">
              {t.games?.lives || 'Lives'}: {lives}
            </div>
            <div className="text-gray-900 dark:text-white">
              {t.games?.time || 'Time'}: {time}s
            </div>
          </div>
        </div>

        {/* Game Over / Win Modal */}
        {(gameOver || isWon) && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center max-w-md">
              <div className="text-6xl mb-6">{isWon ? '🎉' : '😢'}</div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {isWon ? (t.games?.youWon || 'You Won!') : (t.games?.gameOver || 'Game Over!')}
              </h2>
              <div className="space-y-2 mb-8">
                <p className="text-2xl text-gray-600 dark:text-gray-300">
                  {t.games?.score || 'Score'}: {score}
                </p>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  {t.games?.time || 'Time'}: {time}s
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
