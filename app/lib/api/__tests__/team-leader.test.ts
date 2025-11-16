import {
  addTeamApiMethod,
  updateTeamApiMethod,
  getTeamInvitationsApiMethod,
  inviteMemberApiMethod,
  removeMemberApiMethod,
  fetchCheckoutSessionApiMethod,
  cancelSubscriptionApiMethod,
  getListOfInvoicesApiMethod,
} from '../team-leader';

jest.mock('../sendRequestAndGetResponse');

import sendRequestAndGetResponse from '../sendRequestAndGetResponse';

describe('team-leader API methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addTeamApiMethod', () => {
    test('calls sendRequestAndGetResponse with correct URL and data', async () => {
      const testData = { name: 'Test Team', description: 'A test team' };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({ id: '123', ...testData });

      await addTeamApiMethod(testData);

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/teams/add',
        {
          body: JSON.stringify(testData),
        }
      );
      expect(sendRequestAndGetResponse).toHaveBeenCalledTimes(1);
    });

    test('returns the response from sendRequestAndGetResponse', async () => {
      const testData = { name: 'Test Team' };
      const mockResponse = { id: '123', name: 'Test Team' };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue(mockResponse);

      const result = await addTeamApiMethod(testData);

      expect(result).toEqual(mockResponse);
    });

    test('handles empty object data', async () => {
      const testData = {};
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({ id: '123' });

      await addTeamApiMethod(testData);

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/teams/add',
        {
          body: JSON.stringify(testData),
        }
      );
    });

    test('handles object with nested properties', async () => {
      const testData = {
        name: 'Team',
        settings: {
          visibility: 'private',
          allowInvites: true,
        },
      };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({ id: '123' });

      await addTeamApiMethod(testData);

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/teams/add',
        {
          body: JSON.stringify(testData),
        }
      );
    });

    test('handles API errors', async () => {
      const testData = { name: 'Test Team' };
      const error = new Error('API Error');
      (sendRequestAndGetResponse as jest.Mock).mockRejectedValue(error);

      await expect(addTeamApiMethod(testData)).rejects.toThrow('API Error');
    });
  });

  describe('updateTeamApiMethod', () => {
    test('calls sendRequestAndGetResponse with correct URL and data', async () => {
      const testData = { id: '123', name: 'Updated Team' };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue(testData);

      await updateTeamApiMethod(testData);

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/teams/update',
        {
          body: JSON.stringify(testData),
        }
      );
      expect(sendRequestAndGetResponse).toHaveBeenCalledTimes(1);
    });

    test('returns the updated team data', async () => {
      const testData = { id: '123', name: 'Updated Team' };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue(testData);

      const result = await updateTeamApiMethod(testData);

      expect(result).toEqual(testData);
    });

    test('handles team ID in data', async () => {
      const testData = { id: 'team-456', name: 'Another Team', status: 'active' };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue(testData);

      await updateTeamApiMethod(testData);

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/teams/update',
        {
          body: JSON.stringify(testData),
        }
      );
    });
  });

  describe('getTeamInvitationsApiMethod', () => {
    test('calls sendRequestAndGetResponse with correct URL, method, and teamId parameter', async () => {
      const teamId = 'team-123';
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue([]);

      await getTeamInvitationsApiMethod(teamId);

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/teams/get-invitations-for-team',
        {
          method: 'GET',
          qs: { teamId },
        }
      );
      expect(sendRequestAndGetResponse).toHaveBeenCalledTimes(1);
    });

    test('returns list of invitations', async () => {
      const teamId = 'team-123';
      const mockInvitations = [
        { id: 'inv-1', email: 'user1@example.com' },
        { id: 'inv-2', email: 'user2@example.com' },
      ];
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue(mockInvitations);

      const result = await getTeamInvitationsApiMethod(teamId);

      expect(result).toEqual(mockInvitations);
    });

    test('handles empty teamId', async () => {
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue([]);

      await getTeamInvitationsApiMethod('');

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/teams/get-invitations-for-team',
        {
          method: 'GET',
          qs: { teamId: '' },
        }
      );
    });

    test('handles special characters in teamId', async () => {
      const teamId = 'team-123@special#chars';
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue([]);

      await getTeamInvitationsApiMethod(teamId);

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/teams/get-invitations-for-team',
        {
          method: 'GET',
          qs: { teamId },
        }
      );
    });

    test('handles API errors', async () => {
      const error = new Error('Failed to fetch invitations');
      (sendRequestAndGetResponse as jest.Mock).mockRejectedValue(error);

      await expect(getTeamInvitationsApiMethod('team-123')).rejects.toThrow(
        'Failed to fetch invitations'
      );
    });
  });

  describe('inviteMemberApiMethod', () => {
    test('calls sendRequestAndGetResponse with correct URL and invitation data', async () => {
      const testData = { teamId: 'team-123', email: 'user@example.com', role: 'member' };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({ success: true });

      await inviteMemberApiMethod(testData);

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/teams/invite-member',
        {
          body: JSON.stringify(testData),
        }
      );
      expect(sendRequestAndGetResponse).toHaveBeenCalledTimes(1);
    });

    test('returns invitation response', async () => {
      const testData = { teamId: 'team-123', email: 'user@example.com' };
      const mockResponse = { invitationId: 'inv-123', status: 'pending' };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue(mockResponse);

      const result = await inviteMemberApiMethod(testData);

      expect(result).toEqual(mockResponse);
    });

    test('handles multiple roles', async () => {
      const roles = ['admin', 'member', 'viewer'];

      for (const role of roles) {
        jest.clearAllMocks();
        const testData = { teamId: 'team-123', email: 'user@example.com', role };
        (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({ success: true });

        await inviteMemberApiMethod(testData);

        expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
          '/api/v1/team-leader/teams/invite-member',
          {
            body: JSON.stringify(testData),
          }
        );
      }
    });
  });

  describe('removeMemberApiMethod', () => {
    test('calls sendRequestAndGetResponse with correct URL and member data', async () => {
      const testData = { teamId: 'team-123', userId: 'user-456' };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({ success: true });

      await removeMemberApiMethod(testData);

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/teams/remove-member',
        {
          body: JSON.stringify(testData),
        }
      );
      expect(sendRequestAndGetResponse).toHaveBeenCalledTimes(1);
    });

    test('returns success response', async () => {
      const testData = { teamId: 'team-123', userId: 'user-456' };
      const mockResponse = { success: true, removedAt: '2024-01-01T00:00:00Z' };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue(mockResponse);

      const result = await removeMemberApiMethod(testData);

      expect(result).toEqual(mockResponse);
    });

    test('handles removal of multiple members in separate calls', async () => {
      const members = [
        { teamId: 'team-123', userId: 'user-1' },
        { teamId: 'team-123', userId: 'user-2' },
      ];

      for (const member of members) {
        jest.clearAllMocks();
        (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({ success: true });

        await removeMemberApiMethod(member);

        expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
          '/api/v1/team-leader/teams/remove-member',
          {
            body: JSON.stringify(member),
          }
        );
      }
    });
  });

  describe('fetchCheckoutSessionApiMethod', () => {
    test('calls sendRequestAndGetResponse with correct URL and stripe parameters', async () => {
      const params = { mode: 'subscription', teamId: 'team-123' };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({ sessionId: 'sess-123' });

      await fetchCheckoutSessionApiMethod(params);

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/stripe/fetch-checkout-session',
        {
          body: JSON.stringify({ mode: 'subscription', teamId: 'team-123' }),
        }
      );
      expect(sendRequestAndGetResponse).toHaveBeenCalledTimes(1);
    });

    test('returns checkout session data', async () => {
      const params = { mode: 'subscription', teamId: 'team-123' };
      const mockResponse = {
        sessionId: 'sess-123',
        clientSecret: 'secret-123',
        url: 'https://checkout.stripe.com/pay/cs_test',
      };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fetchCheckoutSessionApiMethod(params);

      expect(result).toEqual(mockResponse);
    });

    test('handles different checkout modes', async () => {
      const modes = ['subscription', 'payment', 'setup'];

      for (const mode of modes) {
        jest.clearAllMocks();
        const params = { mode, teamId: 'team-123' };
        (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({ sessionId: 'sess-123' });

        await fetchCheckoutSessionApiMethod(params);

        expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
          '/api/v1/team-leader/stripe/fetch-checkout-session',
          {
            body: JSON.stringify({ mode, teamId: 'team-123' }),
          }
        );
      }
    });

    test('handles long teamId values', async () => {
      const longTeamId = 'team-' + 'a'.repeat(100);
      const params = { mode: 'subscription', teamId: longTeamId };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({ sessionId: 'sess-123' });

      await fetchCheckoutSessionApiMethod(params);

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/stripe/fetch-checkout-session',
        {
          body: JSON.stringify({ mode: 'subscription', teamId: longTeamId }),
        }
      );
    });

    test('handles API errors during checkout', async () => {
      const params = { mode: 'subscription', teamId: 'team-123' };
      const error = new Error('Stripe API Error');
      (sendRequestAndGetResponse as jest.Mock).mockRejectedValue(error);

      await expect(fetchCheckoutSessionApiMethod(params)).rejects.toThrow('Stripe API Error');
    });
  });

  describe('cancelSubscriptionApiMethod', () => {
    test('calls sendRequestAndGetResponse with correct URL and teamId', async () => {
      const params = { teamId: 'team-123' };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({ success: true });

      await cancelSubscriptionApiMethod(params);

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/cancel-subscription',
        {
          body: JSON.stringify({ teamId: 'team-123' }),
        }
      );
      expect(sendRequestAndGetResponse).toHaveBeenCalledTimes(1);
    });

    test('returns cancellation response', async () => {
      const params = { teamId: 'team-123' };
      const mockResponse = { success: true, cancelledAt: '2024-01-01T00:00:00Z' };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cancelSubscriptionApiMethod(params);

      expect(result).toEqual(mockResponse);
    });

    test('handles different team IDs', async () => {
      const teamIds = ['team-123', 'team-456', 'team-789'];

      for (const teamId of teamIds) {
        jest.clearAllMocks();
        (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({ success: true });

        await cancelSubscriptionApiMethod({ teamId });

        expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
          '/api/v1/team-leader/cancel-subscription',
          {
            body: JSON.stringify({ teamId }),
          }
        );
      }
    });

    test('handles API errors during cancellation', async () => {
      const params = { teamId: 'team-123' };
      const error = new Error('Failed to cancel subscription');
      (sendRequestAndGetResponse as jest.Mock).mockRejectedValue(error);

      await expect(cancelSubscriptionApiMethod(params)).rejects.toThrow(
        'Failed to cancel subscription'
      );
    });
  });

  describe('getListOfInvoicesApiMethod', () => {
    test('calls sendRequestAndGetResponse with correct URL and GET method', async () => {
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue([]);

      await getListOfInvoicesApiMethod();

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        '/api/v1/team-leader/get-list-of-invoices-for-customer',
        {
          method: 'GET',
        }
      );
      expect(sendRequestAndGetResponse).toHaveBeenCalledTimes(1);
    });

    test('returns list of invoices', async () => {
      const mockInvoices = [
        { id: 'inv-1', amount: 100, date: '2024-01-01' },
        { id: 'inv-2', amount: 200, date: '2024-02-01' },
        { id: 'inv-3', amount: 150, date: '2024-03-01' },
      ];
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue(mockInvoices);

      const result = await getListOfInvoicesApiMethod();

      expect(result).toEqual(mockInvoices);
    });

    test('returns empty array when no invoices exist', async () => {
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue([]);

      const result = await getListOfInvoicesApiMethod();

      expect(result).toEqual([]);
    });

    test('handles API errors when fetching invoices', async () => {
      const error = new Error('Failed to fetch invoices');
      (sendRequestAndGetResponse as jest.Mock).mockRejectedValue(error);

      await expect(getListOfInvoicesApiMethod()).rejects.toThrow('Failed to fetch invoices');
    });

    test('can be called multiple times independently', async () => {
      const mockInvoices1 = [{ id: 'inv-1', amount: 100 }];
      const mockInvoices2 = [{ id: 'inv-1', amount: 100 }, { id: 'inv-2', amount: 200 }];

      (sendRequestAndGetResponse as jest.Mock).mockResolvedValueOnce(mockInvoices1);
      const result1 = await getListOfInvoicesApiMethod();

      (sendRequestAndGetResponse as jest.Mock).mockResolvedValueOnce(mockInvoices2);
      const result2 = await getListOfInvoicesApiMethod();

      expect(result1).toEqual(mockInvoices1);
      expect(result2).toEqual(mockInvoices2);
      expect(sendRequestAndGetResponse).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration tests - URL construction', () => {
    test('all methods use correct base path', async () => {
      const testData = { test: 'data' };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({});

      const methods = [
        { fn: addTeamApiMethod, expectedPath: '/api/v1/team-leader/teams/add' },
        { fn: updateTeamApiMethod, expectedPath: '/api/v1/team-leader/teams/update' },
        { fn: inviteMemberApiMethod, expectedPath: '/api/v1/team-leader/teams/invite-member' },
        { fn: removeMemberApiMethod, expectedPath: '/api/v1/team-leader/teams/remove-member' },
      ];

      for (const { fn, expectedPath } of methods) {
        jest.clearAllMocks();
        (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({});

        await fn(testData);

        expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
          expectedPath,
          expect.any(Object)
        );
      }
    });

    test('all methods correctly stringify request bodies', async () => {
      const testData = { key: 'value', nested: { prop: 123 } };
      (sendRequestAndGetResponse as jest.Mock).mockResolvedValue({});

      await addTeamApiMethod(testData);

      expect(sendRequestAndGetResponse).toHaveBeenCalledWith(
        expect.any(String),
        {
          body: JSON.stringify(testData),
        }
      );

      const callArgs = (sendRequestAndGetResponse as jest.Mock).mock.calls[0];
      expect(JSON.parse(callArgs[1].body)).toEqual(testData);
    });
  });
});
