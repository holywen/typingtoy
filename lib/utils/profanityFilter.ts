// Simple profanity filter for chat messages

const PROFANITY_LIST = [
  // Common English profanity (partial list - expand as needed)
  // Note: Removed short words like 'hell', 'ass', 'damn' to avoid false positives (hello, glass, condemn)
  'fuck', 'shit', 'bitch',
  'asshole', 'bastard', 'crap', 'dick', 'piss',

  // Add more languages as needed
  // Chinese
  '操', '妈', '傻逼', '草泥马',

  // This is a basic list - consider using a library like 'bad-words' for production
];

const REPLACEMENT_CHAR = '*';

export class ProfanityFilter {
  /**
   * Check if text contains profanity
   */
  static containsProfanity(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    for (const word of PROFANITY_LIST) {
      // Check for exact word match (with word boundaries)
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(lowerText)) {
        return true;
      }
      
      // Check for variations with spaces or special characters (e.g., "f u c k")
      const spacedWord = word.split('').join('[\\s\\-\\_\\.]*');
      const spacedRegex = new RegExp(spacedWord, 'i');
      if (spacedRegex.test(lowerText)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Filter profanity from text by replacing with asterisks
   */
  static filter(text: string): string {
    let filtered = text;
    
    for (const word of PROFANITY_LIST) {
      // Replace exact matches
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filtered = filtered.replace(regex, REPLACEMENT_CHAR.repeat(word.length));
      
      // Replace spaced variations
      const spacedWord = word.split('').join('[\\s\\-\\_\\.]*');
      const spacedRegex = new RegExp(spacedWord, 'gi');
      filtered = filtered.replace(spacedRegex, (match) => REPLACEMENT_CHAR.repeat(match.length));
    }
    
    return filtered;
  }

  /**
   * Validate and filter text
   * Returns filtered text or null if text is too offensive
   */
  static validate(text: string, maxViolations: number = 2): { isValid: boolean; filtered: string; violations: number } {
    let violations = 0;
    const lowerText = text.toLowerCase();
    
    for (const word of PROFANITY_LIST) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        violations += matches.length;
      }
    }
    
    const isValid = violations <= maxViolations;
    const filtered = this.filter(text);
    
    return { isValid, filtered, violations };
  }

  /**
   * Check if username is appropriate
   */
  static isUsernameAppropriate(username: string): boolean {
    return !this.containsProfanity(username);
  }

  /**
   * Add word to filter list (runtime addition)
   */
  static addWord(word: string): void {
    if (!PROFANITY_LIST.includes(word.toLowerCase())) {
      PROFANITY_LIST.push(word.toLowerCase());
    }
  }

  /**
   * Get severity level of profanity (0-3)
   * 0 = clean, 1 = mild, 2 = moderate, 3 = severe
   */
  static getSeverity(text: string): number {
    const validation = this.validate(text, 10);
    
    if (validation.violations === 0) return 0;
    if (validation.violations <= 1) return 1;
    if (validation.violations <= 3) return 2;
    return 3;
  }
}

// Export convenience functions
export const containsProfanity = (text: string) => ProfanityFilter.containsProfanity(text);
export const filterProfanity = (text: string) => ProfanityFilter.filter(text);
export const validateText = (text: string, maxViolations?: number) => ProfanityFilter.validate(text, maxViolations);
