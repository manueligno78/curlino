import {
  isValidUrl,
  isNonEmptyString,
  isValidJson,
  isValidXml,
  isValidHeaders,
  isValidHttpMethod,
} from '../../src/utils/validators';

describe('Validators', () => {
  describe('isValidUrl', () => {
    it('should validate HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://api.example.com/v1/users')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });

    it('should accept other valid protocols', () => {
      expect(isValidUrl('ftp://example.com')).toBe(true); // URL constructor accepts ftp
    });

    it('should handle URLs with parameters', () => {
      expect(isValidUrl('https://api.example.com/users?page=1&limit=10')).toBe(true);
    });
  });

  describe('isNonEmptyString', () => {
    it('should validate non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString(' text ')).toBe(true);
    });

    it('should reject empty and whitespace-only strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString(' ')).toBe(false); // Implementation trims whitespace
      expect(isNonEmptyString('   ')).toBe(false);
    });
  });

  describe('isValidJson', () => {
    it('should validate valid JSON', () => {
      expect(isValidJson('{"name": "John", "age": 30}')).toBe(true);
      expect(isValidJson('[1, 2, 3]')).toBe(true);
      expect(isValidJson('null')).toBe(true);
      expect(isValidJson('true')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(isValidJson('{"name": "John", "age":}')).toBe(false);
      expect(isValidJson('not json')).toBe(false);
      expect(isValidJson('')).toBe(false);
    });
  });

  describe('isValidXml', () => {
    it('should validate well-formed XML', () => {
      expect(isValidXml('<root><item>value</item></root>')).toBe(true);
      expect(isValidXml('<?xml version="1.0"?><root/>')).toBe(true);
    });

    it('should reject malformed XML', () => {
      expect(isValidXml('<root><item>value</root>')).toBe(false);
      expect(isValidXml('not xml')).toBe(false);
      expect(isValidXml('')).toBe(false);
    });
  });

  describe('isValidHeaders', () => {
    it('should validate proper header format', () => {
      expect(isValidHeaders('Content-Type: application/json')).toBe(true);
      expect(isValidHeaders('Content-Type: application/json\nAuthorization: Bearer token')).toBe(
        true
      );
    });

    it('should reject invalid header format', () => {
      expect(isValidHeaders('InvalidHeader')).toBe(false);
    });

    it('should accept header with empty value', () => {
      expect(isValidHeaders('Header:')).toBe(true); // Implementation allows empty values
    });

    it('should handle empty strings', () => {
      expect(isValidHeaders('')).toBe(true); // Empty headers are valid
    });
  });

  describe('isValidHttpMethod', () => {
    it('should validate standard HTTP methods', () => {
      expect(isValidHttpMethod('GET')).toBe(true);
      expect(isValidHttpMethod('POST')).toBe(true);
      expect(isValidHttpMethod('PUT')).toBe(true);
      expect(isValidHttpMethod('DELETE')).toBe(true);
      expect(isValidHttpMethod('PATCH')).toBe(true);
      expect(isValidHttpMethod('HEAD')).toBe(true);
      expect(isValidHttpMethod('OPTIONS')).toBe(true);
    });

    it('should handle case insensitive methods', () => {
      expect(isValidHttpMethod('get')).toBe(true);
      expect(isValidHttpMethod('Post')).toBe(true);
    });

    it('should reject invalid methods', () => {
      expect(isValidHttpMethod('INVALID')).toBe(false);
      expect(isValidHttpMethod('')).toBe(false);
    });
  });

});
