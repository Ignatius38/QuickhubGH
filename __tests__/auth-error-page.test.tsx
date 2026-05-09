/**
 * Unit tests for authentication error page
 * Validates: Requirements 1.4
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthErrorPage from '../app/(public)/auth/error/page';
import { useSearchParams } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

describe('Auth Error Page', () => {
  const mockUseSearchParams = useSearchParams as jest.Mock;

  beforeEach(() => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Error message display', () => {
    it('should display default error message for unknown error', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'unknown_error';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });

    it('should display access denied message', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'access_denied';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      expect(screen.getByText('You denied access to your Google account. Please try again.')).toBeInTheDocument();
    });

    it('should display server error message', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'server_error';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      expect(screen.getByText('An error occurred during authentication. Please try again.')).toBeInTheDocument();
    });

    it('should display exchange failed message', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'exchange_failed';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      expect(screen.getByText('Failed to complete authentication. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Error description display', () => {
    it('should display error description when provided', () => {
      // Arrange
      const testDescription = 'User denied access to Google account';
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'access_denied';
          if (key === 'description') return testDescription;
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      expect(screen.getByText(testDescription)).toBeInTheDocument();
    });

    it('should handle long error descriptions with word break', () => {
      // Arrange
      const longDescription = 'A very long error description that might wrap and need proper styling for readability on mobile devices';
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'server_error';
          if (key === 'description') return longDescription;
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      const descriptionElement = screen.getByText(longDescription);
      expect(descriptionElement).toBeInTheDocument();
      expect(descriptionElement).toHaveClass('break-words');
    });
  });

  describe('Navigation buttons', () => {
    it('should display return to home button', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'unknown_error';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      expect(screen.getByText('Return to Home')).toBeInTheDocument();
      expect(screen.getByText('Return to Home').closest('a')).toHaveAttribute('href', '/');
    });

    it('should display try again button', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'unknown_error';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      expect(screen.getByText('Try Sign In Again')).toBeInTheDocument();
      expect(screen.getByText('Try Sign In Again').closest('a')).toHaveAttribute('href', '/');
    });

    it('should display buttons in correct styling', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'unknown_error';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      const returnButton = screen.getByText('Return to Home');
      const tryAgainButton = screen.getByText('Try Sign In Again');
      
      expect(returnButton).toHaveClass('bg-indigo-600');
      expect(tryAgainButton).toHaveClass('bg-gray-200');
    });
  });

  describe('Layout and styling', () => {
    it('should render with gradient background', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'unknown_error';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      const container = screen.getByText('Authentication Error').closest('div');
      expect(container).toHaveClass('bg-gradient-to-br');
      expect(container).toHaveClass('from-red-50');
      expect(container).toHaveClass('to-orange-100');
    });

    it('should render error icon', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'unknown_error';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should be responsive with proper padding', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'unknown_error';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      const container = screen.getByText('Authentication Error').closest('div');
      expect(container).toHaveClass('px-4');
      expect(container).toHaveClass('min-h-screen');
    });
  });

  describe('Mobile responsiveness', () => {
    it('should stack buttons vertically on small screens', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'unknown_error';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      const buttonContainer = screen.getByText('Return to Home').closest('div')?.parentElement;
      expect(buttonContainer).toHaveClass('flex-col');
      expect(buttonContainer).toHaveClass('sm:flex-row');
    });
  });

  describe('All OAuth error types (Req 1.4)', () => {
    const errorScenarios = [
      {
        reason: 'access_denied',
        expectedMessage: 'You denied access to your Google account. Please try again.',
        description: 'User denies Google OAuth consent',
      },
      {
        reason: 'server_error',
        expectedMessage: 'An error occurred during authentication. Please try again.',
        description: 'Google OAuth server error',
      },
      {
        reason: 'exchange_failed',
        expectedMessage: 'Failed to complete authentication. Please try again.',
        description: 'Code exchange failure',
      },
      {
        reason: 'timeout',
        expectedMessage: 'An unexpected error occurred. Please try again.',
        description: 'OAuth timeout',
      },
      {
        reason: 'invalid_request',
        expectedMessage: 'An unexpected error occurred. Please try again.',
        description: 'Invalid OAuth request',
      },
    ];

    errorScenarios.forEach(({ reason, expectedMessage, description }) => {
      it(`should display correct message for ${description}`, () => {
        // Arrange
        mockUseSearchParams.mockReturnValue({
          get: (key: string) => {
            if (key === 'reason') return reason;
            if (key === 'description') return '';
            return null;
          },
        });

        // Act
        render(<AuthErrorPage />);

        // Assert
        expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Error recovery actions', () => {
    it('should provide clear path back to sign-in', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'access_denied';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      const tryAgainButton = screen.getByText('Try Sign In Again');
      expect(tryAgainButton).toBeInTheDocument();
      expect(tryAgainButton.closest('a')).toHaveAttribute('href', '/');
    });

    it('should provide option to return home', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'server_error';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      const homeButton = screen.getByText('Return to Home');
      expect(homeButton).toBeInTheDocument();
      expect(homeButton.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible error icon', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'unknown_error';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      // Arrange
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'reason') return 'unknown_error';
          if (key === 'description') return '';
          return null;
        },
      });

      // Act
      render(<AuthErrorPage />);

      // Assert
      const heading = screen.getByText('Authentication Error');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H1');
    });
  });
});