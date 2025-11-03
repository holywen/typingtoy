'use client';

import { useEffect, useState } from 'react';
import { getKeyboardLayout, getFingerColor, type FingerType, type KeyData } from '@/lib/data/keyboardLayout';
import { getUserSettings } from '@/lib/services/userSettings';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface VirtualKeyboardProps {
  currentChar?: string;
  highlightHomeRow?: boolean;
}

export default function VirtualKeyboard({ currentChar, highlightHomeRow = false }: VirtualKeyboardProps) {
  const { t } = useLanguage();
  const [layout, setLayout] = useState<KeyData[][]>([]);

  useEffect(() => {
    const settings = getUserSettings();
    setLayout(getKeyboardLayout(settings.keyboardLayout));
  }, []);
  const isCurrentKey = (keyData: { key: string; shiftKey?: string }) => {
    if (!currentChar) return false;
    const char = currentChar;
    return keyData.key === char.toLowerCase() || keyData.shiftKey === char;
  };

  const isHomeRowKey = (key: string) => {
    const homeRowKeys = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];
    return homeRowKeys.includes(key.toLowerCase());
  };

  const getKeyClassName = (keyData: { key: string; shiftKey?: string; finger: FingerType }, rowIndex: number) => {
    const baseClasses = 'relative rounded font-mono font-semibold transition-all duration-150 flex flex-col items-center justify-center';

    const isCurrent = isCurrentKey(keyData);
    const isHome = isHomeRowKey(keyData.key);
    const fingerColor = getFingerColor(keyData.finger);

    let sizeClasses = 'h-12 text-sm';
    let widthClass = 'w-12';

    // Space bar is wider
    if (keyData.key === ' ') {
      widthClass = 'w-64';
      sizeClasses = 'h-12 text-xs';
    }

    if (isCurrent) {
      // Current key to press - bright highlight
      return `${baseClasses} ${widthClass} ${sizeClasses} border-4 border-blue-500 text-white shadow-lg scale-110 z-10`;
    }

    if (highlightHomeRow && isHome) {
      // Home row keys
      return `${baseClasses} ${widthClass} ${sizeClasses} border-2 border-gray-400 dark:border-gray-500 text-gray-900 dark:text-white shadow-md`;
    }

    // Normal keys with finger color
    return `${baseClasses} ${widthClass} ${sizeClasses} border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:shadow-md`;
  };

  const getKeyStyle = (keyData: { finger: FingerType }, isCurrent: boolean) => {
    if (isCurrent) {
      return {
        backgroundColor: getFingerColor(keyData.finger),
      };
    }
    return {};
  };

  if (layout.length === 0) {
    return <div>Loading keyboard...</div>;
  }

  return (
    <div className="inline-block bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-inner">
      <div className="space-y-2">
        {layout.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {/* Add left padding for proper alignment */}
            {rowIndex === 1 && <div className="w-8" />}
            {rowIndex === 2 && <div className="w-12" />}
            {rowIndex === 3 && <div className="w-20" />}

            {row.map((keyData, keyIndex) => {
              const isCurrent = isCurrentKey(keyData);
              const isHome = isHomeRowKey(keyData.key);

              return (
                <div
                  key={keyIndex}
                  className={getKeyClassName(keyData, rowIndex)}
                  style={getKeyStyle(keyData, isCurrent)}
                >
                  {/* Shift character (top) */}
                  {keyData.shiftKey && keyData.key !== ' ' && (
                    <span className="text-xs opacity-60">{keyData.shiftKey}</span>
                  )}

                  {/* Main character */}
                  <span className={keyData.shiftKey ? '' : 'text-base'}>
                    {keyData.key === ' ' ? 'Space' : keyData.key.toUpperCase()}
                  </span>

                  {/* Home row indicators */}
                  {(keyData.key === 'f' || keyData.key === 'j') && (
                    <div className="absolute bottom-1 w-8 h-0.5 bg-gray-400 dark:bg-gray-500" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      {currentChar && (
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {t.typing.press}: <span className="font-bold text-lg">{currentChar === ' ' ? t.typing.space : currentChar}</span>
        </div>
      )}
    </div>
  );
}
