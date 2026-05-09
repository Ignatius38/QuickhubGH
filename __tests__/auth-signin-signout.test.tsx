/**
 * Unit tests for OAuth sign-in redirect and sign-out functionality
 * Validates: Requirements 1.2, 1.6
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TopNav from '../components/navigation/TopNav';
import LandingPage from '../app/(public)/page';
import { createBrowserClient } from '@supabase/ssr';

// Mock dependencies
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/feed'),
}));

jest.mock('../components/navigation/NotificationBadge', () => {
  return function MockNotificationBadge() {
    return <div data-testid="notification-badge" />;
  };
});

describe('OAuth Sign-In and Sign-Out Flow', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn(),
        signOut: jest.fn(),
      },
    };

    (createBrowserClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('OAuth Redirect Flow (Requirement 1.2)', () => {
    it('should display sign-in button on landing page', () => {
      // Act
      render(<LandingPage />);

      // Assert
      const signInButton = screen.getByText('Sign In with Google');
      expect(signInButton).toBeInTheDocument();
      expect(signInButton).toHaveAttribute('href', '/auth/signin');
    });

    it('should have correct styling for sign-in button', () => {
      // Act
      render(<LandingPage />);

      // Assert
      const signInButton = screen.getByText('Sign In with Google');
      expect(signInButton).toHaveClass('bg-indigo-600');
      expect(signInButton).toHaveClass('text-white');
      expect(signInButton).toHaveClass('rounded-lg');
    });

    it('should display platform branding on landing page', () => {
      // Act
      render(<LandingPage />);

      // Assert
      expect(screen.getByText('QuickHubGH')).toBeInTheDocument();
      expect(screen.getByText('Connect with skilled professionals in Ghana')).toBeInTheDocument();
    });

    it('should have mobile-responsive layout', () => {
      // Act
      render(<LandingPage />);

      // Assert
      const container = screen.getByText('QuickHubGH').closest('div');
      expect(container).toHaveClass('min-h-screen');
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('items-center');
      expect(container).toHaveClass('justify-center');
    });
  });

  describe('Sign-Out Functionality (Requirement 1.6)', () => {
    it('should display sign-out button in TopNav', () => {
      // Act
      render(<TopNav />);

      // Assert
      const signOutButton = screen.getByText('Sign Out');
      expect(signOutButton).toBeInTheDocument();
    });

    it('should call signOut when sign-out button is clicked', async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      render(<TopNav />);

      // Act
      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);

      // Assert
      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
      });
    });

    it('should redirect to landing page after sign-out', async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      render(<TopNav />);

      // Act
      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);

      // Assert
      await waitFor(() => {
        expect(window.location.href).toBe('/');
      });
    });

    it('should handle sign-out errors gracefully', async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({
        error: new Error('Sign out failed'),
      });
      render(<TopNav />);

      // Act
      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);

      // Assert - should still redirect even if error occurs
      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        expect(window.location.href).toBe('/');
      });
    });

    it('should create Supabase client with correct credentials', async () => {
      // Arrange
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });
      render(<TopNav />);

      // Act
      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);

      // Assert
      await waitFor(() => {
        expect(createBrowserClient).toHaveBeenCalledWith(
          'https://test.supabase.co',
          'test-anon-key'
        );
      });
    });

    it('should display sign-out button with correct icon', () => {
      // Act
      render(<TopNav />);

      // Assert
      const signOutButton = screen.getByText('Sign Out').closest('button');
      expect(signOutButton).toBeInTheDocument();
      expect(signOutButton).toHaveClass('flex');
      expect(signOutButton).toHaveClass('items-center');
      expect(signOutButton).toHaveClass('gap-2');
    });
  });

  describe('Navigation Integration', () => {
    it('should display all navigation items in TopNav', () => {
      // Act
      render(<TopNav />);

      // Assert
      expect(screen.getByText('Feed')).toBeInTheDocument();
      expect(screen.getByText('Post Job')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('should have correct navigation links', () => {
      // Act
      render(<TopNav />);

      // Assert
      expect(screen.getByText('Feed').closest('a')).toHaveAttribute('href', '/feed');
      expect(screen.getByText('Post Job').closest('a')).toHaveAttribute('href', '/jobs/new');
      expect(screen.getByText('Profile').closest('a')).toHaveAttribute('href', '/profile/edit');
      expect(screen.getByText('Notifications').closest('a')).toHaveAttribute('href', '/notifications');
    });

    it('should highlight active navigation item', () => {
      // Arrange
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/feed');

      // Act
      render(<TopNav />);

      // Assert
      const feedLink = screen.getByText('Feed').closest('a');
      expect(feedLink).toHaveClass('text-indigo-600');
      expect(feedLink).toHaveClass('bg-indigo-50');
    });

    it('should display notification badge', () => {
      // Act
      render(<TopNav />);

      // Assert
      expect(screen.getByTestId('notification-badge')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have sticky positioning for TopNav', () => {
      // Act
      render(<TopNav />);

      // Assert
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('sticky');
      expect(nav).toHaveClass('top-0');
      expect(nav).toHaveClass('z-40');
    });

    it('should have proper container styling', () => {
      // Act
      render(<TopNav />);

      // Assert
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('bg-white');
      expect(nav).toHaveClass('border-b');
      expect(nav).toHaveClass('border-gray-200');
    });

    it('should display platform logo with correct styling', () => {
      // Act
      render(<TopNav />);

      // Assert
      const logo = screen.getAllByText('QuickHubGH')[0];
      expect(logo).toHaveClass('text-2xl');
      expect(logo).toHaveClass('font-bold');
      expect(logo).toHaveClass('text-indigo-600');
    });
  });
});
