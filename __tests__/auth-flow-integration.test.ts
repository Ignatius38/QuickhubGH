/**
 * Integration tests for complete authentication flow
 * Validates: Requirements 1.1-1.6
 */

import { GET as callbackGET } from '../app/(public)/auth/callback/route';
import { middleware } from '../middleware';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Mock dependencies
jest.mock('@supabase/ssr');
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
jest.mock('next/server');

describe('Authentication Flow Integration', () => {
  let mockSupabase: any;
  let mockCookieStore: any;
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
        exchangeCodeForSession: jest.fn(),
      },
    };

    mockCookieStore = {
      getAll: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
    };

    mockRequest = {
      url: 'http://localhost:3000',
      nextUrl: {
        pathname: '/',
      },
      cookies: {
        get: jest.fn(),
      },
      headers: new Headers(),
    };

    // Mock createServerClient
    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock cookies
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);

    // Mock NextResponse methods
    (NextResponse.next as jest.Mock).mockImplementation((options) => ({
      ...options,
      cookies: {
        set: jest.fn(),
      },
    }));
    (NextResponse.redirect as jest.Mock).mockImplementation((url) => ({
      url,
    }));

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete OAuth flow', () => {
    it('should handle successful OAuth flow from start to platform access', async () => {
      // Step 1: User initiates OAuth (not tested here - handled by Supabase)

      // Step 2: Google redirects to callback with code
      const callbackRequest = {
        url: 'http://localhost:3000/auth/callback?code=test-auth-code',
      } as NextRequest;

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
      });

      // Execute callback
      const callbackResponse = await callbackGET(callbackRequest);
      expect(callbackResponse.url).toBe('/feed');

      // Step 3: User tries to access platform route
      mockRequest.url = 'http://localhost:3000/feed';
      mockRequest.nextUrl!.pathname = '/feed';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      // Execute middleware
      const middlewareResponse = await middleware(mockRequest as NextRequest);
      
      // Should allow access
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should handle OAuth error flow', async () => {
      // Step 1: Google redirects to callback with error
      const callbackRequest = {
        url: 'http://localhost:3000/auth/callback?error=access_denied&error_description=User%20denied%20access',
      } as NextRequest;

      // Execute callback
      const callbackResponse = await callbackGET(callbackRequest);
      
      // Should redirect to error page
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/error'),
        })
      );
    });

    it('should handle session expiration and redirect', async () => {
      // User has expired session
      mockRequest.url = 'http://localhost:3000/feed';
      mockRequest.nextUrl!.pathname = '/feed';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Session expired'),
      });

      // Execute middleware
      await middleware(mockRequest as NextRequest);
      
      // Should redirect to landing page
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/',
        })
      );
    });
  });

  describe('Session management', () => {
    it('should maintain session across requests', async () => {
      // First request: Successful authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      // Access platform route
      mockRequest.url = 'http://localhost:3000/feed';
      mockRequest.nextUrl!.pathname = '/feed';
      await middleware(mockRequest as NextRequest);
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      // Second request: Same session should still be valid
      mockRequest.url = 'http://localhost:3000/profile';
      mockRequest.nextUrl!.pathname = '/profile';
      await middleware(mockRequest as NextRequest);
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      // Verify getUser was called for each request
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(2);
    });

    it('should handle missing environment variables gracefully', async () => {
      // Clear environment variables
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Should not crash
      await expect(middleware(mockRequest as NextRequest)).resolves.not.toThrow();
    });
  });

  describe('Route protection logic', () => {
    const testCases = [
      { path: '/feed', isPlatform: true, description: 'feed page' },
      { path: '/jobs/new', isPlatform: true, description: 'job creation page' },
      { path: '/profile/123', isPlatform: true, description: 'profile page' },
      { path: '/subscribe', isPlatform: true, description: 'subscription page' },
      { path: '/notifications', isPlatform: true, description: 'notifications page' },
      { path: '/', isPlatform: false, description: 'landing page' },
      { path: '/auth/callback', isPlatform: false, description: 'callback route' },
      { path: '/auth/error', isPlatform: false, description: 'error page' },
    ];

    testCases.forEach(({ path, isPlatform, description }) => {
      it(`should ${isPlatform ? 'protect' : 'allow'} access to ${description}`, async () => {
        // Arrange
        mockRequest.url = `http://localhost:3000${path}`;
        mockRequest.nextUrl!.pathname = path;
        
        if (isPlatform) {
          mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: new Error('No user'),
          });
        } else {
          mockSupabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: null,
          });
        }

        // Act
        await middleware(mockRequest as NextRequest);

        // Assert
        if (isPlatform) {
          expect(NextResponse.redirect).toHaveBeenCalledWith(
            expect.objectContaining({
              href: 'http://localhost:3000/',
            })
          );
        } else {
          expect(NextResponse.redirect).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('Error scenarios', () => {
    it('should handle Supabase API errors gracefully', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/feed';
      mockRequest.nextUrl!.pathname = '/feed';
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Supabase API error'));

      // Act & Assert (should not throw)
      await expect(middleware(mockRequest as NextRequest)).resolves.not.toThrow();
    });

    it('should handle malformed callback URLs', async () => {
      // Arrange
      const malformedRequest = {
        url: 'http://localhost:3000/auth/callback?',
      } as NextRequest;

      // Act
      const response = await callbackGET(malformedRequest);

      // Assert
      expect(response.url).toBe('/');
    });
  });

  describe('Complete authentication lifecycle (Req 1.1-1.6)', () => {
    it('should complete full OAuth flow from initiation to authenticated access', async () => {
      // Step 1: User initiates OAuth (Req 1.1, 1.2)
      // (Handled by Supabase client - not tested here)

      // Step 2: Google redirects with authorization code (Req 1.2)
      const callbackRequest = {
        url: 'http://localhost:3000/auth/callback?code=valid-auth-code',
      } as NextRequest;

      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
        data: {
          session: {
            access_token: 'test-token',
            refresh_token: 'test-refresh',
            user: { id: 'user-123', email: 'test@example.com' },
          },
        },
      });

      // Step 3: Exchange code for session (Req 1.3)
      const callbackResponse = await callbackGET(callbackRequest);
      expect(callbackResponse.url).toBe('/feed');
      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('valid-auth-code');

      // Step 4: Access platform with valid session (Req 1.5)
      mockRequest.url = 'http://localhost:3000/feed';
      mockRequest.nextUrl!.pathname = '/feed';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      await middleware(mockRequest as NextRequest);
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      // Step 5: Session expires (Req 1.5)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Session expired'),
      });

      const redirectMock = jest.fn();
      (NextResponse.redirect as jest.Mock).mockImplementation(redirectMock);

      // Step 6: Redirect to sign-in (Req 1.5)
      await middleware(mockRequest as NextRequest);
      expect(redirectMock).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/',
        })
      );
    });

    it('should handle OAuth denial and error display (Req 1.4)', async () => {
      // Step 1: User denies Google consent
      const deniedRequest = {
        url: 'http://localhost:3000/auth/callback?error=access_denied&error_description=User%20denied%20consent',
      } as NextRequest;

      // Step 2: Redirect to error page
      await callbackGET(deniedRequest);
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/error'),
        })
      );
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('reason=access_denied'),
        })
      );
    });

    it('should handle sign-out and session invalidation (Req 1.6)', async () => {
      // Step 1: User is authenticated
      mockRequest.url = 'http://localhost:3000/feed';
      mockRequest.nextUrl!.pathname = '/feed';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      await middleware(mockRequest as NextRequest);
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      // Step 2: User signs out (session invalidated)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('No session'),
      });

      const redirectMock = jest.fn();
      (NextResponse.redirect as jest.Mock).mockImplementation(redirectMock);

      // Step 3: Attempt to access platform route
      await middleware(mockRequest as NextRequest);

      // Step 4: Redirected to public landing page (Req 1.6)
      expect(redirectMock).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/',
        })
      );
    });
  });

  describe('Session refresh and token management', () => {
    it('should refresh session on each middleware call', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/feed';
      mockRequest.nextUrl!.pathname = '/feed';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      // Act
      await middleware(mockRequest as NextRequest);
      await middleware(mockRequest as NextRequest);
      await middleware(mockRequest as NextRequest);

      // Assert
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(3);
    });

    it('should handle token refresh failures', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/feed';
      mockRequest.nextUrl!.pathname = '/feed';
      mockSupabase.auth.getUser
        .mockResolvedValueOnce({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { user: null },
          error: new Error('Token refresh failed'),
        });

      // Act - First request succeeds
      await middleware(mockRequest as NextRequest);
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      const redirectMock = jest.fn();
      (NextResponse.redirect as jest.Mock).mockImplementation(redirectMock);

      // Act - Second request fails
      await middleware(mockRequest as NextRequest);

      // Assert - Should redirect
      expect(redirectMock).toHaveBeenCalled();
    });
  });

  describe('Edge cases and error recovery', () => {
    it('should handle missing authorization code', async () => {
      // Arrange
      const noCodeRequest = {
        url: 'http://localhost:3000/auth/callback',
      } as NextRequest;

      // Act
      const response = await callbackGET(noCodeRequest);

      // Assert
      expect(response.url).toBe('/');
    });

    it('should handle code exchange timeout', async () => {
      // Arrange
      const timeoutRequest = {
        url: 'http://localhost:3000/auth/callback?code=timeout-code',
      } as NextRequest;

      mockSupabase.auth.exchangeCodeForSession.mockImplementation(() =>
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      // Act & Assert
      await expect(callbackGET(timeoutRequest)).rejects.toThrow('Timeout');
    });

    it('should handle multiple OAuth errors simultaneously', async () => {
      // Arrange
      const errorRequest1 = {
        url: 'http://localhost:3000/auth/callback?error=access_denied',
      } as NextRequest;
      const errorRequest2 = {
        url: 'http://localhost:3000/auth/callback?error=server_error',
      } as NextRequest;

      // Act
      const responses = await Promise.all([
        callbackGET(errorRequest1),
        callbackGET(errorRequest2),
      ]);

      // Assert
      expect(NextResponse.redirect).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid session state changes', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/feed';
      mockRequest.nextUrl!.pathname = '/feed';

      // Simulate rapid state changes
      mockSupabase.auth.getUser
        .mockResolvedValueOnce({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { user: null },
          error: new Error('Session expired'),
        })
        .mockResolvedValueOnce({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        });

      // Act
      await middleware(mockRequest as NextRequest);
      await middleware(mockRequest as NextRequest);
      await middleware(mockRequest as NextRequest);

      // Assert - Should handle all state changes
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(3);
    });
  });
});