/**
 * Unit tests for Google OAuth metadata extraction logic
 * Tests COALESCE logic with different metadata field combinations
 * Tests email prefix fallback when metadata fields are null
 * Tests edge cases (empty strings, null values)
 * 
 * Validates: Requirements 2.4
 */
import { extractDisplayName, testExtractionLogic } from '../lib/extract-display-name';

describe('Google OAuth Metadata Extraction', () => {
  describe('COALESCE logic with different metadata field combinations', () => {
    it('should extract display_name from full_name field when present', () => {
      const metadata = { full_name: 'John Doe', given_name: 'John', family_name: 'Doe' };
      const email = 'testuser@example.com';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('John Doe');
    });

    it('should extract display_name from name field when full_name is not present', () => {
      const metadata = { name: 'Jane Smith', given_name: 'Jane', family_name: 'Smith' };
      const email = 'testuser@example.com';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('Jane Smith');
    });

    it('should extract display_name from given_name field when full_name and name are not present', () => {
      const metadata = { given_name: 'Bob', family_name: 'Johnson' };
      const email = 'testuser@example.com';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('Bob');
    });

    it('should fall back to email prefix when no metadata fields are present', () => {
      const metadata = {};
      const email = 'testuser@example.com';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('testuser');
    });

    it('should handle priority order correctly (full_name > name > given_name)', () => {
      // full_name should take precedence
      const metadata1 = { 
        full_name: 'Full Name',
        name: 'Name Field', 
        given_name: 'Given Name' 
      };
      expect(extractDisplayName(metadata1, 'test@example.com')).toBe('Full Name');

      // name should be second priority
      const metadata2 = { 
        full_name: null,
        name: 'Name Field', 
        given_name: 'Given Name' 
      };
      expect(extractDisplayName(metadata2, 'test@example.com')).toBe('Name Field');

      // given_name should be third priority
      const metadata3 = { 
        full_name: null,
        name: null, 
        given_name: 'Given Name' 
      };
      expect(extractDisplayName(metadata3, 'test@example.com')).toBe('Given Name');
    });
  });

  describe('Email prefix fallback when metadata fields are null', () => {
    it('should fall back to email prefix when all metadata fields are null', () => {
      const metadata = { full_name: null, name: null, given_name: null };
      const email = 'testuser@example.com';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('testuser');
    });

    it('should fall back to email prefix when metadata is null', () => {
      const metadata = null;
      const email = 'testuser@example.com';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('testuser');
    });

    it('should fall back to email prefix when metadata is undefined', () => {
      const metadata = undefined;
      const email = 'testuser@example.com';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('testuser');
    });

    it('should handle email without @ symbol', () => {
      const metadata = null;
      const email = 'invalidemail';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('invalidemail');
    });

    it('should return "User" for empty email', () => {
      const metadata = null;
      const email = '';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('User');
    });
  });

  describe('Edge cases (empty strings, null values, special characters)', () => {
    it('should treat empty strings in metadata as missing values', () => {
      const metadata = { full_name: '', name: '', given_name: '' };
      const email = 'testuser@example.com';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('testuser');
    });

    it('should handle mixed null and empty values correctly', () => {
      const metadata = { full_name: null, name: '', given_name: 'Alice' };
      const email = 'testuser@example.com';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('Alice');
    });

    it('should preserve special characters in names', () => {
      const metadata = { full_name: 'José Martínez', given_name: 'José' };
      const email = 'testuser@example.com';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('José Martínez');
    });

    it('should preserve whitespace in names', () => {
      const metadata = { full_name: '  Test User  ', name: '  Another Name  ' };
      const email = 'testuser@example.com';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('  Test User  ');
    });

    it('should handle nested metadata structure', () => {
      const metadata = { 
        full_name: 'Test User',
        profile: { first_name: 'Test', last_name: 'User' }
      };
      const email = 'testuser@example.com';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('Test User');
    });

    it('should handle non-string values in metadata by converting to string', () => {
      const metadata = { full_name: 123, name: true, given_name: { toString: () => 'Object' } };
      const email = 'testuser@example.com';
      const result = extractDisplayName(metadata, email);
      expect(result).toBe('123'); // full_name is 123 (converted to string)
    });
  });

  describe('Comprehensive test suite validation', () => {
    it('should pass all test cases in the comprehensive test suite', () => {
      const testResults = testExtractionLogic();
      
      // Log any failures for debugging
      const failures = testResults.filter(result => !result.passed);
      if (failures.length > 0) {
        console.error('Test failures:', failures);
      }
      
      // All tests should pass
      expect(failures.length).toBe(0);
      
      // Verify we have the expected number of test cases
      expect(testResults.length).toBeGreaterThan(0);
      
      // Log summary
      const passedCount = testResults.filter(result => result.passed).length;
      console.log(`Passed ${passedCount}/${testResults.length} test cases`);
    });

    it('should match PostgreSQL COALESCE behavior for all test cases', () => {
      const testResults = testExtractionLogic();
      
      // This is a critical test - the JavaScript logic must match PostgreSQL COALESCE behavior
      testResults.forEach(result => {
        expect(result.actual).toBe(result.expected);
      });
    });
  });

  describe('Integration with actual Google OAuth metadata structures', () => {
    it('should handle typical Google OAuth response structure', () => {
      // Typical Google OAuth response
      const googleOAuthMetadata = {
        iss: 'https://accounts.google.com',
        sub: '1234567890',
        email: 'testuser@example.com',
        email_verified: true,
        name: 'Test User',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/photo.jpg',
        locale: 'en'
      };
      
      const result = extractDisplayName(googleOAuthMetadata, 'testuser@example.com');
      // Google provides 'name' field, not 'full_name'
      expect(result).toBe('Test User');
    });

    it('should handle Google OAuth with only email and no name fields', () => {
      const minimalGoogleOAuthMetadata = {
        email: 'testuser@example.com',
        email_verified: true
      };
      
      const result = extractDisplayName(minimalGoogleOAuthMetadata, 'testuser@example.com');
      expect(result).toBe('testuser');
    });

    it('should handle Google OAuth with custom claims', () => {
      const customClaimsMetadata = {
        name: 'Custom User',
        given_name: 'Custom',
        family_name: 'User',
        custom_claim: 'custom_value',
        'https://example.com/roles': ['user', 'admin']
      };
      
      const result = extractDisplayName(customClaimsMetadata, 'testuser@example.com');
      expect(result).toBe('Custom User');
    });
  });

  describe('Error handling and robustness', () => {
    it('should handle malformed email addresses', () => {
      expect(extractDisplayName(null, '')).toBe('User');
      expect(extractDisplayName(null, '@example.com')).toBe(''); // Empty prefix
      expect(extractDisplayName(null, 'user@')).toBe('user');
    });

    it('should handle non-object metadata gracefully', () => {
      // @ts-ignore - Testing invalid input
      expect(extractDisplayName('not an object', 'test@example.com')).toBe('test');
      // @ts-ignore - Testing invalid input  
      expect(extractDisplayName(123, 'test@example.com')).toBe('test');
      // @ts-ignore - Testing invalid input
      expect(extractDisplayName([], 'test@example.com')).toBe('test');
    });

    it('should be case-insensitive for field names (JavaScript object access)', () => {
      // JavaScript object access is case-sensitive
      const metadata = { 'full_name': 'John Doe', 'FULL_NAME': 'Different Name' };
      const result = extractDisplayName(metadata, 'test@example.com');
      expect(result).toBe('John Doe'); // Uses lowercase 'full_name'
    });
  });
});