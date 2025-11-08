'use client';

import { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import TypingTest from '@/components/TypingTest';
import { lessonsData } from '@/lib/data/lessons';
import { saveProgress, saveLastPosition, getLastPosition } from '@/lib/services/progressStorage';
import { getUserSettings } from '@/lib/services/userSettings';
import TipsBanner from '@/components/TipsBanner';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { convertTextToLayout, convertKeysToLayout } from '@/lib/utils/layoutMapping';
import type { TypingSession } from '@/types';

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useLanguage();
  const { id } = use(params);
  const lessonNumber = parseInt(id);
  const lesson = lessonsData.find((l) => l.lessonNumber === lessonNumber);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [keyboardLayout, setKeyboardLayout] = useState('qwerty');

  // Load keyboard layout and last position when component mounts
  useEffect(() => {
    const settings = getUserSettings();
    setKeyboardLayout(settings.keyboardLayout);

    if (lesson && !isInitialized) {
      const lastPosition = getLastPosition(settings.keyboardLayout);

      if (lastPosition && lastPosition.lessonId === lesson.lessonNumber.toString()) {
        // Resume from last exercise if it's valid
        if (lastPosition.exerciseIndex < lesson.exercises.length) {
          setCurrentExerciseIndex(lastPosition.exerciseIndex);
        }
      }
      setIsInitialized(true);
    }
  }, [lesson, isInitialized]);

  // Listen for keyboard layout changes via storage events
  useEffect(() => {
    const handleStorageChange = () => {
      const settings = getUserSettings();
      setKeyboardLayout(settings.keyboardLayout);
    };

    // Listen for custom storage event
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event from same tab
    window.addEventListener('keyboardLayoutChanged', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('keyboardLayoutChanged', handleStorageChange);
    };
  }, []);

  // Handle when user starts typing in an exercise
  const handleExerciseStart = () => {
    if (lesson) {
      const currentLayout = getUserSettings().keyboardLayout;
      saveLastPosition(lesson.lessonNumber.toString(), currentExerciseIndex, currentLayout);
    }
  };

  if (!lesson) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Lesson Not Found</h1>
          <Link href="/lessons" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
            {t.lesson.backToLessons}
          </Link>
        </div>
      </main>
    );
  }

  const currentExercise = lesson.exercises[currentExerciseIndex];
  const previousLesson = lessonNumber > 1 ? lessonNumber - 1 : null;
  const nextLesson = lessonNumber < 15 ? lessonNumber + 1 : null;

  // Convert exercise content and focus keys to current keyboard layout
  const convertedExerciseContent = useMemo(() => {
    return convertTextToLayout(currentExercise.content, keyboardLayout);
  }, [currentExercise.content, keyboardLayout]);

  const convertedFocusKeys = useMemo(() => {
    return convertKeysToLayout(lesson.focusKeys, keyboardLayout);
  }, [lesson.focusKeys, keyboardLayout]);

  const handleExerciseComplete = (session: TypingSession) => {
    setCompletedExercises(prev => new Set(prev).add(currentExerciseIndex));

    // Save progress to local storage
    saveProgress(
      session,
      'lesson',
      lesson.lessonNumber.toString(),
      lesson.title,
      currentExercise.id,
      currentExercise.title
    );

    // Auto-advance to next exercise if available
    if (currentExerciseIndex < lesson.exercises.length - 1) {
      setTimeout(() => {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      }, 2000);
    }
  };

  const getExerciseTypeLabel = (type: string) => {
    switch (type) {
      case 'new_key': return t.lesson.exerciseTypes.newKey;
      case 'key_practice': return t.lesson.exerciseTypes.practice;
      case 'word': return t.lesson.exerciseTypes.words;
      case 'extra_key': return t.lesson.exerciseTypes.extraKeys;
      case 'extra_word': return t.lesson.exerciseTypes.extraWords;
      default: return type;
    }
  };

  const translateExerciseTitle = (title: string) => {
    // Match pattern like "New key exercise 1", "Key exercise 2"
    const newKeyMatch = title.match(/New key exercise (\d+)/i);
    if (newKeyMatch) {
      return `${t.lesson.exerciseNames.newKeyExercise} ${newKeyMatch[1]}`;
    }
    const keyMatch = title.match(/Key exercise (\d+)/i);
    if (keyMatch) {
      return `${t.lesson.exerciseNames.keyExercise} ${keyMatch[1]}`;
    }
    return title; // Return original if no pattern matches
  };

  return (
    <main className="min-h-screen max-h-screen overflow-y-auto bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Tips Banner for unregistered users */}
      <TipsBanner />

      <div className="container mx-auto px-4 py-2 md:py-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <Link href="/lessons" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm md:text-base">
            {t.lesson.backToLessons}
          </Link>
          <div className="text-center">
            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{t.lesson.lesson} {lesson.lessonNumber}</div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {lesson.title}
            </h1>
          </div>
          <div className="w-20 md:w-32"></div>
        </div>

        {/* Lesson Info */}
        <div className="max-w-6xl mx-auto mb-4 md:mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-6">
            <div className="flex flex-wrap gap-3 md:gap-6 items-center justify-between mb-3 md:mb-6 text-xs md:text-sm">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{t.lesson.difficulty}: </span>
                <span className="font-semibold capitalize">{t.difficulties[lesson.difficulty as keyof typeof t.difficulties]}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{t.lesson.focusKeys}: </span>
                <span className="font-mono font-semibold">{convertedFocusKeys.join(', ')}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{t.lesson.estimatedTime}: </span>
                <span className="font-semibold">{lesson.estimatedTime} {t.lesson.minutes}</span>
              </div>
            </div>

            {/* Exercise Navigation */}
            <div className="border-t pt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t.lesson.exercise} {currentExerciseIndex + 1} {t.lesson.of} {lesson.exercises.length}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {lesson.exercises.map((exercise, index) => (
                  <button
                    key={exercise.id}
                    onClick={() => setCurrentExerciseIndex(index)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      index === currentExerciseIndex
                        ? 'bg-blue-600 text-white shadow-md'
                        : completedExercises.has(index)
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-xs opacity-75">{getExerciseTypeLabel(exercise.type)}</div>
                    <div>{index + 1}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Current Exercise */}
        <div className="max-w-6xl mx-auto mb-4 md:mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 md:p-6 mb-3 md:mb-6">
            <div className="flex items-center justify-between mb-2 md:mb-4">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                {translateExerciseTitle(currentExercise.title)}
              </h2>
              <span className="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {getExerciseTypeLabel(currentExercise.type)}
              </span>
            </div>
          </div>

          <TypingTest
            key={`${currentExercise.id}-${keyboardLayout}`}
            targetText={convertedExerciseContent}
            showKeyboard={true}
            showHandDiagram={true}
            onStart={handleExerciseStart}
            onComplete={handleExerciseComplete}
          />
        </div>

        {/* Exercise Navigation Buttons */}
        <div className="max-w-6xl mx-auto flex justify-between items-center mt-4 md:mt-6 mb-4">
          <button
            onClick={() => currentExerciseIndex > 0 && setCurrentExerciseIndex(currentExerciseIndex - 1)}
            disabled={currentExerciseIndex === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              currentExerciseIndex === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-600'
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
            }`}
          >
            {t.lesson.previousExercise}
          </button>

          {currentExerciseIndex < lesson.exercises.length - 1 ? (
            <button
              onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {t.lesson.nextExercise}
            </button>
          ) : (
            <div className="flex gap-4">
              {previousLesson && (
                <Link
                  href={`/lessons/${previousLesson}`}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {t.lesson.previousLesson}
                </Link>
              )}
              {nextLesson ? (
                <Link
                  href={`/lessons/${nextLesson}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {t.lesson.nextLesson}
                </Link>
              ) : (
                <Link
                  href="/lessons"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {t.lesson.complete}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
