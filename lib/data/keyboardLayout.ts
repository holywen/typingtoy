// Keyboard layout data and finger position mapping
import type { KeyboardLayout } from '@/types';

export type FingerType = 'left-pinky' | 'left-ring' | 'left-middle' | 'left-index' | 'right-index' | 'right-middle' | 'right-ring' | 'right-pinky' | 'thumb';

export interface KeyData {
  key: string;
  shiftKey?: string;
  finger: FingerType;
  width?: number; // relative width, default is 1
}

// QWERTY keyboard layout
export const qwertyLayout: KeyData[][] = [
  // Number row
  [
    { key: '`', shiftKey: '~', finger: 'left-pinky' },
    { key: '1', shiftKey: '!', finger: 'left-pinky' },
    { key: '2', shiftKey: '@', finger: 'left-ring' },
    { key: '3', shiftKey: '#', finger: 'left-middle' },
    { key: '4', shiftKey: '$', finger: 'left-index' },
    { key: '5', shiftKey: '%', finger: 'left-index' },
    { key: '6', shiftKey: '^', finger: 'right-index' },
    { key: '7', shiftKey: '&', finger: 'right-index' },
    { key: '8', shiftKey: '*', finger: 'right-middle' },
    { key: '9', shiftKey: '(', finger: 'right-ring' },
    { key: '0', shiftKey: ')', finger: 'right-pinky' },
    { key: '-', shiftKey: '_', finger: 'right-pinky' },
    { key: '=', shiftKey: '+', finger: 'right-pinky' },
  ],
  // Top row
  [
    { key: 'q', finger: 'left-pinky' },
    { key: 'w', finger: 'left-ring' },
    { key: 'e', finger: 'left-middle' },
    { key: 'r', finger: 'left-index' },
    { key: 't', finger: 'left-index' },
    { key: 'y', finger: 'right-index' },
    { key: 'u', finger: 'right-index' },
    { key: 'i', finger: 'right-middle' },
    { key: 'o', finger: 'right-ring' },
    { key: 'p', finger: 'right-pinky' },
    { key: '[', shiftKey: '{', finger: 'right-pinky' },
    { key: ']', shiftKey: '}', finger: 'right-pinky' },
    { key: '\\', shiftKey: '|', finger: 'right-pinky' },
  ],
  // Home row
  [
    { key: 'a', finger: 'left-pinky' },
    { key: 's', finger: 'left-ring' },
    { key: 'd', finger: 'left-middle' },
    { key: 'f', finger: 'left-index' },
    { key: 'g', finger: 'left-index' },
    { key: 'h', finger: 'right-index' },
    { key: 'j', finger: 'right-index' },
    { key: 'k', finger: 'right-middle' },
    { key: 'l', finger: 'right-ring' },
    { key: ';', shiftKey: ':', finger: 'right-pinky' },
    { key: "'", shiftKey: '"', finger: 'right-pinky' },
  ],
  // Bottom row
  [
    { key: 'z', finger: 'left-pinky' },
    { key: 'x', finger: 'left-ring' },
    { key: 'c', finger: 'left-middle' },
    { key: 'v', finger: 'left-index' },
    { key: 'b', finger: 'left-index' },
    { key: 'n', finger: 'right-index' },
    { key: 'm', finger: 'right-index' },
    { key: ',', shiftKey: '<', finger: 'right-middle' },
    { key: '.', shiftKey: '>', finger: 'right-ring' },
    { key: '/', shiftKey: '?', finger: 'right-pinky' },
  ],
  // Space row
  [
    { key: ' ', finger: 'thumb', width: 5 },
  ],
];

// Dvorak keyboard layout
export const dvorakLayout: KeyData[][] = [
  // Number row (same as QWERTY)
  [
    { key: '`', shiftKey: '~', finger: 'left-pinky' },
    { key: '1', shiftKey: '!', finger: 'left-pinky' },
    { key: '2', shiftKey: '@', finger: 'left-ring' },
    { key: '3', shiftKey: '#', finger: 'left-middle' },
    { key: '4', shiftKey: '$', finger: 'left-index' },
    { key: '5', shiftKey: '%', finger: 'left-index' },
    { key: '6', shiftKey: '^', finger: 'right-index' },
    { key: '7', shiftKey: '&', finger: 'right-index' },
    { key: '8', shiftKey: '*', finger: 'right-middle' },
    { key: '9', shiftKey: '(', finger: 'right-ring' },
    { key: '0', shiftKey: ')', finger: 'right-pinky' },
    { key: '[', shiftKey: '{', finger: 'right-pinky' },
    { key: ']', shiftKey: '}', finger: 'right-pinky' },
  ],
  // Top row
  [
    { key: "'", shiftKey: '"', finger: 'left-pinky' },
    { key: ',', shiftKey: '<', finger: 'left-ring' },
    { key: '.', shiftKey: '>', finger: 'left-middle' },
    { key: 'p', finger: 'left-index' },
    { key: 'y', finger: 'left-index' },
    { key: 'f', finger: 'right-index' },
    { key: 'g', finger: 'right-index' },
    { key: 'c', finger: 'right-middle' },
    { key: 'r', finger: 'right-ring' },
    { key: 'l', finger: 'right-pinky' },
    { key: '/', shiftKey: '?', finger: 'right-pinky' },
    { key: '=', shiftKey: '+', finger: 'right-pinky' },
    { key: '\\', shiftKey: '|', finger: 'right-pinky' },
  ],
  // Home row
  [
    { key: 'a', finger: 'left-pinky' },
    { key: 'o', finger: 'left-ring' },
    { key: 'e', finger: 'left-middle' },
    { key: 'u', finger: 'left-index' },
    { key: 'i', finger: 'left-index' },
    { key: 'd', finger: 'right-index' },
    { key: 'h', finger: 'right-index' },
    { key: 't', finger: 'right-middle' },
    { key: 'n', finger: 'right-ring' },
    { key: 's', finger: 'right-pinky' },
    { key: '-', shiftKey: '_', finger: 'right-pinky' },
  ],
  // Bottom row
  [
    { key: ';', shiftKey: ':', finger: 'left-pinky' },
    { key: 'q', finger: 'left-ring' },
    { key: 'j', finger: 'left-middle' },
    { key: 'k', finger: 'left-index' },
    { key: 'x', finger: 'left-index' },
    { key: 'b', finger: 'right-index' },
    { key: 'm', finger: 'right-index' },
    { key: 'w', finger: 'right-middle' },
    { key: 'v', finger: 'right-ring' },
    { key: 'z', finger: 'right-pinky' },
  ],
  // Space row
  [
    { key: ' ', finger: 'thumb', width: 5 },
  ],
];

// Colemak keyboard layout
export const colemakLayout: KeyData[][] = [
  // Number row (same as QWERTY)
  [
    { key: '`', shiftKey: '~', finger: 'left-pinky' },
    { key: '1', shiftKey: '!', finger: 'left-pinky' },
    { key: '2', shiftKey: '@', finger: 'left-ring' },
    { key: '3', shiftKey: '#', finger: 'left-middle' },
    { key: '4', shiftKey: '$', finger: 'left-index' },
    { key: '5', shiftKey: '%', finger: 'left-index' },
    { key: '6', shiftKey: '^', finger: 'right-index' },
    { key: '7', shiftKey: '&', finger: 'right-index' },
    { key: '8', shiftKey: '*', finger: 'right-middle' },
    { key: '9', shiftKey: '(', finger: 'right-ring' },
    { key: '0', shiftKey: ')', finger: 'right-pinky' },
    { key: '-', shiftKey: '_', finger: 'right-pinky' },
    { key: '=', shiftKey: '+', finger: 'right-pinky' },
  ],
  // Top row
  [
    { key: 'q', finger: 'left-pinky' },
    { key: 'w', finger: 'left-ring' },
    { key: 'f', finger: 'left-middle' },
    { key: 'p', finger: 'left-index' },
    { key: 'g', finger: 'left-index' },
    { key: 'j', finger: 'right-index' },
    { key: 'l', finger: 'right-index' },
    { key: 'u', finger: 'right-middle' },
    { key: 'y', finger: 'right-ring' },
    { key: ';', shiftKey: ':', finger: 'right-pinky' },
    { key: '[', shiftKey: '{', finger: 'right-pinky' },
    { key: ']', shiftKey: '}', finger: 'right-pinky' },
    { key: '\\', shiftKey: '|', finger: 'right-pinky' },
  ],
  // Home row
  [
    { key: 'a', finger: 'left-pinky' },
    { key: 'r', finger: 'left-ring' },
    { key: 's', finger: 'left-middle' },
    { key: 't', finger: 'left-index' },
    { key: 'd', finger: 'left-index' },
    { key: 'h', finger: 'right-index' },
    { key: 'n', finger: 'right-index' },
    { key: 'e', finger: 'right-middle' },
    { key: 'i', finger: 'right-ring' },
    { key: 'o', finger: 'right-pinky' },
    { key: "'", shiftKey: '"', finger: 'right-pinky' },
  ],
  // Bottom row
  [
    { key: 'z', finger: 'left-pinky' },
    { key: 'x', finger: 'left-ring' },
    { key: 'c', finger: 'left-middle' },
    { key: 'v', finger: 'left-index' },
    { key: 'b', finger: 'left-index' },
    { key: 'k', finger: 'right-index' },
    { key: 'm', finger: 'right-index' },
    { key: ',', shiftKey: '<', finger: 'right-middle' },
    { key: '.', shiftKey: '>', finger: 'right-ring' },
    { key: '/', shiftKey: '?', finger: 'right-pinky' },
  ],
  // Space row
  [
    { key: ' ', finger: 'thumb', width: 5 },
  ],
];

// AZERTY keyboard layout (French)
export const azertyLayout: KeyData[][] = [
  // Number row
  [
    { key: '²', finger: 'left-pinky' },
    { key: '&', shiftKey: '1', finger: 'left-pinky' },
    { key: 'é', shiftKey: '2', finger: 'left-ring' },
    { key: '"', shiftKey: '3', finger: 'left-middle' },
    { key: "'", shiftKey: '4', finger: 'left-index' },
    { key: '(', shiftKey: '5', finger: 'left-index' },
    { key: '-', shiftKey: '6', finger: 'right-index' },
    { key: 'è', shiftKey: '7', finger: 'right-index' },
    { key: '_', shiftKey: '8', finger: 'right-middle' },
    { key: 'ç', shiftKey: '9', finger: 'right-ring' },
    { key: 'à', shiftKey: '0', finger: 'right-pinky' },
    { key: ')', shiftKey: '°', finger: 'right-pinky' },
    { key: '=', shiftKey: '+', finger: 'right-pinky' },
  ],
  // Top row
  [
    { key: 'a', finger: 'left-pinky' },
    { key: 'z', finger: 'left-ring' },
    { key: 'e', finger: 'left-middle' },
    { key: 'r', finger: 'left-index' },
    { key: 't', finger: 'left-index' },
    { key: 'y', finger: 'right-index' },
    { key: 'u', finger: 'right-index' },
    { key: 'i', finger: 'right-middle' },
    { key: 'o', finger: 'right-ring' },
    { key: 'p', finger: 'right-pinky' },
    { key: '^', shiftKey: '¨', finger: 'right-pinky' },
    { key: '$', shiftKey: '£', finger: 'right-pinky' },
  ],
  // Home row
  [
    { key: 'q', finger: 'left-pinky' },
    { key: 's', finger: 'left-ring' },
    { key: 'd', finger: 'left-middle' },
    { key: 'f', finger: 'left-index' },
    { key: 'g', finger: 'left-index' },
    { key: 'h', finger: 'right-index' },
    { key: 'j', finger: 'right-index' },
    { key: 'k', finger: 'right-middle' },
    { key: 'l', finger: 'right-ring' },
    { key: 'm', finger: 'right-pinky' },
    { key: 'ù', shiftKey: '%', finger: 'right-pinky' },
    { key: '*', shiftKey: 'µ', finger: 'right-pinky' },
  ],
  // Bottom row
  [
    { key: 'w', finger: 'left-pinky' },
    { key: 'x', finger: 'left-ring' },
    { key: 'c', finger: 'left-middle' },
    { key: 'v', finger: 'left-index' },
    { key: 'b', finger: 'left-index' },
    { key: 'n', finger: 'right-index' },
    { key: ',', shiftKey: '?', finger: 'right-middle' },
    { key: ';', shiftKey: '.', finger: 'right-ring' },
    { key: ':', shiftKey: '/', finger: 'right-pinky' },
    { key: '!', shiftKey: '§', finger: 'right-pinky' },
  ],
  // Space row
  [
    { key: ' ', finger: 'thumb', width: 5 },
  ],
];

// UK QWERTY keyboard layout
export const qwertyUKLayout: KeyData[][] = [
  // Number row
  [
    { key: '`', shiftKey: '¬', finger: 'left-pinky' },
    { key: '1', shiftKey: '!', finger: 'left-pinky' },
    { key: '2', shiftKey: '"', finger: 'left-ring' },
    { key: '3', shiftKey: '£', finger: 'left-middle' },
    { key: '4', shiftKey: '$', finger: 'left-index' },
    { key: '5', shiftKey: '%', finger: 'left-index' },
    { key: '6', shiftKey: '^', finger: 'right-index' },
    { key: '7', shiftKey: '&', finger: 'right-index' },
    { key: '8', shiftKey: '*', finger: 'right-middle' },
    { key: '9', shiftKey: '(', finger: 'right-ring' },
    { key: '0', shiftKey: ')', finger: 'right-pinky' },
    { key: '-', shiftKey: '_', finger: 'right-pinky' },
    { key: '=', shiftKey: '+', finger: 'right-pinky' },
  ],
  // Top row
  [
    { key: 'q', finger: 'left-pinky' },
    { key: 'w', finger: 'left-ring' },
    { key: 'e', finger: 'left-middle' },
    { key: 'r', finger: 'left-index' },
    { key: 't', finger: 'left-index' },
    { key: 'y', finger: 'right-index' },
    { key: 'u', finger: 'right-index' },
    { key: 'i', finger: 'right-middle' },
    { key: 'o', finger: 'right-ring' },
    { key: 'p', finger: 'right-pinky' },
    { key: '[', shiftKey: '{', finger: 'right-pinky' },
    { key: ']', shiftKey: '}', finger: 'right-pinky' },
  ],
  // Home row
  [
    { key: 'a', finger: 'left-pinky' },
    { key: 's', finger: 'left-ring' },
    { key: 'd', finger: 'left-middle' },
    { key: 'f', finger: 'left-index' },
    { key: 'g', finger: 'left-index' },
    { key: 'h', finger: 'right-index' },
    { key: 'j', finger: 'right-index' },
    { key: 'k', finger: 'right-middle' },
    { key: 'l', finger: 'right-ring' },
    { key: ';', shiftKey: ':', finger: 'right-pinky' },
    { key: "'", shiftKey: '@', finger: 'right-pinky' },
    { key: '#', shiftKey: '~', finger: 'right-pinky' },
  ],
  // Bottom row
  [
    { key: '\\', shiftKey: '|', finger: 'left-pinky' },
    { key: 'z', finger: 'left-pinky' },
    { key: 'x', finger: 'left-ring' },
    { key: 'c', finger: 'left-middle' },
    { key: 'v', finger: 'left-index' },
    { key: 'b', finger: 'left-index' },
    { key: 'n', finger: 'right-index' },
    { key: 'm', finger: 'right-index' },
    { key: ',', shiftKey: '<', finger: 'right-middle' },
    { key: '.', shiftKey: '>', finger: 'right-ring' },
    { key: '/', shiftKey: '?', finger: 'right-pinky' },
  ],
  // Space row
  [
    { key: ' ', finger: 'thumb', width: 5 },
  ],
];

// Workman keyboard layout
export const workmanLayout: KeyData[][] = [
  // Number row (same as QWERTY)
  [
    { key: '`', shiftKey: '~', finger: 'left-pinky' },
    { key: '1', shiftKey: '!', finger: 'left-pinky' },
    { key: '2', shiftKey: '@', finger: 'left-ring' },
    { key: '3', shiftKey: '#', finger: 'left-middle' },
    { key: '4', shiftKey: '$', finger: 'left-index' },
    { key: '5', shiftKey: '%', finger: 'left-index' },
    { key: '6', shiftKey: '^', finger: 'right-index' },
    { key: '7', shiftKey: '&', finger: 'right-index' },
    { key: '8', shiftKey: '*', finger: 'right-middle' },
    { key: '9', shiftKey: '(', finger: 'right-ring' },
    { key: '0', shiftKey: ')', finger: 'right-pinky' },
    { key: '-', shiftKey: '_', finger: 'right-pinky' },
    { key: '=', shiftKey: '+', finger: 'right-pinky' },
  ],
  // Top row
  [
    { key: 'q', finger: 'left-pinky' },
    { key: 'd', finger: 'left-ring' },
    { key: 'r', finger: 'left-middle' },
    { key: 'w', finger: 'left-index' },
    { key: 'b', finger: 'left-index' },
    { key: 'j', finger: 'right-index' },
    { key: 'f', finger: 'right-index' },
    { key: 'u', finger: 'right-middle' },
    { key: 'p', finger: 'right-ring' },
    { key: ';', shiftKey: ':', finger: 'right-pinky' },
    { key: '[', shiftKey: '{', finger: 'right-pinky' },
    { key: ']', shiftKey: '}', finger: 'right-pinky' },
    { key: '\\', shiftKey: '|', finger: 'right-pinky' },
  ],
  // Home row
  [
    { key: 'a', finger: 'left-pinky' },
    { key: 's', finger: 'left-ring' },
    { key: 'h', finger: 'left-middle' },
    { key: 't', finger: 'left-index' },
    { key: 'g', finger: 'left-index' },
    { key: 'y', finger: 'right-index' },
    { key: 'n', finger: 'right-index' },
    { key: 'e', finger: 'right-middle' },
    { key: 'o', finger: 'right-ring' },
    { key: 'i', finger: 'right-pinky' },
    { key: "'", shiftKey: '"', finger: 'right-pinky' },
  ],
  // Bottom row
  [
    { key: 'z', finger: 'left-pinky' },
    { key: 'x', finger: 'left-ring' },
    { key: 'm', finger: 'left-middle' },
    { key: 'c', finger: 'left-index' },
    { key: 'v', finger: 'left-index' },
    { key: 'k', finger: 'right-index' },
    { key: 'l', finger: 'right-index' },
    { key: ',', shiftKey: '<', finger: 'right-middle' },
    { key: '.', shiftKey: '>', finger: 'right-ring' },
    { key: '/', shiftKey: '?', finger: 'right-pinky' },
  ],
  // Space row
  [
    { key: ' ', finger: 'thumb', width: 5 },
  ],
];

// Programmer Dvorak keyboard layout
export const programmerDvorakLayout: KeyData[][] = [
  // Number row (optimized for programming with symbols as primary)
  [
    { key: '$', shiftKey: '~', finger: 'left-pinky' },
    { key: '&', shiftKey: '%', finger: 'left-pinky' },
    { key: '[', shiftKey: '7', finger: 'left-ring' },
    { key: '{', shiftKey: '5', finger: 'left-middle' },
    { key: '}', shiftKey: '3', finger: 'left-index' },
    { key: '(', shiftKey: '1', finger: 'left-index' },
    { key: '=', shiftKey: '9', finger: 'right-index' },
    { key: '*', shiftKey: '0', finger: 'right-index' },
    { key: ')', shiftKey: '2', finger: 'right-middle' },
    { key: '+', shiftKey: '4', finger: 'right-ring' },
    { key: ']', shiftKey: '6', finger: 'right-pinky' },
    { key: '!', shiftKey: '8', finger: 'right-pinky' },
    { key: '#', shiftKey: '`', finger: 'right-pinky' },
  ],
  // Top row
  [
    { key: ';', shiftKey: ':', finger: 'left-pinky' },
    { key: ',', shiftKey: '<', finger: 'left-ring' },
    { key: '.', shiftKey: '>', finger: 'left-middle' },
    { key: 'p', finger: 'left-index' },
    { key: 'y', finger: 'left-index' },
    { key: 'f', finger: 'right-index' },
    { key: 'g', finger: 'right-index' },
    { key: 'c', finger: 'right-middle' },
    { key: 'r', finger: 'right-ring' },
    { key: 'l', finger: 'right-pinky' },
    { key: '/', shiftKey: '?', finger: 'right-pinky' },
    { key: '@', shiftKey: '^', finger: 'right-pinky' },
    { key: '\\', shiftKey: '|', finger: 'right-pinky' },
  ],
  // Home row
  [
    { key: 'a', finger: 'left-pinky' },
    { key: 'o', finger: 'left-ring' },
    { key: 'e', finger: 'left-middle' },
    { key: 'u', finger: 'left-index' },
    { key: 'i', finger: 'left-index' },
    { key: 'd', finger: 'right-index' },
    { key: 'h', finger: 'right-index' },
    { key: 't', finger: 'right-middle' },
    { key: 'n', finger: 'right-ring' },
    { key: 's', finger: 'right-pinky' },
    { key: '-', shiftKey: '_', finger: 'right-pinky' },
  ],
  // Bottom row
  [
    { key: "'", shiftKey: '"', finger: 'left-pinky' },
    { key: 'q', finger: 'left-ring' },
    { key: 'j', finger: 'left-middle' },
    { key: 'k', finger: 'left-index' },
    { key: 'x', finger: 'left-index' },
    { key: 'b', finger: 'right-index' },
    { key: 'm', finger: 'right-index' },
    { key: 'w', finger: 'right-middle' },
    { key: 'v', finger: 'right-ring' },
    { key: 'z', finger: 'right-pinky' },
  ],
  // Space row
  [
    { key: ' ', finger: 'thumb', width: 5 },
  ],
];

// Spanish (Spain) keyboard layout
export const spanishLayout: KeyData[][] = [
  // Number row
  [
    { key: 'º', shiftKey: 'ª', finger: 'left-pinky' },
    { key: '1', shiftKey: '!', finger: 'left-pinky' },
    { key: '2', shiftKey: '"', finger: 'left-ring' },
    { key: '3', shiftKey: '·', finger: 'left-middle' },
    { key: '4', shiftKey: '$', finger: 'left-index' },
    { key: '5', shiftKey: '%', finger: 'left-index' },
    { key: '6', shiftKey: '&', finger: 'right-index' },
    { key: '7', shiftKey: '/', finger: 'right-index' },
    { key: '8', shiftKey: '(', finger: 'right-middle' },
    { key: '9', shiftKey: ')', finger: 'right-ring' },
    { key: '0', shiftKey: '=', finger: 'right-pinky' },
    { key: "'", shiftKey: '?', finger: 'right-pinky' },
    { key: '¡', shiftKey: '¿', finger: 'right-pinky' },
  ],
  // Top row
  [
    { key: 'q', finger: 'left-pinky' },
    { key: 'w', finger: 'left-ring' },
    { key: 'e', finger: 'left-middle' },
    { key: 'r', finger: 'left-index' },
    { key: 't', finger: 'left-index' },
    { key: 'y', finger: 'right-index' },
    { key: 'u', finger: 'right-index' },
    { key: 'i', finger: 'right-middle' },
    { key: 'o', finger: 'right-ring' },
    { key: 'p', finger: 'right-pinky' },
    { key: '`', shiftKey: '^', finger: 'right-pinky' },
    { key: '+', shiftKey: '*', finger: 'right-pinky' },
  ],
  // Home row
  [
    { key: 'a', finger: 'left-pinky' },
    { key: 's', finger: 'left-ring' },
    { key: 'd', finger: 'left-middle' },
    { key: 'f', finger: 'left-index' },
    { key: 'g', finger: 'left-index' },
    { key: 'h', finger: 'right-index' },
    { key: 'j', finger: 'right-index' },
    { key: 'k', finger: 'right-middle' },
    { key: 'l', finger: 'right-ring' },
    { key: 'ñ', finger: 'right-pinky' },
    { key: '´', shiftKey: '¨', finger: 'right-pinky' },
    { key: 'ç', shiftKey: 'Ç', finger: 'right-pinky' },
  ],
  // Bottom row
  [
    { key: '<', shiftKey: '>', finger: 'left-pinky' },
    { key: 'z', finger: 'left-pinky' },
    { key: 'x', finger: 'left-ring' },
    { key: 'c', finger: 'left-middle' },
    { key: 'v', finger: 'left-index' },
    { key: 'b', finger: 'left-index' },
    { key: 'n', finger: 'right-index' },
    { key: 'm', finger: 'right-index' },
    { key: ',', shiftKey: ';', finger: 'right-middle' },
    { key: '.', shiftKey: ':', finger: 'right-ring' },
    { key: '-', shiftKey: '_', finger: 'right-pinky' },
  ],
  // Space row
  [
    { key: ' ', finger: 'thumb', width: 5 },
  ],
];

// Spanish (Latin America) keyboard layout
export const latinLayout: KeyData[][] = [
  // Number row
  [
    { key: '|', shiftKey: '°', finger: 'left-pinky' },
    { key: '1', shiftKey: '!', finger: 'left-pinky' },
    { key: '2', shiftKey: '"', finger: 'left-ring' },
    { key: '3', shiftKey: '#', finger: 'left-middle' },
    { key: '4', shiftKey: '$', finger: 'left-index' },
    { key: '5', shiftKey: '%', finger: 'left-index' },
    { key: '6', shiftKey: '&', finger: 'right-index' },
    { key: '7', shiftKey: '/', finger: 'right-index' },
    { key: '8', shiftKey: '(', finger: 'right-middle' },
    { key: '9', shiftKey: ')', finger: 'right-ring' },
    { key: '0', shiftKey: '=', finger: 'right-pinky' },
    { key: "'", shiftKey: '?', finger: 'right-pinky' },
    { key: '¿', shiftKey: '¡', finger: 'right-pinky' },
  ],
  // Top row
  [
    { key: 'q', finger: 'left-pinky' },
    { key: 'w', finger: 'left-ring' },
    { key: 'e', finger: 'left-middle' },
    { key: 'r', finger: 'left-index' },
    { key: 't', finger: 'left-index' },
    { key: 'y', finger: 'right-index' },
    { key: 'u', finger: 'right-index' },
    { key: 'i', finger: 'right-middle' },
    { key: 'o', finger: 'right-ring' },
    { key: 'p', finger: 'right-pinky' },
    { key: '´', shiftKey: '¨', finger: 'right-pinky' },
    { key: '+', shiftKey: '*', finger: 'right-pinky' },
  ],
  // Home row
  [
    { key: 'a', finger: 'left-pinky' },
    { key: 's', finger: 'left-ring' },
    { key: 'd', finger: 'left-middle' },
    { key: 'f', finger: 'left-index' },
    { key: 'g', finger: 'left-index' },
    { key: 'h', finger: 'right-index' },
    { key: 'j', finger: 'right-index' },
    { key: 'k', finger: 'right-middle' },
    { key: 'l', finger: 'right-ring' },
    { key: 'ñ', finger: 'right-pinky' },
    { key: '{', shiftKey: '[', finger: 'right-pinky' },
    { key: '}', shiftKey: ']', finger: 'right-pinky' },
  ],
  // Bottom row
  [
    { key: '<', shiftKey: '>', finger: 'left-pinky' },
    { key: 'z', finger: 'left-pinky' },
    { key: 'x', finger: 'left-ring' },
    { key: 'c', finger: 'left-middle' },
    { key: 'v', finger: 'left-index' },
    { key: 'b', finger: 'left-index' },
    { key: 'n', finger: 'right-index' },
    { key: 'm', finger: 'right-index' },
    { key: ',', shiftKey: ';', finger: 'right-middle' },
    { key: '.', shiftKey: ':', finger: 'right-ring' },
    { key: '-', shiftKey: '_', finger: 'right-pinky' },
  ],
  // Space row
  [
    { key: ' ', finger: 'thumb', width: 5 },
  ],
];

// QWERTZ keyboard layout (German)
export const qwertzLayout: KeyData[][] = [
  // Number row
  [
    { key: '^', shiftKey: '°', finger: 'left-pinky' },
    { key: '1', shiftKey: '!', finger: 'left-pinky' },
    { key: '2', shiftKey: '"', finger: 'left-ring' },
    { key: '3', shiftKey: '§', finger: 'left-middle' },
    { key: '4', shiftKey: '$', finger: 'left-index' },
    { key: '5', shiftKey: '%', finger: 'left-index' },
    { key: '6', shiftKey: '&', finger: 'right-index' },
    { key: '7', shiftKey: '/', finger: 'right-index' },
    { key: '8', shiftKey: '(', finger: 'right-middle' },
    { key: '9', shiftKey: ')', finger: 'right-ring' },
    { key: '0', shiftKey: '=', finger: 'right-pinky' },
    { key: 'ß', shiftKey: '?', finger: 'right-pinky' },
    { key: '´', shiftKey: '`', finger: 'right-pinky' },
  ],
  // Top row
  [
    { key: 'q', finger: 'left-pinky' },
    { key: 'w', finger: 'left-ring' },
    { key: 'e', finger: 'left-middle' },
    { key: 'r', finger: 'left-index' },
    { key: 't', finger: 'left-index' },
    { key: 'z', finger: 'right-index' },
    { key: 'u', finger: 'right-index' },
    { key: 'i', finger: 'right-middle' },
    { key: 'o', finger: 'right-ring' },
    { key: 'p', finger: 'right-pinky' },
    { key: 'ü', finger: 'right-pinky' },
    { key: '+', shiftKey: '*', finger: 'right-pinky' },
  ],
  // Home row
  [
    { key: 'a', finger: 'left-pinky' },
    { key: 's', finger: 'left-ring' },
    { key: 'd', finger: 'left-middle' },
    { key: 'f', finger: 'left-index' },
    { key: 'g', finger: 'left-index' },
    { key: 'h', finger: 'right-index' },
    { key: 'j', finger: 'right-index' },
    { key: 'k', finger: 'right-middle' },
    { key: 'l', finger: 'right-ring' },
    { key: 'ö', finger: 'right-pinky' },
    { key: 'ä', finger: 'right-pinky' },
    { key: '#', shiftKey: "'", finger: 'right-pinky' },
  ],
  // Bottom row
  [
    { key: 'y', finger: 'left-pinky' },
    { key: 'x', finger: 'left-ring' },
    { key: 'c', finger: 'left-middle' },
    { key: 'v', finger: 'left-index' },
    { key: 'b', finger: 'left-index' },
    { key: 'n', finger: 'right-index' },
    { key: 'm', finger: 'right-index' },
    { key: ',', shiftKey: ';', finger: 'right-middle' },
    { key: '.', shiftKey: ':', finger: 'right-ring' },
    { key: '-', shiftKey: '_', finger: 'right-pinky' },
  ],
  // Space row
  [
    { key: ' ', finger: 'thumb', width: 5 },
  ],
];

// Get finger for a specific character in a given layout
export function getFingerForKey(char: string, layoutId: string = 'qwerty'): FingerType {
  const lowerChar = char.toLowerCase();

  // Special case for space
  if (char === ' ') return 'thumb';

  // Get the layout
  const layout = getKeyboardLayout(layoutId);

  // Search through all rows
  for (const row of layout) {
    for (const keyData of row) {
      if (keyData.key === lowerChar || keyData.shiftKey === char) {
        return keyData.finger;
      }
    }
  }

  // Default to right index if not found
  return 'right-index';
}

// Get color for finger
export function getFingerColor(finger: FingerType): string {
  const colors: Record<FingerType, string> = {
    'left-pinky': '#fca5a5',      // red-300
    'left-ring': '#fdba74',       // orange-300
    'left-middle': '#fcd34d',     // yellow-300
    'left-index': '#86efac',      // green-300
    'right-index': '#86efac',     // green-300
    'right-middle': '#93c5fd',    // blue-300
    'right-ring': '#c4b5fd',      // violet-300
    'right-pinky': '#f9a8d4',     // pink-300
    'thumb': '#d1d5db',           // gray-300
  };

  return colors[finger] || '#d1d5db';
}

// Get hand for finger
export function getHandForFinger(finger: FingerType): 'left' | 'right' | 'both' {
  if (finger === 'thumb') return 'both';
  if (finger.startsWith('left')) return 'left';
  return 'right';
}

// Keyboard layout definitions
export interface KeyboardLayoutInfo {
  id: KeyboardLayout;
  name: string;
  language: string;
  description: string;
}

export const availableKeyboardLayouts: KeyboardLayoutInfo[] = [
  { id: 'qwerty', name: 'US QWERTY', language: 'en', description: 'Standard US English keyboard' },
  { id: 'qwerty-uk', name: 'UK QWERTY', language: 'en-GB', description: 'UK English keyboard' },
  { id: 'dvorak', name: 'US Dvorak', language: 'en', description: 'Dvorak Simplified Keyboard' },
  { id: 'colemak', name: 'US Colemak', language: 'en', description: 'Colemak keyboard layout' },
  { id: 'workman', name: 'US Workman', language: 'en', description: 'Workman keyboard layout' },
  { id: 'programmer', name: 'Programmer Dvorak', language: 'en', description: 'Programmer-optimized Dvorak' },
  { id: 'azerty', name: 'French AZERTY', language: 'fr', description: 'French keyboard layout' },
  { id: 'qwertz', name: 'German QWERTZ', language: 'de', description: 'German keyboard layout' },
  { id: 'spanish', name: 'Spanish (Spain)', language: 'es', description: 'Spanish keyboard layout' },
  { id: 'latin', name: 'Spanish (Latin America)', language: 'es-LA', description: 'Latin American Spanish' },
];

/**
 * Get keyboard layout by ID
 */
export function getKeyboardLayout(layoutId: string): KeyData[][] {
  switch (layoutId) {
    case 'dvorak':
      return dvorakLayout;
    case 'colemak':
      return colemakLayout;
    case 'azerty':
      return azertyLayout;
    case 'qwertz':
      return qwertzLayout;
    case 'qwerty-uk':
      return qwertyUKLayout;
    case 'workman':
      return workmanLayout;
    case 'programmer':
      return programmerDvorakLayout;
    case 'spanish':
      return spanishLayout;
    case 'latin':
      return latinLayout;
    default:
      return qwertyLayout;
  }
}
