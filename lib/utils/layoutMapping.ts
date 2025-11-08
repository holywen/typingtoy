/**
 * Keyboard Layout Character Mapping Utility
 * Maps characters from QWERTY to other keyboard layouts based on physical key position
 */

import { getKeyboardLayout, type KeyData } from '@/lib/data/keyboardLayout';

/**
 * Create a position-based mapping between two keyboard layouts
 * Maps QWERTY characters to their equivalent positions in the target layout
 */
function createLayoutMapping(targetLayoutId: string): Map<string, string> {
  const qwertyLayout = getKeyboardLayout('qwerty');
  const targetLayout = getKeyboardLayout(targetLayoutId);
  const mapping = new Map<string, string>();

  // Iterate through each row and position
  for (let rowIndex = 0; rowIndex < qwertyLayout.length; rowIndex++) {
    const qwertyRow = qwertyLayout[rowIndex];
    const targetRow = targetLayout[rowIndex];

    for (let keyIndex = 0; keyIndex < qwertyRow.length; keyIndex++) {
      const qwertyKey = qwertyRow[keyIndex];
      const targetKey = targetRow[keyIndex];

      if (qwertyKey && targetKey) {
        // Map primary key (lowercase)
        mapping.set(qwertyKey.key, targetKey.key);

        // Map shift key if both exist
        if (qwertyKey.shiftKey && targetKey.shiftKey) {
          mapping.set(qwertyKey.shiftKey, targetKey.shiftKey);
        }
      }
    }
  }

  return mapping;
}

/**
 * Convert a string from QWERTY layout to target layout
 * Preserves spacing, capitalization context, and unmapped characters
 */
export function convertTextToLayout(text: string, targetLayoutId: string): string {
  // If target is QWERTY, return as-is
  if (targetLayoutId === 'qwerty') {
    return text;
  }

  const mapping = createLayoutMapping(targetLayoutId);
  let result = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const lowerChar = char.toLowerCase();
    const isUpperCase = char !== lowerChar;

    // Check if character should be mapped
    if (mapping.has(lowerChar)) {
      let mappedChar = mapping.get(lowerChar)!;

      // Preserve case
      if (isUpperCase) {
        mappedChar = mappedChar.toUpperCase();
      }

      result += mappedChar;
    } else if (mapping.has(char)) {
      // Direct mapping for special characters
      result += mapping.get(char)!;
    } else {
      // Keep unmapped characters (spaces, punctuation not in layouts, etc.)
      result += char;
    }
  }

  return result;
}

/**
 * Convert an array of focus keys from QWERTY to target layout
 */
export function convertKeysToLayout(keys: string[], targetLayoutId: string): string[] {
  if (targetLayoutId === 'qwerty') {
    return keys;
  }

  const mapping = createLayoutMapping(targetLayoutId);
  return keys.map(key => mapping.get(key) || key);
}

/**
 * Get all letter keys for a given layout (useful for random text generation)
 */
export function getLayoutLetters(layoutId: string): string[] {
  const layout = getKeyboardLayout(layoutId);
  const letters: string[] = [];

  for (const row of layout) {
    for (const keyData of row) {
      // Only include letter keys (a-z equivalent positions)
      if (keyData.key.length === 1 && keyData.key.match(/[a-z]/i)) {
        letters.push(keyData.key);
      }
    }
  }

  return letters;
}

/**
 * Get number keys for a given layout
 */
export function getLayoutNumbers(layoutId: string): string[] {
  const layout = getKeyboardLayout(layoutId);
  const numbers: string[] = [];

  // Numbers are always in the first row
  if (layout.length > 0) {
    for (const keyData of layout[0]) {
      // Check if primary key is a number or shift key is a number
      if (keyData.key.match(/[0-9]/)) {
        numbers.push(keyData.key);
      } else if (keyData.shiftKey?.match(/[0-9]/)) {
        numbers.push(keyData.shiftKey);
      }
    }
  }

  return numbers;
}

/**
 * Get special character keys for a given layout
 */
export function getLayoutSpecialChars(layoutId: string): string[] {
  const layout = getKeyboardLayout(layoutId);
  const specialChars: string[] = [];

  for (const row of layout) {
    for (const keyData of row) {
      // Include non-letter, non-number, non-space characters
      if (
        keyData.key !== ' ' &&
        !keyData.key.match(/[a-z0-9]/i)
      ) {
        specialChars.push(keyData.key);
      }
      if (
        keyData.shiftKey &&
        !keyData.shiftKey.match(/[a-z0-9]/i)
      ) {
        specialChars.push(keyData.shiftKey);
      }
    }
  }

  return [...new Set(specialChars)]; // Remove duplicates
}
