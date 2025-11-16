import {
  getUserApiMethod,
  getUserBySlugApiMethod,
  emailLoginLinkApiMethod,
  getTeamByTokenApiMethod,
} from '../public';
import sendRequestAndGetResponse from '../sendRequestAndGetResponse';

jest.mock('../sendRequestAndGetResponse');

const mockSendRequest = sendRequestAndGetResponse as jest.MockedFunction<
  typeof sendRequestAndGetResponse
>;

describe('Public API Methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserApiMethod', () => {
    test('calls sendRequestAndGetResponse with correct parameters', async () => {
      // Arrange
      const mockRequest = { headers: { cookie: 'session=123' } };
      const mockResponse = { id: '1', email: 'user@example.com' };

      mockSendRequest.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await getUserApiMethod(mockRequest);

      // Assert
      expect(mockSendRequest).toHaveBeenCalledTimes(1);
      expect(mockSendRequest).toHaveBeenCalledWith('/api/v1/public/get-user', {
        request: mockRequest,
        method: 'GET',
      });
      expect(result).toEqual(mockResponse);
    });

    test('returns user data from API', async () => {
      // Arrange
      const mockRequest = {};
      const userData = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
      };

      mockSendRequest.mockResolvedValueOnce(userData);

      // Act
      const result = await getUserApiMethod(mockRequest);

      // Assert
      expect(result).toEqual(userData);
      expect(result.id).toBe('123');
      expect(result.email).toBe('test@example.com');
    });

    test('passes request object to sendRequestAndGetResponse', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          cookie: 'sessionId=abc; userId=123',
        },
      };

      mockSendRequest.mockResolvedValueOnce({});

      // Act
      await getUserApiMethod(mockRequest);

      // Assert
      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          request: mockRequest,
        }),
      );
    });

    test('throws error if API request fails', async () => {
      // Arrange
      const mockRequest = {};
      const error = new Error('API Error');

      mockSendRequest.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(getUserApiMethod(mockRequest)).rejects.toThrow('API Error');
    });
  });

  describe('getUserBySlugApiMethod', () => {
    test('calls sendRequestAndGetResponse with correct parameters', async () => {
      // Arrange
      const slug = 'john-doe';
      const mockResponse = { id: '1', email: 'john@example.com' };

      mockSendRequest.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await getUserBySlugApiMethod(slug);

      // Assert
      expect(mockSendRequest).toHaveBeenCalledTimes(1);
      expect(mockSendRequest).toHaveBeenCalledWith('/api/v1/public/get-user-by-slug', {
        body: JSON.stringify({ slug }),
      });
      expect(result).toEqual(mockResponse);
    });

    test('handles different slug formats', async () => {
      // Arrange
      const testSlugs = ['john-doe', 'jane_smith', 'user123', 'my-team'];

      mockSendRequest.mockResolvedValue({ id: '1', slug: 'test' });

      // Act & Assert
      for (const slug of testSlugs) {
        await getUserBySlugApiMethod(slug);

        expect(mockSendRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ slug }),
          }),
        );
      }
    });

    test('returns user data with matching slug', async () => {
      // Arrange
      const slug = 'test-user';
      const userData = {
        id: '456',
        slug: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockSendRequest.mockResolvedValueOnce(userData);

      // Act
      const result = await getUserBySlugApiMethod(slug);

      // Assert
      expect(result).toEqual(userData);
      expect(result.slug).toBe('test-user');
    });

    test('sends slug in request body as JSON', async () => {
      // Arrange
      const slug = 'example-slug';

      mockSendRequest.mockResolvedValueOnce({});

      // Act
      await getUserBySlugApiMethod(slug);

      // Assert
      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ slug: 'example-slug' }),
        }),
      );
    });

    test('throws error if slug not found', async () => {
      // Arrange
      mockSendRequest.mockRejectedValueOnce(new Error('User not found'));

      // Act & Assert
      await expect(getUserBySlugApiMethod('non-existent-slug')).rejects.toThrow('User not found');
    });

    test('handles special characters in slug', async () => {
      // Arrange
      const slug = 'user@example'; // although unusual, should still work

      mockSendRequest.mockResolvedValueOnce({});

      // Act
      await getUserBySlugApiMethod(slug);

      // Assert
      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ slug: 'user@example' }),
        }),
      );
    });
  });

  describe('emailLoginLinkApiMethod', () => {
    test('calls sendRequestAndGetResponse with email only', async () => {
      // Arrange
      const email = 'test@example.com';
      const mockResponse = { success: true };

      mockSendRequest.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await emailLoginLinkApiMethod({ email });

      // Assert
      expect(mockSendRequest).toHaveBeenCalledTimes(1);
      expect(mockSendRequest).toHaveBeenCalledWith('/auth/email-login-link', {
        qs: { invitationToken: undefined },
        body: JSON.stringify({ user: email }),
      });
      expect(result).toEqual(mockResponse);
    });

    test('includes invitationToken in query string when provided', async () => {
      // Arrange
      const email = 'test@example.com';
      const invitationToken = 'token-123-abc';

      mockSendRequest.mockResolvedValueOnce({ success: true });

      // Act
      await emailLoginLinkApiMethod({ email, invitationToken });

      // Assert
      expect(mockSendRequest).toHaveBeenCalledWith('/auth/email-login-link', {
        qs: { invitationToken },
        body: JSON.stringify({ user: email }),
      });
    });

    test('handles invitationToken as undefined', async () => {
      // Arrange
      const email = 'user@test.com';

      mockSendRequest.mockResolvedValueOnce({ success: true });

      // Act
      await emailLoginLinkApiMethod({ email, invitationToken: undefined });

      // Assert
      expect(mockSendRequest).toHaveBeenCalledWith(
        '/auth/email-login-link',
        expect.objectContaining({
          qs: { invitationToken: undefined },
        }),
      );
    });

    test('sends email in request body', async () => {
      // Arrange
      const email = 'john.doe@example.com';

      mockSendRequest.mockResolvedValueOnce({});

      // Act
      await emailLoginLinkApiMethod({ email });

      // Assert
      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ user: email }),
        }),
      );
    });

    test('returns success response', async () => {
      // Arrange
      const email = 'test@example.com';
      const response = {
        success: true,
        message: 'Login link sent to email',
      };

      mockSendRequest.mockResolvedValueOnce(response);

      // Act
      const result = await emailLoginLinkApiMethod({ email });

      // Assert
      expect(result).toEqual(response);
      expect(result.success).toBe(true);
    });

    test('handles various email formats', async () => {
      // Arrange
      const emails = [
        'simple@example.com',
        'user.name@example.co.uk',
        'user+tag@example.com',
        'user_name@example.com',
      ];

      mockSendRequest.mockResolvedValue({ success: true });

      // Act & Assert
      for (const email of emails) {
        await emailLoginLinkApiMethod({ email });

        expect(mockSendRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ user: email }),
          }),
        );
      }
    });

    test('throws error if API request fails', async () => {
      // Arrange
      const email = 'test@example.com';

      mockSendRequest.mockRejectedValueOnce(new Error('Email sending failed'));

      // Act & Assert
      await expect(emailLoginLinkApiMethod({ email })).rejects.toThrow('Email sending failed');
    });
  });

  describe('getTeamByTokenApiMethod', () => {
    test('calls sendRequestAndGetResponse with correct parameters', async () => {
      // Arrange
      const token = 'team-invite-token-123';
      const mockRequest = { headers: { cookie: 'session=abc' } };
      const mockResponse = { id: '1', name: 'My Team' };

      mockSendRequest.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await getTeamByTokenApiMethod(token, mockRequest);

      // Assert
      expect(mockSendRequest).toHaveBeenCalledTimes(1);
      expect(mockSendRequest).toHaveBeenCalledWith('/api/v1/public/invitations/get-team-by-token', {
        request: mockRequest,
        method: 'GET',
        qs: { token },
      });
      expect(result).toEqual(mockResponse);
    });

    test('includes token in query string', async () => {
      // Arrange
      const token = 'abc-def-123-456';
      const mockRequest = {};

      mockSendRequest.mockResolvedValueOnce({});

      // Act
      await getTeamByTokenApiMethod(token, mockRequest);

      // Assert
      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          qs: { token },
        }),
      );
    });

    test('returns team data from API', async () => {
      // Arrange
      const token = 'team-token';
      const mockRequest = {};
      const teamData = {
        id: '789',
        name: 'Development Team',
        description: 'Our dev team',
        members: 5,
      };

      mockSendRequest.mockResolvedValueOnce(teamData);

      // Act
      const result = await getTeamByTokenApiMethod(token, mockRequest);

      // Assert
      expect(result).toEqual(teamData);
      expect(result.id).toBe('789');
      expect(result.name).toBe('Development Team');
    });

    test('passes request object with headers', async () => {
      // Arrange
      const token = 'token';
      const mockRequest = {
        headers: {
          cookie: 'sessionId=xyz789',
          'user-agent': 'Mozilla/5.0',
        },
      };

      mockSendRequest.mockResolvedValueOnce({});

      // Act
      await getTeamByTokenApiMethod(token, mockRequest);

      // Assert
      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          request: mockRequest,
        }),
      );
    });

    test('handles various token formats', async () => {
      // Arrange
      const tokens = ['simple-token', 'token-with-dashes-123', 'token_with_underscores'];

      mockSendRequest.mockResolvedValue({ id: '1', name: 'Team' });

      // Act & Assert
      for (const token of tokens) {
        await getTeamByTokenApiMethod(token, {});

        expect(mockSendRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            qs: { token },
          }),
        );
      }
    });

    test('throws error if team not found', async () => {
      // Arrange
      const token = 'invalid-token';
      const mockRequest = {};

      mockSendRequest.mockRejectedValueOnce(new Error('Team not found or token expired'));

      // Act & Assert
      await expect(getTeamByTokenApiMethod(token, mockRequest)).rejects.toThrow(
        'Team not found or token expired',
      );
    });

    test('uses GET method for request', async () => {
      // Arrange
      const token = 'token';
      const mockRequest = {};

      mockSendRequest.mockResolvedValueOnce({});

      // Act
      await getTeamByTokenApiMethod(token, mockRequest);

      // Assert
      expect(mockSendRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });
  });

  describe('API methods integration', () => {
    test('all API methods use correct base path', async () => {
      // Arrange
      mockSendRequest.mockResolvedValue({});

      // Act
      await getUserApiMethod({});
      const call1 = mockSendRequest.mock.calls[0][0];

      mockSendRequest.mockClear();
      mockSendRequest.mockResolvedValue({});
      await getUserBySlugApiMethod('test');
      const call2 = mockSendRequest.mock.calls[0][0];

      mockSendRequest.mockClear();
      mockSendRequest.mockResolvedValue({});
      await emailLoginLinkApiMethod({ email: 'test@example.com' });
      const call3 = mockSendRequest.mock.calls[0][0];

      mockSendRequest.mockClear();
      mockSendRequest.mockResolvedValue({});
      await getTeamByTokenApiMethod('token', {});
      const call4 = mockSendRequest.mock.calls[0][0];

      // Assert
      expect(call1).toContain('/api/v1/public');
      expect(call2).toContain('/api/v1/public');
      expect(call3).toBe('/auth/email-login-link');
      expect(call4).toContain('/api/v1/public');
    });

    test('public endpoints use correct methods', async () => {
      // Arrange
      mockSendRequest.mockResolvedValue({});

      // Act
      await getUserApiMethod({});
      const call1Method = mockSendRequest.mock.calls[0][1].method;

      mockSendRequest.mockClear();
      mockSendRequest.mockResolvedValue({});
      await getUserBySlugApiMethod('test');
      const call2Method = mockSendRequest.mock.calls[0][1].method;

      mockSendRequest.mockClear();
      mockSendRequest.mockResolvedValue({});
      await emailLoginLinkApiMethod({ email: 'test@example.com' });
      const call3Method = mockSendRequest.mock.calls[0][1].method;

      mockSendRequest.mockClear();
      mockSendRequest.mockResolvedValue({});
      await getTeamByTokenApiMethod('token', {});
      const call4Method = mockSendRequest.mock.calls[0][1].method;

      // Assert
      expect(call1Method).toBe('GET');
      expect(call2Method).toBeUndefined(); // POST is default
      expect(call3Method).toBeUndefined(); // POST is default
      expect(call4Method).toBe('GET');
    });

    test('handles concurrent API calls', async () => {
      // Arrange
      mockSendRequest
        .mockResolvedValueOnce({ id: '1' })
        .mockResolvedValueOnce({ id: '2' })
        .mockResolvedValueOnce({ id: '3' })
        .mockResolvedValueOnce({ id: '4' });

      // Act
      const results = await Promise.all([
        getUserApiMethod({}),
        getUserBySlugApiMethod('test'),
        emailLoginLinkApiMethod({ email: 'test@example.com' }),
        getTeamByTokenApiMethod('token', {}),
      ]);

      // Assert
      expect(results).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]);
      expect(mockSendRequest).toHaveBeenCalledTimes(4);
    });
  });

  describe('error scenarios', () => {
    test('propagates API errors from sendRequestAndGetResponse', async () => {
      // Arrange
      const apiError = new Error('Network error');
      mockSendRequest.mockRejectedValueOnce(apiError);

      // Act & Assert
      await expect(getUserApiMethod({})).rejects.toBe(apiError);
    });

    test('handles HTTP error responses', async () => {
      // Arrange
      const httpError = new Error('401');
      mockSendRequest.mockRejectedValueOnce(httpError);

      // Act & Assert
      await expect(getUserApiMethod({})).rejects.toThrow();
    });
  });
});
