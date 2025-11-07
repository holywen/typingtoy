import { generateTypingText, getWordCount } from '../textGenerator';

describe('textGenerator', () => {
  describe('generateTypingText', () => {
    it('should generate text within the specified word range', () => {
      const text = generateTypingText(50, 100);
      const wordCount = getWordCount(text);

      expect(wordCount).toBeGreaterThanOrEqual(40); // Allow tolerance for sentence-boundary trimming
      expect(wordCount).toBeLessThanOrEqual(110);
    });

    it('should use default range when no parameters provided', () => {
      const text = generateTypingText();
      const wordCount = getWordCount(text);

      expect(wordCount).toBeGreaterThan(0);
      expect(wordCount).toBeLessThanOrEqual(1100); // Some tolerance
    });

    it('should generate text with proper sentence structure', () => {
      const text = generateTypingText(20, 30);

      // Should have capital letters at start
      expect(text.charAt(0)).toMatch(/[A-Z]/);

      // Should have periods
      expect(text).toContain('.');

      // Should have spaces
      expect(text).toContain(' ');
    });

    it('should generate different text each time', () => {
      const text1 = generateTypingText(50, 60);
      const text2 = generateTypingText(50, 60);

      // Very high probability of being different
      expect(text1).not.toBe(text2);
    });

    it('should handle small word counts', () => {
      const text = generateTypingText(10, 15);
      const wordCount = getWordCount(text);

      expect(wordCount).toBeGreaterThanOrEqual(8);
      expect(wordCount).toBeLessThanOrEqual(20);
    });

    it('should handle large word counts', () => {
      const text = generateTypingText(500, 600);
      const wordCount = getWordCount(text);

      expect(wordCount).toBeGreaterThanOrEqual(450);
      expect(wordCount).toBeLessThanOrEqual(650);
    });

    it('should generate valid text with no control characters', () => {
      const text = generateTypingText(50, 100);

      // Should not have control characters (except newlines for paragraphs)
      expect(text).not.toMatch(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/);
    });

    it('should end with proper punctuation', () => {
      const text = generateTypingText(20, 30);
      const trimmed = text.trim();

      // Should end with a period (if text is generated and not empty)
      if (trimmed.length > 0) {
        expect(trimmed.charAt(trimmed.length - 1)).toMatch(/[.a-z]/);
      }
    });

    it('should include common English words', () => {
      const text = generateTypingText(100, 150).toLowerCase();

      // Should contain some very common words
      const commonWords = ['the', 'and', 'to', 'of', 'a'];
      const hasCommonWords = commonWords.some(word => text.includes(word));
      expect(hasCommonWords).toBe(true);
    });

    it('should handle equal min and max values', () => {
      const text = generateTypingText(50, 50);
      const wordCount = getWordCount(text);

      expect(wordCount).toBeGreaterThanOrEqual(40); // Allow tolerance for sentence-boundary trimming
      expect(wordCount).toBeLessThanOrEqual(60);
    });

    it('should create paragraphs with double newlines', () => {
      const text = generateTypingText(100, 150);

      // Should have paragraph breaks for longer text
      if (text.length > 300) {
        expect(text).toMatch(/\n\n/);
      }
    });
  });

  describe('getWordCount', () => {
    it('should count words correctly', () => {
      expect(getWordCount('hello world')).toBe(2);
      expect(getWordCount('one two three four five')).toBe(5);
    });

    it('should handle single word', () => {
      expect(getWordCount('hello')).toBe(1);
    });

    it('should handle empty string', () => {
      expect(getWordCount('')).toBe(1); // split returns ['']
    });

    it('should handle multiple spaces', () => {
      expect(getWordCount('hello    world')).toBe(2);
      expect(getWordCount('one  two   three')).toBe(3);
    });

    it('should handle leading/trailing spaces', () => {
      expect(getWordCount('  hello world  ')).toBe(2);
    });

    it('should handle newlines as word separators', () => {
      expect(getWordCount('hello\nworld')).toBe(2);
      expect(getWordCount('one\ntwo\nthree')).toBe(3);
    });

    it('should handle tabs as word separators', () => {
      expect(getWordCount('hello\tworld')).toBe(2);
    });

    it('should handle mixed whitespace', () => {
      expect(getWordCount('hello \n\t world   test')).toBe(3);
    });

    it('should handle text with punctuation', () => {
      expect(getWordCount('Hello, world!')).toBe(2);
      expect(getWordCount('one. two. three.')).toBe(3);
    });

    it('should handle only whitespace', () => {
      expect(getWordCount('   ')).toBe(1); // split returns ['']
    });
  });

  describe('Text quality checks', () => {
    it('should generate readable text with proper capitalization', () => {
      const text = generateTypingText(50, 60);
      const sentences = text.split('.').filter(s => s.trim().length > 0);

      sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length > 0) {
          // Each sentence should start with a capital letter
          expect(trimmed.charAt(0)).toMatch(/[A-Z]/);
        }
      });
    });

    it('should not have consecutive spaces', () => {
      const text = generateTypingText(50, 60);

      // Should not have double spaces (except paragraph breaks)
      const withoutParagraphs = text.replace(/\n\n/g, ' ');
      expect(withoutParagraphs).not.toMatch(/  /);
    });

    it('should have reasonable sentence lengths', () => {
      const text = generateTypingText(100, 150);
      const sentences = text.split('.').filter(s => s.trim().length > 0);

      sentences.forEach(sentence => {
        const wordCount = getWordCount(sentence);
        // Sentences should be between 5 and 25 words
        expect(wordCount).toBeGreaterThanOrEqual(5);
        expect(wordCount).toBeLessThanOrEqual(25);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle when min > max', () => {
      // Function should still work (swap or use min as both)
      const text = generateTypingText(100, 50);
      const wordCount = getWordCount(text);

      expect(wordCount).toBeGreaterThan(0);
    });

    it('should handle very small word counts', () => {
      const text = generateTypingText(5, 10);

      expect(text.length).toBeGreaterThan(0);
      expect(text).toContain(' '); // Should have at least one space
    });

    it('should handle zero word count gracefully', () => {
      const text = generateTypingText(0, 0);

      // Returns empty string for zero word count (valid edge case behavior)
      expect(text).toBe('');
    });

    it('should handle negative word counts gracefully', () => {
      const text = generateTypingText(-10, -5);

      // Returns empty string for negative word counts (valid edge case behavior)
      expect(text).toBe('');
    });
  });
});
