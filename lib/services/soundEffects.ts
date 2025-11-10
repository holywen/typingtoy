/**
 * Simple sound effects service using Web Audio API
 * Generates typing sounds without external audio files
 */

let audioContext: AudioContext | null = null;
let isInitialized = false;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    console.log('🔊 AudioContext created:', audioContext.state);
  }

  // Resume if suspended (browser policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('🔊 AudioContext resumed');
    });
  }

  return audioContext;
}

/**
 * Initialize audio context on first user interaction
 * Call this on game start or first user action
 */
export function initializeAudio() {
  if (!isInitialized) {
    const ctx = getAudioContext();
    console.log('🔊 Audio initialized, state:', ctx.state);
    isInitialized = true;
  }
}

/**
 * Play a keystroke sound
 */
export function playKeystrokeSound(isCorrect: boolean = true) {
  try {
    console.log('🔊 Playing keystroke sound:', isCorrect ? 'correct' : 'incorrect');
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Different frequencies for correct vs incorrect
    oscillator.frequency.value = isCorrect ? 800 : 400;
    oscillator.type = 'sine';

    // Quick fade out
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.05, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    oscillator.start(now);
    oscillator.stop(now + 0.05);
  } catch (error) {
    // Silently fail if audio not available
    console.error('🔊 Audio error:', error);
  }
}

/**
 * Play a completion sound
 */
export function playCompletionSound() {
  try {
    const ctx = getAudioContext();

    // Play a simple ascending melody
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + (i * 0.15);
      gainNode.gain.setValueAtTime(0.1, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  } catch (error) {
    console.debug('Audio not available:', error);
  }
}

/**
 * Play an error sound
 */
export function playErrorSound() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  } catch (error) {
    console.debug('Audio not available:', error);
  }
}

/**
 * Play a countdown sound (for multiplayer games)
 * @param count - The countdown number (3, 2, or 1)
 */
export function playCountdownSound(count: number) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Ascending pitch for increasing tension
    // 3: A4 (440 Hz), 2: C5 (523 Hz), 1: E5 (659 Hz)
    const frequencies: { [key: number]: number } = {
      3: 440,
      2: 523,
      1: 659,
    };

    oscillator.frequency.value = frequencies[count] || 440;
    oscillator.type = 'sine';

    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  } catch (error) {
    console.debug('Audio not available:', error);
  }
}

/**
 * Play a game start sound (for multiplayer games)
 */
export function playGameStartSound() {
  try {
    const ctx = getAudioContext();

    // Energetic upward flourish: C5 → E5 → G5 → C6
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + (i * 0.05);
      gainNode.gain.setValueAtTime(0.12, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    });
  } catch (error) {
    console.debug('Audio not available:', error);
  }
}

/**
 * Play a victory sound (for multiplayer games)
 */
export function playVictorySound() {
  try {
    console.log('🎉 Playing VICTORY sound');
    const ctx = getAudioContext();

    // Triumphant ascending melody: C5 → E5 → G5 → C6 → E6
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];

    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + (i * 0.12);
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    });
  } catch (error) {
    console.error('🔊 Audio error:', error);
  }
}

/**
 * Play a defeat sound (for multiplayer games)
 */
export function playDefeatSound() {
  try {
    console.log('😢 Playing DEFEAT sound');
    const ctx = getAudioContext();

    // Subtle descending melody: C5 → A4 → F4
    const notes = [523.25, 440.00, 349.23];

    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + (i * 0.15);
      gainNode.gain.setValueAtTime(0.1, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.35);
    });
  } catch (error) {
    console.error('🔊 Audio error:', error);
  }
}
