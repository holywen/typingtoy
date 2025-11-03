import type { TypingSession, TypingMetrics, UserProgress } from '@/types';
import { calculateMetrics } from './typingMetrics';

const PROGRESS_KEY = 'typing_progress_history';
const LAST_POSITION_KEY_PREFIX = 'typing_last_position';
const MAX_HISTORY_ITEMS = 100;

export interface ProgressRecord {
  id: string;
  lessonId?: string;
  lessonTitle?: string;
  sessionType: 'lesson' | 'speed_test' | 'custom';
  metrics: TypingMetrics;
  completedAt: string; // ISO date string
  exerciseId?: string;
  exerciseTitle?: string;
}

/**
 * Save a completed typing session to local storage
 */
export function saveProgress(
  session: TypingSession,
  sessionType: 'lesson' | 'speed_test' | 'custom',
  lessonId?: string,
  lessonTitle?: string,
  exerciseId?: string,
  exerciseTitle?: string
): void {
  try {
    const metrics = calculateMetrics(session);
    const record: ProgressRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lessonId,
      lessonTitle,
      sessionType,
      metrics,
      completedAt: new Date().toISOString(),
      exerciseId,
      exerciseTitle,
    };

    const history = getProgressHistory();
    history.unshift(record); // Add to beginning

    // Keep only the most recent items
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

/**
 * Get all progress history from local storage
 */
export function getProgressHistory(): ProgressRecord[] {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load progress history:', error);
    return [];
  }
}

/**
 * Get progress history for a specific lesson
 */
export function getLessonProgress(lessonId: string): ProgressRecord[] {
  const history = getProgressHistory();
  return history.filter((record) => record.lessonId === lessonId);
}

/**
 * Get progress history for a specific exercise
 */
export function getExerciseProgress(exerciseId: string): ProgressRecord[] {
  const history = getProgressHistory();
  return history.filter((record) => record.exerciseId === exerciseId);
}

/**
 * Get statistics for all sessions
 */
export function getOverallStats() {
  const history = getProgressHistory();

  if (history.length === 0) {
    return {
      totalSessions: 0,
      averageWPM: 0,
      averageAccuracy: 0,
      bestWPM: 0,
      totalTime: 0,
      lessonsCompleted: new Set<string>().size,
    };
  }

  const totalSessions = history.length;
  const averageWPM = history.reduce((sum, record) => sum + record.metrics.netWPM, 0) / totalSessions;
  const averageAccuracy = history.reduce((sum, record) => sum + record.metrics.accuracy, 0) / totalSessions;
  const bestWPM = Math.max(...history.map((record) => record.metrics.netWPM));
  const totalTime = history.reduce((sum, record) => sum + record.metrics.duration, 0);
  const lessonsCompleted = new Set(history.filter((r) => r.lessonId).map((r) => r.lessonId)).size;

  return {
    totalSessions,
    averageWPM: Math.round(averageWPM),
    averageAccuracy: Math.round(averageAccuracy),
    bestWPM: Math.round(bestWPM),
    totalTime: Math.round(totalTime),
    lessonsCompleted,
  };
}

/**
 * Get recent progress (last N sessions)
 */
export function getRecentProgress(limit: number = 10): ProgressRecord[] {
  const history = getProgressHistory();
  return history.slice(0, limit);
}

/**
 * Clear all progress history
 */
export function clearProgressHistory(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch (error) {
    console.error('Failed to clear progress history:', error);
  }
}

/**
 * Export progress history as JSON
 */
export function exportProgress(): string {
  const history = getProgressHistory();
  return JSON.stringify(history, null, 2);
}

/**
 * Import progress history from JSON
 */
export function importProgress(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format');
    }
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to import progress:', error);
    return false;
  }
}

/**
 * Get progress trends (for charts)
 */
export function getProgressTrends(days: number = 7) {
  const history = getProgressHistory();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentHistory = history.filter(
    (record) => new Date(record.completedAt) >= cutoffDate
  );

  // Group by date
  const byDate = recentHistory.reduce((acc, record) => {
    const date = new Date(record.completedAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, ProgressRecord[]>);

  // Calculate averages per day
  const trends = Object.entries(byDate).map(([date, records]) => {
    const avgWPM = records.reduce((sum, r) => sum + r.metrics.netWPM, 0) / records.length;
    const avgAccuracy = records.reduce((sum, r) => sum + r.metrics.accuracy, 0) / records.length;
    return {
      date,
      avgWPM: Math.round(avgWPM),
      avgAccuracy: Math.round(avgAccuracy),
      sessionCount: records.length,
    };
  });

  return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Interface for tracking user's last position in lessons
 */
export interface LastPosition {
  lessonId: string;
  exerciseIndex: number;
  keyboardLayout: string;
  timestamp: string;
}

/**
 * Save the user's last position in a lesson
 */
export function saveLastPosition(lessonId: string, exerciseIndex: number, keyboardLayout: string): void {
  try {
    const position: LastPosition = {
      lessonId,
      exerciseIndex,
      keyboardLayout,
      timestamp: new Date().toISOString(),
    };
    const key = `${LAST_POSITION_KEY_PREFIX}_${keyboardLayout}`;
    localStorage.setItem(key, JSON.stringify(position));
  } catch (error) {
    console.error('Failed to save last position:', error);
  }
}

/**
 * Get the user's last position in lessons for a specific keyboard layout
 * Returns null if no position is saved
 */
export function getLastPosition(keyboardLayout: string): LastPosition | null {
  try {
    const key = `${LAST_POSITION_KEY_PREFIX}_${keyboardLayout}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to get last position:', error);
    return null;
  }
}

/**
 * Clear the saved last position for a specific keyboard layout
 * If no layout is specified, clears all layout positions
 */
export function clearLastPosition(keyboardLayout?: string): void {
  try {
    if (keyboardLayout) {
      const key = `${LAST_POSITION_KEY_PREFIX}_${keyboardLayout}`;
      localStorage.removeItem(key);
    } else {
      // Clear all layout positions
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(LAST_POSITION_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.error('Failed to clear last position:', error);
  }
}
