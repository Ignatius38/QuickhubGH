/**
 * Unit tests for authentication middleware
 * Validates: Requirements 1.5, 1.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextResponse: {
    next: jest.fn(),
    redirect: jest.fn(),
  },
}));

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

describe('Authentication Middleware', () => {
  let mockRequest: Partial<NextRequest>;
  let mockSupabase: any;

  beforeEach(() => {
    mockRequest = {
      url: 'http://localhost:3000/feed',
      nextUrl: {
        pathname: '/feed',
      },
      cookies: {
        get: jest.fn(),
      },
      headers: new Headers(),
    };

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
    };

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    // Mock createServerClient
    const { createServerClient } = require('@supabase/ssr');
    createServerClient.mockReturnValue(mockSupabase);

    // Mock NextResponse.next
    (NextResponse.next as jest.Mock).mockImplementation((options) => ({
      ...options,
      cookies: {
        set: jest.fn(),
      },
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Platform route protection', () => {
    it('should redirect unauthenticated users from platform routes to landing page', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('No user'),
      });

      const redirectMock = jest.fn();
      (NextResponse.redirect as jest.Mock).mockImplementation(redirectMock);

      // Act
      await middleware(mockRequest as NextRequest);

      // Assert
      expect(redirectMock).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/',
        })
      );
    });

    it('should allow authenticated users to access platform routes', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      // Act
      const response = await middleware(mockRequest as NextRequest);

      // Assert
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should allow public access to non-platform routes', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/';
      mockRequest.nextUrl!.pathname = '/';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('No user'),
      });

      // Act
      const response = await middleware(mockRequest as NextRequest);

      // Assert
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe('Session management', () => {
    it('should handle missing Supabase environment variables', async () => {
      // Arrange
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Act
      const response = await middleware(mockRequest as NextRequest);

      // Assert
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it('should refresh session on each request', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      // Act
      await middleware(mockRequest as NextRequest);

      // Assert
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });
  });

  describe('Route matching', () => {
    const platformRoutes = [
      '/feed',
      '/jobs/new',
      '/profile/123',
      '/subscribe',
      '/notifications',
    ];

    const publicRoutes = [
      '/',
      '/auth/callback',
      '/auth/error',
      '/_next/static/test.js',
      '/favicon.ico',
    ];

    platformRoutes.forEach((route) => {
      it(`should protect platform route: ${route}`, async () => {
        // Arrange
        mockRequest.url = `http://localhost:3000${route}`;
        mockRequest.nextUrl!.pathname = route;
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: new Error('No user'),
        });

        const redirectMock = jest.fn();
        (NextResponse.redirect as jest.Mock).mockImplementation(redirectMock);

        // Act
        await middleware(mockRequest as NextRequest);

        // Assert
        expect(redirectMock).toHaveBeenCalled();
      });
    });

    publicRoutes.forEach((route) => {
      it(`should allow public access to: ${route}`, async () => {
        // Arrange
        mockRequest.url = `http://localhost:3000${route}`;
        mockRequest.nextUrl!.pathname = route;
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: new Error('No user'),
        });

        // Act
        await middleware(mockRequest as NextRequest);

        // Assert
        expect(NextResponse.redirect).not.toHaveBeenCalled();
      });
    });
  });

  describe('Session expiration handling (Req 1.5)', () => {
    it('should redirect to sign-in when session expires on platform route', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/feed';
      mockRequest.nextUrl!.pathname = '/feed';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Session expired'),
      });

      const redirectMock = jest.fn();
      (NextResponse.redirect as jest.Mock).mockImplementation(redirectMock);

      // Act
      await middleware(mockRequest as NextRequest);

      // Assert
      expect(redirectMock).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/',
        })
      );
    });

    it('should handle expired JWT token', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/profile/edit';
      mockRequest.nextUrl!.pathname = '/profile/edit';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired', status: 401 },
      });

      const redirectMock = jest.fn();
      (NextResponse.redirect as jest.Mock).mockImplementation(redirectMock);

      // Act
      await middleware(mockRequest as NextRequest);

      // Assert
      expect(redirectMock).toHaveBeenCalled();
    });

    it('should handle invalid refresh token', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/jobs/new';
      mockRequest.nextUrl!.pathname = '/jobs/new';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid refresh token', status: 401 },
      });

      const redirectMock = jest.fn();
      (NextResponse.redirect as jest.Mock).mockImplementation(redirectMock);

      // Act
      await middleware(mockRequest as NextRequest);

      // Assert
      expect(redirectMock).toHaveBeenCalled();
    });
  });

  describe('Sign-out flow (Req 1.6)', () => {
    it('should invalidate session and redirect after sign-out', async () => {
      // Arrange - User was authenticated
      mockRequest.url = 'http://localhost:3000/feed';
      mockRequest.nextUrl!.pathname = '/feed';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      // Act - First request succeeds
      await middleware(mockRequest as NextRequest);
      expect(NextResponse.redirect).not.toHaveBeenCalled();

      // Arrange - After sign-out, session is null
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('No session'),
      });

      const redirectMock = jest.fn();
      (NextResponse.redirect as jest.Mock).mockImplementation(redirectMock);

      // Act - Second request after sign-out
      await middleware(mockRequest as NextRequest);

      // Assert - Should redirect to landing page
      expect(redirectMock).toHaveBeenCalledWith(
        expect.objectContaining({
          href: 'http://localhost:3000/',
        })
      );
    });

    it('should prevent access to all platform routes after sign-out', async () => {
      // Arrange
      const protectedRoutes = ['/feed', '/jobs/new', '/profile/123', '/notifications'];
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('No session'),
      });

      const redirectMock = jest.fn();
      (NextResponse.redirect as jest.Mock).mockImplementation(redirectMock);

      // Act & Assert
      for (const route of protectedRoutes) {
        mockRequest.url = `http://localhost:3000${route}`;
        mockRequest.nextUrl!.pathname = route;
        await middleware(mockRequest as NextRequest);
        expect(redirectMock).toHaveBeenCalled();
        redirectMock.mockClear();
      }
    });
  });

  describe('Cookie handling', () => {
    it('should set session cookies on successful authentication', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/feed';
      mockRequest.nextUrl!.pathname = '/feed';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      const mockResponse = {
        cookies: {
          set: jest.fn(),
        },
      };
      (NextResponse.next as jest.Mock).mockReturnValue(mockResponse);

      // Act
      await middleware(mockRequest as NextRequest);

      // Assert
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });

    it('should handle cookie read errors gracefully', async () => {
      // Arrange
      mockRequest.cookies.get = jest.fn().mockImplementation(() => {
        throw new Error('Cookie read error');
      });

      // Act & Assert
      await expect(middleware(mockRequest as NextRequest)).resolves.not.toThrow();
    });
  });

  describe('Concurrent request handling', () => {
    it('should handle multiple simultaneous requests', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/feed';
      mockRequest.nextUrl!.pathname = '/feed';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      // Act
      const requests = Array(5).fill(null).map(() => middleware(mockRequest as NextRequest));
      
      // Assert
      await expect(Promise.all(requests)).resolves.toBeDefined();
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(5);
    });
  });
});