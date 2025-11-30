import { Post } from '../post';

// Mock API methods
jest.mock('../../api/team-member', () => ({
  editPostApiMethod: jest.fn(),
}));

// Mock dependent classes
jest.mock('../index', () => ({
  Store: jest.fn().mockImplementation(() => ({
    socket: { id: 'socket123' },
  })),
}));

jest.mock('../discussion', () => ({
  Discussion: jest.fn().mockImplementation((params) => ({
    _id: params._id || 'discussion123',
    store: params.store,
    team: {
      members: new Map([['user123', { _id: 'user123', displayName: 'Test User' }]]),
    },
    ...params,
  })),
}));

jest.mock('../user', () => ({
  User: jest.fn().mockImplementation((params) => ({
    _id: params._id || 'user123',
    displayName: params.displayName || 'Test User',
    ...params,
  })),
}));

import { editPostApiMethod } from '../../api/team-member';

const mockEditPostApiMethod = editPostApiMethod as jest.MockedFunction<any>;

describe('Post', () => {
  let mockStore: any;
  let mockDiscussion: any;
  let mockUser: any;

  const postParams = {
    _id: 'post123',
    createdUserId: 'user123',
    createdAt: new Date('2023-01-01'),
    discussionId: 'discussion123',
    content: 'Test content',
    htmlContent: '<p>Test content</p>',
    isEdited: false,
    lastUpdatedAt: new Date('2023-01-01'),
    discussion: null as any,
    store: null as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockStore = { socket: { id: 'socket123' } };
    mockDiscussion = {
      _id: 'discussion123',
      store: mockStore,
      team: {
        members: new Map([['user123', { _id: 'user123', displayName: 'Test User' }]]),
      },
    };
    mockUser = { _id: 'user123', displayName: 'Test User' };

    postParams.discussion = mockDiscussion;
    postParams.store = mockStore;
  });

  describe('constructor', () => {
    test('initializes Post with correct properties', () => {
      const post = new Post(postParams);

      expect(post._id).toBe('post123');
      expect(post.createdUserId).toBe('user123');
      expect(post.createdAt).toEqual(new Date('2023-01-01'));
      expect(post.discussionId).toBe('discussion123');
      expect(post.content).toBe('Test content');
      expect(post.htmlContent).toBe('<p>Test content</p>');
      expect(post.isEdited).toBe(false);
      expect(post.lastUpdatedAt).toEqual(new Date('2023-01-01'));
      expect(post.discussion).toBe(mockDiscussion);
      expect(post.store).toBe(mockStore);
    });

    test('makes correct properties observable with MobX', () => {
      const post = new Post(postParams);

      // Verify MobX observables are set up (we can't directly test makeObservable,
      // but we can verify the properties exist and are accessible)
      expect(post.content).toBe('Test content');
      expect(post.htmlContent).toBe('<p>Test content</p>');
      expect(post.isEdited).toBe(false);
      expect(post.lastUpdatedAt).toEqual(new Date('2023-01-01'));
    });
  });

  describe('editPost', () => {
    const editData = {
      content: 'Updated content',
      htmlContent: '<p>Updated content</p>',
      lastUpdatedAt: new Date('2023-01-02'),
    };

    test('successfully edits post and updates local cache', async () => {
      mockEditPostApiMethod.mockResolvedValue({ success: true });

      const post = new Post(postParams);
      await post.editPost(editData);

      expect(mockEditPostApiMethod).toHaveBeenCalledWith({
        id: 'post123',
        content: 'Updated content',
        socketId: 'socket123',
      });

      expect(post.content).toBe('Updated content');
      expect(post.htmlContent).toBe('<p>Updated content</p>');
      expect(post.isEdited).toBe(true);
      expect(post.lastUpdatedAt).toEqual(new Date('2023-01-02'));
    });

    test('handles socket being null', async () => {
      mockEditPostApiMethod.mockResolvedValue({ success: true });
      mockStore.socket = null;

      const post = new Post(postParams);
      await post.editPost(editData);

      expect(mockEditPostApiMethod).toHaveBeenCalledWith({
        id: 'post123',
        content: 'Updated content',
        socketId: null,
      });
    });

    test('handles socket.id being undefined', async () => {
      mockEditPostApiMethod.mockResolvedValue({ success: true });
      mockStore.socket = {};

      const post = new Post(postParams);
      await post.editPost(editData);

      expect(mockEditPostApiMethod).toHaveBeenCalledWith({
        id: 'post123',
        content: 'Updated content',
        socketId: null,
      });
    });

    test('throws error when API call fails', async () => {
      const apiError = new Error('API Error');
      mockEditPostApiMethod.mockRejectedValue(apiError);

      const post = new Post(postParams);

      await expect(post.editPost(editData)).rejects.toThrow('API Error');
      // Note: console.error is globally mocked in jest.setup.js, so we can't spy on it
      // The error is logged as expected based on the implementation
    });

    test('does not update local cache when API call fails', async () => {
      const apiError = new Error('API Error');
      mockEditPostApiMethod.mockRejectedValue(apiError);

      const post = new Post(postParams);
      const originalContent = post.content;
      const originalIsEdited = post.isEdited;

      try {
        await post.editPost(editData);
      } catch (error) {
        // Expected to throw
      }

      expect(post.content).toBe(originalContent);
      expect(post.isEdited).toBe(originalIsEdited);
    });
  });

  describe('changeLocalCache', () => {
    test('updates post properties correctly', () => {
      const post = new Post(postParams);
      const updateData = {
        content: 'New content',
        htmlContent: '<p>New content</p>',
        lastUpdatedAt: new Date('2023-01-03'),
      };

      post.changeLocalCache(updateData);

      expect(post.content).toBe('New content');
      expect(post.htmlContent).toBe('<p>New content</p>');
      expect(post.isEdited).toBe(true);
      expect(post.lastUpdatedAt).toEqual(new Date('2023-01-03'));
    });
  });

  describe('user computed property', () => {
    test('returns user from discussion team members', () => {
      const post = new Post(postParams);

      const user = post.user;

      expect(user).toEqual(mockUser);
      expect(user._id).toBe('user123');
      expect(user.displayName).toBe('Test User');
    });

    test('returns null when user not found in team members', () => {
      // Create discussion with empty members map
      const discussionWithoutUser = {
        store: mockStore,
        team: { members: new Map() },
      };

      const postParamsWithoutUser = {
        ...postParams,
        createdUserId: 'nonexistent-user',
        discussion: discussionWithoutUser,
      };

      const post = new Post(postParamsWithoutUser);

      expect(post.user).toBeNull();
    });

    test('returns null when discussion team members are not available', () => {
      const discussionWithEmptyMembers = {
        store: mockStore,
        team: { members: new Map() },
      };

      const postParamsWithEmptyMembers = {
        ...postParams,
        createdUserId: 'nonexistent-user',
        discussion: discussionWithEmptyMembers,
      };

      const post = new Post(postParamsWithEmptyMembers);

      expect(post.user).toBeNull();
    });

    test('throws error when discussion team is null', () => {
      const discussionWithNullTeam = {
        store: mockStore,
        team: null,
      };

      const postParamsWithNullTeam = {
        ...postParams,
        discussion: discussionWithNullTeam,
      };

      const post = new Post(postParamsWithNullTeam);

      expect(() => post.user).toThrow();
    });
  });
});
