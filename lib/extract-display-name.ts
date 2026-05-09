/**
 * Utility function to extract display name from Google OAuth metadata
 * Replicates the COALESCE logic from the PostgreSQL handle_new_user() function
 * 
 * The logic follows this priority order:
 * 1. raw_user_meta_data->>'full_name'
 * 2. raw_user_meta_data->>'name'
 * 3. raw_user_meta_data->>'given_name'
 * 4. Email prefix (split by '@')
 * 
 * Validates: Requirements 2.4
 */
export function extractDisplayName(
  rawUserMetaData: Record<string, any> | null | undefined,
  email: string
): string {
  // Handle null or undefined metadata
  if (!rawUserMetaData) {
    return extractEmailPrefix(email);
  }

  // Check fields in priority order (COALESCE logic)
  const fullName = rawUserMetaData['full_name'];
  if (fullName !== null && fullName !== undefined && fullName !== '') {
    return String(fullName);
  }

  const name = rawUserMetaData['name'];
  if (name !== null && name !== undefined && name !== '') {
    return String(name);
  }

  const givenName = rawUserMetaData['given_name'];
  if (givenName !== null && givenName !== undefined && givenName !== '') {
    return String(givenName);
  }

  // Fallback to email prefix
  return extractEmailPrefix(email);
}

/**
 * Extract the prefix from an email address (everything before '@')
 * If no '@' is found, returns the entire string
 */
function extractEmailPrefix(email: string): string {
  if (!email) {
    return 'User';
  }
  
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    return email;
  }
  
  return email.substring(0, atIndex);
}

/**
 * Test helper to validate the extraction logic matches PostgreSQL COALESCE behavior
 */
export function testExtractionLogic(): Array<{
  testCase: string;
  metadata: Record<string, any> | null | undefined;
  email: string;
  expected: string;
  actual: string;
  passed: boolean;
}> {
  const testCases = [
    // Test Case 1: Google OAuth with full_name field
    {
      testCase: 'Google OAuth with full_name field',
      metadata: { full_name: 'John Doe', given_name: 'John', family_name: 'Doe' },
      email: 'testuser@example.com',
      expected: 'John Doe'
    },
    // Test Case 2: Google OAuth with name field (no full_name)
    {
      testCase: 'Google OAuth with name field (no full_name)',
      metadata: { name: 'Jane Smith', given_name: 'Jane', family_name: 'Smith' },
      email: 'testuser@example.com',
      expected: 'Jane Smith'
    },
    // Test Case 3: Google OAuth with only given_name field
    {
      testCase: 'Google OAuth with only given_name field',
      metadata: { given_name: 'Bob', family_name: 'Johnson' },
      email: 'testuser@example.com',
      expected: 'Bob'
    },
    // Test Case 4: Google OAuth with no name fields (fallback to email prefix)
    {
      testCase: 'Google OAuth with no name fields (fallback to email prefix)',
      metadata: {},
      email: 'testuser@example.com',
      expected: 'testuser'
    },
    // Test Case 5: Google OAuth with null metadata fields
    {
      testCase: 'Google OAuth with null metadata fields',
      metadata: { full_name: null, name: null, given_name: null },
      email: 'testuser@example.com',
      expected: 'testuser'
    },
    // Test Case 6: Empty strings in metadata fields
    {
      testCase: 'Empty strings in metadata fields',
      metadata: { full_name: '', name: '', given_name: '' },
      email: 'testuser@example.com',
      expected: 'testuser'
    },
    // Test Case 7: Mixed null and empty values
    {
      testCase: 'Mixed null and empty values',
      metadata: { full_name: null, name: '', given_name: 'Alice' },
      email: 'testuser@example.com',
      expected: 'Alice'
    },
    // Test Case 8: Special characters in names
    {
      testCase: 'Special characters in names',
      metadata: { full_name: 'José Martínez', given_name: 'José' },
      email: 'testuser@example.com',
      expected: 'José Martínez'
    },
    // Test Case 9: Email without @ symbol
    {
      testCase: 'Email without @ symbol',
      metadata: null,
      email: 'invalidemail',
      expected: 'invalidemail'
    },
    // Test Case 10: Empty email
    {
      testCase: 'Empty email',
      metadata: null,
      email: '',
      expected: 'User'
    },
    // Test Case 11: Undefined metadata
    {
      testCase: 'Undefined metadata',
      metadata: undefined,
      email: 'testuser@example.com',
      expected: 'testuser'
    },
    // Test Case 12: Nested metadata structure (should still work)
    {
      testCase: 'Nested metadata structure',
      metadata: { 
        full_name: 'Test User',
        profile: { first_name: 'Test', last_name: 'User' }
      },
      email: 'testuser@example.com',
      expected: 'Test User'
    },
    // Test Case 13: Whitespace in names
    {
      testCase: 'Whitespace in names',
      metadata: { full_name: '  Test User  ', name: '  Another Name  ' },
      email: 'testuser@example.com',
      expected: '  Test User  ' // Preserves whitespace as PostgreSQL would
    },
    // Test Case 14: Priority order test - full_name should take precedence
    {
      testCase: 'Priority order test - full_name should take precedence',
      metadata: { 
        full_name: 'Full Name',
        name: 'Name Field',
        given_name: 'Given Name'
      },
      email: 'testuser@example.com',
      expected: 'Full Name'
    },
    // Test Case 15: Priority order test - name should be second priority
    {
      testCase: 'Priority order test - name should be second priority',
      metadata: { 
        full_name: null,
        name: 'Name Field',
        given_name: 'Given Name'
      },
      email: 'testuser@example.com',
      expected: 'Name Field'
    },
  ];

  return testCases.map(testCase => {
    const actual = extractDisplayName(testCase.metadata, testCase.email);
    const passed = actual === testCase.expected;
    
    return {
      testCase: testCase.testCase,
      metadata: testCase.metadata,
      email: testCase.email,
      expected: testCase.expected,
      actual,
      passed
    };
  });
}