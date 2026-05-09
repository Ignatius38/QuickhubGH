/**
 * Integration tests for job creation with subscription checks
 * Validates: Requirements 1.5, 2.5 from bugfix.md
 * 
 * Tests that the subscription gate properly blocks job creation
 * when users don't have active subscriptions.
 */

import { createJob } from '@/app/actions/jobs';
import { hasActiveSubscription } from '@/lib/subscription';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/lib/subscription');

describe('Job Creation with Subscription Check Integration', () => {
  let mockCreateClientWithAsyncCookies: jest.Mock;
  let mockSupabase: any;
  let mockHasActiveSubscription: jest.Mock;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn()
      },
      from: jest.fn()
    };

    // Mock createClientWithAsyncCookies
    mockCreateClientWithAsyncCookies = jest.fn(() => mockSupabase);
    require('@/lib/supabase').createClientWithAsyncCookies = mockCreateClientWithAsyncCookies;

    // Mock hasActiveSubscription
    mockHasActiveSubscription = jest.fn();
    (hasActiveSubscription as jest.Mock) = mockHasActiveSubscription;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Subscription gate blocking', () => {
    it('should block job creation when user has no active subscription', async () => {
      // Arrange
      const userId = 'blocked-user-123';
      const formData = new FormData();
      formData.append('title', 'Test Job');
      formData.append('description', 'Test job description');
      formData.append('location', 'Accra');
      formData.append('budget', '1000');
      formData.append('tags', '1');
      formData.append('tags', '2');

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId, email: 'test@example.com' } },
        error: null
      });

      // Mock subscription check returning false (no subscription)
      mockHasActiveSubscription.mockResolvedValue(false);

      // Act
      const result = await createJob(formData);

      // Assert
      expect(result).toEqual({ error: 'subscription_required' });
      expect(mockHasActiveSubscription).toHaveBeenCalledWith(mockSupabase, userId);
      // Should not proceed to create job
      expect(mockSupabase.from).not.toHaveBeenCalledWith('jobs');
    });

    it('should allow job creation when user has active subscription', async () => {
      // Arrange
      const userId = 'allowed-user-456';
      const formData = new FormData();
      formData.append('title', 'Test Job');
      formData.append('description', 'Test job description');
      formData.append('location', 'Accra');
      formData.append('budget', '1000');
      formData.append('tags', '1');
      formData.append('tags', '2');

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId, email: 'test@example.com' } },
        error: null
      });

      // Mock subscription check returning true (has subscription)
      mockHasActiveSubscription.mockResolvedValue(true);

      // Mock successful job creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'jobs') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { id: 'job-123' },
                  error: null
                }))
              }))
            }))
          };
        }
        if (table === 'job_tags') {
          return {
            insert: jest.fn(() => ({
              error: null
            }))
          };
        }
        return {};
      });

      // Act
      const result = await createJob(formData);

      // Assert
      expect(result).toEqual({ jobId: 'job-123' });
      expect(mockHasActiveSubscription).toHaveBeenCalledWith(mockSupabase, userId);
      // Should proceed to create job
      expect(mockSupabase.from).toHaveBeenCalledWith('jobs');
    });

    it('should handle newly created user profiles (grant trial access)', async () => {
      // Arrange: New user who just signed up via Google OAuth
      const userId = 'new-google-user-789';
      const formData = new FormData();
      formData.append('title', 'New User Job');
      formData.append('description', 'Job from new Google OAuth user');
      formData.append('location', 'Kumasi');
      formData.append('budget', '500');
      formData.append('tags', '3');

      // Mock authenticated user (newly created via Google OAuth)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId, email: 'newuser@gmail.com' } },
        error: null
      });

      // Mock subscription check returning true (new user gets trial)
      mockHasActiveSubscription.mockResolvedValue(true);

      // Mock successful job creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'jobs') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { id: 'job-456' },
                  error: null
                }))
              }))
            }))
          };
        }
        if (table === 'job_tags') {
          return {
            insert: jest.fn(() => ({
              error: null
            }))
          };
        }
        return {};
      });

      // Act
      const result = await createJob(formData);

      // Assert: New user should be able to create job (gets trial)
      expect(result).toEqual({ jobId: 'job-456' });
      expect(mockHasActiveSubscription).toHaveBeenCalledWith(mockSupabase, userId);
    });

    it('should handle user with expired trial (block job creation)', async () => {
      // Arrange: User with expired trial
      const userId = 'expired-trial-user-999';
      const formData = new FormData();
      formData.append('title', 'Expired User Job');
      formData.append('description', 'Job from user with expired trial');
      formData.append('location', 'Takoradi');
      formData.append('budget', '750');
      formData.append('tags', '4');

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId, email: 'expired@example.com' } },
        error: null
      });

      // Mock subscription check returning false (expired trial)
      mockHasActiveSubscription.mockResolvedValue(false);

      // Act
      const result = await createJob(formData);

      // Assert: User with expired trial should be blocked
      expect(result).toEqual({ error: 'subscription_required' });
      expect(mockHasActiveSubscription).toHaveBeenCalledWith(mockSupabase, userId);
    });
  });

  describe('Integration with user profile creation', () => {
    it('should work correctly after user profile is created via Google OAuth', async () => {
      // This test simulates the full flow:
      // 1. User signs in with Google OAuth
      // 2. User profile is created in public.users (bugfix ensures this happens)
      // 3. User tries to create a job
      // 4. Subscription check should work correctly

      // Arrange
      const userId = 'google-oauth-user-111';
      const userEmail = 'googleuser@gmail.com';
      const formData = new FormData();
      formData.append('title', 'Google User Job');
      formData.append('description', 'Job from Google OAuth user with profile');
      formData.append('location', 'Cape Coast');
      formData.append('budget', '1200');
      formData.append('tags', '5');

      // Mock authenticated user (Google OAuth user)
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId, email: userEmail } },
        error: null
      });

      // Mock subscription check - user should get trial since profile was created
      mockHasActiveSubscription.mockResolvedValue(true);

      // Mock successful job creation
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'jobs') {
          return {
            insert: jest.fn(() => ({
              select: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: { id: 'job-google-123' },
                  error: null
                }))
              }))
            }))
          };
        }
        if (table === 'job_tags') {
          return {
            insert: jest.fn(() => ({
              error: null
            }))
          };
        }
        return {};
      });

      // Act
      const result = await createJob(formData);

      // Assert: Google OAuth user with profile should be able to create job
      expect(result).toEqual({ jobId: 'job-google-123' });
      expect(mockHasActiveSubscription).toHaveBeenCalledWith(mockSupabase, userId);
    });

    it('should handle edge case where subscription check fails (database error)', async () => {
      // Arrange: Subscription check fails due to database error
      const userId = 'db-error-user-222';
      const formData = new FormData();
      formData.append('title', 'DB Error Job');
      formData.append('description', 'Job when subscription check has DB error');
      formData.append('location', 'Tamale');
      formData.append('budget', '800');
      formData.append('tags', '6');

      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId, email: 'dberror@example.com' } },
        error: null
      });

      // Mock subscription check throwing error
      mockHasActiveSubscription.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const result = await createJob(formData);

      // Assert: Should handle subscription check error gracefully
      // The actual implementation might return an error or throw
      // Based on the code, it should return { error: 'Internal server error' }
      expect(result).toEqual({ error: 'Internal server error' });
    });
  });
});