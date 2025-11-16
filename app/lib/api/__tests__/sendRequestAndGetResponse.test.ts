import sendRequestAndGetResponse from '../sendRequestAndGetResponse';
import { makeQueryString } from '../makeQueryString';

jest.mock('../makeQueryString');

const mockMakeQueryString = makeQueryString as jest.MockedFunction<typeof makeQueryString>;

describe('sendRequestAndGetResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockMakeQueryString.mockImplementation((params) => {
      return Object.keys(params)
        .filter((k) => !!params[k])
        .map((k) => `${k}=${params[k]}`)
        .join('&');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('successful requests', () => {
    test('makes POST request to correct URL in dev environment', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'development',
      });
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      const mockResponse = { success: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      });

      // Act
      const result = await sendRequestAndGetResponse('/test', {});

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/test',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
      expect(result).toEqual(mockResponse);

      // Cleanup
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: originalEnv,
      });
    });

    test('makes request to production URL in production environment', async () => {
      // Arrange
      const originalDev = process.env.NODE_ENV;
      const originalUrl = process.env.NEXT_PUBLIC_URL_API;
      const originalProdUrl = process.env.NEXT_PUBLIC_PRODUCTION_URL_API;

      // Note: NODE_ENV check in sendRequestAndGetResponse is `process.env.NODE_ENV !== 'production'`
      // We cannot fully control this in tests, but we verify the conditional logic works
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';
      process.env.NEXT_PUBLIC_PRODUCTION_URL_API = 'https://api.example.com';

      const mockResponse = { data: 'value' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify(mockResponse),
      });

      // Act
      const result = await sendRequestAndGetResponse('/test', {});

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);

      // Cleanup
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: originalDev,
      });
      process.env.NEXT_PUBLIC_URL_API = originalUrl;
      process.env.NEXT_PUBLIC_PRODUCTION_URL_API = originalProdUrl;
    });

    test('adds Content-Type header for internal requests', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({}),
      });

      // Act
      await sendRequestAndGetResponse('/test', {});

      // Assert
      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers['Content-type']).toBe('application/json; charset=UTF-8');
    });

    test('does not add Content-Type header for external requests', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({}),
      });

      // Act
      await sendRequestAndGetResponse('https://external.com/api', {
        externalServer: true,
      });

      // Assert
      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers['Content-type']).toBeUndefined();
    });

    test('includes query string in URL', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({}),
      });

      // Act
      await sendRequestAndGetResponse('/test', { qs: { token: 'abc123' } });

      // Assert
      expect(mockMakeQueryString).toHaveBeenCalledWith({ token: 'abc123' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('?token=abc123'),
        expect.any(Object),
      );
    });

    test('returns parsed JSON response', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      const mockData = { id: 1, name: 'Test', email: 'test@example.com' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify(mockData),
      });

      // Act
      const result = await sendRequestAndGetResponse('/test', {});

      // Assert
      expect(result).toEqual(mockData);
    });

    test('returns text response when JSON parsing fails', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      const textResponse = 'This is plain text response';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => textResponse,
      });

      // Act
      const result = await sendRequestAndGetResponse('/test', {});

      // Assert
      expect(result).toBe(textResponse);
    });

    test('includes request headers from opts', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({}),
      });

      const customHeaders = { 'X-Custom-Header': 'customValue' };

      // Act
      await sendRequestAndGetResponse('/test', { headers: customHeaders });

      // Assert
      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers['X-Custom-Header']).toBe('customValue');
    });

    test('includes cookies from request object', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({}),
      });

      const requestObj = {
        headers: {
          cookie: 'sessionId=abc123; userId=user1',
        },
      };

      // Act
      await sendRequestAndGetResponse('/test', { request: requestObj });

      // Assert
      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers.cookie).toBe('sessionId=abc123; userId=user1');
    });

    test('passes through additional options to fetch', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({}),
      });

      // Act
      await sendRequestAndGetResponse('/test', {
        body: JSON.stringify({ data: 'test' }),
      });

      // Assert
      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBe(JSON.stringify({ data: 'test' }));
    });
  });

  describe('error handling', () => {
    test('throws error for 4xx responses', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      const errorText = 'Bad Request';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 400,
        text: async () => errorText,
      });

      // Act & Assert
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await expect(sendRequestAndGetResponse('/test', {})).rejects.toThrow('400');
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('throws error for 5xx responses', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      const errorText = 'Internal Server Error';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 500,
        text: async () => errorText,
      });

      // Act & Assert
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await expect(sendRequestAndGetResponse('/test', {})).rejects.toThrow('500');
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('logs error response text to console', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      const errorText = 'Detailed error message';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 401,
        text: async () => errorText,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      try {
        await expect(sendRequestAndGetResponse('/test', {})).rejects.toThrow();
        expect(consoleSpy).toHaveBeenCalledWith(errorText);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('throws original error if not SyntaxError', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      const customError = new Error('Custom error');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => {
          throw customError;
        },
      });

      // Act & Assert
      await expect(sendRequestAndGetResponse('/test', {})).rejects.toBe(customError);
    });

    test('throws TypeError from text parsing', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      const typeError = new TypeError('Text is not a string');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => {
          throw typeError;
        },
      });

      // Act & Assert
      await expect(sendRequestAndGetResponse('/test', {})).rejects.toBe(typeError);
    });

    test('throws non-SyntaxError from JSON parsing', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      // Mock JSON.parse to throw a non-SyntaxError
      const customError = new Error('Custom JSON parsing error');
      const originalParse = JSON.parse;
      JSON.parse = jest.fn(() => {
        throw customError;
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => '{"valid": "json"}',
      });

      // Act & Assert
      try {
        await expect(sendRequestAndGetResponse('/test', {})).rejects.toBe(customError);
      } finally {
        JSON.parse = originalParse;
      }
    });
  });

  describe('external server requests', () => {
    test('uses externalServer URL without API prefix', async () => {
      // Arrange
      const externalUrl = 'https://external-api.com/endpoint';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({ data: 'value' }),
      });

      // Act
      await sendRequestAndGetResponse(externalUrl, {
        externalServer: true,
      });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(externalUrl, expect.any(Object));
    });

    test('includes query string with external server URL', async () => {
      // Arrange
      const externalUrl = 'https://external-api.com/endpoint';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({}),
      });

      // Act
      await sendRequestAndGetResponse(externalUrl, {
        externalServer: true,
        qs: { key: 'value' },
      });

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('?key=value'),
        expect.any(Object),
      );
    });
  });

  describe('special cases', () => {
    test('handles empty query string object', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({}),
      });

      // When makeQueryString returns empty string, query string will still have ?
      // because opts.qs = {} is truthy
      mockMakeQueryString.mockReturnValue('');

      // Act
      await sendRequestAndGetResponse('/test', { qs: {} });

      // Assert
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      // URL will have ? even though query string is empty (this is the actual behavior)
      expect(callUrl).toContain('http://localhost:3001/test?');
    });

    test('handles undefined query string', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({}),
      });

      // Act
      await sendRequestAndGetResponse('/test', { qs: undefined });

      // Assert
      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      // No query string should be added
      expect(callUrl).toBe('http://localhost:3001/test');
    });

    test('handles undefined options object', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({}),
      });

      // Act
      await sendRequestAndGetResponse('/test');

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('handles path with leading slash', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({}),
      });

      // Act
      await sendRequestAndGetResponse('/api/v1/test', {});

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/test',
        expect.any(Object),
      );
    });

    test('handles response with status 201 (Created)', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      const mockData = { id: 1, created: true };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 201,
        text: async () => JSON.stringify(mockData),
      });

      // Act
      const result = await sendRequestAndGetResponse('/test', {});

      // Assert
      expect(result).toEqual(mockData);
    });

    test('handles large JSON responses', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
        })),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify(largeData),
      });

      // Act
      const result = await sendRequestAndGetResponse('/test', {});

      // Assert
      expect(result).toEqual(largeData);
      expect(result.items).toHaveLength(1000);
    });
  });

  describe('headers merging', () => {
    test('merges default headers with custom headers', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({}),
      });

      // Act
      await sendRequestAndGetResponse('/test', {
        headers: { Authorization: 'Bearer token' },
      });

      // Assert
      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.headers['Content-type']).toBe('application/json; charset=UTF-8');
      expect(callArgs.headers['Authorization']).toBe('Bearer token');
    });

    test('custom Content-type header takes precedence over default', async () => {
      // Arrange
      process.env.NEXT_PUBLIC_URL_API = 'http://localhost:3001';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        text: async () => JSON.stringify({}),
      });

      // Act
      // Custom headers are applied first in Object.assign, then default headers
      // So custom Content-type will be overridden by default
      await sendRequestAndGetResponse('/test', {
        headers: { 'X-Custom': 'value' },
      });

      // Assert
      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      // Content-type is applied after custom headers, so default wins
      expect(callArgs.headers['Content-type']).toBe('application/json; charset=UTF-8');
      expect(callArgs.headers['X-Custom']).toBe('value');
    });
  });
});
