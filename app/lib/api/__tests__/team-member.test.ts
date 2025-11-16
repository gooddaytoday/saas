import sendRequestAndGetResponse from '../sendRequestAndGetResponse';
import * as teamMemberApi from '../team-member';

// Mock the sendRequestAndGetResponse function
jest.mock('../sendRequestAndGetResponse');

const mockedSendRequest = sendRequestAndGetResponse as jest.MockedFunction<
  typeof sendRequestAndGetResponse
>;

describe('team-member API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSignedRequestForUploadApiMethod', () => {
    it('should call sendRequestAndGetResponse with correct path and parameters', async () => {
      // Arrange
      const mockResponse = { signedRequest: 'signed-url', url: 'https://s3.example.com' };
      mockedSendRequest.mockResolvedValue(mockResponse);

      const params = {
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        prefix: 'documents',
        bucket: 'my-bucket',
      };

      // Act
      const result = await teamMemberApi.getSignedRequestForUploadApiMethod(params);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith(
        '/api/v1/team-member/aws/get-signed-request-for-upload-to-s3',
        {
          body: JSON.stringify(params),
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle response with signed request data', async () => {
      // Arrange
      const mockResponse = { signedRequest: 'mock-signed-request' };
      mockedSendRequest.mockResolvedValue(mockResponse);

      const params = {
        fileName: 'image.png',
        fileType: 'image/png',
        prefix: 'images',
        bucket: 'bucket-name',
      };

      // Act
      const result = await teamMemberApi.getSignedRequestForUploadApiMethod(params);

      // Assert
      expect(result.signedRequest).toBe('mock-signed-request');
    });

    it('should propagate errors from sendRequestAndGetResponse', async () => {
      // Arrange
      const error = new Error('Upload service error');
      mockedSendRequest.mockRejectedValue(error);

      const params = {
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        prefix: 'documents',
        bucket: 'my-bucket',
      };

      // Act & Assert
      await expect(teamMemberApi.getSignedRequestForUploadApiMethod(params)).rejects.toThrow(
        'Upload service error',
      );
    });
  });

  describe('uploadFileUsingSignedPutRequestApiMethod', () => {
    it('should call sendRequestAndGetResponse with PUT method and file body', async () => {
      // Arrange
      const mockFile = new File(['file content'], 'test.pdf', { type: 'application/pdf' });
      const signedRequest = 'https://s3.example.com/signed-upload';
      const mockResponse = { success: true };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.uploadFileUsingSignedPutRequestApiMethod(
        mockFile,
        signedRequest,
      );

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith(signedRequest, {
        externalServer: true,
        method: 'PUT',
        body: mockFile,
        headers: {},
      });
      expect(result).toEqual(mockResponse);
    });

    it('should include custom headers when provided', async () => {
      // Arrange
      const mockFile = new File(['content'], 'file.txt');
      const signedRequest = 'https://s3.example.com/upload';
      const customHeaders = { 'x-custom-header': 'value' };
      const mockResponse = { success: true };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.uploadFileUsingSignedPutRequestApiMethod(
        mockFile,
        signedRequest,
        customHeaders,
      );

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith(signedRequest, {
        externalServer: true,
        method: 'PUT',
        body: mockFile,
        headers: customHeaders,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should use empty headers object by default', async () => {
      // Arrange
      const mockFile = new File(['data'], 'file.bin');
      const signedRequest = 'https://example.com/upload';
      const mockResponse = { uploaded: true };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      await teamMemberApi.uploadFileUsingSignedPutRequestApiMethod(mockFile, signedRequest);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith(
        signedRequest,
        expect.objectContaining({
          headers: {},
        }),
      );
    });

    it('should handle upload errors', async () => {
      // Arrange
      const mockFile = new File(['content'], 'file.txt');
      const signedRequest = 'https://s3.example.com/upload';
      const error = new Error('Upload failed');

      mockedSendRequest.mockRejectedValue(error);

      // Act & Assert
      await expect(
        teamMemberApi.uploadFileUsingSignedPutRequestApiMethod(mockFile, signedRequest),
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('updateProfileApiMethod', () => {
    it('should call sendRequestAndGetResponse with profile update data', async () => {
      // Arrange
      const profileData = { name: 'John Doe', email: 'john@example.com' };
      const mockResponse = { success: true };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.updateProfileApiMethod(profileData);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/user/update-profile', {
        body: JSON.stringify(profileData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty profile data', async () => {
      // Arrange
      const mockResponse = { success: true };
      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      await teamMemberApi.updateProfileApiMethod({});

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/user/update-profile', {
        body: JSON.stringify({}),
      });
    });

    it('should propagate errors from API', async () => {
      // Arrange
      const profileData = { name: 'Jane' };
      const error = new Error('Profile update failed');

      mockedSendRequest.mockRejectedValue(error);

      // Act & Assert
      await expect(teamMemberApi.updateProfileApiMethod(profileData)).rejects.toThrow(
        'Profile update failed',
      );
    });
  });

  describe('toggleThemeApiMethod', () => {
    it('should call sendRequestAndGetResponse with theme toggle data', async () => {
      // Arrange
      const themeData = { theme: 'dark' };
      const mockResponse = { theme: 'dark' };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.toggleThemeApiMethod(themeData);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/user/toggle-theme', {
        body: JSON.stringify(themeData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle various theme values', async () => {
      // Arrange
      const themes = ['light', 'dark'];

      for (const theme of themes) {
        mockedSendRequest.mockResolvedValue({ theme });

        // Act
        await teamMemberApi.toggleThemeApiMethod({ theme });

        // Assert
        expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/user/toggle-theme', {
          body: JSON.stringify({ theme }),
        });
      }
    });
  });

  describe('getInitialDataApiMethod', () => {
    it('should call sendRequestAndGetResponse with empty options object', async () => {
      // Arrange
      const mockResponse = { user: {}, teams: [] };
      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.getInitialDataApiMethod();

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/get-initial-data', {
        body: JSON.stringify({}),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should pass options.data in the body when provided', async () => {
      // Arrange
      const options = { data: { teamId: '123' } };
      const mockResponse = { user: { id: '1' }, teams: [{ id: '123' }] };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.getInitialDataApiMethod(options);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/get-initial-data', {
        body: JSON.stringify({ teamId: '123' }),
        data: { teamId: '123' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should merge custom options with default options', async () => {
      // Arrange
      const options = {
        data: { filter: 'active' },
        timeout: 5000,
      };
      const mockResponse = { teams: [] };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      await teamMemberApi.getInitialDataApiMethod(options);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith(
        '/api/v1/team-member/get-initial-data',
        expect.objectContaining({
          body: JSON.stringify({ filter: 'active' }),
          data: { filter: 'active' },
          timeout: 5000,
        }),
      );
    });

    it('should return initial data response', async () => {
      // Arrange
      const mockResponse = {
        user: { id: '1', name: 'John' },
        teams: [{ id: 'team1', name: 'Team A' }],
      };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.getInitialDataApiMethod();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result.user).toBeDefined();
      expect(result.teams).toBeDefined();
    });
  });

  describe('getTeamMembersApiMethod', () => {
    it('should call sendRequestAndGetResponse with GET method and teamId query parameter', async () => {
      // Arrange
      const teamId = 'team-123';
      const mockResponse = { members: [] };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.getTeamMembersApiMethod(teamId);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/teams/get-members', {
        method: 'GET',
        qs: { teamId },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return team members list', async () => {
      // Arrange
      const teamId = 'team-456';
      const mockResponse = {
        members: [
          { id: 'user-1', name: 'Alice' },
          { id: 'user-2', name: 'Bob' },
        ],
      };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.getTeamMembersApiMethod(teamId);

      // Assert
      expect(result.members).toHaveLength(2);
      expect(result.members[0].name).toBe('Alice');
    });

    it('should handle empty team members response', async () => {
      // Arrange
      const teamId = 'empty-team';
      const mockResponse = { members: [] };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.getTeamMembersApiMethod(teamId);

      // Assert
      expect(result.members).toEqual([]);
    });

    it('should propagate errors from API call', async () => {
      // Arrange
      const teamId = 'team-xyz';
      const error = new Error('Team not found');

      mockedSendRequest.mockRejectedValue(error);

      // Act & Assert
      await expect(teamMemberApi.getTeamMembersApiMethod(teamId)).rejects.toThrow('Team not found');
    });
  });

  describe('getDiscussionListApiMethod', () => {
    it('should call sendRequestAndGetResponse with GET method and query parameters', async () => {
      // Arrange
      const params = { teamId: 'team-1', page: 1, limit: 10 };
      const mockResponse = { discussions: [] };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.getDiscussionListApiMethod(params);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/discussions/list', {
        method: 'GET',
        qs: params,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return typed response with discussions array', async () => {
      // Arrange
      const params = { teamId: 'team-1' };
      const mockResponse = {
        discussions: [
          { id: 'disc-1', title: 'Discussion 1' },
          { id: 'disc-2', title: 'Discussion 2' },
        ],
      };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.getDiscussionListApiMethod(params);

      // Assert
      expect(result.discussions).toHaveLength(2);
      expect(result.discussions[0].id).toBe('disc-1');
    });

    it('should handle empty discussions list', async () => {
      // Arrange
      const params = { teamId: 'team-empty' };
      const mockResponse = { discussions: [] };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.getDiscussionListApiMethod(params);

      // Assert
      expect(result.discussions).toEqual([]);
    });

    it('should support pagination parameters', async () => {
      // Arrange
      const params = { teamId: 'team-1', page: 2, limit: 20 };
      const mockResponse = { discussions: [] };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      await teamMemberApi.getDiscussionListApiMethod(params);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/discussions/list', {
        method: 'GET',
        qs: expect.objectContaining({
          page: 2,
          limit: 20,
        }),
      });
    });
  });

  describe('addDiscussionApiMethod', () => {
    it('should call sendRequestAndGetResponse with discussion data', async () => {
      // Arrange
      const discussionData = { title: 'New Discussion', teamId: 'team-1' };
      const mockResponse = { id: 'disc-123', ...discussionData };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.addDiscussionApiMethod(discussionData);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/discussions/add', {
        body: JSON.stringify(discussionData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle newly created discussion response', async () => {
      // Arrange
      const discussionData = { title: 'Test Discussion', teamId: 'team-1' };
      const mockResponse = { id: 'disc-new', ...discussionData, createdAt: '2024-01-01' };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.addDiscussionApiMethod(discussionData);

      // Assert
      expect(result.id).toBe('disc-new');
      expect(result.title).toBe('Test Discussion');
    });
  });

  describe('editDiscussionApiMethod', () => {
    it('should call sendRequestAndGetResponse with updated discussion data', async () => {
      // Arrange
      const discussionData = { id: 'disc-1', title: 'Updated Title' };
      const mockResponse = { ...discussionData };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.editDiscussionApiMethod(discussionData);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/discussions/edit', {
        body: JSON.stringify(discussionData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return updated discussion', async () => {
      // Arrange
      const discussionData = { id: 'disc-1', title: 'New Title', description: 'Updated' };
      const mockResponse = { ...discussionData, updatedAt: '2024-01-02' };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.editDiscussionApiMethod(discussionData);

      // Assert
      expect(result.title).toBe('New Title');
      expect(result.description).toBe('Updated');
    });
  });

  describe('deleteDiscussionApiMethod', () => {
    it('should call sendRequestAndGetResponse with discussion id', async () => {
      // Arrange
      const deleteData = { id: 'disc-1' };
      const mockResponse = { success: true };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.deleteDiscussionApiMethod(deleteData);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/discussions/delete', {
        body: JSON.stringify(deleteData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return success response', async () => {
      // Arrange
      const deleteData = { id: 'disc-to-delete' };
      const mockResponse = { success: true, deletedId: 'disc-to-delete' };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.deleteDiscussionApiMethod(deleteData);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('getPostListApiMethod', () => {
    it('should call sendRequestAndGetResponse with GET method and discussionId parameter', async () => {
      // Arrange
      const discussionId = 'disc-1';
      const mockResponse = { posts: [] };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.getPostListApiMethod(discussionId);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/posts/list', {
        method: 'GET',
        qs: { discussionId },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return posts for discussion', async () => {
      // Arrange
      const discussionId = 'disc-1';
      const mockResponse = {
        posts: [
          { id: 'post-1', content: 'First post' },
          { id: 'post-2', content: 'Second post' },
        ],
      };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.getPostListApiMethod(discussionId);

      // Assert
      expect(result.posts).toHaveLength(2);
      expect(result.posts[0].content).toBe('First post');
    });

    it('should handle empty posts list', async () => {
      // Arrange
      const discussionId = 'disc-empty';
      const mockResponse = { posts: [] };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.getPostListApiMethod(discussionId);

      // Assert
      expect(result.posts).toEqual([]);
    });
  });

  describe('addPostApiMethod', () => {
    it('should call sendRequestAndGetResponse with post data', async () => {
      // Arrange
      const postData = { content: 'New post', discussionId: 'disc-1' };
      const mockResponse = { id: 'post-123', ...postData };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.addPostApiMethod(postData);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/posts/add', {
        body: JSON.stringify(postData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return created post with id', async () => {
      // Arrange
      const postData = { content: 'Test post', discussionId: 'disc-1' };
      const mockResponse = { id: 'post-new', ...postData, createdAt: '2024-01-01' };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.addPostApiMethod(postData);

      // Assert
      expect(result.id).toBe('post-new');
      expect(result.content).toBe('Test post');
    });
  });

  describe('editPostApiMethod', () => {
    it('should call sendRequestAndGetResponse with updated post data', async () => {
      // Arrange
      const postData = { id: 'post-1', content: 'Updated content' };
      const mockResponse = { ...postData };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.editPostApiMethod(postData);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/posts/edit', {
        body: JSON.stringify(postData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return updated post', async () => {
      // Arrange
      const postData = { id: 'post-1', content: 'New content' };
      const mockResponse = { ...postData, updatedAt: '2024-01-02' };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.editPostApiMethod(postData);

      // Assert
      expect(result.content).toBe('New content');
    });
  });

  describe('deletePostApiMethod', () => {
    it('should call sendRequestAndGetResponse with post id', async () => {
      // Arrange
      const deleteData = { id: 'post-1' };
      const mockResponse = { success: true };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.deletePostApiMethod(deleteData);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/posts/delete', {
        body: JSON.stringify(deleteData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should return success response', async () => {
      // Arrange
      const deleteData = { id: 'post-to-delete' };
      const mockResponse = { success: true, deletedId: 'post-to-delete' };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.deletePostApiMethod(deleteData);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('sendDataToLambdaApiMethod', () => {
    it('should call sendRequestAndGetResponse with external server and lambda data', async () => {
      // Arrange
      const lambdaData = { action: 'process', payload: { id: 123 } };
      const mockResponse = { result: 'processed' };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Set environment variable
      process.env.NEXT_PUBLIC_API_GATEWAY_ENDPOINT = 'https://api.example.com';

      // Act
      const result = await teamMemberApi.sendDataToLambdaApiMethod(lambdaData);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('https://api.example.com/', {
        externalServer: true,
        body: JSON.stringify(lambdaData),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle lambda response', async () => {
      // Arrange
      const lambdaData = { action: 'calculate', value: 42 };
      const mockResponse = { result: 'calculated', output: 84 };

      mockedSendRequest.mockResolvedValue(mockResponse);
      process.env.NEXT_PUBLIC_API_GATEWAY_ENDPOINT = 'https://api.example.com';

      // Act
      const result = await teamMemberApi.sendDataToLambdaApiMethod(lambdaData);

      // Assert
      expect(result.output).toBe(84);
    });

    it('should propagate lambda errors', async () => {
      // Arrange
      const lambdaData = { action: 'error' };
      const error = new Error('Lambda execution failed');

      mockedSendRequest.mockRejectedValue(error);
      process.env.NEXT_PUBLIC_API_GATEWAY_ENDPOINT = 'https://api.example.com';

      // Act & Assert
      await expect(teamMemberApi.sendDataToLambdaApiMethod(lambdaData)).rejects.toThrow(
        'Lambda execution failed',
      );
    });
  });

  describe('Integration tests - Multiple API calls', () => {
    it('should handle sequential API calls', async () => {
      // Arrange
      const mockResponse1 = { members: [{ id: 'user-1' }] };
      const mockResponse2 = { discussions: [] };

      mockedSendRequest.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      // Act
      const members = await teamMemberApi.getTeamMembersApiMethod('team-1');
      const discussions = await teamMemberApi.getDiscussionListApiMethod({ teamId: 'team-1' });

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledTimes(2);
      expect(members.members).toHaveLength(1);
      expect(discussions.discussions).toEqual([]);
    });

    it('should handle concurrent API calls', async () => {
      // Arrange
      mockedSendRequest.mockResolvedValue({ items: [] });

      // Act
      const results = await Promise.all([
        teamMemberApi.getTeamMembersApiMethod('team-1'),
        teamMemberApi.getDiscussionListApiMethod({ teamId: 'team-1' }),
        teamMemberApi.getPostListApiMethod('disc-1'),
      ]);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
    });
  });

  describe('Error handling - All API methods', () => {
    it('should propagate 400 errors', async () => {
      // Arrange
      const error = new Error('400');
      mockedSendRequest.mockRejectedValue(error);

      // Act & Assert
      await expect(teamMemberApi.updateProfileApiMethod({})).rejects.toThrow('400');
    });

    it('should propagate 500 errors', async () => {
      // Arrange
      const error = new Error('500');
      mockedSendRequest.mockRejectedValue(error);

      // Act & Assert
      await expect(teamMemberApi.getTeamMembersApiMethod('team-1')).rejects.toThrow('500');
    });

    it('should propagate network errors', async () => {
      // Arrange
      const error = new Error('Network error');
      mockedSendRequest.mockRejectedValue(error);

      // Act & Assert
      await expect(teamMemberApi.addDiscussionApiMethod({})).rejects.toThrow('Network error');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined options parameter gracefully', async () => {
      // Arrange
      const mockResponse = { user: {}, teams: [] };
      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.getInitialDataApiMethod(undefined);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should handle undefined data in API responses', async () => {
      // Arrange
      mockedSendRequest.mockResolvedValue(undefined);

      // Act
      const result = await teamMemberApi.getTeamMembersApiMethod('team-1');

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle large file uploads', async () => {
      // Arrange
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large-file.bin');
      const signedRequest = 'https://s3.example.com/upload';
      const mockResponse = { success: true };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.uploadFileUsingSignedPutRequestApiMethod(
        largeFile,
        signedRequest,
      );

      // Assert
      expect(mockedSendRequest).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should handle special characters in parameters', async () => {
      // Arrange
      const discussionData = { title: 'Special chars: !@#$%^&*()', teamId: 'team-1' };
      const mockResponse = { id: 'disc-1', ...discussionData };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.addDiscussionApiMethod(discussionData);

      // Assert
      expect(mockedSendRequest).toHaveBeenCalledWith('/api/v1/team-member/discussions/add', {
        body: JSON.stringify(discussionData),
      });
      expect(result.title).toBe('Special chars: !@#$%^&*()');
    });

    it('should handle unicode characters in data', async () => {
      // Arrange
      const postData = { content: '你好世界 🌍 مرحبا' };
      const mockResponse = { id: 'post-1', ...postData };

      mockedSendRequest.mockResolvedValue(mockResponse);

      // Act
      const result = await teamMemberApi.addPostApiMethod(postData);

      // Assert
      expect(result.content).toBe('你好世界 🌍 مرحبا');
    });
  });
});
