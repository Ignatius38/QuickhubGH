# QuickHubGH Platform Bugfix Design

## Overview

This bugfix addresses the root cause of missing user profiles after Google OAuth login in the QuickHubGH platform. When users sign in with Google OAuth, a row is not being inserted into the public.users table, causing profile pages to show "No profile" or create temporary in-memory user objects instead of proper database records. This breaks core platform functionality including subscription checks, job posting, and application submission.

The fix involves three key changes:
1. Fixing the `handle_new_user()` trigger to work correctly with RLS policies
2. Adding proper INSERT policy for the users table
3. Updating the profile page to upsert missing user records instead of creating temporary objects

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when Google OAuth login occurs and user profile creation fails
- **Property (P)**: The desired behavior when Google OAuth login occurs - a row should be inserted into public.users table
- **Preservation**: Existing user profile functionality that must remain unchanged by the fix
- **handle_new_user()**: The PostgreSQL trigger function in `supabase/migrations/20250428005300_create_initial_schema.sql` that creates user profiles
- **RLS**: Row Level Security - PostgreSQL security feature that restricts table access
- **raw_user_meta_data**: JSON metadata from Google OAuth containing user profile information
- **upsert**: INSERT or UPDATE operation that creates a record if it doesn't exist, updates if it does

## Bug Details

### Bug Condition

The bug manifests when a user signs in with Google OAuth but the trigger fails to insert a row into the public.users table. The `handle_new_user()` function is either blocked by RLS due to missing INSERT policy, fails to extract display_name correctly from Google OAuth metadata, or encounters timing/execution issues.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type AuthUserCreationEvent
  OUTPUT: boolean
  
  RETURN input.auth_provider = 'google' 
    AND NOT EXISTS (
      SELECT 1 FROM public.users WHERE id = input.id
    )
END FUNCTION
```

### Examples

1. **Google OAuth Login Failure**: User signs in with Google OAuth, auth.users row is created, but no corresponding public.users row exists. Profile page shows "No profile" or creates temporary user object.
   
   **Expected**: Row inserted into public.users with id, email, and display_name extracted from Google profile
   **Actual**: No row inserted, profile page creates temporary in-memory object

2. **Profile Page Workaround**: When accessing `/profile/[id]` for a user missing from public.users, the page creates a temporary User object from auth session data instead of upserting a database record.
   
   **Expected**: Page should upsert missing user record into public.users table
   **Actual**: Page creates temporary object, subscription checks fail

3. **Subscription Check Failure**: Subscription checks query public.users table to determine if user has active subscription. Missing user rows cause subscription checks to fail even if user has paid.
   
   **Expected**: Subscription checks work correctly for all authenticated users
   **Actual**: Subscription checks fail for users missing from public.users

4. **Edge Case - Multiple Google OAuth Logins**: User signs in multiple times with Google OAuth, each time expecting profile to exist.
   
   **Expected**: First login creates profile, subsequent logins use existing profile
   **Actual**: Each login may fail to create profile, requiring workaround each time

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Existing user profiles in public.users table must continue to work exactly as before
- Profile page display for existing users must remain unchanged
- Subscription checks for users with existing profiles must continue to work correctly
- All RLS policies for SELECT and UPDATE operations must remain unchanged
- Non-Google authentication flows (though not currently used) should not be affected

**Scope:**
All inputs that do NOT involve Google OAuth login failures should be completely unaffected by this fix. This includes:
- Existing user profiles in the database
- Profile editing functionality
- Subscription management for existing users
- Job posting and application submission for users with profiles
- All other platform features that depend on user profiles

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Missing INSERT Policy for RLS**: The users table has RLS enabled with SELECT and UPDATE policies, but no INSERT policy. The `handle_new_user()` trigger uses `SECURITY DEFINER` but may still be blocked by RLS when trying to insert into a table with RLS enabled but no INSERT policy.

2. **Incorrect Metadata Extraction**: The trigger tries to access `NEW.raw_user_meta_data->>'full_name'` which might not have the expected structure from Google OAuth. Google OAuth may provide different field names or nested structures.

3. **Trigger Execution Context**: Even with `SECURITY DEFINER`, triggers execute in the security context of the function owner, but RLS still applies to the table being modified. Without proper INSERT policy, the trigger cannot insert rows.

4. **Profile Page Workaround Instead of Fix**: The profile page creates temporary user objects instead of fixing the root cause by upserting missing records.

## Correctness Properties

Property 1: Bug Condition - Google OAuth User Profile Creation

_For any_ input where the bug condition holds (isBugCondition returns true), the fixed system SHALL insert a row into the public.users table with the user's id, email, and a display_name extracted from Google OAuth metadata using COALESCE with multiple field checks.

**Validates: Requirements 2.1, 2.3, 2.4**

Property 2: Preservation - Existing User Profile Functionality

_For any_ input where the bug condition does NOT hold (isBugCondition returns false), the fixed system SHALL produce exactly the same behavior as the original system, preserving all existing user profile functionality, subscription checks, and platform features.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `supabase/migrations/20250428005304_create_rls_policies.sql`

**Function**: RLS policy definitions

**Specific Changes**:
1. **Add INSERT Policy for users table**: Create a policy that allows the `handle_new_user()` trigger to insert rows. Since triggers run with `SECURITY DEFINER`, we need a policy that allows insertion by the function owner or bypasses RLS for trigger operations.

2. **Update trigger function metadata extraction**: Enhance the `handle_new_user()` function to better handle Google OAuth metadata structure with multiple fallback options.

**File**: `supabase/migrations/20250428005300_create_initial_schema.sql`

**Function**: `public.handle_new_user()`

**Specific Changes**:
1. **Improve display_name extraction**: Update the COALESCE logic to check multiple possible metadata fields from Google OAuth.
2. **Ensure trigger compatibility with RLS**: Verify the trigger works correctly with the new INSERT policy.

**File**: `app/(platform)/profile/[id]/page.tsx`

**Function**: Profile page data fetching logic

**Specific Changes**:
1. **Replace temporary object creation with upsert**: When a user is missing from public.users but exists in auth.users, upsert a record instead of creating a temporary object.
2. **Maintain backward compatibility**: Ensure the upsert operation doesn't break existing functionality.

**File**: `app/actions/profile.ts`

**Function**: Profile update server actions

**Specific Changes**:
1. **Add upsert function**: Create a server action that upserts user profiles when missing.
2. **Integrate with profile page**: Call the upsert function from the profile page when needed.

### Implementation Details

1. **RLS INSERT Policy**:
   ```sql
   -- Allow trigger function to insert user profiles
   CREATE POLICY "users_insert_policy" ON public.users
       FOR INSERT WITH CHECK (true);
   ```
   This policy allows any INSERT operation. Combined with RLS, it ensures the trigger can insert rows while still restricting other operations.

2. **Enhanced display_name extraction**:
   ```sql
   COALESCE(
       NEW.raw_user_meta_data->>'full_name',
       NEW.raw_user_meta_data->>'name',
       NEW.raw_user_meta_data->>'given_name',
       SPLIT_PART(NEW.email, '@', 1)
   )
   ```

3. **Profile page upsert logic**:
   ```typescript
   // Instead of creating temporary object:
   if (userError?.code === 'PGRST116' || !user) {
     // Upsert user profile
     await upsertUserProfile(params.id);
     // Re-fetch user data
     const { data: user } = await supabase
       .from('users')
       .select('*')
       .eq('id', params.id)
       .single();
     userData = user;
   }
   ```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate Google OAuth login and check if user profile is created. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Google OAuth Login Test**: Simulate Google OAuth login and check if row exists in public.users (will fail on unfixed code)
2. **Profile Page Missing User Test**: Access profile page for user missing from public.users (will fail on unfixed code)
3. **Subscription Check Test**: Test subscription check for user missing from public.users (will fail on unfixed code)
4. **Multiple Login Test**: Test multiple Google OAuth logins for same user (may fail on unfixed code)

**Expected Counterexamples**:
- No row inserted into public.users after Google OAuth login
- Profile page creates temporary object instead of database record
- Subscription checks fail for users with missing profiles
- Possible causes: missing INSERT policy, incorrect metadata extraction, trigger execution issues

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedSystem(input)
  ASSERT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = input.id 
    AND email = input.email
    AND display_name IS NOT NULL
  )
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalSystem(input) = fixedSystem(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for existing user profiles, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Existing User Profile Preservation**: Verify existing user profiles continue to work correctly after fix
2. **Profile Editing Preservation**: Verify profile editing functionality remains unchanged
3. **Subscription Check Preservation**: Verify subscription checks work correctly for users with existing profiles
4. **Platform Feature Preservation**: Verify all platform features (job posting, applications, ratings) continue to work

### Unit Tests

- Test Google OAuth metadata extraction with various Google profile structures
- Test trigger execution with different RLS policy configurations
- Test profile page upsert logic for missing users
- Test subscription check integration with user profile creation

### Property-Based Tests

- Generate random Google OAuth metadata and verify display_name extraction works correctly
- Generate random user scenarios and verify profile creation/preservation properties hold
- Test that all non-Google authentication flows continue to work across many scenarios

### Integration Tests

- Test full Google OAuth login flow → profile creation → subscription check → job posting
- Test profile page access for missing users triggers upsert and displays correctly
- Test that visual feedback occurs when user profiles are created/updated