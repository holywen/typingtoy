import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SocialShareButtons from '../SocialShareButtons';

// Mock the i18n context
jest.mock('@/lib/i18n/LanguageContext', () => ({
  useLanguage: () => ({
    t: {
      social: {
        shareTitle: '📢 Share Typing Toy with friends!',
        shareText: 'Check out Typing Toy - Learn to type faster with 15 progressive lessons, speed tests, and fun games! 🎯⌨️',
        shareOn: 'Share on',
      },
    },
  }),
}));

describe('SocialShareButtons', () => {
  let windowOpenSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock window.open
    windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    windowOpenSpy.mockRestore();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the component without crashing', () => {
      render(<SocialShareButtons />);
      expect(screen.getByText('📢 Share Typing Toy with friends!')).toBeInTheDocument();
    });

    it('should render all 5 social platform buttons', () => {
      render(<SocialShareButtons />);

      // Check for all platform buttons by their accessible labels
      expect(screen.getByLabelText(/Share on Twitter\/X/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Share on Facebook/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Share on LinkedIn/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Share on Reddit/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Share on WhatsApp/i)).toBeInTheDocument();
    });

    it('should render with proper styling classes', () => {
      const { container } = render(<SocialShareButtons />);

      // Check for gradient background
      const wrapper = container.querySelector('.bg-gradient-to-r');
      expect(wrapper).toBeInTheDocument();

      // Check for border
      const borderElement = container.querySelector('.border-b');
      expect(borderElement).toBeInTheDocument();
    });

    it('should have responsive flex layout', () => {
      const { container } = render(<SocialShareButtons />);

      const flexContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('Social Platform Buttons', () => {
    it('should render Twitter/X button with correct styling', () => {
      render(<SocialShareButtons />);
      const twitterButton = screen.getByLabelText(/Share on Twitter\/X/i);

      expect(twitterButton).toHaveClass('bg-black');
      expect(twitterButton).toHaveClass('hover:bg-gray-800');
    });

    it('should render Facebook button with correct styling', () => {
      render(<SocialShareButtons />);
      const facebookButton = screen.getByLabelText(/Share on Facebook/i);

      expect(facebookButton).toHaveClass('bg-blue-600');
      expect(facebookButton).toHaveClass('hover:bg-blue-700');
    });

    it('should render LinkedIn button with correct styling', () => {
      render(<SocialShareButtons />);
      const linkedinButton = screen.getByLabelText(/Share on LinkedIn/i);

      expect(linkedinButton).toHaveClass('bg-blue-700');
      expect(linkedinButton).toHaveClass('hover:bg-blue-800');
    });

    it('should render Reddit button with correct styling', () => {
      render(<SocialShareButtons />);
      const redditButton = screen.getByLabelText(/Share on Reddit/i);

      expect(redditButton).toHaveClass('bg-orange-600');
      expect(redditButton).toHaveClass('hover:bg-orange-700');
    });

    it('should render WhatsApp button with correct styling', () => {
      render(<SocialShareButtons />);
      const whatsappButton = screen.getByLabelText(/Share on WhatsApp/i);

      expect(whatsappButton).toHaveClass('bg-green-600');
      expect(whatsappButton).toHaveClass('hover:bg-green-700');
    });
  });

  describe('Click Handlers', () => {
    it('should open Twitter share dialog when Twitter button is clicked', () => {
      render(<SocialShareButtons />);
      const twitterButton = screen.getByLabelText(/Share on Twitter\/X/i);

      fireEvent.click(twitterButton);

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://twitter.com/intent/tweet'),
        '_blank',
        'noopener,noreferrer,width=600,height=400'
      );
      expect(windowOpenSpy.mock.calls[0][0]).toContain(encodeURIComponent('http://localhost:3000'));
    });

    it('should open Facebook share dialog when Facebook button is clicked', () => {
      render(<SocialShareButtons />);
      const facebookButton = screen.getByLabelText(/Share on Facebook/i);

      fireEvent.click(facebookButton);

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://www.facebook.com/sharer/sharer.php'),
        '_blank',
        'noopener,noreferrer,width=600,height=400'
      );
    });

    it('should open LinkedIn share dialog when LinkedIn button is clicked', () => {
      render(<SocialShareButtons />);
      const linkedinButton = screen.getByLabelText(/Share on LinkedIn/i);

      fireEvent.click(linkedinButton);

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://www.linkedin.com/sharing/share-offsite'),
        '_blank',
        'noopener,noreferrer,width=600,height=400'
      );
    });

    it('should open Reddit share dialog when Reddit button is clicked', () => {
      render(<SocialShareButtons />);
      const redditButton = screen.getByLabelText(/Share on Reddit/i);

      fireEvent.click(redditButton);

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://www.reddit.com/submit'),
        '_blank',
        'noopener,noreferrer,width=600,height=400'
      );
    });

    it('should open WhatsApp share dialog when WhatsApp button is clicked', () => {
      render(<SocialShareButtons />);
      const whatsappButton = screen.getByLabelText(/Share on WhatsApp/i);

      fireEvent.click(whatsappButton);

      expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/'),
        '_blank',
        'noopener,noreferrer,width=600,height=400'
      );
    });

    it('should include the share text in the URL for Twitter', () => {
      render(<SocialShareButtons />);
      const twitterButton = screen.getByLabelText(/Share on Twitter\/X/i);

      fireEvent.click(twitterButton);

      const calledUrl = windowOpenSpy.mock.calls[0][0];
      expect(calledUrl).toContain('text=');
      expect(calledUrl).toContain(encodeURIComponent('Check out Typing Toy'));
    });

    it('should include the share text in the URL for Reddit', () => {
      render(<SocialShareButtons />);
      const redditButton = screen.getByLabelText(/Share on Reddit/i);

      fireEvent.click(redditButton);

      const calledUrl = windowOpenSpy.mock.calls[0][0];
      expect(calledUrl).toContain('title=');
      expect(calledUrl).toContain(encodeURIComponent('Check out Typing Toy'));
    });

    it('should include both text and URL in WhatsApp share', () => {
      render(<SocialShareButtons />);
      const whatsappButton = screen.getByLabelText(/Share on WhatsApp/i);

      fireEvent.click(whatsappButton);

      const calledUrl = windowOpenSpy.mock.calls[0][0];
      expect(calledUrl).toContain('text=');
      expect(calledUrl).toContain(encodeURIComponent('Check out Typing Toy'));
      expect(calledUrl).toContain(encodeURIComponent('http://localhost:3000'));
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all buttons', () => {
      render(<SocialShareButtons />);

      expect(screen.getByLabelText('Share on Twitter/X')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on Facebook')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on LinkedIn')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on Reddit')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on WhatsApp')).toBeInTheDocument();
    });

    it('should have title attributes for all buttons', () => {
      render(<SocialShareButtons />);

      expect(screen.getByTitle('Share on Twitter/X')).toBeInTheDocument();
      expect(screen.getByTitle('Share on Facebook')).toBeInTheDocument();
      expect(screen.getByTitle('Share on LinkedIn')).toBeInTheDocument();
      expect(screen.getByTitle('Share on Reddit')).toBeInTheDocument();
      expect(screen.getByTitle('Share on WhatsApp')).toBeInTheDocument();
    });

    it('should have all SVG icons with aria-hidden attribute', () => {
      const { container } = render(<SocialShareButtons />);
      const svgElements = container.querySelectorAll('svg[aria-hidden="true"]');

      // Should have 5 SVG icons (one for each platform)
      expect(svgElements).toHaveLength(5);
    });
  });

  describe('Internationalization', () => {
    it('should use i18n translations for share title', () => {
      render(<SocialShareButtons />);
      expect(screen.getByText('📢 Share Typing Toy with friends!')).toBeInTheDocument();
    });

    it('should use i18n shareText in generated URLs', () => {
      render(<SocialShareButtons />);
      const twitterButton = screen.getByLabelText(/Share on Twitter\/X/i);

      fireEvent.click(twitterButton);

      const calledUrl = windowOpenSpy.mock.calls[0][0];
      // The share text should be from i18n
      expect(calledUrl).toContain(encodeURIComponent('Check out Typing Toy - Learn to type faster'));
    });

    it('should use i18n shareOn text for aria-labels', () => {
      render(<SocialShareButtons />);

      // The aria-label format is: `${t.social.shareOn} ${platform.label}`
      // Which should be: "Share on Twitter/X", "Share on Facebook", etc.
      expect(screen.getByLabelText('Share on Twitter/X')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode classes for container', () => {
      const { container } = render(<SocialShareButtons />);

      const darkModeElement = container.querySelector('.dark\\:from-blue-900\\/20');
      expect(darkModeElement).toBeInTheDocument();

      const borderDark = container.querySelector('.dark\\:border-blue-800');
      expect(borderDark).toBeInTheDocument();
    });

    it('should have dark mode text color classes', () => {
      const { container } = render(<SocialShareButtons />);

      const textElement = container.querySelector('.dark\\:text-gray-300');
      expect(textElement).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should hide button labels on mobile and show on desktop', () => {
      const { container } = render(<SocialShareButtons />);

      // Button labels should have 'hidden sm:inline' classes
      const buttonLabels = container.querySelectorAll('.hidden.sm\\:inline');

      // Should have 5 labels (one per button)
      expect(buttonLabels.length).toBeGreaterThanOrEqual(5);
    });

    it('should use flex-col on mobile and flex-row on desktop', () => {
      const { container } = render(<SocialShareButtons />);

      const responsiveContainer = container.querySelector('.flex-col.sm\\:flex-row');
      expect(responsiveContainer).toBeInTheDocument();
    });
  });

  describe('URL Encoding', () => {
    it('should properly encode special characters in URLs', () => {
      render(<SocialShareButtons />);
      const twitterButton = screen.getByLabelText(/Share on Twitter\/X/i);

      fireEvent.click(twitterButton);

      const calledUrl = windowOpenSpy.mock.calls[0][0];

      // Check that emojis and special characters are encoded
      expect(calledUrl).toContain(encodeURIComponent('🎯⌨️'));
    });

    it('should properly encode the current page URL', () => {
      render(<SocialShareButtons />);
      const facebookButton = screen.getByLabelText(/Share on Facebook/i);

      fireEvent.click(facebookButton);

      const calledUrl = windowOpenSpy.mock.calls[0][0];
      expect(calledUrl).toContain(encodeURIComponent('http://localhost:3000'));
    });
  });

  describe('Window Features', () => {
    it('should open popup with correct window features', () => {
      render(<SocialShareButtons />);
      const twitterButton = screen.getByLabelText(/Share on Twitter\/X/i);

      fireEvent.click(twitterButton);

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.any(String),
        '_blank',
        'noopener,noreferrer,width=600,height=400'
      );
    });

    it('should use _blank target for security', () => {
      render(<SocialShareButtons />);
      const facebookButton = screen.getByLabelText(/Share on Facebook/i);

      fireEvent.click(facebookButton);

      expect(windowOpenSpy.mock.calls[0][1]).toBe('_blank');
    });

    it('should include noopener and noreferrer for security', () => {
      render(<SocialShareButtons />);
      const linkedinButton = screen.getByLabelText(/Share on LinkedIn/i);

      fireEvent.click(linkedinButton);

      const windowFeatures = windowOpenSpy.mock.calls[0][2];
      expect(windowFeatures).toContain('noopener');
      expect(windowFeatures).toContain('noreferrer');
    });
  });
});
