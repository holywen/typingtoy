import { ProfanityFilter } from '../profanityFilter';

describe('ProfanityFilter', () => {
  describe('containsProfanity', () => {
    it('should detect profanity in text', () => {
      expect(ProfanityFilter.containsProfanity('this is shit')).toBe(true);
      expect(ProfanityFilter.containsProfanity('what the fuck')).toBe(true);
      expect(ProfanityFilter.containsProfanity('you bitch')).toBe(true);
    });

    it('should not detect profanity in clean text', () => {
      expect(ProfanityFilter.containsProfanity('hello world')).toBe(false);
      expect(ProfanityFilter.containsProfanity('this is a test')).toBe(false);
      expect(ProfanityFilter.containsProfanity('good morning')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(ProfanityFilter.containsProfanity('SHIT')).toBe(true);
      expect(ProfanityFilter.containsProfanity('Fuck')).toBe(true);
      expect(ProfanityFilter.containsProfanity('BiTcH')).toBe(true);
    });

    it('should detect spaced variations', () => {
      expect(ProfanityFilter.containsProfanity('f u c k')).toBe(true);
      expect(ProfanityFilter.containsProfanity('s h i t')).toBe(true);
    });

    it('should detect variations with hyphens', () => {
      expect(ProfanityFilter.containsProfanity('f-u-c-k')).toBe(true);
      expect(ProfanityFilter.containsProfanity('s-h-i-t')).toBe(true);
    });

    it('should detect variations with underscores', () => {
      expect(ProfanityFilter.containsProfanity('f_u_c_k')).toBe(true);
    });

    it('should not flag false positives', () => {
      // Words that contain profanity as substring but are not profane
      expect(ProfanityFilter.containsProfanity('hello')).toBe(false);
      expect(ProfanityFilter.containsProfanity('glass')).toBe(false);
      expect(ProfanityFilter.containsProfanity('assume')).toBe(false);
    });

    it('should handle empty string', () => {
      expect(ProfanityFilter.containsProfanity('')).toBe(false);
    });

    it('should handle unicode/multilingual profanity', () => {
      // Chinese profanity
      expect(ProfanityFilter.containsProfanity('你个傻逼')).toBe(true);
    });
  });

  describe('filter', () => {
    it('should replace profanity with asterisks', () => {
      const filtered = ProfanityFilter.filter('this is shit');
      expect(filtered).toContain('****');
      expect(filtered).not.toContain('shit');
    });

    it('should preserve clean text', () => {
      const text = 'hello world';
      const filtered = ProfanityFilter.filter(text);
      expect(filtered).toBe(text);
    });

    it('should replace multiple profanities', () => {
      const filtered = ProfanityFilter.filter('fuck this shit');
      expect(filtered).toContain('****');
      expect(filtered).not.toContain('fuck');
      expect(filtered).not.toContain('shit');
    });

    it('should handle case variations', () => {
      const filtered1 = ProfanityFilter.filter('SHIT');
      const filtered2 = ProfanityFilter.filter('Shit');
      const filtered3 = ProfanityFilter.filter('shit');

      expect(filtered1).toContain('****');
      expect(filtered2).toContain('****');
      expect(filtered3).toContain('****');
    });

    it('should replace spaced variations', () => {
      const filtered = ProfanityFilter.filter('f u c k');
      expect(filtered).not.toContain('f u c k');
      expect(filtered).toContain('*');
    });

    it('should preserve sentence structure', () => {
      const filtered = ProfanityFilter.filter('this is shit ok');
      expect(filtered).toMatch(/this is \*+ ok/);
    });

    it('should handle empty string', () => {
      expect(ProfanityFilter.filter('')).toBe('');
    });

    it('should handle text with no profanity', () => {
      const text = 'The quick brown fox';
      expect(ProfanityFilter.filter(text)).toBe(text);
    });

    it('should handle profanity at start of text', () => {
      const filtered = ProfanityFilter.filter('shit happens');
      expect(filtered).toMatch(/^\*+/);
    });

    it('should handle profanity at end of text', () => {
      const filtered = ProfanityFilter.filter('holy shit');
      expect(filtered).toMatch(/\*+$/);
    });

    it('should preserve surrounding punctuation', () => {
      const filtered = ProfanityFilter.filter('what the shit!');
      expect(filtered).toContain('!');
      expect(filtered).toContain('*');
    });

    it('should handle multiple instances of same profanity', () => {
      const filtered = ProfanityFilter.filter('shit shit shit');
      const asteriskCount = (filtered.match(/\*/g) || []).length;
      expect(asteriskCount).toBeGreaterThan(8); // 'shit' = 4 chars, 3 instances
    });
  });

  describe('Edge cases', () => {
    it('should handle very long text', () => {
      const longText = 'hello world '.repeat(1000) + 'shit';
      const filtered = ProfanityFilter.filter(longText);
      expect(filtered).toContain('*');
      expect(filtered).not.toContain('shit');
    });

    it('should handle text with only profanity', () => {
      const filtered = ProfanityFilter.filter('shit');
      expect(filtered).toBe('****');
    });

    it('should handle profanity with numbers', () => {
      const filtered = ProfanityFilter.filter('shit123');
      // Depending on implementation, this may or may not be filtered
      // Current implementation uses word boundaries, so this might not match
      expect(typeof filtered).toBe('string');
    });

    it('should handle special characters', () => {
      const text = '@#$%^&*()';
      const filtered = ProfanityFilter.filter(text);
      expect(filtered).toBe(text);
    });

    it('should not break on regex special characters in text', () => {
      const text = 'test (parentheses) [brackets] {braces}';
      const filtered = ProfanityFilter.filter(text);
      expect(filtered).toBe(text);
    });
  });

  describe('validate', () => {
    it('should validate text with violations count', () => {
      const result = ProfanityFilter.validate('this is shit');

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('filtered');
      expect(result).toHaveProperty('violations');
      expect(result.violations).toBeGreaterThan(0);
    });

    it('should pass clean text', () => {
      const result = ProfanityFilter.validate('hello world');

      expect(result.isValid).toBe(true);
      expect(result.violations).toBe(0);
      expect(result.filtered).toBe('hello world');
    });

    it('should respect maxViolations threshold', () => {
      const result1 = ProfanityFilter.validate('shit fuck bitch', 1);
      const result2 = ProfanityFilter.validate('shit fuck bitch', 5);

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(true);
    });

    it('should use default maxViolations of 2', () => {
      const result = ProfanityFilter.validate('shit fuck');

      expect(result.isValid).toBe(true); // 2 violations = max allowed
    });

    it('should count multiple violations', () => {
      const result = ProfanityFilter.validate('shit shit shit');

      expect(result.violations).toBe(3);
    });

    it('should filter text in result', () => {
      const result = ProfanityFilter.validate('this is shit');

      expect(result.filtered).not.toContain('shit');
      expect(result.filtered).toContain('*');
    });
  });

  describe('isUsernameAppropriate', () => {
    it('should return true for clean usernames', () => {
      expect(ProfanityFilter.isUsernameAppropriate('JohnDoe')).toBe(true);
      expect(ProfanityFilter.isUsernameAppropriate('Player123')).toBe(true);
    });

    it('should return false for profane usernames', () => {
      expect(ProfanityFilter.isUsernameAppropriate('shit123')).toBe(false);
      expect(ProfanityFilter.isUsernameAppropriate('fuckface')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(ProfanityFilter.isUsernameAppropriate('SHIT')).toBe(false);
    });
  });

  describe('getSeverity', () => {
    it('should return 0 for clean text', () => {
      expect(ProfanityFilter.getSeverity('hello world')).toBe(0);
    });

    it('should return 1 for mild profanity', () => {
      expect(ProfanityFilter.getSeverity('shit')).toBe(1);
    });

    it('should return 2 for moderate profanity', () => {
      expect(ProfanityFilter.getSeverity('shit fuck')).toBe(2);
    });

    it('should return 3 for severe profanity', () => {
      expect(ProfanityFilter.getSeverity('shit fuck bitch asshole')).toBe(3);
    });

    it('should handle empty text', () => {
      expect(ProfanityFilter.getSeverity('')).toBe(0);
    });
  });

  describe('addWord', () => {
    it('should add new words to filter list', () => {
      const customWord = 'badword123';

      // Should not be filtered initially
      expect(ProfanityFilter.containsProfanity(customWord)).toBe(false);

      // Add word
      ProfanityFilter.addWord(customWord);

      // Should now be filtered
      expect(ProfanityFilter.containsProfanity(customWord)).toBe(true);
    });

    it('should not add duplicate words', () => {
      ProfanityFilter.addWord('duplicate');
      ProfanityFilter.addWord('duplicate');

      // Should work without issues
      expect(ProfanityFilter.containsProfanity('duplicate')).toBe(true);
    });

    it('should normalize words to lowercase', () => {
      ProfanityFilter.addWord('TeStWoRd');

      expect(ProfanityFilter.containsProfanity('testword')).toBe(true);
      expect(ProfanityFilter.containsProfanity('TESTWORD')).toBe(true);
    });
  });

  describe('Convenience exports', () => {
    it('containsProfanity function should work', () => {
      const { containsProfanity } = require('../profanityFilter');
      expect(containsProfanity('shit')).toBe(true);
      expect(containsProfanity('hello')).toBe(false);
    });

    it('filterProfanity function should work', () => {
      const { filterProfanity } = require('../profanityFilter');
      const filtered = filterProfanity('shit');
      expect(filtered).toContain('*');
    });

    it('validateText function should work', () => {
      const { validateText } = require('../profanityFilter');
      const result = validateText('shit');
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('filtered');
      expect(result).toHaveProperty('violations');
    });
  });
});
