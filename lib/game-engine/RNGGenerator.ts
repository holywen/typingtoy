// Seeded Random Number Generator
// Uses a simple LCG (Linear Congruential Generator) for deterministic randomness

/**
 * Seeded random number generator
 * Ensures all players see the same random sequence
 */
export class RNGGenerator {
  private seed: number;
  private current: number;
  
  // LCG constants (from Numerical Recipes)
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = 2 ** 32;
  
  constructor(seed: number) {
    this.seed = seed;
    this.current = seed;
  }
  
  /**
   * Get the original seed
   */
  getSeed(): number {
    return this.seed;
  }
  
  /**
   * Reset to original seed
   */
  reset(): void {
    this.current = this.seed;
  }
  
  /**
   * Generate next random number in sequence [0, 1)
   */
  next(): number {
    this.current = (this.a * this.current + this.c) % this.m;
    return this.current / this.m;
  }
  
  /**
   * Generate random integer in range [min, max]
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  
  /**
   * Generate random float in range [min, max)
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
  
  /**
   * Generate random boolean
   */
  nextBoolean(): boolean {
    return this.next() < 0.5;
  }
  
  /**
   * Pick random element from array
   */
  choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    return array[this.nextInt(0, array.length - 1)];
  }
  
  /**
   * Shuffle array in place using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  /**
   * Generate random string of given length
   */
  randomString(length: number, charset: string = 'abcdefghijklmnopqrstuvwxyz'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[this.nextInt(0, charset.length - 1)];
    }
    return result;
  }
  
  /**
   * Sample n elements from array without replacement
   */
  sample<T>(array: T[], n: number): T[] {
    if (n > array.length) {
      throw new Error('Cannot sample more elements than array length');
    }
    
    const shuffled = this.shuffle(array);
    return shuffled.slice(0, n);
  }
  
  /**
   * Generate random position in 2D space
   */
  randomPosition(width: number, height: number): { x: number; y: number } {
    return {
      x: this.nextFloat(0, width),
      y: this.nextFloat(0, height),
    };
  }
  
  /**
   * Create a new RNG with a random seed
   */
  static random(): RNGGenerator {
    return new RNGGenerator(Date.now() + Math.random() * 1000000);
  }
  
  /**
   * Create RNG from string seed (hash it to number)
   */
  static fromString(str: string): RNGGenerator {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return new RNGGenerator(Math.abs(hash));
  }
}

/**
 * Create a seeded RNG for a room
 */
export function createRoomRNG(roomId: string, gameType: string): RNGGenerator {
  const seedString = `${roomId}-${gameType}-${Date.now()}`;
  return RNGGenerator.fromString(seedString);
}

/**
 * Generate a deterministic sequence of items
 */
export function generateSequence<T>(
  rng: RNGGenerator,
  items: T[],
  length: number,
  allowRepeats: boolean = true
): T[] {
  const sequence: T[] = [];
  
  if (!allowRepeats && length > items.length) {
    throw new Error('Cannot generate sequence longer than items without repeats');
  }
  
  if (allowRepeats) {
    for (let i = 0; i < length; i++) {
      sequence.push(rng.choice(items));
    }
  } else {
    // Sample without replacement
    const shuffled = rng.shuffle(items);
    return shuffled.slice(0, length);
  }
  
  return sequence;
}

/**
 * Test RNG determinism
 */
export function testRNGDeterminism(): boolean {
  const seed = 12345;
  const rng1 = new RNGGenerator(seed);
  const rng2 = new RNGGenerator(seed);
  
  // Both should produce same sequence
  for (let i = 0; i < 1000; i++) {
    if (rng1.next() !== rng2.next()) {
      return false;
    }
  }
  
  return true;
}
