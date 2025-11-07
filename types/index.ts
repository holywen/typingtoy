// Core typing test types
export interface Keystroke {
  key: string;
  timestamp: number;
  correct: boolean;
  corrected: boolean;
}

export interface TypingSession {
  startTime: number;
  keystrokes: Keystroke[];
  targetText: string;
  currentPosition: number;
  completed?: boolean;
}

export interface TypingMetrics {
  grossWPM: number;
  netWPM: number;
  accuracy: number;
  duration: number; // in seconds
  charactersTyped: number;
  errors: number;
  correctedErrors: number;
}

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  keyboardLayout: KeyboardLayout;
  preferredLanguage: string;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Lesson types
export interface SubExercise {
  id: string;
  title: string;
  content: string;
  type: 'new_key' | 'key_practice' | 'word' | 'extra_key' | 'extra_word';
}

export interface Lesson {
  id: string;
  lessonNumber: number;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: string; // deprecated, use exercises instead
  exercises: SubExercise[];
  keyboardLayout: KeyboardLayout;
  language: string;
  focusKeys: string[];
  prerequisites: string[]; // lesson IDs
  estimatedTime: number; // in minutes
}

// Progress types
export interface UserProgress {
  id: string;
  userId: string;
  lessonId?: string;
  sessionType: 'lesson' | 'speed_test' | 'custom' | 'game';
  metrics: TypingMetrics;
  keystrokeData?: Keystroke[]; // optional detailed data
  completedAt: Date;
}

// Achievement types
export interface Achievement {
  id: string;
  userId: string;
  achievementType: string;
  title: string;
  description: string;
  icon?: string;
  earnedAt: Date;
}

// Keyboard layout types
export type KeyboardLayout =
  | 'qwerty'
  | 'dvorak'
  | 'colemak'
  | 'workman'
  | 'azerty'
  | 'qwertz';

// Settings types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  keyboardLayout: KeyboardLayout;
  language: string;
  soundEnabled: boolean;
  showKeyboard: boolean;
  highlightErrors: boolean;
}
