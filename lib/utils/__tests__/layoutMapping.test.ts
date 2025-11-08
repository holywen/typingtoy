import {
  convertTextToLayout,
  convertKeysToLayout,
  getLayoutLetters,
  getLayoutNumbers,
  getLayoutSpecialChars,
} from '../layoutMapping';

describe('layoutMapping', () => {
  describe('convertTextToLayout', () => {
    it('should return original text for QWERTY layout', () => {
      const text = 'hello world';
      const result = convertTextToLayout(text, 'qwerty');
      expect(result).toBe('hello world');
    });

    it('should convert text from QWERTY to Dvorak', () => {
      const text = 'hello';
      const result = convertTextToLayout(text, 'dvorak');
      // In Dvorak, QWERTY 'h' -> 'd', 'e' -> '.', 'l' -> 'n', 'o' -> 'r'
      expect(result).toBe('d.nnr');
    });

    it('should preserve capitalization', () => {
      const text = 'Hello World';
      const result = convertTextToLayout(text, 'dvorak');
      // Should maintain uppercase for first letters
      expect(result.charAt(0)).toBe('D'); // H -> D
      expect(result.includes(' ')).toBe(true); // Space preserved
    });

    it('should preserve unmapped characters like spaces and punctuation', () => {
      const text = 'hello, world!';
      const result = convertTextToLayout(text, 'dvorak');
      expect(result).toContain(',');
      expect(result).toContain('!');
      expect(result).toContain(' ');
    });

    it('should convert text from QWERTY to Colemak', () => {
      const text = 'test';
      const result = convertTextToLayout(text, 'colemak');
      // Colemak has different mappings
      expect(result).toBeTruthy();
      expect(result.length).toBe(4);
    });

    it('should handle empty string', () => {
      const result = convertTextToLayout('', 'dvorak');
      expect(result).toBe('');
    });

    it('should handle special characters', () => {
      const text = '123 @#$';
      const result = convertTextToLayout(text, 'dvorak');
      expect(result).toContain('1');
      expect(result).toContain('2');
      expect(result).toContain('3');
      expect(result).toContain(' ');
    });

    it('should handle shift characters with direct mapping', () => {
      // Test the else-if branch for direct mapping (line 69-72)
      const text = '!@#';
      const result = convertTextToLayout(text, 'dvorak');
      expect(result).toBeTruthy();
      expect(result.length).toBe(3);
    });

    it('should map uppercase letters correctly', () => {
      const text = 'ABC';
      const result = convertTextToLayout(text, 'dvorak');
      // Verify all characters are uppercase in result
      expect(result).toBe(result.toUpperCase());
      expect(result.length).toBe(3);
    });
  });

  describe('convertKeysToLayout', () => {
    it('should return original keys for QWERTY', () => {
      const keys = ['a', 's', 'd', 'f'];
      const result = convertKeysToLayout(keys, 'qwerty');
      expect(result).toEqual(['a', 's', 'd', 'f']);
    });

    it('should convert keys from QWERTY to Dvorak', () => {
      const keys = ['a', 's', 'd', 'f'];
      const result = convertKeysToLayout(keys, 'dvorak');
      // Should convert each key to its Dvorak equivalent
      expect(result).toHaveLength(4);
      expect(result).not.toEqual(['a', 's', 'd', 'f']);
    });

    it('should preserve unmapped keys', () => {
      const keys = ['a', 'unmapped'];
      const result = convertKeysToLayout(keys, 'dvorak');
      // Unmapped keys should be kept as-is
      expect(result).toContain('unmapped');
    });

    it('should handle empty array', () => {
      const result = convertKeysToLayout([], 'dvorak');
      expect(result).toEqual([]);
    });
  });

  describe('getLayoutLetters', () => {
    it('should return letter keys for QWERTY', () => {
      const letters = getLayoutLetters('qwerty');
      expect(letters).toContain('a');
      expect(letters).toContain('z');
      expect(letters).toContain('q');
      expect(letters.length).toBeGreaterThan(20); // At least 26 letters
    });

    it('should return letter keys for Dvorak', () => {
      const letters = getLayoutLetters('dvorak');
      expect(letters.length).toBeGreaterThan(20);
      expect(letters.every(letter => letter.match(/[a-z]/i))).toBe(true);
    });

    it('should not include non-letter characters', () => {
      const letters = getLayoutLetters('qwerty');
      expect(letters.every(letter => letter.length === 1)).toBe(true);
      expect(letters.some(letter => letter.match(/[0-9]/))).toBe(false);
    });

    it('should return letters for Colemak', () => {
      const letters = getLayoutLetters('colemak');
      expect(letters.length).toBeGreaterThan(20);
    });
  });

  describe('getLayoutNumbers', () => {
    it('should return number keys for QWERTY', () => {
      const numbers = getLayoutNumbers('qwerty');
      expect(numbers).toContain('1');
      expect(numbers).toContain('9');
      expect(numbers).toContain('0');
    });

    it('should return number keys for Dvorak', () => {
      const numbers = getLayoutNumbers('dvorak');
      expect(numbers.length).toBeGreaterThan(0);
      expect(numbers.every(num => num.match(/[0-9]/))).toBe(true);
    });

    it('should handle layouts with numbers in primary or shift positions', () => {
      const numbers = getLayoutNumbers('qwerty');
      expect(numbers.length).toBeGreaterThanOrEqual(10);
    });

    it('should return numbers for AZERTY', () => {
      const numbers = getLayoutNumbers('azerty');
      // AZERTY has numbers on shift keys
      expect(numbers.length).toBeGreaterThan(0);
    });
  });

  describe('getLayoutSpecialChars', () => {
    it('should return special character keys for QWERTY', () => {
      const specialChars = getLayoutSpecialChars('qwerty');
      expect(specialChars.length).toBeGreaterThan(0);
      expect(specialChars).toContain(';');
      expect(specialChars).toContain('[');
      expect(specialChars).toContain(']');
    });

    it('should not include letters or numbers', () => {
      const specialChars = getLayoutSpecialChars('qwerty');
      expect(specialChars.every(char => !char.match(/[a-z0-9]/i))).toBe(true);
    });

    it('should not include spaces', () => {
      const specialChars = getLayoutSpecialChars('qwerty');
      expect(specialChars).not.toContain(' ');
    });

    it('should include shift characters', () => {
      const specialChars = getLayoutSpecialChars('qwerty');
      // Should include things like !, @, #, etc.
      expect(specialChars.some(char => ['!', '@', '#', '$', '%'].includes(char))).toBe(true);
    });

    it('should remove duplicates', () => {
      const specialChars = getLayoutSpecialChars('qwerty');
      const uniqueChars = [...new Set(specialChars)];
      expect(specialChars.length).toBe(uniqueChars.length);
    });

    it('should return special characters for Dvorak', () => {
      const specialChars = getLayoutSpecialChars('dvorak');
      expect(specialChars.length).toBeGreaterThan(0);
    });

    it('should return special characters for Colemak', () => {
      const specialChars = getLayoutSpecialChars('colemak');
      expect(specialChars.length).toBeGreaterThan(0);
    });
  });
});
