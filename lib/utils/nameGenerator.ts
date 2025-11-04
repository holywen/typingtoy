// Guest username generator

const ADJECTIVES = [
  'Swift', 'Mighty', 'Quick', 'Fast', 'Lightning', 'Thunder',
  'Blazing', 'Turbo', 'Sonic', 'Hyper', 'Ultra', 'Mega',
  'Super', 'Epic', 'Legendary', 'Cosmic', 'Stellar', 'Quantum',
  'Ninja', 'Dragon', 'Phoenix', 'Shadow', 'Storm', 'Frost',
  'Fire', 'Ice', 'Electric', 'Golden', 'Silver', 'Diamond',
  'Crystal', 'Neon', 'Cyber', 'Digital', 'Pixel', 'Binary',
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Prime',
  'Royal', 'Noble', 'Elite', 'Master', 'Champion', 'Hero',
  'Brave', 'Bold', 'Wild', 'Fierce', 'Savage', 'Rogue',
  'Stealth', 'Silent', 'Mystic', 'Arcane', 'Magic', 'Cosmic',
  'Astral', 'Celestial', 'Divine', 'Sacred', 'Holy', 'Blessed',
  'Dark', 'Void', 'Chaos', 'Crimson', 'Azure', 'Emerald',
  'Jade', 'Ruby', 'Sapphire', 'Amber', 'Violet', 'Scarlet',
];

const NOUNS = [
  'Racer', 'Runner', 'Speedster', 'Dasher', 'Sprinter', 'Bolt',
  'Warrior', 'Fighter', 'Striker', 'Slayer', 'Hunter', 'Ranger',
  'Mage', 'Wizard', 'Sorcerer', 'Sage', 'Scholar', 'Scribe',
  'Knight', 'Paladin', 'Guardian', 'Defender', 'Protector', 'Sentinel',
  'Rogue', 'Assassin', 'Ninja', 'Shadow', 'Phantom', 'Ghost',
  'Dragon', 'Phoenix', 'Tiger', 'Lion', 'Wolf', 'Bear',
  'Eagle', 'Hawk', 'Falcon', 'Raven', 'Crow', 'Owl',
  'Viper', 'Cobra', 'Python', 'Serpent', 'Shark', 'Whale',
  'Titan', 'Giant', 'Colossus', 'Behemoth', 'Leviathan', 'Kraken',
  'Star', 'Comet', 'Meteor', 'Nova', 'Nebula', 'Galaxy',
  'Blaze', 'Flame', 'Inferno', 'Ember', 'Spark', 'Flash',
  'Storm', 'Thunder', 'Lightning', 'Tempest', 'Hurricane', 'Cyclone',
  'Blade', 'Sword', 'Arrow', 'Spear', 'Axe', 'Hammer',
  'King', 'Queen', 'Prince', 'Princess', 'Lord', 'Lady',
  'Master', 'Champion', 'Hero', 'Legend', 'Myth', 'Icon',
  'Pro', 'Ace', 'Expert', 'Genius', 'Prodigy', 'Virtuoso',
];

export class NameGenerator {
  /**
   * Generate a random guest username
   * Format: AdjectiveNoun1234
   */
  static generateGuestName(): string {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const number = Math.floor(Math.random() * 10000);
    
    return `${adjective}${noun}${number}`;
  }

  /**
   * Generate multiple unique guest names
   */
  static generateUniqueNames(count: number): string[] {
    const names = new Set<string>();
    
    while (names.size < count) {
      names.add(this.generateGuestName());
    }
    
    return Array.from(names);
  }

  /**
   * Validate username format and length
   */
  static isValidUsername(username: string): boolean {
    // 3-20 characters, alphanumeric and underscore only
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(username);
  }

  /**
   * Sanitize username by removing invalid characters
   */
  static sanitizeUsername(username: string): string {
    // Remove invalid characters
    let sanitized = username.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Trim to max length
    sanitized = sanitized.substring(0, 20);
    
    // Ensure minimum length
    if (sanitized.length < 3) {
      sanitized = this.generateGuestName();
    }
    
    return sanitized;
  }

  /**
   * Generate a room name
   */
  static generateRoomName(): string {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    
    return `${adjective} ${noun}'s Room`;
  }

  /**
   * Get a random adjective
   */
  static getRandomAdjective(): string {
    return ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  }

  /**
   * Get a random noun
   */
  static getRandomNoun(): string {
    return NOUNS[Math.floor(Math.random() * NOUNS.length)];
  }
}

// Export convenience functions
export const generateGuestName = () => NameGenerator.generateGuestName();
export const isValidUsername = (username: string) => NameGenerator.isValidUsername(username);
export const sanitizeUsername = (username: string) => NameGenerator.sanitizeUsername(username);
export const generateRoomName = () => NameGenerator.generateRoomName();
