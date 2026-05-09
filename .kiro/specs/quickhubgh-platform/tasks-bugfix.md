# Implementation Plan: QuickHubGH Platform Bugfix

## Overview

This implementation plan follows the bugfix workflow to fix the missing user profiles after Google OAuth login bug in the QuickHubGH platform. The plan uses the bug condition methodology with exploration tests before implementation and preservation tests to ensure no regressions.

## Bug Condition Specifications

From the bugfix.md and design.md documents:

**Bug Condition (C(X))**: 
```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type AuthUserCreationEvent
  OUTPUT: boolean
  
  RETURN X.auth_provider = 'google' 
    AND NOT EXISTS (
      SELECT 1 FROM public.users WHERE id = X.id
    )
END FUNCTION
```

**Expected Behavior Property (P(result))**:
```pascal
FOR ALL X WHERE isBugCondition(X) DO
  result ← F'(X)
  ASSERT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = X.id 
    AND email = X.email
    AND display_name = COALESCE(
      X.raw_user_meta_data->>'full_name',
      X.raw_user_meta_data->>'name',
      SPLIT_PART(X.email, '@', 1)
    )
  )
END FOR
```

**Preservation Goal**:
```pascal
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

## Tasks

### Phase 1: Bug Condition Exploration Tests (BEFORE implementing fix)

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Google OAuth User Profile Creation Failure
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test implementation details from Bug Condition in design
  - The test assertions should match the Expected Behavior Properties from design
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing User Profile Functionality
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

### Phase 2: Fix Implementation

- [x] 3. Fix for missing user profiles after Google OAuth login

  - [x] 3.1 Add INSERT policy for users table in RLS policies
    - Modify `supabase/migrations/20250428005304_create_rls_policies.sql
    - Add INSERT policy allowing trigger function to insert user profiles
    - Policy should allow any INSERT operation while maintaining other RLS restrictions
    - Test policy with service role client
    - _Bug_Condition: isBugCondition(input) where input.auth_provider = 'google' AND user profile missing_
    - _Expected_Behavior: expectedBehavior(result) from design - user row inserted_
    - _Preservation: Preservation Requirements 3.1, 3.3 - existing RLS policies unchanged_
    - _Requirements: 1.3, 2.3_

  - [x] 3.2 Update handle_new_user() trigger function for better Google OAuth metadata extraction
    - Modify `supabase/migrations/20250428005300_create_initial_schema.sql`
    - Enhance display_name extraction with COALESCE checking multiple metadata fields
    - Ensure trigger works correctly with new INSERT policy
    - Test trigger with Google OAuth metadata simulation
    - _Bug_Condition: isBugCondition(input) where Google metadata extraction fails_
    - _Expected_Behavior: expectedBehavior(result) from design - display_name correctly extracted_
    - _Preservation: Preservation Requirements 3.4 - default 'seeker' role preserved_
    - _Requirements: 1.4, 2.4_

  - [x] 3.3 Update profile page to upsert missing user records instead of creating temporary objects
    - Modify `app/(platform)/profile/[id]/page.tsx`
    - Replace temporary object creation logic with upsert function call
    - Maintain backward compatibility for existing users
    - Test profile page with missing user scenario
    - _Bug_Condition: isBugCondition(input) where profile page creates temporary object_
    - _Expected_Behavior: expectedBehavior(result) from design - database record upserted_
    - _Preservation: Preservation Requirements 3.2 - existing profile display unchanged_
    - _Requirements: 1.2, 2.2_

  - [x] 3.4 Add upsertUserProfile server action
    - Create or modify `app/actions/profile.ts`
    - Implement upsertUserProfile function that creates missing user records
    - Use service role client for database operations
    - Integrate with profile page logic
    - _Bug_Condition: isBugCondition(input) where user profile missing_
    - _Expected_Behavior: expectedBehavior(result) from design - user record created_
    - _Preservation: Preservation Requirements 3.1 - existing users unchanged_
    - _Requirements: 2.2, 2.5_

  - [x] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Google OAuth User Profile Creation Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties from design_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing User Profile Functionality
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

### Phase 3: Validation and Testing

- [ ] 4. Write unit tests for individual components
  - [x] 4.1 Test Google OAuth metadata extraction with various profile structures
    - Test COALESCE logic with different metadata field combinations
    - Test email prefix fallback when metadata fields are null
    - Test edge cases (empty strings, null values)
    - _Requirements: 2.4_

  - [x] 4.2 Test trigger execution with different RLS policy configurations
    - Test trigger with INSERT policy enabled/disabled
    - Test trigger with service role vs authenticated user
    - Test trigger error handling
    - _Requirements: 1.3, 2.3_

  - [x] 4.3 Test profile page upsert logic for missing users
    - Test profile page with missing user (should upsert)
    - Test profile page with existing user (should not modify)
    - Test error handling for database operations
    - _Requirements: 1.2, 2.2_

  - [x] 4.4 Test subscription check integration with user profile creation
    - Test subscription check for newly created user profile
    - Test subscription check for existing user profile
    - Test subscription gate blocking without profile
    - _Requirements: 1.5, 2.5_

- [x] 5. Write integration tests for full flow
  - [x] 5.1 Test full Google OAuth login flow → profile creation → subscription check → job posting
    - Simulate Google OAuth login
    - Verify user profile created in public.users
    - Test subscription check passes
    - Test job posting capability
    - _Requirements: 1.1, 2.1, 2.5_

  - [x] 5.2 Test profile page access for missing users triggers upsert and displays correctly
    - Access profile page for user missing from public.users
    - Verify upsert operation occurs
    - Verify profile displays correctly after upsert
    - Test visual feedback during upsert
    - _Requirements: 1.2, 2.2_

  - [x] 5.3 Test that visual feedback occurs when user profiles are created/updated
    - Test loading states during profile creation
    - Test success/error notifications
    - Test UI updates after profile operations
    - _Requirements: Cross-cutting UI requirements_

- [x] 6. Write property-based tests for comprehensive validation
  - [x] 6.1 Generate random Google OAuth metadata and verify display_name extraction works correctly
    - Property: For all valid Google OAuth metadata, display_name extraction should not fail
    - Property: display_name should never be null after extraction
    - Test with various metadata field combinations and structures
    - _Requirements: 2.4_

  - [x] 6.2 Generate random user scenarios and verify profile creation/preservation properties hold
    - Property: For all Google OAuth login events, user profile should be created
    - Property: For all non-Google auth events, existing behavior should be preserved
    - Test across many user scenarios and edge cases
    - _Requirements: 1.1, 2.1, 3.1-3.5_

  - [x] 6.3 Test that all non-Google authentication flows continue to work across many scenarios
    - Property: All existing platform features work for users with profiles
    - Property: Subscription checks work correctly for all users with profiles
    - Test job posting, applications, ratings for existing users
    - _Requirements: 3.5_

### Phase 4: Checkpoint and Final Validation

- [x] 7. Checkpoint - Ensure all tests pass
  - Run all tests (exploration, preservation, unit, integration, property-based)
  - Verify bug condition exploration test now passes (bug is fixed)
  - Verify preservation tests still pass (no regressions)
  - Verify all unit and integration tests pass
  - Document test results and any issues found
  - Ask the user if questions arise during final validation

## Test Implementation Details

### Exploration Test Implementation (Task 1)
```typescript
// Example test structure for bug condition exploration
describe('Bug Condition Exploration - Google OAuth User Profile Creation', () => {
  it('should fail on unfixed code when Google OAuth login occurs', async () => {
    // Simulate Google OAuth login event
    const authEvent = {
      auth_provider: 'google',
      id: 'test-user-id',
      email: 'test@example.com',
      raw_user_meta_data: { full_name: 'Test User' }
    };
    
    // Check if user profile exists (should not exist on unfixed code)
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', authEvent.id)
      .single();
    
    // This should FAIL on unfixed code - proves bug exists
    expect(user).not.toBeNull(); // Will fail on unfixed code
    expect(user?.display_name).toBe('Test User'); // Will fail on unfixed code
  });
});
```

### Preservation Test Implementation (Task 2)
```typescript
// Example property-based test for preservation
describe('Preservation - Existing User Profile Functionality', () => {
  it('should preserve existing user profile behavior', async () => {
    // Generate test cases for non-buggy inputs
    const testCases = generateNonBuggyTestCases();
    
    for (const testCase of testCases) {
      const originalResult = await originalSystem(testCase);
      const fixedResult = await fixedSystem(testCase);
      
      // Should PASS on unfixed code - confirms baseline behavior
      expect(fixedResult).toEqual(originalResult);
    }
  });
});
```

## Files to Modify

1. `supabase/migrations/20250428005304_create_rls_policies.sql` - Add INSERT policy for users table
2. `supabase/migrations/20250428005300_create_initial_schema.sql` - Update handle_new_user() function
3. `app/(platform)/profile/[id]/page.tsx` - Update profile page logic
4. `app/actions/profile.ts` - Add upsertUserProfile server action
5. `lib/types.ts` - Add any needed types for Google OAuth metadata
6. Create test files in appropriate locations for bug condition exploration and fix validation

## Notes

- All exploration and preservation tests MUST be written BEFORE implementing the fix
- Property-based testing is recommended for stronger preservation guarantees
- The observation-first methodology requires observing behavior on UNFIXED code first
- Each task includes specification references for traceability
- Checkpoints ensure incremental validation and prevent regressions
- The fix follows the bug condition methodology: Explore → Preserve → Implement → Validate