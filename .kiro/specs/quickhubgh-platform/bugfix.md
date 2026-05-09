# Bugfix Requirements Document

## Introduction

This bugfix addresses the root cause of missing user profiles after Google OAuth login in the QuickHubGH platform. When users sign in with Google OAuth, a row is not being inserted into the public.users table, causing profile pages to show "No profile" or create temporary in-memory user objects instead of proper database records. This breaks core platform functionality including subscription checks, job posting, and application submission.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user signs in with Google OAuth THEN the system fails to insert a row into the public.users table
1.2 WHEN the public.users row is missing THEN the profile page creates a temporary in-memory user object instead of upserting a database record
1.3 WHEN the trigger `handle_new_user()` executes THEN it may be blocked by Row Level Security (RLS) due to missing INSERT policy
1.4 WHEN Google OAuth provides user metadata THEN the trigger may fail to extract `display_name` correctly due to limited field checking
1.5 WHEN a user profile is missing THEN subscription checks and other platform features may fail or behave incorrectly

### Expected Behavior (Correct)

2.1 WHEN a user signs in with Google OAuth THEN the system SHALL insert a row into the public.users table with id, email, and display_name
2.2 WHEN the public.users row is missing THEN the profile page SHALL upsert a database record using the current session data
2.3 WHEN the trigger `handle_new_user()` executes THEN it SHALL successfully insert a row regardless of RLS policies
2.4 WHEN Google OAuth provides user metadata THEN the system SHALL correctly extract display_name using COALESCE with multiple metadata fields: `raw_user_meta_data->>'full_name'`, `raw_user_meta_data->>'name'`, and email prefix as fallback
2.5 WHEN a user profile exists THEN all platform features SHALL work correctly including subscription checks, job posting, and applications

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user signs in with existing profile THEN the system SHALL CONTINUE TO use the existing public.users row without modification
3.2 WHEN a user profile is complete THEN the profile page SHALL CONTINUE TO display all user data correctly
3.3 WHEN RLS policies are applied THEN non-buggy operations SHALL CONTINUE TO be properly restricted according to existing policies
3.4 WHEN the trigger executes successfully THEN it SHALL CONTINUE TO create user profiles with default 'seeker' role
3.5 WHEN subscription checks occur THEN they SHALL CONTINUE TO verify active subscriptions correctly


## Bug Condition Derivation

### Bug Condition Function

Identifies inputs that trigger the bug:

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type AuthUserCreationEvent
  OUTPUT: boolean
  
  // Returns true when Google OAuth login occurs and user profile creation fails
  RETURN X.auth_provider = 'google' 
    AND NOT EXISTS (
      SELECT 1 FROM public.users WHERE id = X.id
    )
END FUNCTION
```

### Property Specification

Defines correct behavior for buggy inputs:

```pascal
// Property: Fix Checking - User Profile Creation
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

### Preservation Goal

Ensures non-buggy inputs continue to work correctly:

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR
```

### Key Definitions

- **F**: The original (unfixed) function - the code as it exists before the fix
- **F'**: The fixed function - the code after applying the fix
- **C(X)**: Bug Condition - `X.auth_provider = 'google' AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = X.id)`
- **P(result)**: Property - `EXISTS (SELECT 1 FROM public.users WHERE id = X.id AND email = X.email AND display_name IS NOT NULL)`
- **¬C(X)**: Non-buggy inputs - all other auth events that should be preserved

### Counterexample

A concrete example demonstrating the bug:
- User signs in with Google OAuth
- Auth user created in `auth.users` table
- No corresponding row in `public.users` table
- Profile page shows "No profile" or creates temporary user object
- Subscription checks fail, preventing job posting/application