// Anti-cheat validation service for multiplayer games

export interface Keystroke {
  char: string;
  timestamp: number;
  correct: boolean;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
}

export class AntiCheatValidator {
  private static readonly MAX_HUMAN_WPM = 250; // Professional typists max out around 200-220 WPM
  private static readonly MIN_KEYSTROKE_INTERVAL = 20; // Milliseconds - anything faster is suspicious
  private static readonly MAX_KEYSTROKE_INTERVAL = 5000; // 5 seconds - too slow indicates tampering

  /**
   * Validate WPM based on keystroke history
   */
  static validateWPM(wpm: number, keystrokeHistory: Keystroke[]): ValidationResult {
    // Check if WPM exceeds human limits
    if (wpm > this.MAX_HUMAN_WPM) {
      return {
        valid: false,
        reason: `WPM ${wpm} exceeds maximum human speed (${this.MAX_HUMAN_WPM})`,
        severity: 'high',
      };
    }

    // Check keystroke intervals
    if (keystrokeHistory.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < keystrokeHistory.length; i++) {
        const interval = keystrokeHistory[i].timestamp - keystrokeHistory[i - 1].timestamp;
        intervals.push(interval);
      }

      // Check for suspiciously fast intervals
      const tooFastCount = intervals.filter(i => i < this.MIN_KEYSTROKE_INTERVAL).length;
      if (tooFastCount > intervals.length * 0.1) { // More than 10% too fast
        return {
          valid: false,
          reason: `${tooFastCount} keystrokes faster than ${this.MIN_KEYSTROKE_INTERVAL}ms`,
          severity: 'high',
        };
      }

      // Check average interval
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval < 30) { // Average less than 30ms per keystroke
        return {
          valid: false,
          reason: `Average keystroke interval ${avgInterval.toFixed(1)}ms is too fast`,
          severity: 'medium',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validate accuracy combined with WPM (perfect accuracy + very high WPM is suspicious)
   */
  static validateAccuracy(accuracy: number, wpm: number): ValidationResult {
    // 100% accuracy with very high WPM is extremely rare
    if (accuracy === 100 && wpm > 180) {
      return {
        valid: false,
        reason: `100% accuracy with ${wpm} WPM is highly suspicious`,
        severity: 'high',
      };
    }

    // 99%+ accuracy with superhuman WPM
    if (accuracy >= 99 && wpm > 200) {
      return {
        valid: false,
        reason: `${accuracy}% accuracy with ${wpm} WPM exceeds human capability`,
        severity: 'high',
      };
    }

    return { valid: true };
  }

  /**
   * Validate timestamp consistency
   */
  static validateTimestamps(keystrokes: Keystroke[]): ValidationResult {
    if (keystrokes.length < 2) {
      return { valid: true };
    }

    for (let i = 1; i < keystrokes.length; i++) {
      const interval = keystrokes[i].timestamp - keystrokes[i - 1].timestamp;

      // Timestamps going backwards
      if (interval < 0) {
        return {
          valid: false,
          reason: 'Timestamp went backwards',
          severity: 'high',
        };
      }

      // Unreasonably long gap (player AFK or tampering)
      if (interval > this.MAX_KEYSTROKE_INTERVAL) {
        return {
          valid: false,
          reason: `Keystroke interval ${interval}ms exceeds maximum ${this.MAX_KEYSTROKE_INTERVAL}ms`,
          severity: 'low',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validate game-specific physics (for Typing Walk: can only move to adjacent cells)
   */
  static validatePosition(
    currentRow: number,
    currentCol: number,
    prevRow: number,
    prevCol: number
  ): ValidationResult {
    const dx = Math.abs(currentCol - prevCol);
    const dy = Math.abs(currentRow - prevRow);

    // Can only move one step at a time
    if (dx + dy !== 1) {
      return {
        valid: false,
        reason: `Invalid move from (${prevRow},${prevCol}) to (${currentRow},${currentCol})`,
        severity: 'high',
      };
    }

    return { valid: true };
  }

  /**
   * Comprehensive validation for a game session
   */
  static validateGameSession(data: {
    wpm: number;
    accuracy: number;
    keystrokeHistory: Keystroke[];
  }): ValidationResult {
    // Validate WPM
    const wpmValidation = this.validateWPM(data.wpm, data.keystrokeHistory);
    if (!wpmValidation.valid) {
      return wpmValidation;
    }

    // Validate accuracy
    const accuracyValidation = this.validateAccuracy(data.accuracy, data.wpm);
    if (!accuracyValidation.valid) {
      return accuracyValidation;
    }

    // Validate timestamps
    const timestampValidation = this.validateTimestamps(data.keystrokeHistory);
    if (!timestampValidation.valid) {
      return timestampValidation;
    }

    return { valid: true };
  }

  /**
   * Real-time keystroke validation (called on each input)
   */
  static validateKeystroke(data: {
    char: string;
    timestamp: number;
    previousTimestamp?: number;
    expectedChar: string;
  }): ValidationResult {
    // Validate timestamp
    if (data.previousTimestamp) {
      const interval = data.timestamp - data.previousTimestamp;

      if (interval < 0) {
        return {
          valid: false,
          reason: 'Timestamp went backwards',
          severity: 'high',
        };
      }

      if (interval < this.MIN_KEYSTROKE_INTERVAL) {
        return {
          valid: false,
          reason: `Keystroke interval ${interval}ms too fast`,
          severity: 'medium',
        };
      }
    }

    // Validate character (basic check - game engine will do detailed validation)
    if (data.char.length !== 1) {
      return {
        valid: false,
        reason: 'Invalid character length',
        severity: 'high',
      };
    }

    return { valid: true };
  }

  /**
   * Log suspicious activity (would integrate with logging service)
   */
  static logSuspiciousActivity(
    playerId: string,
    displayName: string,
    validation: ValidationResult
  ): void {
    if (!validation.valid) {
      console.warn(`⚠️ Anti-cheat: ${validation.severity?.toUpperCase()} - Player ${displayName} (${playerId}): ${validation.reason}`);
      // TODO: Store in database for admin review
      // TODO: Auto-ban for high severity repeated offenses
    }
  }
}
