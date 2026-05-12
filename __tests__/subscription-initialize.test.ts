/**
 * Unit tests for Paystack payment initialization route
 * Validates: Requirements 5.1, 5.2, 5.3, 5.6, 5.7
 */

import { POST } from '../app/api/subscriptions/initialize/route';
import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('next/server');

describe('POST /api/subscriptions/initialize', () => {
  let mockRequest: Partial<NextRequest>;
  let mockCreateClientWithAsyncCookies: jest.Mock;
  let mockSupabase: any;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_mockkey';
    process.env.PAYMENT_TEST_MODE = 'false';

    // Mock request
    mockRequest = {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: jest.fn(),
      url: 'http://localhost:3000/api/subscriptions/initialize'
    };

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(() => ({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null
        }))
      },
      from: jest.fn((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { email: 'test@example.com' },
                  error: null
                }))
              }))
            }))
          };
        }
        if (table === 'subscriptions') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  gt: jest.fn(() => ({
                    maybeSingle: jest.fn(() => ({
                      data: null, // No active subscription
                      error: { code: 'PGRST116', message: 'No rows returned' }
                    }))
                  }))
                }))
              }))
            }))
          };
        }
        return {};
      })
    };

    // Mock createClientWithAsyncCookies
    mockCreateClientWithAsyncCookies = jest.fn(() => mockSupabase);
    require('@/lib/supabase').createClientWithAsyncCookies = mockCreateClientWithAsyncCookies;

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Mock NextResponse.json
    (NextResponse.json as jest.Mock) = jest.fn((data, options) => ({
      ...data,
      status: options?.status || 200
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication validation', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'monthly', paymentMethod: 'all' });

      // Act
      const response = await POST(mockRequest as NextRequest);

      // Assert
      expect(response.status).toBe(401);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    });

    it('should return 404 if user not found in users table', async () => {
      // Arrange
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { code: 'PGRST116', message: 'No rows returned' }
            }))
          }))
        }))
      });
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'monthly', paymentMethod: 'all' });

      // Act
      const response = await POST(mockRequest as NextRequest);

      // Assert
      expect(response.status).toBe(404);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'User not found' },
        { status: 404 }
      );
    });
  });

  describe('Input validation', () => {
    it('should return 400 for invalid subscription tier', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'invalid', paymentMethod: 'all' });

      // Act
      const response = await POST(mockRequest as NextRequest);

      // Assert
      expect(response.status).toBe(400);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    });

    it('should return 400 for invalid payment method', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'monthly', paymentMethod: 'invalid' });

      // Act
      const response = await POST(mockRequest as NextRequest);

      // Assert
      expect(response.status).toBe(400);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    });

    it('should accept valid payment methods: momo, card, all', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'monthly', paymentMethod: 'momo' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          status: true,
          message: 'Authorization URL created',
          data: {
            authorization_url: 'https://paystack.com/pay/test-ref',
            reference: 'test-ref-123',
            access_code: 'access-123'
          }
        })
      });

      // Act
      const response = await POST(mockRequest as NextRequest);

      // Assert
      expect(mockFetch).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalled();
    });
  });

  describe('Subscription validation', () => {
    it('should return 400 if user already has active subscription', async () => {
      // Arrange
      // Temporarily override the mock for this test
      const originalFrom = mockSupabase.from;
      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { email: 'test@example.com' },
                  error: null
                }))
              }))
            }))
          };
        }
        if (table === 'subscriptions') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => ({
                  gt: jest.fn(() => ({
                    maybeSingle: jest.fn(() => ({
                      data: { id: 'sub-123' }, // Active subscription exists
                      error: null
                    }))
                  }))
                }))
              }))
            }))
          };
        }
        return {};
      });
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'monthly', paymentMethod: 'all' });

      // Act
      const response = await POST(mockRequest as NextRequest);

      // Assert
      expect(response.status).toBe(400);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );

      // Restore original mock
      mockSupabase.from = originalFrom;
    });
  });

  describe('Test mode functionality (Req 5.7)', () => {
    it('should return mock response when PAYMENT_TEST_MODE is true', async () => {
      // Arrange
      process.env.PAYMENT_TEST_MODE = 'true';
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'monthly', paymentMethod: 'momo' });

      // Act
      const response = await POST(mockRequest as NextRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: true,
          message: expect.stringContaining('Test mode'),
          data: expect.objectContaining({
            authorization_url: expect.stringContaining('/subscribe/test-complete'),
            reference: expect.stringContaining('test_'),
            amount: 4000, // GHS 40 in pesewas
            currency: 'GHS',
            channels: ['mobile_money']
          })
        })
      );

      process.env.PAYMENT_TEST_MODE = 'false';
    });

    it('should include tier in test mode reference', async () => {
      // Arrange
      process.env.PAYMENT_TEST_MODE = 'true';
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'quarterly', paymentMethod: 'card' });

      // Act
      const response = await POST(mockRequest as NextRequest);

      // Assert
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reference: expect.stringContaining('quarterly'),
            amount: 10800 // GHS 108 in pesewas
          })
        })
      );

      process.env.PAYMENT_TEST_MODE = 'false';
    });
  });

  describe('Paystack API integration (Req 5.1, 5.2, 5.3)', () => {
    it('should call Paystack API with correct parameters for MoMo payment', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'monthly', paymentMethod: 'momo' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          status: true,
          message: 'Authorization URL created',
          data: {
            authorization_url: 'https://paystack.com/pay/test-ref',
            reference: 'test-ref-123',
            access_code: 'access-123'
          }
        })
      });

      // Act
      await POST(mockRequest as NextRequest);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paystack.co/transaction/initialize',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer sk_test_mockkey'
          }),
          body: JSON.stringify({
            email: 'test@example.com',
            amount: 4000,
            currency: 'GHS',
            channels: ['mobile_money'],
            callback_url: 'http://localhost:3000/subscribe/callback',
            metadata: {
              tier: 'monthly',
              userId: 'user-123',
              userEmail: 'test@example.com'
            }
          })
        })
      );
    });

    it('should call Paystack API with correct parameters for card payment', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'annual', paymentMethod: 'card' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          status: true,
          message: 'Authorization URL created',
          data: {
            authorization_url: 'https://paystack.com/pay/test-ref',
            reference: 'test-ref-123',
            access_code: 'access-123'
          }
        })
      });

      // Act
      await POST(mockRequest as NextRequest);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.paystack.co/transaction/initialize',
        expect.objectContaining({
          body: JSON.stringify({
            email: 'test@example.com',
            amount: 38400, // GHS 384 in pesewas
            currency: 'GHS',
            channels: ['card'],
            callback_url: 'http://localhost:3000/subscribe/callback',
            metadata: {
              tier: 'annual',
              userId: 'user-123',
              userEmail: 'test@example.com'
            }
          })
        })
      );
    });

    it('should handle Paystack API errors gracefully', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'monthly', paymentMethod: 'all' });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          status: false,
          message: 'Invalid amount'
        })
      });

      // Act
      const response = await POST(mockRequest as NextRequest);

      // Assert
      expect(response.status).toBe(400);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    });

    it('should return 500 if Paystack secret key is not set', async () => {
      // Arrange
      const originalKey = process.env.PAYSTACK_SECRET_KEY;
      delete process.env.PAYSTACK_SECRET_KEY;
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'monthly', paymentMethod: 'all' });

      // Act
      const response = await POST(mockRequest as NextRequest);

      // Assert
      expect(response.status).toBe(500);
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Payment configuration error' },
        { status: 500 }
      );

      process.env.PAYSTACK_SECRET_KEY = originalKey;
    });
  });

  describe('Environment variable security (Req 5.6)', () => {
    it('should use environment variables for Paystack configuration', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'monthly', paymentMethod: 'all' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          status: true,
          message: 'Authorization URL created',
          data: {
            authorization_url: 'https://paystack.com/pay/test-ref',
            reference: 'test-ref-123',
            access_code: 'access-123'
          }
        })
      });

      // Act
      await POST(mockRequest as NextRequest);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer sk_test_mockkey'
          })
        })
      );
    });
  });

  describe('Payment flow (Req 5.3)', () => {
    it('should return authorization URL for redirection', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'monthly', paymentMethod: 'all' });
      const mockPaystackResponse = {
        status: true,
        message: 'Authorization URL created',
        data: {
          authorization_url: 'https://paystack.com/pay/test-ref-123',
          reference: 'test-ref-123',
          access_code: 'access-123'
        }
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockPaystackResponse)
      });

      // Act
      const response = await POST(mockRequest as NextRequest);

      // Assert
      expect(NextResponse.json).toHaveBeenCalledWith(mockPaystackResponse);
    });

    it('should include correct callback URL', async () => {
      // Arrange
      mockRequest.json = jest.fn().mockResolvedValue({ tier: 'monthly', paymentMethod: 'all' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          status: true,
          message: 'Authorization URL created',
          data: {
            authorization_url: 'https://paystack.com/pay/test-ref',
            reference: 'test-ref-123',
            access_code: 'access-123'
          }
        })
      });

      // Act
      await POST(mockRequest as NextRequest);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"callback_url":"http://localhost:3000/subscribe/callback"')
        })
      );
    });
  });
});