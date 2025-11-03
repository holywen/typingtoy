'use client';

import Link from 'next/link';
import { lessonsData } from '@/lib/data/lessons';
import TipsBanner from '@/components/TipsBanner';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function LessonsPage() {
  const { t } = useLanguage();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <TipsBanner />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
            {t.lessons.backToHome}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {t.lessons.title}
          </h1>
          <div className="w-24"></div>
        </div>

        <div className="max-w-4xl mx-auto mb-8">
          <p className="text-center text-lg text-gray-600 dark:text-gray-300">
            {t.lessons.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {lessonsData.map((lesson) => (
            <Link
              key={lesson.lessonNumber}
              href={`/lessons/${lesson.lessonNumber}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    {lesson.lessonNumber}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {lesson.title}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <span className={`text-xs px-3 py-1 rounded-full ${getDifficultyColor(lesson.difficulty)}`}>
                  {t.difficulties[lesson.difficulty as keyof typeof t.difficulties]}
                </span>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                <p>{t.lessons.focusKeys}: <span className="font-mono font-semibold">{lesson.focusKeys.join(', ')}</span></p>
                <p className="mt-1">{t.lessons.estimatedTime}: {lesson.estimatedTime} {t.lesson.minutes}</p>
                <p className="mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {lesson.exercises.length} {t.lessons.exercises}
                </p>
              </div>

              <div className="flex flex-wrap gap-1">
                {lesson.exercises.map((exercise, idx) => (
                  <div
                    key={exercise.id}
                    className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded text-xs flex items-center justify-center text-gray-600 dark:text-gray-400"
                    title={exercise.title}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
              <span className="text-gray-600 dark:text-gray-400">{t.difficulties.beginner}</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></span>
              <span className="text-gray-600 dark:text-gray-400">{t.difficulties.intermediate}</span>
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 bg-red-500 rounded-full mr-2"></span>
              <span className="text-gray-600 dark:text-gray-400">{t.difficulties.advanced}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
