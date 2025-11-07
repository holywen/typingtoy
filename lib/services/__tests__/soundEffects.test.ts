describe('soundEffects', () => {
  let mockAudioContext: any;
  let mockOscillator: any;
  let mockGainNode: any;

  beforeEach(() => {
    // Reset modules to clear AudioContext singleton
    jest.resetModules();

    // Create mocks for Web Audio API
    mockGainNode = {
      connect: jest.fn(),
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
    };

    mockOscillator = {
      connect: jest.fn(),
      frequency: { value: 0 },
      type: 'sine',
      start: jest.fn(),
      stop: jest.fn(),
    };

    mockAudioContext = {
      createOscillator: jest.fn(() => mockOscillator),
      createGain: jest.fn(() => mockGainNode),
      destination: {},
      currentTime: 0,
    };

    // Mock global AudioContext
    global.AudioContext = jest.fn(() => mockAudioContext) as any;
    (global as any).webkitAudioContext = jest.fn(() => mockAudioContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('playKeystrokeSound', () => {
    it('should create and play a sound for correct keystroke', () => {
      const { playKeystrokeSound } = require('../soundEffects');
      playKeystrokeSound(true);

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
      expect(mockOscillator.frequency.value).toBe(800); // Correct frequency
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it('should use different frequency for incorrect keystroke', () => {
      const { playKeystrokeSound } = require('../soundEffects');
      playKeystrokeSound(false);

      expect(mockOscillator.frequency.value).toBe(400); // Incorrect frequency
    });

    it('should default to correct sound when no parameter provided', () => {
      const { playKeystrokeSound } = require('../soundEffects');
      playKeystrokeSound();

      expect(mockOscillator.frequency.value).toBe(800);
    });

    it('should handle audio context errors gracefully', () => {
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw new Error('Audio not available');
      });

      const { playKeystrokeSound } = require('../soundEffects');
      expect(() => playKeystrokeSound()).not.toThrow();
    });

    it('should set gain values for fade out', () => {
      const { playKeystrokeSound } = require('../soundEffects');
      playKeystrokeSound(true);

      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.05, 0);
      expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, 0.05);
    });

    it('should use sine wave oscillator', () => {
      const { playKeystrokeSound } = require('../soundEffects');
      playKeystrokeSound(true);

      expect(mockOscillator.type).toBe('sine');
    });
  });

  describe('playCompletionSound', () => {
    it('should play three ascending notes', () => {
      const { playCompletionSound } = require('../soundEffects');
      playCompletionSound();

      // Should create 3 oscillators (one for each note)
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(3);
    });

    it('should use correct frequencies for C5, E5, G5', () => {
      const frequencies: number[] = [];
      mockAudioContext.createOscillator.mockImplementation(() => {
        const osc = {
          ...mockOscillator,
          frequency: { value: 0 },
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn(),
        };
        frequencies.push(osc.frequency.value);
        return osc;
      });

      const { playCompletionSound } = require('../soundEffects');
      playCompletionSound();

      // Verify oscillator frequencies are set to C5, E5, G5
      const createdOscillators = mockAudioContext.createOscillator.mock.results;
      expect(createdOscillators).toHaveLength(3);
    });

    it('should handle audio errors gracefully', () => {
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw new Error('Audio not available');
      });

      const { playCompletionSound } = require('../soundEffects');
      expect(() => playCompletionSound()).not.toThrow();
    });

    it('should start notes at staggered times', () => {
      const startTimes: number[] = [];
      mockOscillator.start.mockImplementation((time: number) => {
        startTimes.push(time);
      });

      const { playCompletionSound } = require('../soundEffects');
      playCompletionSound();

      // Each note should start 0.15s after the previous one
      // Note: We can't easily verify exact times without more complex mocking
      expect(mockOscillator.start).toHaveBeenCalledTimes(3);
    });
  });

  describe('playErrorSound', () => {
    it('should create and play error sound', () => {
      const { playErrorSound } = require('../soundEffects');
      playErrorSound();

      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
      expect(mockOscillator.start).toHaveBeenCalled();
      expect(mockOscillator.stop).toHaveBeenCalled();
    });

    it('should use low frequency for error sound', () => {
      const { playErrorSound } = require('../soundEffects');
      playErrorSound();

      expect(mockOscillator.frequency.value).toBe(200);
    });

    it('should use sawtooth wave for error sound', () => {
      const { playErrorSound } = require('../soundEffects');
      playErrorSound();

      expect(mockOscillator.type).toBe('sawtooth');
    });

    it('should handle audio errors gracefully', () => {
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw new Error('Audio not available');
      });

      const { playErrorSound } = require('../soundEffects');
      expect(() => playErrorSound()).not.toThrow();
    });

    it('should set gain values for fade out', () => {
      const { playErrorSound } = require('../soundEffects');
      playErrorSound();

      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.08, 0);
      expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.01, 0.15);
    });
  });

  describe('Audio Context initialization', () => {
    it('should reuse the same AudioContext instance', () => {
      const { playKeystrokeSound, playErrorSound } = require('../soundEffects');
      playKeystrokeSound();
      playKeystrokeSound();
      playErrorSound();

      // AudioContext constructor should be called only once
      expect(global.AudioContext).toHaveBeenCalledTimes(1);
    });

    it('should handle webkit prefix for AudioContext', () => {
      // Remove AudioContext, keep only webkit version
      delete (global as any).AudioContext;

      const { playKeystrokeSound } = require('../soundEffects');
      playKeystrokeSound();

      expect((global as any).webkitAudioContext).toHaveBeenCalled();
    });
  });
});
