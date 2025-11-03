'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface HumanCheckProps {
  onVerify: (isValid: boolean) => void;
  error?: string;
}

export default function HumanCheck({ onVerify, error }: HumanCheckProps) {
  const { t } = useLanguage();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);

  useEffect(() => {
    generateQuestion();
  }, []);

  const generateQuestion = () => {
    // Generate a simple math question
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-'];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let result = 0;
    let questionText = '';

    if (operation === '+') {
      result = num1 + num2;
      questionText = `${num1} + ${num2}`;
    } else {
      // For subtraction, ensure positive result
      const larger = Math.max(num1, num2);
      const smaller = Math.min(num1, num2);
      result = larger - smaller;
      questionText = `${larger} - ${smaller}`;
    }

    setQuestion(questionText);
    setCorrectAnswer(result);
    setAnswer('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAnswer(value);

    // Auto-verify when answer is entered
    if (value) {
      const isValid = parseInt(value) === correctAnswer;
      onVerify(isValid);
    } else {
      onVerify(false);
    }
  };

  return (
    <div>
      <label htmlFor="humanCheck" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t.auth.humanCheck}: {question} = ?
      </label>
      <input
        id="humanCheck"
        type="number"
        value={answer}
        onChange={handleChange}
        required
        className={`w-full px-4 py-2 border ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white`}
        placeholder={t.auth.humanCheckPlaceholder}
        autoComplete="off"
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
