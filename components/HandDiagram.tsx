'use client';

import { getFingerForKey, getFingerColor, getHandForFinger, type FingerType } from '@/lib/data/keyboardLayout';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface HandDiagramProps {
  currentChar?: string;
  hand: 'left' | 'right';
}

export default function HandDiagram({ currentChar, hand }: HandDiagramProps) {
  const { t } = useLanguage();
  const currentFinger = currentChar ? getFingerForKey(currentChar) : null;
  const currentHand = currentFinger ? getHandForFinger(currentFinger) : 'both';

  const getFingerHighlight = (finger: FingerType): string => {
    if (!currentFinger) return 'opacity-40';
    if (currentFinger === finger) {
      return 'opacity-100 drop-shadow-lg';
    }
    return 'opacity-30';
  };

  const LeftHand = () => (
    <svg
      viewBox="0 0 200 300"
      className="w-32 h-48"
    >
      {/* Palm */}
      <ellipse
        cx="100"
        cy="180"
        rx="60"
        ry="80"
        fill="#f3f4f6"
        stroke="#9ca3af"
        strokeWidth="2"
        className={getFingerHighlight('left-index')}
      />

      {/* Pinky - leftmost for left hand */}
      <rect
        x="30"
        y="80"
        width="20"
        height="80"
        rx="10"
        fill={getFingerColor('left-pinky')}
        stroke="#9ca3af"
        strokeWidth="2"
        className={getFingerHighlight('left-pinky')}
      />

      {/* Ring */}
      <rect
        x="54"
        y="50"
        width="22"
        height="110"
        rx="11"
        fill={getFingerColor('left-ring')}
        stroke="#9ca3af"
        strokeWidth="2"
        className={getFingerHighlight('left-ring')}
      />

      {/* Middle */}
      <rect
        x="80"
        y="30"
        width="24"
        height="130"
        rx="12"
        fill={getFingerColor('left-middle')}
        stroke="#9ca3af"
        strokeWidth="2"
        className={getFingerHighlight('left-middle')}
      />

      {/* Index */}
      <rect
        x="108"
        y="50"
        width="24"
        height="120"
        rx="12"
        fill={getFingerColor('left-index')}
        stroke="#9ca3af"
        strokeWidth="2"
        className={getFingerHighlight('left-index')}
      />

      {/* Thumb */}
      <ellipse
        cx="145"
        cy="200"
        rx="18"
        ry="45"
        fill={getFingerColor('thumb')}
        stroke="#9ca3af"
        strokeWidth="2"
        transform="rotate(-30 145 200)"
        className={getFingerHighlight('thumb')}
      />

      {/* Label */}
      <text
        x="90"
        y="280"
        textAnchor="middle"
        className="text-sm font-semibold fill-gray-600 dark:fill-gray-400"
      >
        {t.typing.leftHand}
      </text>
    </svg>
  );

  const RightHand = () => (
    <svg
      viewBox="0 0 200 300"
      className="w-32 h-48"
    >
      {/* Palm */}
      <ellipse
        cx="100"
        cy="180"
        rx="60"
        ry="80"
        fill="#f3f4f6"
        stroke="#9ca3af"
        strokeWidth="2"
        className={getFingerHighlight('right-index')}
      />

      {/* Pinky */}
      <rect
        x="150"
        y="80"
        width="20"
        height="80"
        rx="10"
        fill={getFingerColor('right-pinky')}
        stroke="#9ca3af"
        strokeWidth="2"
        className={getFingerHighlight('right-pinky')}
      />

      {/* Ring */}
      <rect
        x="123"
        y="50"
        width="22"
        height="110"
        rx="11"
        fill={getFingerColor('right-ring')}
        stroke="#9ca3af"
        strokeWidth="2"
        className={getFingerHighlight('right-ring')}
      />

      {/* Middle */}
      <rect
        x="94"
        y="30"
        width="24"
        height="130"
        rx="12"
        fill={getFingerColor('right-middle')}
        stroke="#9ca3af"
        strokeWidth="2"
        className={getFingerHighlight('right-middle')}
      />

      {/* Index */}
      <rect
        x="66"
        y="50"
        width="24"
        height="120"
        rx="12"
        fill={getFingerColor('right-index')}
        stroke="#9ca3af"
        strokeWidth="2"
        className={getFingerHighlight('right-index')}
      />

      {/* Thumb */}
      <ellipse
        cx="55"
        cy="200"
        rx="18"
        ry="45"
        fill={getFingerColor('thumb')}
        stroke="#9ca3af"
        strokeWidth="2"
        transform="rotate(30 55 200)"
        className={getFingerHighlight('thumb')}
      />

      {/* Label */}
      <text
        x="100"
        y="280"
        textAnchor="middle"
        className="text-sm font-semibold fill-gray-600 dark:fill-gray-400"
      >
        {t.typing.rightHand}
      </text>
    </svg>
  );

  return hand === 'left' ? <LeftHand /> : <RightHand />;
}
