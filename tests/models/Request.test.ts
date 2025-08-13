import { Request } from '../../src/models/Request';

describe('Request Model', () => {
  it('should create a request with all properties', () => {
    const request = new Request(
      'test-id',
      'Test Request',
      'https://api.example.com/test',
      'GET',
      { 'Content-Type': 'application/json' },
      '{"test": "data"}',
      'Test description'
    );

    expect(request.id).toBe('test-id');
    expect(request.name).toBe('Test Request');
    expect(request.url).toBe('https://api.example.com/test');
    expect(request.method).toBe('GET');
    expect(request.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(request.body).toBe('{"test": "data"}');
    expect(request.description).toBe('Test description');
  });

  it('should create a request with minimal properties', () => {
    const request = new Request('test-id', 'Test Request', 'https://api.example.com/test');

    expect(request.id).toBe('test-id');
    expect(request.name).toBe('Test Request');
    expect(request.url).toBe('https://api.example.com/test');
    expect(request.method).toBe('GET');
    expect(request.headers).toEqual({});
    expect(request.body).toBe('');
    expect(request.description).toBe('');
  });

  it('should update request properties', () => {
    const request = new Request('test-id', 'Test Request', 'https://api.example.com/test');

    request.method = 'POST';
    request.headers = { Authorization: 'Bearer token' };
    request.body = '{"data": "updated"}';

    expect(request.method).toBe('POST');
    expect(request.headers).toEqual({ Authorization: 'Bearer token' });
    expect(request.body).toBe('{"data": "updated"}');
  });
});
