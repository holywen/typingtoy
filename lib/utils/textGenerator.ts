/**
 * Text Generator for Typing Speed Tests
 * Generates random, copyright-free text passages for practice
 */

// Common words for generating natural-sounding text
const commonWords = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did', 'having',
  'may', 'should', 'could', 'would', 'might', 'must', 'shall', 'can', 'will', 'need',
];

// Topic-specific word sets for variety
const techWords = [
  'computer', 'program', 'software', 'data', 'system', 'code', 'developer',
  'application', 'website', 'internet', 'digital', 'technology', 'network',
  'server', 'database', 'interface', 'algorithm', 'function', 'variable',
];

const natureWords = [
  'tree', 'forest', 'mountain', 'river', 'ocean', 'sky', 'sun', 'moon',
  'star', 'cloud', 'wind', 'rain', 'flower', 'plant', 'animal', 'bird',
  'fish', 'earth', 'nature', 'garden', 'valley', 'hill', 'lake', 'season',
];

const dailyWords = [
  'morning', 'evening', 'night', 'today', 'yesterday', 'tomorrow', 'week',
  'month', 'home', 'family', 'friend', 'person', 'thing', 'place', 'life',
  'world', 'hand', 'part', 'child', 'eye', 'woman', 'man', 'room', 'house',
];

const actionWords = [
  'walk', 'run', 'talk', 'write', 'read', 'speak', 'listen', 'watch',
  'learn', 'teach', 'understand', 'remember', 'forget', 'start', 'stop',
  'continue', 'begin', 'end', 'create', 'build', 'make', 'develop', 'grow',
];

// Sentence starters for variety
const sentenceStarters = [
  'The', 'A', 'In', 'When', 'While', 'During', 'After', 'Before',
  'Many', 'Some', 'Most', 'Every', 'Each', 'This', 'That', 'These',
  'Those', 'People', 'Everyone', 'Someone', 'Nobody', 'Everybody',
];

// Connecting words for smoother text
const connectors = [
  'and', 'but', 'or', 'so', 'because', 'although', 'however', 'therefore',
  'moreover', 'furthermore', 'meanwhile', 'nevertheless', 'thus', 'hence',
];

/**
 * Generate a random sentence with natural word flow
 */
function generateSentence(wordPool: string[]): string {
  const length = Math.floor(Math.random() * 10) + 8; // 8-17 words
  const starter = sentenceStarters[Math.floor(Math.random() * sentenceStarters.length)];

  const words = [starter.toLowerCase()];

  for (let i = 0; i < length - 1; i++) {
    const word = wordPool[Math.floor(Math.random() * wordPool.length)];
    words.push(word);

    // Occasionally add a connector
    if (i > 3 && Math.random() > 0.85) {
      words.push(connectors[Math.floor(Math.random() * connectors.length)]);
    }
  }

  // Capitalize first letter
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);

  return words.join(' ') + '.';
}

/**
 * Generate a paragraph with multiple sentences
 */
function generateParagraph(wordPool: string[], sentenceCount?: number): string {
  const count = sentenceCount || (Math.floor(Math.random() * 3) + 3); // 3-5 sentences
  const sentences = [];

  for (let i = 0; i < count; i++) {
    sentences.push(generateSentence(wordPool));
  }

  return sentences.join(' ');
}

/**
 * Mix different word sets for variety
 */
function createWordPool(): string[] {
  const pools = [techWords, natureWords, dailyWords, actionWords];
  const selectedPools = pools.sort(() => Math.random() - 0.5).slice(0, 2);

  return [
    ...commonWords,
    ...selectedPools.flat(),
  ];
}

/**
 * Generate a text passage with specified word count range
 */
export function generateTypingText(minWords: number = 500, maxWords: number = 1000): string {
  const targetWords = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const wordPool = createWordPool();

  const paragraphs: string[] = [];
  let currentWordCount = 0;

  while (currentWordCount < targetWords) {
    const paragraph = generateParagraph(wordPool);
    paragraphs.push(paragraph);
    currentWordCount += paragraph.split(' ').length;
  }

  // Join paragraphs and trim to target word count
  const fullText = paragraphs.join('\n\n');
  const words = fullText.split(' ');

  if (words.length > targetWords) {
    // Trim to exact target, ensuring we end at a sentence
    const trimmedWords = words.slice(0, targetWords);
    let text = trimmedWords.join(' ');

    // Find the last period
    const lastPeriod = text.lastIndexOf('.');
    if (lastPeriod > targetWords * 0.9 * 5) { // Rough estimate: word ~ 5 chars
      text = text.substring(0, lastPeriod + 1);
    }

    return text;
  }

  return fullText;
}

/**
 * Get word count of a text
 */
export function getWordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}
