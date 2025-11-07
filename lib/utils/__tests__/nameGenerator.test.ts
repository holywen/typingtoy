import {
  NameGenerator,
  generateGuestName,
  isValidUsername,
  sanitizeUsername,
  generateRoomName,
} from '../nameGenerator';

describe('NameGenerator', () => {
  describe('generateGuestName', () => {
    it('should generate a name in the correct format', () => {
      const name = NameGenerator.generateGuestName();

      // Should match pattern: AdjectiveNoun1234
      expect(name).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/);
    });

    it('should generate a number between 0 and 9999', () => {
      const name = NameGenerator.generateGuestName();
      const numberPart = name.match(/\d+$/)?.[0];

      expect(numberPart).toBeDefined();
      if (numberPart) {
        const num = parseInt(numberPart, 10);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThan(10000);
      }
    });

    it('should generate different names', () => {
      const names = new Set();
      for (let i = 0; i < 20; i++) {
        names.add(NameGenerator.generateGuestName());
      }

      // Should have some variety (very high probability)
      expect(names.size).toBeGreaterThan(1);
    });

    it('should not contain spaces', () => {
      const name = NameGenerator.generateGuestName();
      expect(name).not.toContain(' ');
    });

    it('should start with a capital letter', () => {
      const name = NameGenerator.generateGuestName();
      expect(name.charAt(0)).toMatch(/[A-Z]/);
    });

    it('convenience function should work the same', () => {
      const name = generateGuestName();
      expect(name).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/);
    });
  });

  describe('generateUniqueNames', () => {
    it('should generate the requested number of unique names', () => {
      const names = NameGenerator.generateUniqueNames(10);

      expect(names).toHaveLength(10);
      expect(new Set(names).size).toBe(10); // All unique
    });

    it('should generate 1 name when count is 1', () => {
      const names = NameGenerator.generateUniqueNames(1);

      expect(names).toHaveLength(1);
      expect(names[0]).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/);
    });

    it('should handle generating many names', () => {
      const names = NameGenerator.generateUniqueNames(50);

      expect(names).toHaveLength(50);
      expect(new Set(names).size).toBe(50);
    });

    it('should return an array', () => {
      const names = NameGenerator.generateUniqueNames(5);

      expect(Array.isArray(names)).toBe(true);
    });

    it('all names should be valid format', () => {
      const names = NameGenerator.generateUniqueNames(10);

      names.forEach(name => {
        expect(name).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/);
      });
    });
  });

  describe('isValidUsername', () => {
    it('should validate correct usernames', () => {
      expect(NameGenerator.isValidUsername('John123')).toBe(true);
      expect(NameGenerator.isValidUsername('user_name')).toBe(true);
      expect(NameGenerator.isValidUsername('Test')).toBe(true);
      expect(NameGenerator.isValidUsername('a1b2c3')).toBe(true);
    });

    it('should reject usernames that are too short', () => {
      expect(NameGenerator.isValidUsername('ab')).toBe(false);
      expect(NameGenerator.isValidUsername('a')).toBe(false);
      expect(NameGenerator.isValidUsername('')).toBe(false);
    });

    it('should reject usernames that are too long', () => {
      expect(NameGenerator.isValidUsername('a'.repeat(21))).toBe(false);
      expect(NameGenerator.isValidUsername('verylongusernamethatexceedslimit')).toBe(false);
    });

    it('should reject usernames with invalid characters', () => {
      expect(NameGenerator.isValidUsername('user name')).toBe(false); // space
      expect(NameGenerator.isValidUsername('user-name')).toBe(false); // hyphen
      expect(NameGenerator.isValidUsername('user.name')).toBe(false); // dot
      expect(NameGenerator.isValidUsername('user@name')).toBe(false); // @
      expect(NameGenerator.isValidUsername('user#name')).toBe(false); // #
    });

    it('should accept underscores', () => {
      expect(NameGenerator.isValidUsername('user_name')).toBe(true);
      expect(NameGenerator.isValidUsername('_username_')).toBe(true);
    });

    it('should accept numbers', () => {
      expect(NameGenerator.isValidUsername('user123')).toBe(true);
      expect(NameGenerator.isValidUsername('123user')).toBe(true);
      expect(NameGenerator.isValidUsername('123')).toBe(true);
    });

    it('should be case-insensitive for validation', () => {
      expect(NameGenerator.isValidUsername('User')).toBe(true);
      expect(NameGenerator.isValidUsername('USER')).toBe(true);
      expect(NameGenerator.isValidUsername('uSeR')).toBe(true);
    });

    it('convenience function should work the same', () => {
      expect(isValidUsername('John123')).toBe(true);
      expect(isValidUsername('ab')).toBe(false);
    });
  });

  describe('sanitizeUsername', () => {
    it('should remove invalid characters', () => {
      expect(NameGenerator.sanitizeUsername('user name')).toBe('username');
      expect(NameGenerator.sanitizeUsername('user-name')).toBe('username');
      expect(NameGenerator.sanitizeUsername('user@name')).toBe('username');
      expect(NameGenerator.sanitizeUsername('user#123!')).toBe('user123');
    });

    it('should trim to max length', () => {
      const longName = 'a'.repeat(30);
      const sanitized = NameGenerator.sanitizeUsername(longName);

      expect(sanitized.length).toBeLessThanOrEqual(20);
    });

    it('should generate a new name if result is too short', () => {
      const sanitized = NameGenerator.sanitizeUsername('ab');

      expect(sanitized.length).toBeGreaterThanOrEqual(3);
      expect(sanitized).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/);
    });

    it('should generate a new name for empty string', () => {
      const sanitized = NameGenerator.sanitizeUsername('');

      expect(sanitized.length).toBeGreaterThanOrEqual(3);
      expect(sanitized).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/);
    });

    it('should generate a new name for only special characters', () => {
      const sanitized = NameGenerator.sanitizeUsername('!@#$%');

      expect(sanitized.length).toBeGreaterThanOrEqual(3);
      expect(sanitized).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/);
    });

    it('should keep valid characters', () => {
      expect(NameGenerator.sanitizeUsername('user_123')).toBe('user_123');
      expect(NameGenerator.sanitizeUsername('User123')).toBe('User123');
    });

    it('should handle unicode characters', () => {
      const sanitized = NameGenerator.sanitizeUsername('user名前');

      expect(sanitized).toMatch(/^[a-zA-Z0-9_]+$/);
    });

    it('convenience function should work the same', () => {
      expect(sanitizeUsername('user name')).toBe('username');
      expect(sanitizeUsername('ab')).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/);
    });
  });

  describe('generateRoomName', () => {
    it('should generate a room name with correct format', () => {
      const roomName = NameGenerator.generateRoomName();

      // Should match pattern: "Adjective Noun's Room"
      expect(roomName).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+'s Room$/);
    });

    it('should contain "s Room" suffix', () => {
      const roomName = NameGenerator.generateRoomName();

      expect(roomName).toContain("'s Room");
    });

    it('should start with a capital letter', () => {
      const roomName = NameGenerator.generateRoomName();

      expect(roomName.charAt(0)).toMatch(/[A-Z]/);
    });

    it('should generate different room names', () => {
      const names = new Set();
      for (let i = 0; i < 10; i++) {
        names.add(NameGenerator.generateRoomName());
      }

      // Should have some variety
      expect(names.size).toBeGreaterThan(1);
    });

    it('convenience function should work the same', () => {
      const roomName = generateRoomName();
      expect(roomName).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+'s Room$/);
    });
  });

  describe('getRandomAdjective', () => {
    it('should return a non-empty string', () => {
      const adjective = NameGenerator.getRandomAdjective();

      expect(typeof adjective).toBe('string');
      expect(adjective.length).toBeGreaterThan(0);
    });

    it('should return a capitalized word', () => {
      const adjective = NameGenerator.getRandomAdjective();

      expect(adjective.charAt(0)).toMatch(/[A-Z]/);
    });

    it('should return different adjectives', () => {
      const adjectives = new Set();
      for (let i = 0; i < 20; i++) {
        adjectives.add(NameGenerator.getRandomAdjective());
      }

      // Should have variety
      expect(adjectives.size).toBeGreaterThan(1);
    });
  });

  describe('getRandomNoun', () => {
    it('should return a non-empty string', () => {
      const noun = NameGenerator.getRandomNoun();

      expect(typeof noun).toBe('string');
      expect(noun.length).toBeGreaterThan(0);
    });

    it('should return a capitalized word', () => {
      const noun = NameGenerator.getRandomNoun();

      expect(noun.charAt(0)).toMatch(/[A-Z]/);
    });

    it('should return different nouns', () => {
      const nouns = new Set();
      for (let i = 0; i < 20; i++) {
        nouns.add(NameGenerator.getRandomNoun());
      }

      // Should have variety
      expect(nouns.size).toBeGreaterThan(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle generateUniqueNames with 0 count', () => {
      const names = NameGenerator.generateUniqueNames(0);

      expect(names).toHaveLength(0);
      expect(Array.isArray(names)).toBe(true);
    });

    it('should handle very long input to sanitize', () => {
      const veryLong = 'a'.repeat(1000);
      const sanitized = NameGenerator.sanitizeUsername(veryLong);

      expect(sanitized.length).toBeLessThanOrEqual(20);
    });

    it('should handle whitespace-only username', () => {
      const sanitized = NameGenerator.sanitizeUsername('   ');

      expect(sanitized.length).toBeGreaterThanOrEqual(3);
      expect(sanitized).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d+$/);
    });
  });
});
