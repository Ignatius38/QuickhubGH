/**
 * Unit tests for OAuth callback route
 * Validates: Requirements 1.3, 1.4
 */

import { GET } from '../app/(public)/auth/callback/route';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies
jest.mock('@supabase/ssr');
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));
jest.mock('next/server');

describe('OAuth Callback Route', () => {
  let mockRequest: Partial<NextRequest>;
  let mockSupabase: any;
  let mockCookieStore: any;

  beforeEach(() => {
    mockRequest = {
      url: 'http://localhost:3000/auth/callback?code=test-code',
    };

    mockSupabase = {
      auth: {
        exchangeCodeForSession: jest.fn(),
      },
    };

    mockCookieStore = {
      getAll: jest.fn(),
      set: jest.fn(),
    };

    // Mock createServerClient
    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

    // Mock cookies
    (cookies as jest.Mock).mockReturnValue(mockCookieStore);

    // Mock NextResponse.redirect
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

  describe('Successful OAuth flow', () => {
    it('should exchange code for session and redirect to feed', async () => {
      // Arrange
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
      });

      // Act
      const response = await GET(mockRequest as NextRequest);

      // Assert
      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code');
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: '/feed',
        })
      );
    });

    it('should handle successful session exchange', async () => {
      // Arrange
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
      });

      // Act
      const response = await GET(mockRequest as NextRequest);

      // Assert
      expect(response).toEqual(expect.objectContaining({
        url: '/feed',
      }));
    });
  });

  describe('OAuth error handling', () => {
    it('should redirect to error page when OAuth returns error', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/auth/callback?error=access_denied&error_description=User%20denied%20access';

      // Act
      const response = await GET(mockRequest as NextRequest);

      // Assert
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

    it('should redirect to error page when code exchange fails', async () => {
      // Arrange
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: new Error('Exchange failed'),
      });

      // Act
      const response = await GET(mockRequest as NextRequest);

      // Assert
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/error'),
        })
      );
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('reason=exchange_failed'),
        })
      );
    });

    it('should handle missing code parameter', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/auth/callback';

      // Act
      const response = await GET(mockRequest as NextRequest);

      // Assert
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: '/',
        })
      );
    });
  });

  describe('Cookie management', () => {
    it('should set cookies on successful authentication', async () => {
      // Arrange
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
      });

      // Act
      await GET(mockRequest as NextRequest);

      // Assert
      expect(mockCookieStore.set).toHaveBeenCalled();
    });

    it('should handle cookie setting errors gracefully', async () => {
      // Arrange
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
      });
      mockCookieStore.set.mockImplementation(() => {
        throw new Error('Cookie error');
      });

      // Act & Assert (should not throw)
      await expect(GET(mockRequest as NextRequest)).resolves.not.toThrow();
    });
  });

  describe('URL parameter parsing', () => {
    it('should extract code from URL parameters', async () => {
      // Arrange
      const testCode = 'test-auth-code-123';
      mockRequest.url = `http://localhost:3000/auth/callback?code=${testCode}`;

      // Act
      await GET(mockRequest as NextRequest);

      // Assert
      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(testCode);
    });

    it('should extract error parameters from URL', async () => {
      // Arrange
      const error = 'server_error';
      const description = 'Internal%20server%20error';
      mockRequest.url = `http://localhost:3000/auth/callback?error=${error}&error_description=${description}`;

      // Act
      await GET(mockRequest as NextRequest);

      // Assert
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining(`reason=${error}`),
        })
      );
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining(`description=${description}`),
        })
      );
    });
  });

  describe('Google OAuth consent scenarios (Req 1.2)', () => {
    it('should handle user denying Google consent', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/auth/callback?error=access_denied&error_description=User%20denied%20consent';

      // Act
      const response = await GET(mockRequest as NextRequest);

      // Assert
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

    it('should handle Google OAuth timeout', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/auth/callback?error=timeout&error_description=OAuth%20timeout';

      // Act
      const response = await GET(mockRequest as NextRequest);

      // Assert
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/error'),
        })
      );
    });

    it('should handle invalid OAuth state parameter', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/auth/callback?error=invalid_request&error_description=Invalid%20state';

      // Act
      const response = await GET(mockRequest as NextRequest);

      // Assert
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/error'),
        })
      );
    });
  });

  describe('Session creation (Req 1.3)', () => {
    it('should create authenticated session on successful OAuth callback', async () => {
      // Arrange
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
        data: {
          session: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            user: { id: 'user-123', email: 'test@example.com' },
          },
        },
      });

      // Act
      await GET(mockRequest as NextRequest);

      // Assert
      expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code');
      expect(mockCookieStore.set).toHaveBeenCalled();
    });

    it('should handle session creation with user metadata', async () => {
      // Arrange
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
        data: {
          session: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            user: {
              id: 'user-123',
              email: 'test@example.com',
              user_metadata: {
                full_name: 'Test User',
                avatar_url: 'https://example.com/avatar.jpg',
              },
            },
          },
        },
      });

      // Act
      const response = await GET(mockRequest as NextRequest);

      // Assert
      expect(response.url).toBe('/feed');
    });
  });

  describe('Error handling edge cases (Req 1.4)', () => {
    it('should handle network errors during code exchange', async () => {
      // Arrange
      mockSupabase.auth.exchangeCodeForSession.mockRejectedValue(
        new Error('Network error')
      );

      // Act & Assert
      await expect(GET(mockRequest as NextRequest)).rejects.toThrow('Network error');
    });

    it('should handle malformed error descriptions', async () => {
      // Arrange
      mockRequest.url = 'http://localhost:3000/auth/callback?error=server_error&error_description=';

      // Act
      const response = await GET(mockRequest as NextRequest);

      // Assert
      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          href: expect.stringContaining('/auth/error'),
        })
      );
    });

    it('should handle concurrent callback requests', async () => {
      // Arrange
      mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
        error: null,
      });

      // Act
      const response1 = GET(mockRequest as NextRequest);
      const response2 = GET(mockRequest as NextRequest);

      // Assert
      await expect(Promise.all([response1, response2])).resolves.toBeDefined();
    });
  });
});