import { parseCurlCommand, importCurlCommand } from '../../src/utils/curlImporter';

describe('curlImporter', () => {
  beforeEach(() => {
    // Mock console methods to capture debug output
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('parseCurlCommand', () => {
    it('should parse simple GET request', () => {
      const curl = 'curl https://api.example.com/users';
      const result = parseCurlCommand(curl);

      expect(result).toBeTruthy();
      expect(result?.url).toBe('https://api.example.com/users');
      expect(result?.method).toBe('GET');
      expect(result?.headers).toEqual({});
    });

    it('should parse POST request with data', () => {
      const curl = 'curl -X POST https://api.example.com/users -d \'{"name":"test"}\'';
      const result = parseCurlCommand(curl);

      expect(result).toBeTruthy();
      expect(result?.url).toBe('https://api.example.com/users');
      expect(result?.method).toBe('POST');
      expect(result?.body).toBe('{"name":"test"}');
    });

    it('should parse request with headers', () => {
      const curl =
        'curl -H "Content-Type: application/json" -H "Authorization: Bearer token" https://api.example.com/users';
      const result = parseCurlCommand(curl);

      expect(result).toBeTruthy();
      expect(result?.url).toBe('https://api.example.com/users');
      expect(result?.method).toBe('GET');
      expect(result?.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      });
    });

    it('should parse complex request with all options', () => {
      const curl =
        'curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer token" -d \'{"name":"test","age":25}\' https://api.example.com/users';
      const result = parseCurlCommand(curl);

      expect(result).toBeTruthy();
      expect(result?.url).toBe('https://api.example.com/users');
      expect(result?.method).toBe('POST');
      expect(result?.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      });
      expect(result?.body).toBe('{"name":"test","age":25}');
    });

    it('should handle URL with query parameters', () => {
      const curl = 'curl "https://api.example.com/users?page=1&limit=10"';
      const result = parseCurlCommand(curl);

      expect(result).toBeTruthy();
      expect(result?.url).toBe('https://api.example.com/users?page=1&limit=10');
    });

    it('should handle different URL formats', () => {
      const testCases = [
        'curl https://example.com',
        'curl http://localhost:3000/api',
        'curl "https://api.example.com/v1/endpoint"',
        "curl 'http://test.com/path'",
      ];

      testCases.forEach(curl => {
        const result = parseCurlCommand(curl);
        expect(result).toBeTruthy();
        expect(result?.url).toBeTruthy();
        expect(result?.url).not.toBe('/');
        expect(result?.url).not.toBe('');
      });
    });

    it('should handle URL at different positions', () => {
      const curl1 = 'curl -X POST https://api.example.com/users -d \'{"test": true}\'';
      const curl2 = 'curl https://api.example.com/users -X POST -d \'{"test": true}\'';

      const result1 = parseCurlCommand(curl1);
      const result2 = parseCurlCommand(curl2);

      expect(result1?.url).toBe('https://api.example.com/users');
      expect(result2?.url).toBe('https://api.example.com/users');
    });

    it('should return null for invalid commands', () => {
      expect(parseCurlCommand('not a curl command')).toBeNull();
      expect(parseCurlCommand('')).toBeNull();
      expect(parseCurlCommand('wget https://example.com')).toBeNull();
    });
  });

  describe('importCurlCommand', () => {
    it('should create Request object from curl command', () => {
      const curl =
        'curl -X POST -H "Content-Type: application/json" -d \'{"name":"test"}\' https://api.example.com/users';
      const request = importCurlCommand(curl);

      expect(request).toBeTruthy();
      expect(request?.url).toBe('https://api.example.com/users');
      expect(request?.method).toBe('POST');
      expect(request?.headers).toEqual({
        'Content-Type': 'application/json',
      });
      expect(request?.body).toBe('{"name":"test"}');
      expect(request?.name).toBe('users');
    });

    it('should handle URL without path for name generation', () => {
      const curl = 'curl https://api.example.com';
      const request = importCurlCommand(curl);

      expect(request).toBeTruthy();
      expect(request?.name).toBe('api.example.com'); // Fixed expectation
    });

    it('should debug URL parsing for problematic cases', () => {
      const testCases = [
        'curl https://httpbin.org/get',
        'curl -X POST https://httpbin.org/post -d \'{"test":true}\'',
        'curl -H "Authorization: Bearer token" https://api.github.com/user',
      ];

      testCases.forEach(curl => {
        const result = parseCurlCommand(curl);

        expect(result).toBeTruthy();
        expect(result?.url).toBeTruthy();
        expect(result?.url).not.toBe('/');
        expect(result?.url).not.toBe('');
      });
    });
  });
});
