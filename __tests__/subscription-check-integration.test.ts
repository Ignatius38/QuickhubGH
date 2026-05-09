/**
 * Unit tests for subscription check integration with user profile creation
 * Validates: Requirements 1.5, 2.5 from bugfix.md
 * 
 * Tests subscription check functionality for:
 * 1. Newly created user profiles (after Google OAuth login)
 * 2. Existing user profiles (should continue to work)
 * 3. Subscription gate blocking when user has no subscription
 */

import { hasActiveSubscription, getSubscriptionStatus } from '@/lib/subscription';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@/lib/supabase');

describe('Subscription Check Integration with User Profile Creation', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockGt: jest.Mock;
  let mockLimit: jest.Mock;
  let mockSingle: jest.Mock;
  let mockMaybeSingle: jest.Mock;

  beforeEach(() => {
    // Create mock chain for Supabase queries
    mockMaybeSingle = jest.fn();
    mockSingle = jest.fn();
    mockLimit = jest.fn(() => ({ single: mockSingle }));
    mockGt = jest.fn(() => ({ maybeSingle: mockMaybeSingle, limit: mockLimit }));
    mockEq = jest.fn(() => ({ eq: jest.fn(() => ({ gt: mockGt })) }));
    mockSelect = jest.fn(() => ({ eq: mockEq }));
    mockFrom = jest.fn(() => ({ select: mockSelect }));

    mockSupabase = {
      from: mockFrom,
      auth: {
        getUser: jest.fn()
      }
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Test 1: Subscription check for newly created user profile', () => {
    it('should grant free trial to newly created user (user not in public.users)', async () => {
      // Arrange: Simulate a newly created user (not in public.users table)
      const userId = 'new-user-123';
      const now = new Date();
      
      // Mock: No paid subscription
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gt: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: null, // No paid subscription
                    error: { code: 'PGRST116', message: 'No rows returned' }
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      // Mock: User not found in public.users (newly created)
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => ({
              data: null, // User not in public.users
              error: null
            }))
          }))
        }))
      });

      // Act
      const result = await hasActiveSubscription(mockSupabase, userId);

      // Assert: New user should get free trial (return true)
      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledTimes(2);
      expect(mockFrom).toHaveBeenCalledWith('subscriptions');
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('should grant free trial to user created within last 30 days', async () => {
      // Arrange: User created 15 days ago (within trial period)
      const userId = 'recent-user-456';
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      // Mock: No paid subscription
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gt: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: null,
                    error: { code: 'PGRST116', message: 'No rows returned' }
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      // Mock: User exists in public.users with recent creation date
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => ({
              data: { created_at: fifteenDaysAgo.toISOString() },
              error: null
            }))
          }))
        }))
      });

      // Act
      const result = await hasActiveSubscription(mockSupabase, userId);

      // Assert: User within 30-day trial should have active subscription
      expect(result).toBe(true);
    });
  });

  describe('Test 2: Subscription check for existing user profile', () => {
    it('should return true for user with active paid subscription', async () => {
      // Arrange: User with active paid subscription
      const userId = 'paid-user-789';
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // Subscription ends in 30 days

      // Mock: Active paid subscription exists
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gt: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: { id: 'sub-123', ends_at: futureDate.toISOString() },
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      // Act
      const result = await hasActiveSubscription(mockSupabase, userId);

      // Assert: User with paid subscription should have active subscription
      expect(result).toBe(true);
      // Should not check users table when paid subscription exists
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith('subscriptions');
    });

    it('should return false for user with expired trial (created > 30 days ago)', async () => {
      // Arrange: User created 45 days ago (trial expired)
      const userId = 'expired-user-999';
      const fortyFiveDaysAgo = new Date();
      fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

      // Mock: No paid subscription
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gt: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: null,
                    error: { code: 'PGRST116', message: 'No rows returned' }
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      // Mock: User exists with old creation date
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => ({
              data: { created_at: fortyFiveDaysAgo.toISOString() },
              error: null
            }))
          }))
        }))
      });

      // Act
      const result = await hasActiveSubscription(mockSupabase, userId);

      // Assert: User with expired trial should not have active subscription
      expect(result).toBe(false);
    });

    it('should return true for user with active subscription regardless of profile existence', async () => {
      // Arrange: Edge case - user has paid subscription but no profile (shouldn't happen with fix)
      const userId = 'edge-case-user';
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      // Mock: Active paid subscription exists
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gt: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: { id: 'sub-456', ends_at: futureDate.toISOString() },
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      // Act
      const result = await hasActiveSubscription(mockSupabase, userId);

      // Assert: Paid subscription takes precedence over profile check
      expect(result).toBe(true);
    });
  });

  describe('Test 3: Subscription gate blocking without profile', () => {
    it('should block job creation when user has no subscription', async () => {
      // This test simulates the integration with job creation
      // We'll test the hasActiveSubscription function directly
      
      // Arrange: User with no subscription (expired trial)
      const userId = 'blocked-user-111';
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Mock: No paid subscription
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gt: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: null,
                    error: { code: 'PGRST116', message: 'No rows returned' }
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      // Mock: User exists with very old creation date
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => ({
              data: { created_at: sixtyDaysAgo.toISOString() },
              error: null
            }))
          }))
        }))
      });

      // Act
      const result = await hasActiveSubscription(mockSupabase, userId);

      // Assert: User should be blocked (no active subscription)
      expect(result).toBe(false);
    });

    it('should allow job creation for user with active subscription', async () => {
      // Arrange: User with active subscription
      const userId = 'allowed-user-222';
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      // Mock: Active paid subscription
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gt: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: { id: 'sub-789', ends_at: futureDate.toISOString() },
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      // Act
      const result = await hasActiveSubscription(mockSupabase, userId);

      // Assert: User should be allowed (has active subscription)
      expect(result).toBe(true);
    });

    it('should handle database errors gracefully (fail-open design)', async () => {
      // Arrange: Database error scenario
      const userId = 'error-user-333';

      // Mock: Database error when checking subscriptions
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gt: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: null,
                    error: { code: 'PGRST500', message: 'Database error' }
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      // Mock: Database error when checking users
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => ({
              data: null,
              error: { code: 'PGRST500', message: 'Database error' }
            }))
          }))
        }))
      });

      // Act & Assert: Current implementation grants trial access on database errors (fail-open)
      // This might be intentional to avoid blocking users due to temporary database issues
      const result = await hasActiveSubscription(mockSupabase, userId);
      expect(result).toBe(true); // Fail-open: grant access on database errors
    });
  });

  describe('Test 4: Integration with getSubscriptionStatus function', () => {
    it('should return correct status for newly created user (trial)', async () => {
      // Arrange: New user not in public.users
      const userId = 'new-status-user';
      const now = new Date();
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + 30);

      // Mock: No subscription
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: null,
                  error: { code: 'PGRST116', message: 'No rows returned' }
                }))
              }))
            }))
          }))
        }))
      });

      // Mock: User not found in public.users
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => ({
              data: null,
              error: null
            }))
          }))
        }))
      });

      // Act
      const status = await getSubscriptionStatus(mockSupabase, userId);

      // Assert: Should return trial status for new user
      expect(status.status).toBe('trial');
      expect(status.isTrial).toBe(true);
      expect(status.endsAt).toBeDefined();
    });

    it('should return correct status for user with active paid subscription', async () => {
      // Arrange: User with active paid subscription
      const userId = 'paid-status-user';
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      // Mock: Active subscription
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: {
                    ends_at: futureDate.toISOString(),
                    status: 'active'
                  },
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Act
      const status = await getSubscriptionStatus(mockSupabase, userId);

      // Assert: Should return active status
      expect(status.status).toBe('active');
      expect(status.isTrial).toBe(false);
      expect(status.endsAt).toBe(futureDate.toISOString());
    });

    it('should return correct status for user with expired subscription', async () => {
      // Arrange: User with expired subscription
      const userId = 'expired-status-user';
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      // Mock: Expired subscription
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({
                single: jest.fn(() => ({
                  data: {
                    ends_at: pastDate.toISOString(),
                    status: 'active' // Still marked active but date expired
                  },
                  error: null
                }))
              }))
            }))
          }))
        }))
      });

      // Act
      const status = await getSubscriptionStatus(mockSupabase, userId);

      // Assert: Should return expired status
      expect(status.status).toBe('expired');
      expect(status.isTrial).toBe(false);
    });
  });

  describe('Test 5: Edge cases and error scenarios', () => {
    it('should handle null created_at in user record', async () => {
      // Arrange: User exists but created_at is null
      const userId = 'null-created-user';

      // Mock: No paid subscription
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gt: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: null,
                    error: { code: 'PGRST116', message: 'No rows returned' }
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      // Mock: User exists with null created_at
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => ({
              data: { created_at: null },
              error: null
            }))
          }))
        }))
      });

      // Act
      const result = await hasActiveSubscription(mockSupabase, userId);

      // Assert: Should return false when created_at is null
      expect(result).toBe(false);
    });

    it('should handle invalid date strings in created_at', async () => {
      // Arrange: User with invalid date string
      const userId = 'invalid-date-user';

      // Mock: No paid subscription
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gt: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn(() => ({
                    data: null,
                    error: { code: 'PGRST116', message: 'No rows returned' }
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      // Mock: User exists with invalid date string
      mockFrom.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => ({
              data: { created_at: 'invalid-date-string' },
              error: null
            }))
          }))
        }))
      });

      // Act
      const result = await hasActiveSubscription(mockSupabase, userId);

      // Assert: Should handle invalid dates gracefully (return false)
      expect(result).toBe(false);
    });
  });
});