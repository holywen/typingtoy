import type { Keystroke, TypingMetrics, TypingSession } from '@/types';

/**
 * Calculate typing metrics from a typing session
 * @param session - The current typing session
 * @returns Calculated metrics including WPM and accuracy
 */
export function calculateMetrics(session: TypingSession): TypingMetrics {
  const currentTime = performance.now();
  const timeElapsed = (currentTime - session.startTime) / 1000; // Convert to seconds
  const timeElapsedMinutes = timeElapsed / 60; // Convert to minutes

  // Count characters and errors
  const totalChars = session.keystrokes.length;
  const correctChars = session.keystrokes.filter((k) => k.correct).length;
  const uncorrectedErrors = session.keystrokes.filter(
    (k) => !k.correct && !k.corrected
  ).length;
  const correctedErrors = session.keystrokes.filter((k) => k.corrected).length;

  // Calculate Gross WPM (raw speed)
  // One "word" = 5 characters (industry standard)
  const grossWPM = timeElapsedMinutes > 0 ? totalChars / 5 / timeElapsedMinutes : 0;

  // Calculate Net WPM (adjusted for uncorrected errors)
  // Only uncorrected errors penalize Net WPM
  const netWPM =
    timeElapsedMinutes > 0
      ? Math.max(0, grossWPM - uncorrectedErrors / timeElapsedMinutes)
      : 0;

  // Calculate Accuracy (all errors count: corrected + uncorrected)
  const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 100;

  return {
    grossWPM: Math.round(grossWPM * 100) / 100, // Round to 2 decimal places
    netWPM: Math.round(netWPM * 100) / 100,
    accuracy: Math.round(accuracy * 100) / 100,
    duration: Math.round(timeElapsed),
    charactersTyped: totalChars,
    errors: uncorrectedErrors + correctedErrors,
    correctedErrors,
  };
}

/**
 * Track a keystroke and determine if it's correct
 * @param key - The pressed key
 * @param targetChar - The expected character
 * @param timestamp - When the key was pressed
 * @returns Keystroke object
 */
export function trackKeystroke(
  key: string,
  targetChar: string,
  timestamp: number
): Keystroke {
  const correct = key === targetChar;

  return {
    key,
    timestamp,
    correct,
    corrected: false,
  };
}

/**
 * Calculate real-time statistics for display
 * Should be called less frequently (e.g., every 1-2 seconds) for performance
 * @param session - The current typing session
 * @returns Metrics for UI display
 */
export function getRealTimeStats(session: TypingSession): {
  wpm: number;
  accuracy: number;
  timeElapsed: number;
} {
  if (session.keystrokes.length === 0) {
    return {
      wpm: 0,
      accuracy: 100,
      timeElapsed: 0,
    };
  }

  const metrics = calculateMetrics(session);
  const currentTime = performance.now();
  const timeElapsed = Math.round((currentTime - session.startTime) / 1000);

  return {
    wpm: Math.round(metrics.netWPM),
    accuracy: Math.round(metrics.accuracy),
    timeElapsed,
  };
}

/**
 * Get character timing data for visualization
 * @param keystrokes - Array of keystrokes
 * @returns Timing data per character
 */
export function getCharacterTimings(keystrokes: Keystroke[]): number[] {
  if (keystrokes.length <= 1) return [];

  const timings: number[] = [];
  for (let i = 1; i < keystrokes.length; i++) {
    const timeDiff = keystrokes[i].timestamp - keystrokes[i - 1].timestamp;
    timings.push(timeDiff);
  }

  return timings;
}

/**
 * Identify problem keys (keys with high error rates)
 * @param keystrokes - Array of keystrokes
 * @returns Map of keys to error counts
 */
export function identifyProblemKeys(keystrokes: Keystroke[]): Map<string, number> {
  const errorMap = new Map<string, number>();

  keystrokes.forEach((keystroke) => {
    if (!keystroke.correct) {
      const currentCount = errorMap.get(keystroke.key) || 0;
      errorMap.set(keystroke.key, currentCount + 1);
    }
  });

  // Sort by error count and return top offenders
  return new Map(
    [...errorMap.entries()].sort((a, b) => b[1] - a[1])
  );
}
