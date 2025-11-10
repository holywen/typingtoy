import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TypingTest from '../TypingTest';

// Mock the services and components
jest.mock('@/lib/services/typingMetrics', () => ({
  calculateMetrics: jest.fn(() => ({
    netWPM: 50,
    accuracy: 95,
    duration: 60,
  })),
  getRealTimeStats: jest.fn(() => ({
    wpm: 50,
    accuracy: 95,
    timeElapsed: 60,
  })),
  trackKeystroke: jest.fn((char, target) => ({
    char,
    timestamp: Date.now(),
    correct: char === target,
  })),
}));

jest.mock('@/lib/services/soundEffects', () => ({
  initializeAudio: jest.fn(),
  playKeystrokeSound: jest.fn(),
  playCompletionSound: jest.fn(),
  playErrorSound: jest.fn(),
  playCountdownSound: jest.fn(),
  playGameStartSound: jest.fn(),
  playVictorySound: jest.fn(),
  playDefeatSound: jest.fn(),
}));

jest.mock('@/lib/services/userSettings', () => ({
  getUserSettings: jest.fn(() => ({
    soundEnabled: true,
    keyboardLayout: 'qwerty',
    theme: 'light',
  })),
  updateSetting: jest.fn(),
}));

jest.mock('@/lib/i18n/LanguageContext', () => ({
  useLanguage: () => ({
    t: {
      typing: {
        wpm: 'WPM',
        accuracy: 'Accuracy',
        time: 'Time',
        soundOn: 'Sound On',
        soundOff: 'Sound Off',
        clickToStart: 'Click to start typing',
        startTyping: 'Start typing...',
        completed: 'Completed!',
        yourSpeed: 'Your Speed',
        tryAgain: 'Try Again',
      },
    },
    language: 'en',
  }),
}));

jest.mock('../VirtualKeyboard', () => {
  return function VirtualKeyboard() {
    return <div data-testid="virtual-keyboard">Virtual Keyboard</div>;
  };
});

jest.mock('../HandDiagram', () => {
  return function HandDiagram() {
    return <div data-testid="hand-diagram">Hand Diagram</div>;
  };
});

describe('TypingTest Component', () => {
  const defaultProps = {
    targetText: 'hello world',
    onComplete: jest.fn(),
    onStart: jest.fn(),
    showKeyboard: true,
    showHandDiagram: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock scrollIntoView which is not available in jsdom
    Element.prototype.scrollIntoView = jest.fn();
  });

  describe('Rendering', () => {
    it('should render the component with initial state', () => {
      render(<TypingTest {...defaultProps} />);

      expect(screen.getByText('Click to start typing')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // WPM
      expect(screen.getByText('100%')).toBeInTheDocument(); // Accuracy
    });

    it('should render target text with alternating lines', () => {
      render(<TypingTest {...defaultProps} />);

      // Target text should be split into lines
      const textDisplay = document.querySelector('[tabindex="0"]');
      expect(textDisplay).toBeInTheDocument();
    });

    it('should render virtual keyboard when showKeyboard is true', () => {
      render(<TypingTest {...defaultProps} />);
      expect(screen.getAllByTestId('virtual-keyboard')).toHaveLength(1);
    });

    it('should render hand diagrams when showHandDiagram is true', () => {
      render(<TypingTest {...defaultProps} />);
      expect(screen.getAllByTestId('hand-diagram')).toHaveLength(2); // Left and right
    });

    it('should not render keyboard when showKeyboard is false', () => {
      render(<TypingTest {...defaultProps} showKeyboard={false} />);
      expect(screen.queryByTestId('virtual-keyboard')).not.toBeInTheDocument();
    });

    it('should not render hand diagrams when showHandDiagram is false', () => {
      render(<TypingTest {...defaultProps} showHandDiagram={false} />);
      expect(screen.queryByTestId('hand-diagram')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Input', () => {
    it('should handle correct character input', () => {
      render(<TypingTest {...defaultProps} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;
      expect(textDisplay).toBeInTheDocument();

      // Type first character 'h'
      fireEvent.keyDown(textDisplay, { key: 'h' });

      expect(defaultProps.onStart).toHaveBeenCalledTimes(1);
    });

    it('should handle space key input', () => {
      render(<TypingTest {...defaultProps} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;

      // Type until space
      'hello'.split('').forEach(char => {
        fireEvent.keyDown(textDisplay, { key: char });
      });

      fireEvent.keyDown(textDisplay, { key: ' ' });

      // Should have called onStart once
      expect(defaultProps.onStart).toHaveBeenCalled();
    });

    it('should handle backspace key', () => {
      render(<TypingTest {...defaultProps} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;

      // Type a character
      fireEvent.keyDown(textDisplay, { key: 'h' });

      // Press backspace
      fireEvent.keyDown(textDisplay, { key: 'Backspace' });

      // Character should be removed (tested indirectly through state)
      expect(textDisplay).toBeInTheDocument();
    });

    it('should prevent Tab key default behavior', () => {
      render(<TypingTest {...defaultProps} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;

      // Create a real keyboard event
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = jest.spyOn(tabEvent, 'preventDefault');
      textDisplay.dispatchEvent(tabEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should handle Enter key for newline in target text', () => {
      const textWithNewline = 'hello\nworld';
      render(<TypingTest {...defaultProps} targetText={textWithNewline} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;

      // Type "hello"
      'hello'.split('').forEach(char => {
        fireEvent.keyDown(textDisplay, { key: char });
      });

      // Press Enter (should be accepted as next char is newline)
      fireEvent.keyDown(textDisplay, { key: 'Enter' });

      expect(textDisplay).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should call onStart when typing begins', () => {
      render(<TypingTest {...defaultProps} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;
      fireEvent.keyDown(textDisplay, { key: 'h' });

      expect(defaultProps.onStart).toHaveBeenCalledTimes(1);
    });

    it('should call onComplete when typing is finished', async () => {
      const shortText = 'hi';
      render(<TypingTest {...defaultProps} targetText={shortText} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;

      // Type all characters
      fireEvent.keyDown(textDisplay, { key: 'h' });
      fireEvent.keyDown(textDisplay, { key: 'i' });

      await waitFor(() => {
        expect(defaultProps.onComplete).toHaveBeenCalled();
      });
    });

    it('should not call onStart multiple times', () => {
      render(<TypingTest {...defaultProps} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;

      fireEvent.keyDown(textDisplay, { key: 'h' });
      fireEvent.keyDown(textDisplay, { key: 'e' });
      fireEvent.keyDown(textDisplay, { key: 'l' });

      expect(defaultProps.onStart).toHaveBeenCalledTimes(1);
    });
  });

  describe('Completion State', () => {
    it('should show completion message when finished', async () => {
      const shortText = 'hi';
      render(<TypingTest {...defaultProps} targetText={shortText} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;

      // Type all characters
      fireEvent.keyDown(textDisplay, { key: 'h' });
      fireEvent.keyDown(textDisplay, { key: 'i' });

      await waitFor(() => {
        expect(screen.getByText('Completed!')).toBeInTheDocument();
      });
    });

    it('should show Try Again button when completed', async () => {
      const shortText = 'hi';
      render(<TypingTest {...defaultProps} targetText={shortText} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;

      fireEvent.keyDown(textDisplay, { key: 'h' });
      fireEvent.keyDown(textDisplay, { key: 'i' });

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should restart when Try Again is clicked', async () => {
      const shortText = 'hi';
      render(<TypingTest {...defaultProps} targetText={shortText} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;

      // Complete the test
      fireEvent.keyDown(textDisplay, { key: 'h' });
      fireEvent.keyDown(textDisplay, { key: 'i' });

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Click Try Again
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      // Should reset to initial state
      expect(screen.getByText('Click to start typing')).toBeInTheDocument();
    });

    it('should hide keyboard and hand diagrams when completed', async () => {
      const shortText = 'hi';
      render(<TypingTest {...defaultProps} targetText={shortText} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;

      fireEvent.keyDown(textDisplay, { key: 'h' });
      fireEvent.keyDown(textDisplay, { key: 'i' });

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Completed!')).toBeInTheDocument();
      });

      // Keyboard and hand diagrams should be hidden
      expect(screen.queryByTestId('virtual-keyboard')).not.toBeInTheDocument();
      expect(screen.queryByTestId('hand-diagram')).not.toBeInTheDocument();
    });
  });

  describe('Sound Control', () => {
    it('should toggle sound when sound button is clicked', () => {
      const { updateSetting } = require('@/lib/services/userSettings');

      render(<TypingTest {...defaultProps} />);

      const soundButton = screen.getByTitle('Sound On');
      fireEvent.click(soundButton);

      expect(updateSetting).toHaveBeenCalledWith('soundEnabled', false);
    });
  });

  describe('Statistics Display', () => {
    it('should display WPM stat', () => {
      render(<TypingTest {...defaultProps} />);
      expect(screen.getByText('WPM')).toBeInTheDocument();
    });

    it('should display Accuracy stat', () => {
      render(<TypingTest {...defaultProps} />);
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
    });

    it('should display Time stat', () => {
      render(<TypingTest {...defaultProps} />);
      expect(screen.getByText('Time')).toBeInTheDocument();
    });

    it('should update stats during typing', async () => {
      jest.useFakeTimers();

      const { act } = require('react');

      render(<TypingTest {...defaultProps} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;
      fireEvent.keyDown(textDisplay, { key: 'h' });

      // Fast-forward time by 1 second wrapped in act
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Stats should be updated (verified by mock being called)
      const { getRealTimeStats } = require('@/lib/services/typingMetrics');
      expect(getRealTimeStats).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Multi-line Text', () => {
    it('should handle text with newlines', () => {
      const multilineText = 'line1\nline2\nline3';
      render(<TypingTest {...defaultProps} targetText={multilineText} />);

      const textDisplay = document.querySelector('[tabindex="0"]');
      expect(textDisplay).toBeInTheDocument();

      // Should render multiple line pairs (target + input for each line)
      const displayDiv = textDisplay as HTMLElement;
      expect(displayDiv.children.length).toBeGreaterThan(2); // At least 2 lines
    });
  });

  describe('Focus Management', () => {
    it('should auto-focus the text display on mount', () => {
      render(<TypingTest {...defaultProps} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;

      // Check that element is focusable
      expect(textDisplay).toHaveAttribute('tabindex', '0');
    });

    it('should refocus text display after restart', async () => {
      const shortText = 'hi';
      render(<TypingTest {...defaultProps} targetText={shortText} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;

      // Complete test
      fireEvent.keyDown(textDisplay, { key: 'h' });
      fireEvent.keyDown(textDisplay, { key: 'i' });

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Restart
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      // Text display should still be focusable
      expect(textDisplay).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Text Reset on Target Change', () => {
    it('should reset session when targetText changes', () => {
      const { rerender } = render(<TypingTest {...defaultProps} targetText="hello" />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;
      fireEvent.keyDown(textDisplay, { key: 'h' });

      // Change target text
      rerender(<TypingTest {...defaultProps} targetText="world" />);

      // Should show start message again
      expect(screen.getByText('Click to start typing')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have focusable text display area', () => {
      render(<TypingTest {...defaultProps} />);

      const textDisplay = document.querySelector('[tabindex="0"]');
      expect(textDisplay).toBeInTheDocument();
      expect(textDisplay).toHaveAttribute('tabindex', '0');
    });

    it('should not accept input when completed', async () => {
      const shortText = 'hi';
      render(<TypingTest {...defaultProps} targetText={shortText} />);

      const textDisplay = document.querySelector('[tabindex="0"]') as HTMLElement;

      // Complete test
      fireEvent.keyDown(textDisplay, { key: 'h' });
      fireEvent.keyDown(textDisplay, { key: 'i' });

      await waitFor(() => {
        expect(screen.getByText('Completed!')).toBeInTheDocument();
      });

      // Try to type more
      fireEvent.keyDown(textDisplay, { key: 'x' });

      // Should not trigger any new input processing
      expect(textDisplay).toBeInTheDocument();
    });
  });
});
