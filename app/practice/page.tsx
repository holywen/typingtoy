'use client';

import { useState } from 'react';
import Link from 'next/link';
import TypingTest from '@/components/TypingTest';
import { saveProgress } from '@/lib/services/progressStorage';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TypingSession } from '@/types';

const presetTexts = [
  {
    title: 'Programming Quote',
    text: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand. - Martin Fowler',
  },
  {
    title: 'JavaScript Basics',
    text: 'const greeting = "Hello, World!"; function sayHello() { console.log(greeting); } sayHello();',
  },
  {
    title: 'Common Words',
    text: 'the quick brown fox jumps over the lazy dog while typing practice helps improve speed and accuracy',
  },
  {
    title: 'Numbers & Symbols',
    text: 'Email: user@example.com | Price: $99.99 | Date: 2024-01-15 | Code: #FF5733',
  },
  {
    title: 'Famous Quote',
    text: 'The only way to do great work is to love what you do. If you haven\'t found it yet, keep looking. Don\'t settle. - Steve Jobs',
  },
];

export default function PracticePage() {
  const { t } = useLanguage();
  const [customText, setCustomText] = useState('');
  const [targetText, setTargetText] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  const handleStartCustom = () => {
    if (customText.trim().length < 10) {
      alert(t.practice.minCharactersAlert);
      return;
    }
    setTargetText(customText);
    setIsStarted(true);
  };

  const handleStartPreset = (text: string) => {
    setTargetText(text);
    setIsStarted(true);
  };

  const handleComplete = (session: TypingSession) => {
    saveProgress(session, 'custom');
    console.log('Practice completed!', session);
  };

  const handleReset = () => {
    setIsStarted(false);
    setTargetText('');
    setCustomText('');
  };

  if (isStarted && targetText) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={handleReset}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              {t.practice.backToPracticeSetup}
            </button>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {t.practice.title}
            </h1>
            <div className="w-48"></div>
          </div>

          <TypingTest
            key={targetText}
            targetText={targetText}
            onComplete={handleComplete}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
            {t.practice.backToHome}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {t.practice.title}
          </h1>
          <div className="w-24"></div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Custom Text Input */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {t.practice.practiceYourOwnText}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t.practice.practiceDescription}
            </p>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={t.practice.customTextPlaceholder}
              className="w-full h-40 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono resize-none"
              spellCheck="false"
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {customText.length} {t.practice.characters}
              </span>
              <button
                onClick={handleStartCustom}
                disabled={customText.trim().length < 10}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                {t.practice.startPracticing}
              </button>
            </div>
          </div>

          {/* Preset Texts */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {t.practice.orChoosePreset}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t.practice.selectPresetDescription}
            </p>
            <div className="space-y-4">
              {presetTexts.map((preset, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {preset.title}
                    </h3>
                    <button
                      onClick={() => handleStartPreset(preset.text)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      {t.practice.practiceThis}
                    </button>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-mono text-sm line-clamp-2">
                    {preset.text}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {preset.text.length} {t.practice.characters}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">
              {t.practice.practiceTips}
            </h3>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>{t.practice.tips.tip1}</li>
              <li>{t.practice.tips.tip2}</li>
              <li>{t.practice.tips.tip3}</li>
              <li>{t.practice.tips.tip4}</li>
              <li>{t.practice.tips.tip5}</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
