'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

  const inputRef = useRef<HTMLTextAreaElement>(null);
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

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        return; // Let default behavior handle it
      }

      // Handle Enter key for newlines
      if (key === 'Enter') {
        // Check if next character in target text is a newline
        const nextChar = targetText[currentInput.length];
        if (nextChar === '\n') {
          // Allow Enter if it's expected
          return;
        } else {
          // Prevent Enter if not expected
          e.preventDefault();
          return;
        }
      }

      // Prevent default for Tab
      if (key === 'Tab') {
        e.preventDefault();
        return;
      }

      // Ignore other special keys except space
      if (key.length > 1 && key !== ' ') {
        e.preventDefault();
        return;
      }
    },
    [isStarted, onStart, currentInput.length, targetText]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      const prevLength = currentInput.length;
      const newLength = value.length;

      // Typing forward
      if (newLength > prevLength) {
        const newChar = value[newLength - 1];
        const targetChar = targetText[newLength - 1];

        const keystroke = trackKeystroke(newChar, targetChar, performance.now());

        // Play sound feedback
        if (soundEnabled) {
          playKeystrokeSound(keystroke.correct);
        }

        setSession((prev) => ({
          ...prev,
          keystrokes: [...prev.keystrokes, keystroke],
          currentPosition: newLength,
        }));

        // Check if completed
        if (newLength === targetText.length) {
          setIsCompleted(true);

          // Play completion sound
          if (soundEnabled) {
            playCompletionSound();
          }

          const finalSession = {
            ...session,
            keystrokes: [...session.keystrokes, keystroke],
            currentPosition: newLength,
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

      setCurrentInput(value);
    },
    [currentInput, targetText, session, onComplete]
  );

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll to current character
  useEffect(() => {
    if (currentCharRef.current && textDisplayRef.current) {
      const container = textDisplayRef.current;
      const currentElement = currentCharRef.current;

      // Get positions
      const containerRect = container.getBoundingClientRect();
      const elementRect = currentElement.getBoundingClientRect();

      // Calculate if element is outside visible area
      const isAbove = elementRect.top < containerRect.top;
      const isBelow = elementRect.bottom > containerRect.bottom;

      if (isAbove || isBelow) {
        // Scroll to keep current character in view
        currentElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentInput]);

  // Render text with highlighting
  const renderText = () => {
    return targetText.split('').map((char, index) => {
      let className = 'text-2xl ';
      const isCurrent = index === currentInput.length;
      const isNewline = char === '\n';

      if (index < currentInput.length) {
        // Already typed
        if (currentInput[index] === char) {
          className += 'text-green-600 dark:text-green-400';
        } else {
          className += 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
        }
      } else if (isCurrent) {
        // Current character
        className += 'text-gray-900 dark:text-white bg-blue-200 dark:bg-blue-900/50';
      } else {
        // Not yet typed
        className += 'text-gray-400 dark:text-gray-600';
      }

      // Handle different character types
      let displayChar;
      if (char === ' ') {
        displayChar = '\u00A0'; // Non-breaking space
      } else if (isNewline) {
        // Display newline as a special symbol with line break
        return (
          <span key={index}>
            <span
              className={`${className} inline-flex items-center px-1 rounded border border-current`}
              ref={isCurrent ? currentCharRef : null}
              title="Press Enter"
            >
              ↵
            </span>
            <br />
          </span>
        );
      } else {
        displayChar = char;
      }

      return (
        <span
          key={index}
          className={className}
          ref={isCurrent ? currentCharRef : null}
        >
          {displayChar}
        </span>
      );
    });
  };

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
    inputRef.current?.focus();
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

      {/* Text Display */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg mb-8">
        <div
          ref={textDisplayRef}
          className="font-mono leading-relaxed break-words overflow-y-auto"
          style={{
            height: 'calc(2.5rem * 3 * 1.625)', // 3 lines: text-2xl (2.5rem) * line-height (1.625) * 3 lines
            maxHeight: 'calc(2.5rem * 3 * 1.625)',
          }}
        >
          {renderText()}
        </div>
      </div>

      {/* Input Area */}
      <textarea
        ref={inputRef}
        value={currentInput}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={isCompleted}
        className="w-full p-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
        placeholder={isStarted ? '' : t.typing.startTyping}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
        rows={3}
      />

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

      {/* Instructions */}
      {!isStarted && !isCompleted && (
        <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
          <p>{t.typing.clickToStart}</p>
        </div>
      )}
    </div>
  );
}
