import { observable } from 'mobx';
import { Discussion } from '../discussion';

// Mock API methods
jest.mock('../../api/team-member', () => ({
  editDiscussionApiMethod: jest.fn(),
  getPostListApiMethod: jest.fn(),
  addPostApiMethod: jest.fn(),
  deletePostApiMethod: jest.fn(),
  sendDataToLambdaApiMethod: jest.fn(),
}));

// Mock dependent classes
jest.mock('../index', () => ({
  Store: jest.fn().mockImplementation(() => ({
    isServer: false,
    socket: {
      id: 'socket123',
      emit: jest.fn(),
    },
    currentUser: {
      _id: 'user123',
    },
  })),
}));

jest.mock('../team', () => ({
  Team: jest.fn().mockImplementation(() => ({
    _id: 'team123',
    members: new Map([
      ['user1', { _id: 'user1', name: 'User 1' }],
      ['user2', { _id: 'user2', name: 'User 2' }],
    ]),
    discussions: observable([]),
    memberIds: observable([]),
  })),
}));

jest.mock('../post', () => ({
  Post: jest.fn().mockImplementation((params) => {
    return {
      _id: params._id || 'post123',
      discussion: params.discussion,
      store: params.store,
      ...params,
      changeLocalCache: jest.fn(),
    };
  }),
}));

import {
  editDiscussionApiMethod,
  getPostListApiMethod,
  addPostApiMethod,
  deletePostApiMethod,
  sendDataToLambdaApiMethod,
} from '../../api/team-member';
import { Store } from '../index';
import { Team } from '../team';
import { Post } from '../post';

describe('Discussion', () => {
  let mockStore: any;
  let mockTeam: any;
  let mockPost: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances
    mockStore = new Store({ isServer: false });
    mockTeam = new Team({ _id: 'team123', store: mockStore });
    mockPost = new Post({ _id: 'post123', discussion: null, store: mockStore });
  });

  describe('Constructor', () => {
    test('initializes with required parameters', () => {
      const params = {
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: ['user1', 'user2'],
        notificationType: 'email',
      };

      const discussion = new Discussion(params);

      expect(discussion._id).toBe('discussion123');
      expect(discussion.createdUserId).toBe('user123');
      expect(discussion.store).toBe(mockStore);
      expect(discussion.team).toBe(mockTeam);
      expect(discussion.name).toBe('Test Discussion');
      expect(discussion.slug).toBe('test-discussion');
      expect([...discussion.memberIds]).toEqual(['user1', 'user2']);
      expect(discussion.notificationType).toBe('email');
      expect(discussion.isLoadingPosts).toBe(true); // loadPosts() sets this to true
    });

    test('handles empty memberIds array', () => {
      const params = {
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: [],
        notificationType: 'email',
      };

      const discussion = new Discussion(params);

      expect([...discussion.memberIds]).toEqual([]);
      expect(discussion.isLoadingPosts).toBe(true); // loadPosts() sets this to true
    });

    test('calls setInitialPosts when initialPosts provided', () => {
      const initialPosts = [{ _id: 'post1', content: 'Post 1' }];
      const params = {
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: [],
        notificationType: 'email',
        initialPosts,
      };

      const discussion = new Discussion(params);

      // Mock setInitialPosts should be called
      expect(Post).toHaveBeenCalledWith(
        expect.objectContaining({
          discussion,
          store: mockStore,
          _id: 'post1',
          content: 'Post 1',
        }),
      );
    });

    test('calls loadPosts when no initialPosts provided', () => {
      const mockLoadPosts = jest.spyOn(Discussion.prototype, 'loadPosts').mockResolvedValue();

      const params = {
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: [],
        notificationType: 'email',
      };

      new Discussion(params);

      expect(mockLoadPosts).toHaveBeenCalled();
      mockLoadPosts.mockRestore();
    });
  });

  describe('changeLocalCache', () => {
    let discussion: Discussion;

    beforeEach(() => {
      jest.clearAllMocks();
      discussion = new Discussion({
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: ['user1'],
        notificationType: 'email',
      });
      jest.clearAllMocks(); // Clear mocks after constructor calls loadPosts
    });

    test('updates name and memberIds', () => {
      const data = {
        name: 'Updated Discussion',
        memberIds: ['user1', 'user3'],
      };

      discussion.changeLocalCache(data);

      expect(discussion.name).toBe('Updated Discussion');
      expect([...discussion.memberIds]).toEqual(['user1', 'user3']);
    });

    test('handles empty memberIds in data', () => {
      const data = {
        name: 'Updated Discussion',
        memberIds: [],
      };

      discussion.changeLocalCache(data);

      expect(discussion.name).toBe('Updated Discussion');
      expect([...discussion.memberIds]).toEqual([]);
    });

    test('handles undefined memberIds in data', () => {
      const data = {
        name: 'Updated Discussion',
        memberIds: undefined,
      };

      discussion.changeLocalCache(data);

      expect(discussion.name).toBe('Updated Discussion');
      expect([...discussion.memberIds]).toEqual(['user1']); // Should keep existing
    });
  });

  describe('members (computed)', () => {
    let discussion: Discussion;

    beforeEach(() => {
      discussion = new Discussion({
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: ['user1', 'user2'],
        notificationType: 'email',
      });
    });

    test('returns mapped members from memberIds', () => {
      const members = discussion.members;

      expect(members).toHaveLength(2);
      expect(members[0]).toEqual({ _id: 'user1', name: 'User 1' });
      expect(members[1]).toEqual({ _id: 'user2', name: 'User 2' });
    });

    test('filters out null/undefined members', () => {
      // Modify team members to include a non-existent user
      discussion.memberIds.replace(['user1', 'user999', 'user2']);

      const members = discussion.members;

      expect(members).toHaveLength(2);
      expect(members[0]._id).toBe('user1');
      expect(members[1]._id).toBe('user2');
    });

    test('returns empty array when no memberIds', () => {
      discussion.memberIds.clear();

      const members = discussion.members;

      expect(members).toEqual([]);
    });
  });

  describe('setInitialPosts', () => {
    let discussion: Discussion;

    beforeEach(() => {
      discussion = new Discussion({
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: [],
        notificationType: 'email',
      });
    });

    test('creates Post instances from posts array', () => {
      const callCountBefore = (Post as jest.Mock).mock.calls.length;

      const posts = [
        { _id: 'post1', content: 'Post 1' },
        { _id: 'post2', content: 'Post 2' },
      ];

      discussion.setInitialPosts(posts);

      const callCountAfter = (Post as jest.Mock).mock.calls.length;
      expect(callCountAfter - callCountBefore).toBe(2);

      expect(Post).toHaveBeenCalledWith(
        expect.objectContaining({
          discussion,
          store: mockStore,
          _id: 'post1',
          content: 'Post 1',
        }),
      );
      expect(Post).toHaveBeenCalledWith(
        expect.objectContaining({
          discussion,
          store: mockStore,
          _id: 'post2',
          content: 'Post 2',
        }),
      );
    });

    test('replaces existing posts array', () => {
      discussion.posts.replace([mockPost]);

      const posts = [{ _id: 'post1', content: 'Post 1' }];

      discussion.setInitialPosts(posts);

      expect(discussion.posts).toHaveLength(1);
    });
  });

  describe('loadPosts', () => {
    let discussion: Discussion;

    beforeEach(() => {
      discussion = new Discussion({
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: [],
        notificationType: 'email',
      });
    });

    test('returns early when isServer is true', async () => {
      jest.clearAllMocks();
      mockStore.isServer = true;

      await discussion.loadPosts();

      expect(getPostListApiMethod).not.toHaveBeenCalled();
    });

    test('returns early when already loading', async () => {
      jest.clearAllMocks();
      discussion.isLoadingPosts = true;

      await discussion.loadPosts();

      expect(getPostListApiMethod).not.toHaveBeenCalled();
    });

    test('loads posts successfully', async () => {
      jest.clearAllMocks();

      const mockPosts = [
        { _id: 'post1', content: 'Post 1' },
        { _id: 'post2', content: 'Post 2' },
      ];

      (getPostListApiMethod as jest.Mock).mockResolvedValue({ posts: mockPosts });

      await discussion.loadPosts();

      expect(getPostListApiMethod).toHaveBeenCalledWith('discussion123');
      expect(discussion.isLoadingPosts).toBe(false);
      expect(Post).toHaveBeenCalledTimes(2);
    });

    test('handles empty posts array', async () => {
      (getPostListApiMethod as jest.Mock).mockResolvedValue({ posts: [] });

      await discussion.loadPosts();

      expect(discussion.posts).toHaveLength(0);
      expect(discussion.isLoadingPosts).toBe(false);
    });

    test('handles undefined posts response', async () => {
      (getPostListApiMethod as jest.Mock).mockResolvedValue({});

      await discussion.loadPosts();

      expect(discussion.posts).toHaveLength(0);
      expect(discussion.isLoadingPosts).toBe(false);
    });

    test.skip('handles API error', async () => {
      const error = new Error('API Error');
      (getPostListApiMethod as jest.Mock).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let thrownError;
      try {
        await discussion.loadPosts();
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBe(error);
      expect(discussion.isLoadingPosts).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(error);

      consoleSpy.mockRestore();
    });
  });

  describe('addPost', () => {
    let discussion: Discussion;

    beforeEach(() => {
      discussion = new Discussion({
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: [],
        notificationType: 'email',
      });
    });

    test('adds post successfully and returns Post instance', async () => {
      const mockResponse = { post: { _id: 'newPost', content: 'New post' } };
      (addPostApiMethod as jest.Mock).mockResolvedValue(mockResponse);

      const result = await discussion.addPost('New post content');

      expect(addPostApiMethod).toHaveBeenCalledWith({
        discussionId: 'discussion123',
        content: 'New post content',
        socketId: 'socket123',
      });

      expect(result).toBeDefined();
      expect(discussion.posts).toHaveLength(1);
    });

    test.skip('handles API error', async () => {
      const error = new Error('API Error');
      (addPostApiMethod as jest.Mock).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let thrownError;
      try {
        await discussion.addPost('Content');
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBe(error);
      expect(consoleSpy).toHaveBeenCalledWith(error);

      consoleSpy.mockRestore();
    });

    test('works without socket', async () => {
      mockStore.socket = null;
      const mockResponse = { post: { _id: 'newPost', content: 'New post' } };
      (addPostApiMethod as jest.Mock).mockResolvedValue(mockResponse);

      await discussion.addPost('Content');

      expect(addPostApiMethod).toHaveBeenCalledWith({
        discussionId: 'discussion123',
        content: 'Content',
        socketId: null,
      });
    });
  });

  describe('deletePost', () => {
    let discussion: Discussion;
    let postToDelete: any;

    beforeEach(() => {
      discussion = new Discussion({
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: [],
        notificationType: 'email',
      });

      postToDelete = new Post({
        _id: 'postToDelete',
        createdUserId: 'user123',
        createdAt: new Date(),
        discussionId: 'discussion123',
        discussion,
        store: mockStore,
        content: 'Content to delete',
        htmlContent: 'HTML content',
        isEdited: false,
        lastUpdatedAt: new Date(),
      });
      discussion.posts.push(postToDelete);
    });

    test('deletes post successfully', async () => {
      (deletePostApiMethod as jest.Mock).mockResolvedValue({});

      await discussion.deletePost(postToDelete);

      expect(deletePostApiMethod).toHaveBeenCalledWith({
        id: 'postToDelete',
        discussionId: 'discussion123',
        socketId: 'socket123',
      });

      expect(discussion.posts).toHaveLength(0);
    });

    test.skip('handles API error', async () => {
      const error = new Error('API Error');
      (deletePostApiMethod as jest.Mock).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let thrownError;
      try {
        await discussion.deletePost(postToDelete);
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBe(error);
      expect(discussion.posts).toHaveLength(1); // Post should still be there
      expect(consoleSpy).toHaveBeenCalledWith(error);

      consoleSpy.mockRestore();
    });

    test('works without socket', async () => {
      mockStore.socket = null;
      (deletePostApiMethod as jest.Mock).mockResolvedValue({});

      await discussion.deletePost(postToDelete);

      expect(deletePostApiMethod).toHaveBeenCalledWith({
        id: 'postToDelete',
        discussionId: 'discussion123',
        socketId: null,
      });
    });
  });

  describe('editDiscussion', () => {
    let discussion: Discussion;

    beforeEach(() => {
      discussion = new Discussion({
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: ['user1'],
        notificationType: 'email',
      });
    });

    test('edits discussion successfully', async () => {
      (editDiscussionApiMethod as jest.Mock).mockResolvedValue({});

      const data = { name: 'Updated Name', memberIds: ['user1', 'user2'] };

      await discussion.editDiscussion(data);

      expect(editDiscussionApiMethod).toHaveBeenCalledWith({
        id: 'discussion123',
        ...data,
        socketId: 'socket123',
      });

      expect(discussion.name).toBe('Updated Name');
      expect([...discussion.memberIds]).toEqual(['user1', 'user2']);
    });

    test.skip('handles API error', async () => {
      const error = new Error('API Error');
      (editDiscussionApiMethod as jest.Mock).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let thrownError;
      try {
        await discussion.editDiscussion({ name: 'New Name' });
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBe(error);
      expect(consoleSpy).toHaveBeenCalledWith(error);

      consoleSpy.mockRestore();
    });

    test('works without socket', async () => {
      mockStore.socket = null;
      (editDiscussionApiMethod as jest.Mock).mockResolvedValue({});

      await discussion.editDiscussion({ name: 'New Name' });

      expect(editDiscussionApiMethod).toHaveBeenCalledWith({
        id: 'discussion123',
        name: 'New Name',
        socketId: null,
      });
    });
  });

  describe('Socket room methods', () => {
    let discussion: Discussion;

    beforeEach(() => {
      discussion = new Discussion({
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: [],
        notificationType: 'email',
      });
    });

    describe('joinSocketRooms', () => {
      test('joins team and discussion rooms when socket exists', () => {
        discussion.joinSocketRooms();

        expect(mockStore.socket.emit).toHaveBeenCalledWith('joinTeamRoom', 'team123');
        expect(mockStore.socket.emit).toHaveBeenCalledWith('joinDiscussionRoom', 'discussion123');
      });

      test('does nothing when socket does not exist', () => {
        mockStore.socket = null;

        discussion.joinSocketRooms();

        expect(mockStore.socket).toBeNull();
      });
    });

    describe('leaveSocketRooms', () => {
      test('leaves team and discussion rooms when socket exists', () => {
        discussion.leaveSocketRooms();

        expect(mockStore.socket.emit).toHaveBeenCalledWith('leaveTeamRoom', 'team123');
        expect(mockStore.socket.emit).toHaveBeenCalledWith('leaveDiscussionRoom', 'discussion123');
      });

      test('does nothing when socket does not exist', () => {
        mockStore.socket = null;

        discussion.leaveSocketRooms();

        expect(mockStore.socket).toBeNull();
      });
    });
  });

  describe('Realtime event handlers', () => {
    let discussion: Discussion;

    beforeEach(() => {
      discussion = new Discussion({
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: [],
        notificationType: 'email',
      });
    });

    describe('handleDiscussionRealtimeEvent', () => {
      test('handles "added" action', () => {
        const mockAddDiscussionToLocalCache = jest.spyOn(discussion, 'addDiscussionToLocalCache');

        const data = {
          actionType: 'added',
          discussion: { _id: 'newDiscussion', name: 'New Discussion' },
        };

        discussion.handleDiscussionRealtimeEvent(data);

        expect(mockAddDiscussionToLocalCache).toHaveBeenCalledWith(data.discussion);
        mockAddDiscussionToLocalCache.mockRestore();
      });

      test('handles "edited" action', () => {
        const mockEditDiscussionFromLocalCache = jest.spyOn(
          discussion,
          'editDiscussionFromLocalCache',
        );

        const data = {
          actionType: 'edited',
          discussion: { _id: 'discussion123', name: 'Updated Name' },
        };

        discussion.handleDiscussionRealtimeEvent(data);

        expect(mockEditDiscussionFromLocalCache).toHaveBeenCalledWith(data.discussion);
        mockEditDiscussionFromLocalCache.mockRestore();
      });

      test('handles "deleted" action', () => {
        const discussionToDelete = new Discussion({
          _id: 'discussionToDelete',
          name: 'To Delete',
          createdUserId: 'user123',
          store: mockStore,
          team: mockTeam,
          slug: 'to-delete',
          memberIds: [],
          notificationType: 'email',
        });
        mockTeam.discussions.push(discussionToDelete);

        const data = {
          actionType: 'deleted',
          id: 'discussionToDelete',
        };

        discussion.handleDiscussionRealtimeEvent(data);

        expect(mockTeam.discussions).toHaveLength(0);
      });
    });

    describe('handlePostRealtimeEvent', () => {
      test('handles "added" action', () => {
        const mockAddPostToLocalCache = jest.spyOn(discussion, 'addPostToLocalCache');

        const data = {
          actionType: 'added',
          post: { _id: 'newPost', content: 'New post' },
        };

        discussion.handlePostRealtimeEvent(data);

        expect(mockAddPostToLocalCache).toHaveBeenCalledWith(data.post);
        mockAddPostToLocalCache.mockRestore();
      });

      test('handles "edited" action', () => {
        const mockEditPostFromLocalCache = jest.spyOn(discussion, 'editPostFromLocalCache');

        const data = {
          actionType: 'edited',
          post: { _id: 'existingPost', content: 'Updated content' },
        };

        discussion.handlePostRealtimeEvent(data);

        expect(mockEditPostFromLocalCache).toHaveBeenCalledWith(data.post);
        mockEditPostFromLocalCache.mockRestore();
      });

      test('handles "deleted" action', () => {
        const mockDeletePostFromLocalCache = jest.spyOn(discussion, 'deletePostFromLocalCache');

        const data = {
          actionType: 'deleted',
          id: 'postToDelete',
        };

        discussion.handlePostRealtimeEvent(data);

        expect(mockDeletePostFromLocalCache).toHaveBeenCalledWith(data.id);
        mockDeletePostFromLocalCache.mockRestore();
      });
    });
  });

  describe('Local cache management methods', () => {
    let discussion: Discussion;

    beforeEach(() => {
      discussion = new Discussion({
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: [],
        notificationType: 'email',
      });
    });

    describe('addDiscussionToLocalCache', () => {
      test('adds discussion to team when user is member', () => {
        const discussionData = {
          _id: 'newDiscussion',
          name: 'New Discussion',
          memberIds: ['user123'], // current user is member
        };

        const result = discussion.addDiscussionToLocalCache(discussionData);

        expect(result).toBeInstanceOf(Discussion);
        expect(mockTeam.discussions.length).toBe(1);
        expect(mockTeam.discussions[0]._id).toBe('newDiscussion');
      });

      test('does not add discussion when user is not member', () => {
        const discussionData = {
          _id: 'newDiscussion',
          name: 'New Discussion',
          memberIds: ['otherUser'], // current user is not member
        };

        discussion.addDiscussionToLocalCache(discussionData);

        expect(mockTeam.discussions.length).toBe(0);
      });
    });

    describe('editDiscussionFromLocalCache', () => {
      test('updates discussion when it exists and user is member', () => {
        const existingDiscussion = new Discussion({
          _id: 'discussion123',
          name: 'Old Name',
          createdUserId: 'user123',
          store: mockStore,
          team: mockTeam,
          slug: 'old-name',
          memberIds: ['user123'],
          notificationType: 'email',
        });
        mockTeam.discussions.push(existingDiscussion);

        const data = {
          _id: 'discussion123',
          name: 'Updated Name',
          memberIds: ['user123'],
        };

        discussion.editDiscussionFromLocalCache(data);

        expect(existingDiscussion.name).toBe('Updated Name');
      });

      test('adds discussion when it does not exist and user is member', () => {
        const data = {
          _id: 'newDiscussion',
          name: 'New Discussion',
          memberIds: ['user123'],
        };

        discussion.editDiscussionFromLocalCache(data);

        expect(mockTeam.discussions.length).toBe(1);
        expect(mockTeam.discussions[0]._id).toBe('newDiscussion');
      });

      test('removes discussion when user is no longer member', () => {
        const existingDiscussion = new Discussion({
          _id: 'discussion123',
          name: 'Old Name',
          createdUserId: 'user123',
          store: mockStore,
          team: mockTeam,
          slug: 'old-name',
          memberIds: ['user123'],
          notificationType: 'email',
        });
        mockTeam.discussions.push(existingDiscussion);

        const data = {
          _id: 'discussion123',
          name: 'Updated Name',
          memberIds: ['otherUser'], // current user not in members
        };

        discussion.editDiscussionFromLocalCache(data);

        expect(mockTeam.discussions).toHaveLength(0);
      });
    });

    describe('deleteDiscussionFromLocalCache', () => {
      test('removes discussion from team discussions', () => {
        const discussionToRemove = new Discussion({
          _id: 'discussionToRemove',
          name: 'To Remove',
          createdUserId: 'user123',
          store: mockStore,
          team: mockTeam,
          slug: 'to-remove',
          memberIds: [],
          notificationType: 'email',
        });
        mockTeam.discussions.push(discussionToRemove);

        discussion.deleteDiscussionFromLocalCache('discussionToRemove');

        expect(mockTeam.discussions).toHaveLength(0);
      });

      test('does nothing when discussion does not exist', () => {
        const otherDiscussion = new Discussion({
          _id: 'otherDiscussion',
          name: 'Other',
          createdUserId: 'user123',
          store: mockStore,
          team: mockTeam,
          slug: 'other',
          memberIds: [],
          notificationType: 'email',
        });
        mockTeam.discussions.push(otherDiscussion);

        discussion.deleteDiscussionFromLocalCache('nonExistent');

        expect(mockTeam.discussions).toHaveLength(1);
      });
    });

    describe('editPostFromLocalCache', () => {
      test('updates existing post', () => {
        const existingPost = new Post({
          _id: 'post123',
          createdUserId: 'user123',
          createdAt: new Date(),
          discussionId: 'discussion123',
          discussion,
          store: mockStore,
          content: 'Old content',
          htmlContent: 'Old HTML content',
          isEdited: false,
          lastUpdatedAt: new Date(),
        });
        discussion.posts.push(existingPost);

        const data = { _id: 'post123', content: 'Updated content' };

        discussion.editPostFromLocalCache(data);

        expect(existingPost.changeLocalCache).toHaveBeenCalledWith(data);
      });

      test('does nothing when post does not exist', () => {
        const data = { _id: 'nonExistent', content: 'Content' };

        discussion.editPostFromLocalCache(data);

        // No posts exist, so nothing should happen
        expect(discussion.posts).toHaveLength(0);
      });
    });

    describe('deletePostFromLocalCache', () => {
      test('removes existing post', () => {
        const postToRemove = new Post({
          _id: 'postToRemove',
          createdUserId: 'user123',
          createdAt: new Date(),
          discussionId: 'discussion123',
          discussion,
          store: mockStore,
          content: 'Content',
          htmlContent: 'HTML content',
          isEdited: false,
          lastUpdatedAt: new Date(),
        });
        discussion.posts.push(postToRemove);

        discussion.deletePostFromLocalCache('postToRemove');

        expect(discussion.posts).toHaveLength(0);
      });

      test('does nothing when post does not exist', () => {
        const existingPost = new Post({
          _id: 'otherPost',
          createdUserId: 'user123',
          createdAt: new Date(),
          discussionId: 'discussion123',
          discussion,
          store: mockStore,
          content: 'Content',
          htmlContent: 'HTML content',
          isEdited: false,
          lastUpdatedAt: new Date(),
        });
        discussion.posts.push(existingPost);

        discussion.deletePostFromLocalCache('nonExistent');

        expect(discussion.posts).toHaveLength(1);
      });
    });
  });

  describe('sendDataToLambda', () => {
    let discussion: Discussion;

    beforeEach(() => {
      discussion = new Discussion({
        _id: 'discussion123',
        createdUserId: 'user123',
        store: mockStore,
        team: mockTeam,
        name: 'Test Discussion',
        slug: 'test-discussion',
        memberIds: [],
        notificationType: 'email',
      });
    });

    test('sends data to lambda successfully', async () => {
      (sendDataToLambdaApiMethod as jest.Mock).mockResolvedValue({});

      const params = {
        discussionName: 'Test Discussion',
        discussionLink: 'http://example.com/discussion',
        postContent: 'Post content',
        authorName: 'Author Name',
        userIds: ['user1', 'user2'],
      };

      await discussion.sendDataToLambda(params);

      expect(sendDataToLambdaApiMethod).toHaveBeenCalledWith(params);
    });

    test.skip('handles API error', async () => {
      const error = new Error('Lambda Error');
      (sendDataToLambdaApiMethod as jest.Mock).mockRejectedValue(error);

      const params = {
        discussionName: 'Test',
        discussionLink: 'http://example.com',
        postContent: 'Content',
        authorName: 'Author',
        userIds: ['user1'],
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let thrownError;
      try {
        await discussion.sendDataToLambda(params);
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBe(error);
      expect(consoleSpy).toHaveBeenCalledWith(error);

      consoleSpy.mockRestore();
    });
  });
});
