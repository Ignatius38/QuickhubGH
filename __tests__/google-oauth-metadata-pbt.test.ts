/**
 * Property-Based Tests for Google OAuth Metadata Extraction
 * 
 * **Validates: Requirements 2.4**
 * 
 * Task 6.1: Generate random Google OAuth metadata and verify display_name extraction works correctly
 * 
 * Properties:
 * 1. For all valid Google OAuth metadata, display_name extraction should not fail
 * 2. display_name should never be null after extraction
 * 3. Test with various metadata field combinations and structures
 * 
 * Uses fast-check for property-based testing to generate random metadata structures
 * and comprehensively test the extraction logic.
 */

import * as fc from 'fast-check';
import { extractDisplayName } from '../lib/extract-display-name';

/**
 * Arbitrary generators for Google OAuth metadata
 * 
 * Google OAuth metadata typically includes fields like:
 * - name: Full name
 * - given_name: First name
 * - family_name: Last name
 * - email: Email address
 * - picture: Profile picture URL
 * - locale: Language/locale
 * - email_verified: Boolean
 * 
 * Additional fields that might be present:
 * - full_name: Alternative full name field
 * - middle_name: Middle name
 * - nickname: Nickname
 * - preferred_username: Preferred username
 * - profile: Profile URL
 * - website: Website URL
 * - gender: Gender
 * - birthdate: Birthdate
 * - zoneinfo: Timezone
 * - phone_number: Phone number
 * - phone_number_verified: Phone verification status
 * - address: Address object
 * - updated_at: Last update timestamp
 */

/**
 * Generator for valid email addresses
 */
const emailArb = fc.emailAddress().map(email => email.toLowerCase());

/**
 * Generator for name strings (can include special characters, spaces, etc.)
 */
const nameStringArb = fc.string({
  minLength: 1,
  maxLength: 50,
}).filter(s => s.trim().length > 0);

/**
 * Generator for nullable name strings (can be null, undefined, empty string, or valid name)
 */
const nullableNameStringArb = fc.oneof(
  fc.constant(null),
  fc.constant(undefined),
  fc.constant(''),
  nameStringArb
);

/**
 * Generator for Google OAuth metadata objects
 * 
 * Generates random metadata with various field combinations:
 * - Some fields present, some missing
 * - Different field values (valid names, empty strings, null, undefined)
 * - Nested structures
 * - Special characters in names
 */
const googleOAuthMetadataArb: fc.Arbitrary<Record<string, any> | null | undefined> = fc.oneof(
  // Null or undefined metadata
  fc.constant(null),
  fc.constant(undefined),
  
  // Empty object
  fc.constant({}),
  
  // Full metadata with all common fields
  fc.record({
    name: nullableNameStringArb,
    given_name: nullableNameStringArb,
    family_name: nullableNameStringArb,
    full_name: nullableNameStringArb,
    email: emailArb,
    email_verified: fc.boolean(),
    picture: fc.webUrl(),
    locale: fc.constantFrom('en', 'fr', 'es', 'de', 'pt', 'it', 'ru', 'zh', 'ja', 'ko'),
    // Additional optional fields
    middle_name: nullableNameStringArb,
    nickname: nullableNameStringArb,
    preferred_username: nullableNameStringArb,
    profile: fc.webUrl(),
    website: fc.webUrl(),
    gender: fc.constantFrom('male', 'female', 'other'),
    birthdate: fc.constantFrom('1990-01-01', '1985-05-15', '2000-12-25'),
    zoneinfo: fc.constantFrom('America/New_York', 'Europe/London', 'Asia/Tokyo', 'Africa/Accra'),
    phone_number: fc.string({ minLength: 10, maxLength: 15 }),
    phone_number_verified: fc.boolean(),
    updated_at: fc.constantFrom('2024-01-01T00:00:00Z', '2024-06-01T12:30:45Z', '2024-12-31T23:59:59Z'),
  }),
  
  // Partial metadata - random subset of fields
  fc.dictionary(
    fc.constantFrom(
      'name', 'given_name', 'family_name', 'full_name', 'email', 
      'email_verified', 'picture', 'locale', 'middle_name', 'nickname',
      'preferred_username', 'profile', 'website', 'gender', 'birthdate',
      'zoneinfo', 'phone_number', 'phone_number_verified', 'updated_at'
    ),
    fc.oneof(
      nullableNameStringArb,
      fc.boolean(),
      fc.webUrl(),
      fc.constantFrom('2024-01-01T00:00:00Z', '2024-06-01T12:30:45Z', '2024-12-31T23:59:59Z'),
      fc.constantFrom('1990-01-01', '1985-05-15', '2000-12-25'),
      fc.string({ minLength: 10, maxLength: 15 })
    )
  ),
  
  // Metadata with nested structures (like address)
  fc.record({
    name: nullableNameStringArb,
    given_name: nullableNameStringArb,
    family_name: nullableNameStringArb,
    address: fc.record({
      formatted: fc.string(),
      street_address: fc.string(),
      locality: fc.string(),
      region: fc.string(),
      postal_code: fc.string(),
      country: fc.string(),
    }),
  }),
  
  // Metadata with non-string values that should be converted to string
  fc.record({
    full_name: fc.oneof(
      fc.integer(),
      fc.float(),
      fc.boolean(),
      fc.constant({ toString: () => 'Object Name' })
    ),
    name: fc.oneof(
      fc.integer(),
      fc.float(),
      fc.boolean(),
      fc.constant({ toString: () => 'Object Name' })
    ),
    given_name: fc.oneof(
      fc.integer(),
      fc.float(),
      fc.boolean(),
      fc.constant({ toString: () => 'Object Name' })
    ),
  }),
  
  // Metadata with whitespace and special characters
  fc.record({
    full_name: fc.string({ minLength: 5, maxLength: 30 }).map(s => `  ${s}  `), // Leading/trailing spaces
    name: fc.string({ minLength: 5, maxLength: 30 }).map(s => `\t${s}\n`), // Tabs and newlines
    given_name: fc.string({ minLength: 3, maxLength: 20 }).map(s => `${s}©®™`), // Special symbols
  }),
  
  // Metadata with international characters
  fc.record({
    full_name: fc.constantFrom(
      'José Martínez',
      'François Dupont',
      'Björn Åström',
      'Michał Kowalski',
      'Αλέξανδρος Παπαδόπουλος',
      '伊藤 太郎',
      '김철수',
      '陈小明'
    ),
    name: fc.constantFrom(
      'José Martínez',
      'François Dupont',
      'Björn Åström',
      'Michał Kowalski',
      'Αλέξανδρος Παπαδόπουλος',
      '伊藤 太郎',
      '김철수',
      '陈小明'
    ),
    given_name: fc.constantFrom(
      'José',
      'François',
      'Björn',
      'Michał',
      'Αλέξανδρος',
      '太郎',
      '철수',
      '小明'
    ),
  })
);

describe('Property-Based Tests: Google OAuth Metadata Extraction', () => {
  /**
   * Property 1: For all valid Google OAuth metadata, display_name extraction should not fail
   * 
   * This property ensures that the extraction function never throws exceptions
   * for any valid metadata input (including null, undefined, empty objects, etc.)
   */
  describe('Property 1: No exceptions during extraction', () => {
    it('should never throw exceptions for any valid metadata and email', () => {
      const property = fc.property(
        googleOAuthMetadataArb,
        emailArb,
        (metadata, email) => {
          // The function should not throw for any input
          expect(() => {
            extractDisplayName(metadata, email);
          }).not.toThrow();
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 1000, // Run 1000 random test cases
      });
    });
    
    it('should handle edge case emails without throwing', () => {
      const edgeCaseEmailArb = fc.oneof(
        fc.constant(''),
        fc.constant('@'),
        fc.constant('user@'),
        fc.constant('@example.com'),
        fc.constant('user@example'),
        fc.constant('user@example.'),
        fc.string({ minLength: 0, maxLength: 100 }), // Any string including invalid emails
      );
      
      const property = fc.property(
        googleOAuthMetadataArb,
        edgeCaseEmailArb,
        (metadata, email) => {
          // The function should not throw for any input, even invalid emails
          expect(() => {
            extractDisplayName(metadata, email);
          }).not.toThrow();
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500, // Run 500 random test cases for edge cases
      });
    });
  });
  
  /**
   * Property 2: display_name should never be null after extraction
   * 
   * This property ensures that the extraction function always returns a non-null string
   * The function should have fallback logic to ensure a display name is always returned
   */
  describe('Property 2: Non-null display_name', () => {
    it('should always return a non-null, non-undefined string', () => {
      const property = fc.property(
        googleOAuthMetadataArb,
        emailArb,
        (metadata, email) => {
          const result = extractDisplayName(metadata, email);
          
          // Result should never be null or undefined
          expect(result).not.toBeNull();
          expect(result).not.toBeUndefined();
          
          // Result should be a string
          expect(typeof result).toBe('string');
          
          // Result should not be empty (should have fallback to "User" for empty email)
          // Note: For empty email, extractEmailPrefix returns "User"
          expect(result.length).toBeGreaterThan(0);
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 1000,
      });
    });
    
    it('should have fallback to email prefix or "User" when metadata is empty', () => {
      const property = fc.property(
        emailArb,
        (email) => {
          // Test with null metadata
          const result1 = extractDisplayName(null, email);
          expect(result1).not.toBeNull();
          expect(result1).not.toBeUndefined();
          expect(typeof result1).toBe('string');
          expect(result1.length).toBeGreaterThan(0);
          
          // Test with undefined metadata
          const result2 = extractDisplayName(undefined, email);
          expect(result2).not.toBeNull();
          expect(result2).not.toBeUndefined();
          expect(typeof result2).toBe('string');
          expect(result2.length).toBeGreaterThan(0);
          
          // Test with empty object metadata
          const result3 = extractDisplayName({}, email);
          expect(result3).not.toBeNull();
          expect(result3).not.toBeUndefined();
          expect(typeof result3).toBe('string');
          expect(result3.length).toBeGreaterThan(0);
          
          // All results should be the same for empty metadata
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
  });
  
  /**
   * Property 3: Priority order is correctly followed
   * 
   * The extraction logic should follow this priority order:
   * 1. full_name field (if present and non-empty)
   * 2. name field (if present and non-empty)
   * 3. given_name field (if present and non-empty)
   * 4. Email prefix fallback
   */
  describe('Property 3: Priority order correctness', () => {
    it('should prioritize full_name over name and given_name', () => {
      const property = fc.property(
        nameStringArb, // full_name value
        nameStringArb, // name value (different from full_name)
        nameStringArb, // given_name value (different from both)
        emailArb,
        (fullName, name, givenName, email) => {
          // Ensure all names are different to test priority
          fc.pre(fullName !== name);
          fc.pre(fullName !== givenName);
          fc.pre(name !== givenName);
          
          const metadata = {
            full_name: fullName,
            name: name,
            given_name: givenName,
          };
          
          const result = extractDisplayName(metadata, email);
          
          // Should use full_name (highest priority)
          expect(result).toBe(fullName);
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
    
    it('should prioritize name over given_name when full_name is empty', () => {
      const property = fc.property(
        nameStringArb, // name value
        nameStringArb, // given_name value (different from name)
        emailArb,
        (name, givenName, email) => {
          // Ensure names are different to test priority
          fc.pre(name !== givenName);
          
          const metadata = {
            full_name: '', // Empty string - should be treated as missing
            name: name,
            given_name: givenName,
          };
          
          const result = extractDisplayName(metadata, email);
          
          // Should use name (second priority since full_name is empty)
          expect(result).toBe(name);
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
    
    it('should use given_name when full_name and name are null/empty', () => {
      const property = fc.property(
        nameStringArb, // given_name value
        emailArb,
        (givenName, email) => {
          const metadata = {
            full_name: null,
            name: '',
            given_name: givenName,
          };
          
          const result = extractDisplayName(metadata, email);
          
          // Should use given_name (third priority)
          expect(result).toBe(givenName);
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
    
    it('should fall back to email prefix when all name fields are null/empty', () => {
      const property = fc.property(
        emailArb,
        (email) => {
          const metadata = {
            full_name: null,
            name: '',
            given_name: undefined,
          };
          
          const result = extractDisplayName(metadata, email);
          const expectedEmailPrefix = email.split('@')[0] || 'User';
          
          // Should use email prefix (fallback)
          expect(result).toBe(expectedEmailPrefix);
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
  });
  
  /**
   * Property 4: Field value conversion to string
   * 
   * The extraction function should convert non-string values to strings
   * (e.g., numbers, booleans, objects with toString method)
   */
  describe('Property 4: Non-string value conversion', () => {
    it('should convert non-string values to strings', () => {
      const nonStringValueArb = fc.oneof(
        fc.integer(),
        fc.float(),
        fc.boolean(),
        fc.constant({ toString: () => 'Custom Object' }),
        fc.constant([1, 2, 3]),
        fc.constant(new Date('2024-01-01')),
      );
      
      const property = fc.property(
        nonStringValueArb,
        emailArb,
        (nonStringValue, email) => {
          const metadata = {
            full_name: nonStringValue,
          };
          
          const result = extractDisplayName(metadata, email);
          
          // Result should be a string
          expect(typeof result).toBe('string');
          
          // Should not throw when converting
          expect(() => String(nonStringValue)).not.toThrow();
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
    
    it('should handle priority with mixed string and non-string values', () => {
      const property = fc.property(
        fc.integer(), // full_name as number
        nameStringArb, // name as string
        emailArb,
        (fullNameNum, nameStr, email) => {
          const metadata = {
            full_name: fullNameNum,
            name: nameStr,
          };
          
          const result = extractDisplayName(metadata, email);
          
          // Should use full_name even though it's a number (converted to string)
          expect(result).toBe(String(fullNameNum));
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
  });
  
  /**
   * Property 5: Consistency with PostgreSQL COALESCE logic
   * 
   * The JavaScript logic should match the PostgreSQL COALESCE behavior
   * COALESCE returns the first non-null argument
   * In PostgreSQL, empty string is NOT null, but our JavaScript logic treats it as missing
   * This is intentional to match the expected behavior
   */
  describe('Property 5: Consistency with COALESCE logic', () => {
    it('should treat empty strings as missing values (not null)', () => {
      const property = fc.property(
        nameStringArb, // name value
        emailArb,
        (name, email) => {
          const metadata = {
            full_name: '', // Empty string
            name: name,
            given_name: '',
          };
          
          const result = extractDisplayName(metadata, email);
          
          // Should use name (not full_name which is empty string)
          expect(result).toBe(name);
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
    
    it('should treat null and undefined as missing values', () => {
      const property = fc.property(
        nameStringArb, // given_name value
        emailArb,
        (givenName, email) => {
          const metadata = {
            full_name: null,
            name: undefined,
            given_name: givenName,
          };
          
          const result = extractDisplayName(metadata, email);
          
          // Should use given_name (full_name is null, name is undefined)
          expect(result).toBe(givenName);
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
  });
  
  /**
   * Property 6: Email prefix extraction correctness
   * 
   * When falling back to email prefix, it should correctly extract everything before '@'
   * or return the entire string if no '@' is found
   */
  describe('Property 6: Email prefix extraction', () => {
    it('should correctly extract email prefix', () => {
      const emailWithPrefixArb = fc.tuple(
        fc.string({ minLength: 1, maxLength: 20 }), // local part
        fc.constantFrom('example.com', 'gmail.com', 'yahoo.com', 'outlook.com') // domain
      ).map(([local, domain]) => `${local}@${domain}`);
      
      const property = fc.property(
        emailWithPrefixArb,
        (email) => {
          const metadata = {}; // Empty metadata to force email fallback
          const result = extractDisplayName(metadata, email);
          const expectedPrefix = email.split('@')[0];
          
          expect(result).toBe(expectedPrefix);
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
    
    it('should handle emails without @ symbol', () => {
      const noAtEmailArb = fc.string({ minLength: 1, maxLength: 30 })
        .filter(s => !s.includes('@'));
      
      const property = fc.property(
        noAtEmailArb,
        (email) => {
          const metadata = {};
          const result = extractDisplayName(metadata, email);
          
          // Should return entire string when no @ found
          expect(result).toBe(email);
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
    
    it('should return "User" for empty email', () => {
      const metadata = {};
      const result = extractDisplayName(metadata, '');
      
      expect(result).toBe('User');
    });
    
    it('should handle email with only @ symbol', () => {
      const metadata = {};
      const result1 = extractDisplayName(metadata, '@');
      expect(result1).toBe(''); // Empty prefix
      
      const result2 = extractDisplayName(metadata, 'user@');
      expect(result2).toBe('user');
      
      const result3 = extractDisplayName(metadata, '@example.com');
      expect(result3).toBe(''); // Empty prefix
    });
  });
  
  /**
   * Property 7: Comprehensive random metadata testing
   * 
   * Test the extraction function with completely random metadata structures
   * to ensure robustness and catch edge cases
   */
  describe('Property 7: Comprehensive random testing', () => {
    it('should handle completely random metadata structures', () => {
      const randomMetadataArb = fc.oneof(
        googleOAuthMetadataArb,
        // Even more random structures
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.anything()
        ),
        fc.constant([]), // Array
        fc.constant(123), // Number
        fc.constant(true), // Boolean
        fc.string(), // String
      );
      
      const property = fc.property(
        randomMetadataArb,
        fc.string({ minLength: 0, maxLength: 50 }), // Any string as email
        (metadata, email) => {
          // Function should not throw for ANY input
          expect(() => {
            extractDisplayName(metadata, email);
          }).not.toThrow();
          
          const result = extractDisplayName(metadata, email);
          
          // Should always return a string
          expect(typeof result).toBe('string');
          
          // Should never be null or undefined
          expect(result).not.toBeNull();
          expect(result).not.toBeUndefined();
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 1000, // Run many test cases
        endOnFailure: true,
      });
    });
    
    it('should preserve whitespace in names when present', () => {
      const property = fc.property(
        fc.string({ minLength: 3, maxLength: 30 })
          .map(s => `  ${s}  `), // Add whitespace
        emailArb,
        (nameWithWhitespace, email) => {
          const metadata = {
            full_name: nameWithWhitespace,
          };
          
          const result = extractDisplayName(metadata, email);
          
          // Should preserve whitespace (PostgreSQL COALESCE would preserve it)
          expect(result).toBe(nameWithWhitespace);
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
  });
  
  /**
   * Property 8: Real-world Google OAuth metadata patterns
   * 
   * Test with metadata structures that mimic real Google OAuth responses
   */
  describe('Property 8: Real-world Google OAuth patterns', () => {
    it('should handle typical Google OAuth response structure', () => {
      const typicalGoogleMetadataArb = fc.record({
        iss: fc.constant('https://accounts.google.com'),
        sub: fc.string({ minLength: 10, maxLength: 30 }),
        email: emailArb,
        email_verified: fc.boolean(),
        name: nullableNameStringArb,
        given_name: nullableNameStringArb,
        family_name: nullableNameStringArb,
        picture: fc.webUrl(),
        locale: fc.constantFrom('en', 'fr', 'es', 'de', 'pt', 'it', 'ru', 'zh', 'ja', 'ko'),
      });
      
      const property = fc.property(
        typicalGoogleMetadataArb,
        (metadata) => {
          const email = metadata.email;
          const result = extractDisplayName(metadata, email);
          
          // Should not throw
          expect(() => extractDisplayName(metadata, email)).not.toThrow();
          
          // Should return a string
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
          
          // If name is present in metadata, should use it (Google provides 'name' not 'full_name')
          if (metadata.name && metadata.name.trim().length > 0) {
            expect(result).toBe(metadata.name);
          }
          // If name is not present but given_name is, should use given_name
          else if (metadata.given_name && metadata.given_name.trim().length > 0) {
            expect(result).toBe(metadata.given_name);
          }
          // Otherwise should fall back to email prefix
          else {
            const expectedPrefix = email.split('@')[0] || 'User';
            expect(result).toBe(expectedPrefix);
          }
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
    
    it('should handle Google OAuth with custom claims', () => {
      const googleWithCustomClaimsArb = fc.record({
        name: nullableNameStringArb,
        given_name: nullableNameStringArb,
        family_name: nullableNameStringArb,
        email: emailArb,
        'https://example.com/roles': fc.array(fc.constantFrom('user', 'admin', 'moderator')),
        'https://example.com/custom': fc.string(),
        custom_claim: fc.string(),
      });
      
      const property = fc.property(
        googleWithCustomClaimsArb,
        (metadata) => {
          const email = metadata.email;
          const result = extractDisplayName(metadata, email);
          
          // Should not throw despite custom claims
          expect(() => extractDisplayName(metadata, email)).not.toThrow();
          
          // Should return a valid string
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
          
          return true;
        }
      );
      
      fc.assert(property, {
        verbose: true,
        numRuns: 500,
      });
    });
  });
  
  /**
   * Summary of properties tested:
   * 1. No exceptions during extraction
   * 2. Non-null display_name always returned
   * 3. Priority order correctness (full_name > name > given_name > email prefix)
   * 4. Non-string value conversion to string
   * 5. Consistency with PostgreSQL COALESCE logic
   * 6. Email prefix extraction correctness
   * 7. Comprehensive random metadata testing
   * 8. Real-world Google OAuth metadata patterns
   * 
   * These properties comprehensively test the display_name extraction logic
   * and ensure it works correctly for all possible Google OAuth metadata inputs.
   */
});
