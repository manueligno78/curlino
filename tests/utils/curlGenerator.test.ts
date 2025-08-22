import { generateCurlCommand } from '../../src/utils/curlGenerator';
import { Request } from '../../src/models/Request';

describe('curlGenerator', () => {
  const baseRequest: Request = {
    id: 'test-id',
    name: 'Test Request',
    url: 'https://api.example.com/test',
    method: 'GET',
    headers: {},
    body: '',
    collectionId: null,
    timestamp: Date.now(),
  };

  describe('generateCurlCommand', () => {
    it('should generate basic GET command', () => {
      const result = generateCurlCommand(baseRequest);

      expect(result).toBe('curl -X GET "https://api.example.com/test"');
    });

    it('should generate POST command with body', () => {
      const request: Request = {
        ...baseRequest,
        method: 'POST',
        body: '{"name": "test"}',
      };

      const result = generateCurlCommand(request);

      expect(result).toBe('curl -X POST "https://api.example.com/test" -d \'{"name": "test"}\'');
    });

    it('should include headers', () => {
      const request: Request = {
        ...baseRequest,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123',
        },
      };

      const result = generateCurlCommand(request);

      expect(result).toContain('-H "Content-Type: application/json"');
      expect(result).toContain('-H "Authorization: Bearer token123"');
    });

    it('should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach(method => {
        const request: Request = {
          ...baseRequest,
          method,
        };

        const result = generateCurlCommand(request);

        expect(result).toContain(`-X ${method}`);
      });
    });

    it('should escape quotes in URL', () => {
      const request: Request = {
        ...baseRequest,
        url: 'https://api.example.com/test?query="value"',
      };

      const result = generateCurlCommand(request);

      expect(result).toContain('"https://api.example.com/test?query=\\"value\\""');
    });

    it('should escape quotes in headers', () => {
      const request: Request = {
        ...baseRequest,
        headers: {
          'Custom-Header': 'value with "quotes"',
        },
      };

      const result = generateCurlCommand(request);

      expect(result).toContain('-H "Custom-Header: value with \\"quotes\\""');
    });

    it('should handle body with single quotes', () => {
      const request: Request = {
        ...baseRequest,
        method: 'POST',
        body: '{"message": "It\'s working"}',
      };

      const result = generateCurlCommand(request);

      expect(result).toContain('-d \'{"message": "It\'s working"}\'');
    });

    it('should handle body with both single and double quotes', () => {
      const request: Request = {
        ...baseRequest,
        method: 'POST',
        body: '{"message": "It\'s a \\"test\\""}',
      };

      const result = generateCurlCommand(request);

      // Should escape the body appropriately
      expect(result).toContain('-d');
    });

    it('should handle empty body', () => {
      const request: Request = {
        ...baseRequest,
        method: 'POST',
        body: '',
      };

      const result = generateCurlCommand(request);

      expect(result).not.toContain('-d');
    });

    it('should handle null/undefined body', () => {
      const request: Request = {
        ...baseRequest,
        method: 'POST',
        body: null as any,
      };

      const result = generateCurlCommand(request);

      expect(result).not.toContain('-d');
    });

    it('should handle empty headers object', () => {
      const request: Request = {
        ...baseRequest,
        headers: {},
      };

      const result = generateCurlCommand(request);

      expect(result).not.toContain('-H');
    });

    it('should handle null headers', () => {
      const request: Request = {
        ...baseRequest,
        headers: null as any,
      };

      const result = generateCurlCommand(request);

      expect(result).not.toContain('-H');
    });

    it('should handle complex real-world example', () => {
      const request: Request = {
        ...baseRequest,
        method: 'POST',
        url: 'https://api.github.com/repos/owner/repo/issues',
        headers: {
          'Authorization': 'token ghp_xxxxxxxxxxxxxxxxxxxx',
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'MyApp/1.0',
        },
        body: JSON.stringify({
          title: 'Bug report with "quotes" and \'apostrophes\'',
          body: 'Description of the issue\nwith multiple lines',
          labels: ['bug', 'high-priority'],
        }),
      };

      const result = generateCurlCommand(request);

      expect(result).toContain('curl -X POST');
      expect(result).toContain('"https://api.github.com/repos/owner/repo/issues"');
      expect(result).toContain('-H "Authorization: token ghp_xxxxxxxxxxxxxxxxxxxx"');
      expect(result).toContain('-H "Accept: application/vnd.github.v3+json"');
      expect(result).toContain('-H "Content-Type: application/json"');
      expect(result).toContain('-H "User-Agent: MyApp/1.0"');
      expect(result).toContain('-d \'');
    });

    it('should handle URLs with spaces', () => {
      const request: Request = {
        ...baseRequest,
        url: 'https://api.example.com/test with spaces',
      };

      const result = generateCurlCommand(request);

      expect(result).toContain('"https://api.example.com/test with spaces"');
    });

    it('should handle headers with empty values', () => {
      const request: Request = {
        ...baseRequest,
        headers: {
          'Custom-Header': '',
          'Another-Header': 'value',
        },
      };

      const result = generateCurlCommand(request);

      expect(result).toContain('-H "Custom-Header: "');
      expect(result).toContain('-H "Another-Header: value"');
    });

    it('should handle multiline body', () => {
      const request: Request = {
        ...baseRequest,
        method: 'POST',
        body: 'line1\nline2\nline3',
      };

      const result = generateCurlCommand(request);

      expect(result).toContain('-d \'line1\nline2\nline3\'');
    });

    it('should preserve JSON formatting in body', () => {
      const request: Request = {
        ...baseRequest,
        method: 'POST',
        body: JSON.stringify({ key: 'value', nested: { prop: 123 } }, null, 2),
      };

      const result = generateCurlCommand(request);

      expect(result).toContain('-d \'');
      expect(result).toContain('{\n  "key": "value",\n  "nested": {\n    "prop": 123\n  }\n}');
    });
  });
});