import {
  hasValidProtocol,
  isValidUrlFormat,
  prefillProtocol,
  validateAndCorrectUrl,
  getUrlProtocol,
} from '../../src/utils/urlValidation';

describe('urlValidation', () => {
  describe('hasValidProtocol', () => {
    test('should return true for URLs with https protocol', () => {
      expect(hasValidProtocol('https://example.com')).toBe(true);
      expect(hasValidProtocol('HTTPS://example.com')).toBe(true);
    });

    test('should return true for URLs with http protocol', () => {
      expect(hasValidProtocol('http://example.com')).toBe(true);
      expect(hasValidProtocol('HTTP://example.com')).toBe(true);
    });

    test('should return false for URLs without protocol', () => {
      expect(hasValidProtocol('example.com')).toBe(false);
      expect(hasValidProtocol('www.example.com')).toBe(false);
      expect(hasValidProtocol('api.example.com/v1')).toBe(false);
    });

    test('should return false for incomplete protocols', () => {
      expect(hasValidProtocol('http:/example.com')).toBe(false);
      expect(hasValidProtocol('https:example.com')).toBe(false);
      expect(hasValidProtocol('http:/')).toBe(false);
    });
  });

  describe('isValidUrlFormat', () => {
    test('should return true for valid URLs with protocol', () => {
      expect(isValidUrlFormat('https://example.com')).toBe(true);
      expect(isValidUrlFormat('http://api.example.com/v1')).toBe(true);
    });

    test('should return true for valid URLs without protocol', () => {
      expect(isValidUrlFormat('example.com')).toBe(true);
      expect(isValidUrlFormat('api.example.com/v1')).toBe(true);
    });

    test('should return false for invalid URLs', () => {
      expect(isValidUrlFormat('not a url')).toBe(false);
      expect(isValidUrlFormat('://')).toBe(false);
      expect(isValidUrlFormat('')).toBe(false);
    });
  });

  describe('prefillProtocol', () => {
    test('should return https:// for empty URL', () => {
      expect(prefillProtocol('')).toBe('https://');
      expect(prefillProtocol('   ')).toBe('https://');
    });

    test('should return URL unchanged if it already has protocol', () => {
      expect(prefillProtocol('https://example.com')).toBe('https://example.com');
      expect(prefillProtocol('http://example.com')).toBe('http://example.com');
    });

    test('should add https:// to URLs without protocol', () => {
      expect(prefillProtocol('example.com')).toBe('https://example.com');
      expect(prefillProtocol('api.example.com/v1')).toBe('https://api.example.com/v1');
    });

    test('should use specified protocol', () => {
      expect(prefillProtocol('example.com', 'http')).toBe('http://example.com');
      expect(prefillProtocol('', 'http')).toBe('http://');
    });

    test('should clean up incomplete protocols', () => {
      expect(prefillProtocol('http:/example.com')).toBe('https://example.com');
      expect(prefillProtocol('https:example.com')).toBe('https://example.com');
    });
  });

  describe('validateAndCorrectUrl', () => {
    test('should validate and return valid URLs unchanged', () => {
      const result = validateAndCorrectUrl('https://example.com');
      expect(result.isValid).toBe(true);
      expect(result.correctedUrl).toBe('https://example.com');
    });

    test('should add protocol to URLs without it', () => {
      const result = validateAndCorrectUrl('example.com');
      expect(result.isValid).toBe(true);
      expect(result.correctedUrl).toBe('https://example.com');
    });

    test('should return error for empty URLs', () => {
      const result = validateAndCorrectUrl('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL cannot be empty');
    });

    test('should return error for invalid URLs', () => {
      const result = validateAndCorrectUrl('not a url');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    test('should handle cURL commands specially', () => {
      const result = validateAndCorrectUrl('curl https://example.com');
      expect(result.isValid).toBe(true);
      expect(result.correctedUrl).toBe('curl https://example.com');
    });

    test('should handle complex URLs with paths and query params', () => {
      const result = validateAndCorrectUrl('api.example.com/v1/users?page=1');
      expect(result.isValid).toBe(true);
      expect(result.correctedUrl).toBe('https://api.example.com/v1/users?page=1');
    });
  });

  describe('getUrlProtocol', () => {
    test('should return https for HTTPS URLs', () => {
      expect(getUrlProtocol('https://example.com')).toBe('https');
    });

    test('should return http for HTTP URLs', () => {
      expect(getUrlProtocol('http://example.com')).toBe('http');
    });

    test('should return null for invalid URLs', () => {
      expect(getUrlProtocol('not a url')).toBeNull();
      expect(getUrlProtocol('example.com')).toBeNull();
    });
  });
});