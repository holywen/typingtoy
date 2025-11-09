'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { TypingSession, Keystroke } from '@/types';
import { calculateMetrics, getRealTimeStats, trackKeystroke } from '@/lib/services/typingMetrics';
import { playKeystrokeSound, playCompletionSound } from '@/lib/services/soundEffects';
import { getUserSettings, updateSetting } from '@/lib/services/userSettings';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import VirtualKeyboard from './VirtualKeyboard';
import HandDiagram from './HandDiagram';

interface TypingTestProps {
  targetText: string;
  onComplete?: (session: TypingSession) => void;
  onStart?: () => void;
  showKeyboard?: boolean;
  showHandDiagram?: boolean;
}

export default function TypingTest({ targetText, onComplete, onStart, showKeyboard = true, showHandDiagram = true }: TypingTestProps) {
  const { t } = useLanguage();
  const [session, setSession] = useState<TypingSession>({
    startTime: 0,
    keystrokes: [],
    targetText,
    currentPosition: 0,
  });

  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100, timeElapsed: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const statsIntervalRef = useRef<number | undefined>(undefined);
  const textDisplayRef = useRef<HTMLDivElement>(null);
  const currentCharRef = useRef<HTMLSpanElement>(null);

  // Load sound settings
  useEffect(() => {
    const settings = getUserSettings();
    setSoundEnabled(settings.soundEnabled);
  }, []);

  // Initialize session
  useEffect(() => {
    setSession({
      startTime: 0,
      keystrokes: [],
      targetText,
      currentPosition: 0,
    });
    setCurrentInput('');
    setIsStarted(false);
    setIsCompleted(false);
  }, [targetText]);

  // Update stats every second
  useEffect(() => {
    if (isStarted && !isCompleted) {
      statsIntervalRef.current = window.setInterval(() => {
        const currentStats = getRealTimeStats(session);
        setStats(currentStats);
      }, 1000);

      return () => {
        if (statsIntervalRef.current) {
          clearInterval(statsIntervalRef.current);
        }
      };
    }
  }, [isStarted, isCompleted, session]);

  // Handle keyboard input on the text display div
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isCompleted) {
        return;
      }

      // Start session on first keystroke
      if (!isStarted) {
        setIsStarted(true);
        setSession((prev) => ({
          ...prev,
          startTime: performance.now(),
        }));
        // Notify parent component that typing has started
        if (onStart) {
          onStart();
        }
      }

      const key = e.key;

      // Handle backspace
      if (key === 'Backspace') {
        e.preventDefault();
        if (currentInput.length > 0) {
          setCurrentInput(prev => prev.slice(0, -1));
          setSession(prev => ({
            ...prev,
            keystrokes: prev.keystrokes.slice(0, -1),
            currentPosition: Math.max(0, prev.currentPosition - 1),
          }));
        }
        return;
      }

      // Handle Enter key for newlines
      if (key === 'Enter') {
        e.preventDefault();
        // Check if next character in target text is a newline
        const nextChar = targetText[currentInput.length];
        if (nextChar === '\n') {
          // Process newline as a character
          const keystroke = trackKeystroke('\n', '\n', performance.now());

          if (soundEnabled) {
            playKeystrokeSound(keystroke.correct);
          }

          const newInput = currentInput + '\n';
          setCurrentInput(newInput);
          setSession((prev) => ({
            ...prev,
            keystrokes: [...prev.keystrokes, keystroke],
            currentPosition: newInput.length,
          }));

          // Check if completed
          if (newInput.length === targetText.length) {
            setIsCompleted(true);
            if (soundEnabled) {
              playCompletionSound();
            }
            const finalSession = {
              ...session,
              keystrokes: [...session.keystrokes, keystroke],
              currentPosition: newInput.length,
            };
            const metrics = calculateMetrics(finalSession);
            setStats({
              wpm: Math.round(metrics.netWPM),
              accuracy: Math.round(metrics.accuracy),
              timeElapsed: metrics.duration,
            });
            if (onComplete) {
              onComplete(finalSession);
            }
          }
        }
        return;
      }

      // Prevent default for Tab
      if (key === 'Tab') {
        e.preventDefault();
        return;
      }

      // Process printable characters and space
      if (key.length === 1 || key === ' ') {
        e.preventDefault();

        const newChar = key;
        const targetChar = targetText[currentInput.length];
        const keystroke = trackKeystroke(newChar, targetChar, performance.now());

        if (soundEnabled) {
          playKeystrokeSound(keystroke.correct);
        }

        const newInput = currentInput + newChar;
        setCurrentInput(newInput);
        setSession((prev) => ({
          ...prev,
          keystrokes: [...prev.keystrokes, keystroke],
          currentPosition: newInput.length,
        }));

        // Check if completed
        if (newInput.length === targetText.length) {
          setIsCompleted(true);
          if (soundEnabled) {
            playCompletionSound();
          }
          const finalSession = {
            ...session,
            keystrokes: [...session.keystrokes, keystroke],
            currentPosition: newInput.length,
          };
          const metrics = calculateMetrics(finalSession);
          setStats({
            wpm: Math.round(metrics.netWPM),
            accuracy: Math.round(metrics.accuracy),
            timeElapsed: metrics.duration,
          });
          if (onComplete) {
            onComplete(finalSession);
          }
        }
      }
    },
    [isStarted, isCompleted, onStart, currentInput, targetText, session, onComplete, soundEnabled]
  );


  // Auto-focus text display area
  useEffect(() => {
    textDisplayRef.current?.focus();
  }, []);

  // Auto-scroll to keep current typing position visible
  useEffect(() => {
    if (currentCharRef.current && textDisplayRef.current) {
      const container = textDisplayRef.current;
      const currentElement = currentCharRef.current;

      const containerRect = container.getBoundingClientRect();
      const elementRect = currentElement.getBoundingClientRect();

      // Use larger padding to ensure input line stays visible
      // This ensures scroll happens before the line goes out of view
      const padding = 100;
      const isAbove = elementRect.top < (containerRect.top + padding);
      const isBelow = elementRect.bottom > (containerRect.bottom - padding);

      if (isAbove || isBelow) {
        // Use instant scroll (no smooth animation) to avoid input delay
        // Use 'start' positioning to ensure the input line is at top of visible area
        currentElement.scrollIntoView({
          behavior: 'auto',
          block: 'start',
        });
      }
    }
  }, [currentInput.length]); // Only trigger on length change, not full string change

  // Windowed rendering: Only render visible lines to dramatically improve performance
  const renderedText = useMemo(() => {
    // Split text into lines (treating each newline as a line separator)
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < targetText.length; i++) {
      if (targetText[i] === '\n') {
        lines.push(currentLine);
        currentLine = '';
      } else {
        currentLine += targetText[i];
      }
    }
    // Add the last line if it exists
    if (currentLine.length > 0 || targetText[targetText.length - 1] === '\n') {
      lines.push(currentLine);
    }

    // Calculate which line we're currently on based on user input
    let charCount = 0;
    let currentLineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (currentInput.length <= charCount + lines[i].length) {
        currentLineIndex = i;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline character
    }

    // Define visible window (only render lines near current position)
    const LINES_BEFORE = 5;
    const LINES_AFTER = 10;
    const visibleStart = Math.max(0, currentLineIndex - LINES_BEFORE);
    const visibleEnd = Math.min(lines.length, currentLineIndex + LINES_AFTER + 1);

    // Calculate approximate height per line pair (target + input line)
    // text-xl = 1.25rem ≈ 20px, leading-relaxed = 1.625 ≈ 32.5px, mb-4 = 1rem ≈ 16px
    const LINE_PAIR_HEIGHT = 81; // pixels per line pair

    const result: React.ReactElement[] = [];

    // Add spacer before visible window
    if (visibleStart > 0) {
      result.push(
        <div
          key="spacer-before"
          style={{ height: `${visibleStart * LINE_PAIR_HEIGHT}px` }}
        />
      );
    }

    // Render only visible lines
    charCount = 0;
    for (let i = 0; i < visibleStart; i++) {
      charCount += lines[i].length + 1;
    }

    for (let lineIndex = visibleStart; lineIndex < visibleEnd; lineIndex++) {
      const line = lines[lineIndex];
      const lineStartIndex = charCount;
      const lineEndIndex = charCount + line.length;

      // Render target line
      const targetLineChars = line.split('').map((char, charIndexInLine) => {
        const globalIndex = lineStartIndex + charIndexInLine;
        let className = 'text-xl ';
        const isCurrent = globalIndex === currentInput.length;

        if (globalIndex < currentInput.length) {
          className += 'text-gray-400 dark:text-gray-500';
        } else if (isCurrent) {
          className += 'text-gray-900 dark:text-white bg-blue-200 dark:bg-blue-900/50';
        } else {
          className += 'text-gray-400 dark:text-gray-600';
        }

        const displayChar = char === ' ' ? '\u00A0' : char;

        return (
          <span
            key={`target-${lineIndex}-${charIndexInLine}`}
            className={className}
            ref={isCurrent ? currentCharRef : null}
          >
            {displayChar}
          </span>
        );
      });

      // Add newline indicator at end of target line (if not the last line)
      if (lineIndex < lines.length - 1) {
        const newlineIndex = lineEndIndex;
        const isCurrent = newlineIndex === currentInput.length;
        let className = 'text-xl ';

        if (newlineIndex < currentInput.length) {
          className += 'text-gray-400 dark:text-gray-500';
        } else if (isCurrent) {
          className += 'text-gray-900 dark:text-white bg-blue-200 dark:bg-blue-900/50';
        } else {
          className += 'text-gray-400 dark:text-gray-600';
        }

        targetLineChars.push(
          <span
            key={`target-${lineIndex}-newline`}
            className={className}
            ref={isCurrent ? currentCharRef : null}
          >
            ↵
          </span>
        );
      }

      // Render user input line
      const inputLineChars = line.split('').map((targetChar, charIndexInLine) => {
        const globalIndex = lineStartIndex + charIndexInLine;

        if (globalIndex >= currentInput.length) {
          return (
            <span
              key={`input-${lineIndex}-${charIndexInLine}`}
              className="text-xl text-transparent"
            >
              {targetChar === ' ' ? '\u00A0' : targetChar}
            </span>
          );
        }

        const typedChar = currentInput[globalIndex];
        const isCorrect = typedChar === targetChar;
        let className = 'text-xl ';

        if (isCorrect) {
          className += 'text-green-600 dark:text-green-400 font-semibold';
        } else {
          className += 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 font-semibold';
        }

        const displayChar = typedChar === ' ' ? '\u00A0' : typedChar;

        return (
          <span
            key={`input-${lineIndex}-${charIndexInLine}`}
            className={className}
          >
            {displayChar}
          </span>
        );
      });

      // Add newline indicator for input line (if not the last line and user has typed it)
      if (lineIndex < lines.length - 1) {
        const newlineIndex = lineEndIndex;

        if (newlineIndex < currentInput.length) {
          const typedChar = currentInput[newlineIndex];
          const isCorrect = typedChar === '\n';
          let className = 'text-xl ';

          if (isCorrect) {
            className += 'text-green-600 dark:text-green-400 font-semibold';
          } else {
            className += 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 font-semibold';
          }

          inputLineChars.push(
            <span
              key={`input-${lineIndex}-newline`}
              className={className}
            >
              ↵
            </span>
          );
        } else {
          // Not typed yet - show placeholder
          inputLineChars.push(
            <span
              key={`input-${lineIndex}-newline`}
              className="text-xl text-transparent"
            >
              ↵
            </span>
          );
        }
      }

      result.push(
        <div key={`target-line-${lineIndex}`} className="font-mono leading-relaxed">
          {targetLineChars}
        </div>
      );

      result.push(
        <div key={`input-line-${lineIndex}`} className="font-mono leading-relaxed mb-4">
          {inputLineChars}
        </div>
      );

      charCount += line.length + 1;
    }

    // Add spacer after visible window
    if (visibleEnd < lines.length) {
      result.push(
        <div
          key="spacer-after"
          style={{ height: `${(lines.length - visibleEnd) * LINE_PAIR_HEIGHT}px` }}
        />
      );
    }

    return result;
  }, [targetText, currentInput.length]); // Only recalculate when text or position changes

  const restart = () => {
    setSession({
      startTime: 0,
      keystrokes: [],
      targetText,
      currentPosition: 0,
    });
    setCurrentInput('');
    setIsStarted(false);
    setIsCompleted(false);
    setStats({ wpm: 0, accuracy: 100, timeElapsed: 0 });
    textDisplayRef.current?.focus();
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    updateSetting('soundEnabled', newValue);
  };

  // Get current character to type
  const currentChar = currentInput.length < targetText.length ? targetText[currentInput.length] : undefined;

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Sound Toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleSound}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-white"
          title={soundEnabled ? t.typing.soundOn : t.typing.soundOff}
        >
          {soundEnabled ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
          <span className="text-sm">{soundEnabled ? t.typing.soundOn : t.typing.soundOff}</span>
        </button>
      </div>

      {/* Stats Display */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.wpm}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{t.typing.wpm}</div>
        </div>
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.accuracy}%</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{t.typing.accuracy}</div>
        </div>
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md text-center">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.timeElapsed}s</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{t.typing.time}</div>
        </div>
      </div>

      {/* Text Display with Input */}
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg mb-6 md:mb-8 border-2 border-blue-500 dark:border-blue-600">
        <div
          ref={textDisplayRef}
          className="font-mono break-words overflow-y-auto focus:outline-none"
          style={{
            minHeight: '200px',
            maxHeight: '400px',
          }}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {renderedText}
        </div>
        {!isStarted && !isCompleted && (
          <div className="mt-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            {t.typing.clickToStart}
          </div>
        )}
      </div>

      {/* Completion Message */}
      {isCompleted && (
        <div className="mt-8 text-center">
          <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">
            {t.typing.completed}
          </h2>
          <div className="space-y-2 mb-6">
            <p className="text-xl">
              {t.typing.yourSpeed}: <span className="font-bold">{stats.wpm} {t.typing.wpm}</span>
            </p>
            <p className="text-xl">
              {t.typing.accuracy}: <span className="font-bold">{stats.accuracy}%</span>
            </p>
            <p className="text-xl">
              {t.typing.time}: <span className="font-bold">{stats.timeElapsed}s</span>
            </p>
          </div>
          <button
            onClick={restart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors"
          >
            {t.typing.tryAgain}
          </button>
        </div>
      )}

      {/* Virtual Keyboard with Hand Diagrams on sides */}
      {(showKeyboard || showHandDiagram) && !isCompleted && (
        <div className="mt-8 flex items-center justify-center gap-8">
          {/* Left Hand */}
          {showHandDiagram && (
            <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <HandDiagram currentChar={currentChar} hand="left" />
            </div>
          )}

          {/* Keyboard */}
          {showKeyboard && (
            <div className="flex-shrink-0">
              <VirtualKeyboard currentChar={currentChar} highlightHomeRow={true} />
            </div>
          )}

          {/* Right Hand */}
          {showHandDiagram && (
            <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <HandDiagram currentChar={currentChar} hand="right" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
