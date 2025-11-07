import {
  saveProgress,
  getProgressHistory,
  getLessonProgress,
  getExerciseProgress,
  getOverallStats,
  getRecentProgress,
  clearProgressHistory,
  exportProgress,
  importProgress,
  getProgressTrends,
  saveLastPosition,
  getLastPosition,
  clearLastPosition,
} from '../progressStorage';
import type { TypingSession } from '@/types';

// Mock calculateMetrics
jest.mock('../typingMetrics', () => ({
  calculateMetrics: jest.fn(() => ({
    grossWPM: 50,
    netWPM: 48,
    accuracy: 95,
    duration: 60,
    charactersTyped: 250,
    errors: 5,
    correctedErrors: 2,
  })),
}));

describe('progressStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('saveProgress and getProgressHistory', () => {
    it('should save and retrieve progress', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1');

      const history = getProgressHistory();
      expect(history).toHaveLength(1);
      expect(history[0].lessonId).toBe('lesson-1');
      expect(history[0].lessonTitle).toBe('Lesson 1');
      expect(history[0].sessionType).toBe('lesson');
      expect(history[0].metrics.netWPM).toBe(48);
    });

    it('should save progress with exercise info', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1', 'ex-1', 'Exercise 1');

      const history = getProgressHistory();
      expect(history[0].exerciseId).toBe('ex-1');
      expect(history[0].exerciseTitle).toBe('Exercise 1');
    });

    it('should add new progress to the beginning of history', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1');
      saveProgress(session, 'lesson', 'lesson-2', 'Lesson 2');

      const history = getProgressHistory();
      expect(history[0].lessonId).toBe('lesson-2');
      expect(history[1].lessonId).toBe('lesson-1');
    });

    it('should limit history to 100 items', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      // Add 105 items
      for (let i = 0; i < 105; i++) {
        saveProgress(session, 'speed_test', `lesson-${i}`, `Lesson ${i}`);
      }

      const history = getProgressHistory();
      expect(history).toHaveLength(100);
    });

    it('should return empty array if no history exists', () => {
      const history = getProgressHistory();
      expect(history).toEqual([]);
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      // Should not throw
      expect(() => saveProgress(session, 'lesson')).not.toThrow();

      setItemSpy.mockRestore();
    });

    it('should generate unique IDs for each progress record', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1');
      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1');

      const history = getProgressHistory();
      expect(history[0].id).not.toBe(history[1].id);
    });
  });

  describe('getLessonProgress', () => {
    it('should filter progress by lesson ID', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1');
      saveProgress(session, 'lesson', 'lesson-2', 'Lesson 2');
      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1');
      saveProgress(session, 'speed_test');

      const lesson1Progress = getLessonProgress('lesson-1');
      expect(lesson1Progress).toHaveLength(2);
      expect(lesson1Progress.every(p => p.lessonId === 'lesson-1')).toBe(true);
    });

    it('should return empty array for non-existent lesson', () => {
      const progress = getLessonProgress('non-existent');
      expect(progress).toEqual([]);
    });
  });

  describe('getExerciseProgress', () => {
    it('should filter progress by exercise ID', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1', 'ex-1', 'Exercise 1');
      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1', 'ex-2', 'Exercise 2');
      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1', 'ex-1', 'Exercise 1');

      const ex1Progress = getExerciseProgress('ex-1');
      expect(ex1Progress).toHaveLength(2);
      expect(ex1Progress.every(p => p.exerciseId === 'ex-1')).toBe(true);
    });
  });

  describe('getOverallStats', () => {
    it('should return zero stats for empty history', () => {
      const stats = getOverallStats();

      expect(stats).toEqual({
        totalSessions: 0,
        averageWPM: 0,
        averageAccuracy: 0,
        bestWPM: 0,
        totalTime: 0,
        lessonsCompleted: 0,
      });
    });

    it('should calculate overall statistics correctly', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1');
      saveProgress(session, 'lesson', 'lesson-2', 'Lesson 2');
      saveProgress(session, 'speed_test');

      const stats = getOverallStats();

      expect(stats.totalSessions).toBe(3);
      expect(stats.averageWPM).toBe(48); // From mocked metrics
      expect(stats.averageAccuracy).toBe(95);
      expect(stats.bestWPM).toBe(48);
      expect(stats.totalTime).toBe(180); // 60 * 3
      expect(stats.lessonsCompleted).toBe(2); // lesson-1 and lesson-2
    });

    it('should count unique lessons only', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1');
      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1');
      saveProgress(session, 'lesson', 'lesson-2', 'Lesson 2');

      const stats = getOverallStats();
      expect(stats.lessonsCompleted).toBe(2);
    });
  });

  describe('getRecentProgress', () => {
    it('should return last N sessions', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      for (let i = 0; i < 15; i++) {
        saveProgress(session, 'lesson', `lesson-${i}`, `Lesson ${i}`);
      }

      const recent = getRecentProgress(5);
      expect(recent).toHaveLength(5);
      expect(recent[0].lessonId).toBe('lesson-14'); // Most recent
    });

    it('should default to 10 sessions', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      for (let i = 0; i < 15; i++) {
        saveProgress(session, 'lesson');
      }

      const recent = getRecentProgress();
      expect(recent).toHaveLength(10);
    });
  });

  describe('clearProgressHistory', () => {
    it('should remove all progress from localStorage', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      saveProgress(session, 'lesson');
      expect(getProgressHistory()).toHaveLength(1);

      clearProgressHistory();
      expect(getProgressHistory()).toHaveLength(0);
    });
  });

  describe('exportProgress and importProgress', () => {
    it('should export progress as JSON string', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      saveProgress(session, 'lesson', 'lesson-1', 'Lesson 1');

      const exported = exportProgress();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].lessonId).toBe('lesson-1');
    });

    it('should import progress from JSON string', () => {
      const data = [
        {
          id: 'test-1',
          lessonId: 'lesson-1',
          lessonTitle: 'Lesson 1',
          sessionType: 'lesson',
          metrics: {
            grossWPM: 50,
            netWPM: 48,
            accuracy: 95,
            duration: 60,
            charactersTyped: 250,
            errors: 5,
            correctedErrors: 2,
          },
          completedAt: new Date().toISOString(),
        },
      ];

      const success = importProgress(JSON.stringify(data));

      expect(success).toBe(true);
      const history = getProgressHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('test-1');
    });

    it('should return false for invalid JSON', () => {
      const success = importProgress('invalid json');
      expect(success).toBe(false);
    });

    it('should return false for non-array data', () => {
      const success = importProgress(JSON.stringify({ invalid: 'data' }));
      expect(success).toBe(false);
    });
  });

  describe('getProgressTrends', () => {
    it('should return trends for the last N days', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      saveProgress(session, 'lesson');
      const trends = getProgressTrends(7);

      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBeGreaterThan(0);
      expect(trends[0]).toHaveProperty('date');
      expect(trends[0]).toHaveProperty('avgWPM');
      expect(trends[0]).toHaveProperty('avgAccuracy');
      expect(trends[0]).toHaveProperty('sessionCount');
    });

    it('should calculate averages correctly per day', () => {
      const session: TypingSession = {
        targetText: 'test',
        currentPosition: 4,
        keystrokes: [],
        startTime: 0,
        completed: true,
      };

      saveProgress(session, 'lesson');
      saveProgress(session, 'lesson');

      const trends = getProgressTrends(1);
      expect(trends[0].sessionCount).toBe(2);
      expect(trends[0].avgWPM).toBe(48);
      expect(trends[0].avgAccuracy).toBe(95);
    });

    it('should sort trends by date', () => {
      const trends = getProgressTrends(30);

      for (let i = 1; i < trends.length; i++) {
        const prevDate = new Date(trends[i - 1].date);
        const currDate = new Date(trends[i].date);
        expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
      }
    });
  });

  describe('saveLastPosition and getLastPosition', () => {
    it('should save and retrieve last position', () => {
      saveLastPosition('lesson-1', 5, 'qwerty');

      const position = getLastPosition('qwerty');

      expect(position).not.toBeNull();
      expect(position?.lessonId).toBe('lesson-1');
      expect(position?.exerciseIndex).toBe(5);
      expect(position?.keyboardLayout).toBe('qwerty');
      expect(position?.timestamp).toBeDefined();
    });

    it('should return null if no position is saved', () => {
      const position = getLastPosition('qwerty');
      expect(position).toBeNull();
    });

    it('should save different positions for different keyboard layouts', () => {
      saveLastPosition('lesson-1', 3, 'qwerty');
      saveLastPosition('lesson-2', 5, 'dvorak');

      const qwertyPos = getLastPosition('qwerty');
      const dvorakPos = getLastPosition('dvorak');

      expect(qwertyPos?.lessonId).toBe('lesson-1');
      expect(qwertyPos?.exerciseIndex).toBe(3);
      expect(dvorakPos?.lessonId).toBe('lesson-2');
      expect(dvorakPos?.exerciseIndex).toBe(5);
    });

    it('should overwrite previous position for same layout', () => {
      saveLastPosition('lesson-1', 3, 'qwerty');
      saveLastPosition('lesson-2', 5, 'qwerty');

      const position = getLastPosition('qwerty');
      expect(position?.lessonId).toBe('lesson-2');
      expect(position?.exerciseIndex).toBe(5);
    });

    it('should handle localStorage errors gracefully', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const position = getLastPosition('qwerty');
      expect(position).toBeNull();

      getItemSpy.mockRestore();
    });
  });

  describe('clearLastPosition', () => {
    it('should clear position for specific keyboard layout', () => {
      saveLastPosition('lesson-1', 3, 'qwerty');
      saveLastPosition('lesson-2', 5, 'dvorak');

      clearLastPosition('qwerty');

      expect(getLastPosition('qwerty')).toBeNull();
      expect(getLastPosition('dvorak')).not.toBeNull();
    });

    it('should clear all positions when no layout specified', () => {
      saveLastPosition('lesson-1', 3, 'qwerty');
      saveLastPosition('lesson-2', 5, 'dvorak');
      saveLastPosition('lesson-3', 7, 'colemak');

      clearLastPosition();

      expect(getLastPosition('qwerty')).toBeNull();
      expect(getLastPosition('dvorak')).toBeNull();
      expect(getLastPosition('colemak')).toBeNull();
    });

    it('should handle errors gracefully', () => {
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => clearLastPosition('qwerty')).not.toThrow();

      removeItemSpy.mockRestore();
    });
  });
});
