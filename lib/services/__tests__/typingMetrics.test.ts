import {
  calculateMetrics,
  trackKeystroke,
  getRealTimeStats,
  getCharacterTimings,
  identifyProblemKeys,
} from '../typingMetrics';
import type { TypingSession, Keystroke } from '@/types';

describe('typingMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset performance.now() to a fixed time
    (performance.now as jest.Mock).mockReturnValue(10000);
  });

  describe('calculateMetrics', () => {
    it('should calculate metrics correctly for a basic session', () => {
      const session: TypingSession = {
        targetText: 'hello',
        currentPosition: 5,
        keystrokes: [
          { key: 'h', timestamp: 0, correct: true, corrected: false },
          { key: 'e', timestamp: 100, correct: true, corrected: false },
          { key: 'l', timestamp: 200, correct: true, corrected: false },
          { key: 'l', timestamp: 300, correct: true, corrected: false },
          { key: 'o', timestamp: 400, correct: true, corrected: false },
        ],
        startTime: 0,
        completed: false,
      };

      const metrics = calculateMetrics(session);

      expect(metrics.charactersTyped).toBe(5);
      expect(metrics.accuracy).toBe(100);
      expect(metrics.errors).toBe(0);
      expect(metrics.correctedErrors).toBe(0);
      expect(metrics.grossWPM).toBeGreaterThan(0);
      expect(metrics.netWPM).toBeGreaterThan(0);
    });

    it('should calculate metrics with uncorrected errors', () => {
      const session: TypingSession = {
        targetText: 'hello',
        currentPosition: 5,
        keystrokes: [
          { key: 'h', timestamp: 0, correct: true, corrected: false },
          { key: 'x', timestamp: 100, correct: false, corrected: false }, // Error
          { key: 'l', timestamp: 200, correct: true, corrected: false },
          { key: 'l', timestamp: 300, correct: true, corrected: false },
          { key: 'o', timestamp: 400, correct: true, corrected: false },
        ],
        startTime: 0,
        completed: false,
      };

      const metrics = calculateMetrics(session);

      expect(metrics.charactersTyped).toBe(5);
      expect(metrics.accuracy).toBe(80); // 4/5 = 80%
      expect(metrics.errors).toBe(1);
      expect(metrics.correctedErrors).toBe(0);
      expect(metrics.netWPM).toBeLessThan(metrics.grossWPM); // Net WPM should be penalized
    });

    it('should calculate metrics with corrected errors', () => {
      const session: TypingSession = {
        targetText: 'hello',
        currentPosition: 5,
        keystrokes: [
          { key: 'h', timestamp: 0, correct: true, corrected: false },
          { key: 'x', timestamp: 100, correct: false, corrected: true }, // Corrected error
          { key: 'l', timestamp: 200, correct: true, corrected: false },
          { key: 'l', timestamp: 300, correct: true, corrected: false },
          { key: 'o', timestamp: 400, correct: true, corrected: false },
        ],
        startTime: 0,
        completed: false,
      };

      const metrics = calculateMetrics(session);

      expect(metrics.accuracy).toBe(80); // Still counts towards accuracy
      expect(metrics.errors).toBe(1);
      expect(metrics.correctedErrors).toBe(1);
    });

    it('should handle empty session', () => {
      const session: TypingSession = {
        targetText: 'hello',
        currentPosition: 0,
        keystrokes: [],
        startTime: 0,
        completed: false,
      };

      const metrics = calculateMetrics(session);

      expect(metrics.charactersTyped).toBe(0);
      expect(metrics.accuracy).toBe(100);
      expect(metrics.errors).toBe(0);
      expect(metrics.grossWPM).toBe(0);
      expect(metrics.netWPM).toBe(0);
    });

    it('should round values to 2 decimal places', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [
          { key: 't', timestamp: 0, correct: true, corrected: false },
          { key: 'e', timestamp: 100, correct: true, corrected: false },
          { key: 's', timestamp: 200, correct: true, corrected: false },
          { key: 't', timestamp: 333, correct: true, corrected: false },
        ],
        startTime: 0,
        completed: false,
      };

      const metrics = calculateMetrics(session);

      expect(metrics.grossWPM).toEqual(expect.any(Number));
      expect(metrics.netWPM).toEqual(expect.any(Number));
      expect(metrics.accuracy).toEqual(expect.any(Number));
      // Check that values are properly rounded
      expect(Number.isInteger(metrics.grossWPM * 100)).toBe(true);
      expect(Number.isInteger(metrics.netWPM * 100)).toBe(true);
      expect(Number.isInteger(metrics.accuracy * 100)).toBe(true);
    });

    it('should never return negative Net WPM', () => {
      const session: TypingSession = {
        targetText: 'hello',
        currentPosition: 5,
        keystrokes: [
          { key: 'x', timestamp: 0, correct: false, corrected: false },
          { key: 'x', timestamp: 100, correct: false, corrected: false },
          { key: 'x', timestamp: 200, correct: false, corrected: false },
          { key: 'x', timestamp: 300, correct: false, corrected: false },
          { key: 'x', timestamp: 400, correct: false, corrected: false },
        ],
        startTime: 0,
        completed: false,
      };

      const metrics = calculateMetrics(session);

      expect(metrics.netWPM).toBeGreaterThanOrEqual(0);
    });
  });

  describe('trackKeystroke', () => {
    it('should create a correct keystroke when key matches target', () => {
      const keystroke = trackKeystroke('a', 'a', 1000);

      expect(keystroke).toEqual({
        key: 'a',
        timestamp: 1000,
        correct: true,
        corrected: false,
      });
    });

    it('should create an incorrect keystroke when key does not match target', () => {
      const keystroke = trackKeystroke('b', 'a', 1000);

      expect(keystroke).toEqual({
        key: 'b',
        timestamp: 1000,
        correct: false,
        corrected: false,
      });
    });

    it('should handle special characters', () => {
      const keystroke = trackKeystroke('!', '!', 1000);

      expect(keystroke.correct).toBe(true);
    });

    it('should be case-sensitive', () => {
      const keystroke = trackKeystroke('A', 'a', 1000);

      expect(keystroke.correct).toBe(false);
    });

    it('should handle spaces', () => {
      const keystroke = trackKeystroke(' ', ' ', 1000);

      expect(keystroke.correct).toBe(true);
    });
  });

  describe('getRealTimeStats', () => {
    it('should return initial stats for empty session', () => {
      const session: TypingSession = {
        targetText: 'hello',
        currentPosition: 0,
        keystrokes: [],
        startTime: 0,
        completed: false,
      };

      const stats = getRealTimeStats(session);

      expect(stats).toEqual({
        wpm: 0,
        accuracy: 100,
        timeElapsed: 0,
      });
    });

    it('should return rounded integer values for display', () => {
      const session: TypingSession = {
        targetText: 'hello world',
        currentPosition: 11,
        keystrokes: [
          { key: 'h', timestamp: 0, correct: true, corrected: false },
          { key: 'e', timestamp: 100, correct: true, corrected: false },
          { key: 'l', timestamp: 200, correct: true, corrected: false },
          { key: 'l', timestamp: 300, correct: true, corrected: false },
          { key: 'o', timestamp: 400, correct: true, corrected: false },
        ],
        startTime: 0,
        completed: false,
      };

      const stats = getRealTimeStats(session);

      expect(Number.isInteger(stats.wpm)).toBe(true);
      expect(Number.isInteger(stats.accuracy)).toBe(true);
      expect(Number.isInteger(stats.timeElapsed)).toBe(true);
    });

    it('should calculate time elapsed correctly', () => {
      (performance.now as jest.Mock).mockReturnValue(5000);

      const session: TypingSession = {
        targetText: 'hello',
        currentPosition: 5,
        keystrokes: [
          { key: 'h', timestamp: 0, correct: true, corrected: false },
        ],
        startTime: 0,
        completed: false,
      };

      const stats = getRealTimeStats(session);

      expect(stats.timeElapsed).toBe(5); // 5 seconds
    });
  });

  describe('getCharacterTimings', () => {
    it('should return empty array for 0 or 1 keystroke', () => {
      expect(getCharacterTimings([])).toEqual([]);
      expect(getCharacterTimings([
        { key: 'a', timestamp: 0, correct: true, corrected: false },
      ])).toEqual([]);
    });

    it('should calculate time differences between keystrokes', () => {
      const keystrokes: Keystroke[] = [
        { key: 'a', timestamp: 0, correct: true, corrected: false },
        { key: 'b', timestamp: 100, correct: true, corrected: false },
        { key: 'c', timestamp: 250, correct: true, corrected: false },
        { key: 'd', timestamp: 300, correct: true, corrected: false },
      ];

      const timings = getCharacterTimings(keystrokes);

      expect(timings).toEqual([100, 150, 50]);
    });

    it('should handle negative time differences gracefully', () => {
      const keystrokes: Keystroke[] = [
        { key: 'a', timestamp: 100, correct: true, corrected: false },
        { key: 'b', timestamp: 50, correct: true, corrected: false },
      ];

      const timings = getCharacterTimings(keystrokes);

      expect(timings).toEqual([-50]);
    });
  });

  describe('identifyProblemKeys', () => {
    it('should return empty map for no errors', () => {
      const keystrokes: Keystroke[] = [
        { key: 'a', timestamp: 0, correct: true, corrected: false },
        { key: 'b', timestamp: 100, correct: true, corrected: false },
        { key: 'c', timestamp: 200, correct: true, corrected: false },
      ];

      const problemKeys = identifyProblemKeys(keystrokes);

      expect(problemKeys.size).toBe(0);
    });

    it('should count errors per key', () => {
      const keystrokes: Keystroke[] = [
        { key: 'a', timestamp: 0, correct: false, corrected: false },
        { key: 'b', timestamp: 100, correct: true, corrected: false },
        { key: 'a', timestamp: 200, correct: false, corrected: false },
        { key: 'c', timestamp: 300, correct: false, corrected: false },
        { key: 'a', timestamp: 400, correct: false, corrected: false },
      ];

      const problemKeys = identifyProblemKeys(keystrokes);

      expect(problemKeys.get('a')).toBe(3);
      expect(problemKeys.get('c')).toBe(1);
      expect(problemKeys.get('b')).toBeUndefined();
    });

    it('should sort keys by error count in descending order', () => {
      const keystrokes: Keystroke[] = [
        { key: 'a', timestamp: 0, correct: false, corrected: false },
        { key: 'b', timestamp: 100, correct: false, corrected: false },
        { key: 'b', timestamp: 200, correct: false, corrected: false },
        { key: 'c', timestamp: 300, correct: false, corrected: false },
        { key: 'c', timestamp: 400, correct: false, corrected: false },
        { key: 'c', timestamp: 500, correct: false, corrected: false },
      ];

      const problemKeys = identifyProblemKeys(keystrokes);
      const entries = [...problemKeys.entries()];

      expect(entries[0]).toEqual(['c', 3]);
      expect(entries[1]).toEqual(['b', 2]);
      expect(entries[2]).toEqual(['a', 1]);
    });

    it('should include corrected errors in count', () => {
      const keystrokes: Keystroke[] = [
        { key: 'a', timestamp: 0, correct: false, corrected: false },
        { key: 'a', timestamp: 100, correct: false, corrected: true },
      ];

      const problemKeys = identifyProblemKeys(keystrokes);

      expect(problemKeys.get('a')).toBe(2);
    });
  });
});
