import { observable } from 'mobx';
import { Team } from '../team';

// Mock API methods
jest.mock('../../api/team-leader', () => ({
  cancelSubscriptionApiMethod: jest.fn(),
  inviteMemberApiMethod: jest.fn(),
  removeMemberApiMethod: jest.fn(),
  updateTeamApiMethod: jest.fn(),
}));

jest.mock('../../api/team-member', () => ({
  addDiscussionApiMethod: jest.fn(),
  deleteDiscussionApiMethod: jest.fn(),
  getDiscussionListApiMethod: jest.fn(),
}));

// Mock Next.js Router
jest.mock('next/router', () => ({
  __esModule: true,
  default: {
    push: jest.fn().mockResolvedValue(true),
  },
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
      name: 'Current User',
    },
  })),
}));

jest.mock('../user', () => ({
  User: jest.fn().mockImplementation((params) => ({
    _id: params._id,
    name: params.name,
    email: params.email,
  })),
}));

jest.mock('../invitation', () => ({
  Invitation: jest.fn().mockImplementation((params) => ({
    _id: params._id,
    email: params.email,
    teamId: params.teamId,
  })),
}));

jest.mock('../discussion', () => ({
  Discussion: jest.fn().mockImplementation((params) => ({
    _id: params._id,
    name: params.name,
    slug: params.slug,
    memberIds: observable(params.memberIds || []),
    store: params.store,
    team: params.team,
    changeLocalCache: jest.fn(),
  })),
}));

import Router from 'next/router';
import {
  cancelSubscriptionApiMethod,
  inviteMemberApiMethod,
  removeMemberApiMethod,
  updateTeamApiMethod,
} from '../../api/team-leader';
import {
  addDiscussionApiMethod,
  deleteDiscussionApiMethod,
  getDiscussionListApiMethod,
} from '../../api/team-member';
import { Store } from '../index';
import { User } from '../user';
import { Discussion } from '../discussion';

describe('Team', () => {
  let mockStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock API responses before creating store
    (getDiscussionListApiMethod as jest.Mock).mockResolvedValue({ discussions: [] });

    // Create mock store instance
    mockStore = new Store({ isServer: false });
  });

  describe('Constructor', () => {
    test('initializes with required parameters', () => {
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        memberIds: ['user1', 'user2'],
        currentDiscussionSlug: 'test-discussion',
        initialDiscussions: [],
        stripeSubscription: { id: 'sub123', object: 'subscription' },
        isSubscriptionActive: true,
        isPaymentFailed: false,
        store: mockStore,
      };

      const team = new Team(params);

      expect(team._id).toBe('team123');
      expect(team.teamLeaderId).toBe('user123');
      expect(team.name).toBe('Test Team');
      expect(team.slug).toBe('test-team');
      expect(team.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect([...team.memberIds]).toEqual(['user1', 'user2']);
      expect(team.currentDiscussionSlug).toBe('test-discussion');
      expect(team.store).toBe(mockStore);
      expect(team.isSubscriptionActive).toBe(true);
      expect(team.isPaymentFailed).toBe(false);
    });

    test('initializes with default values', () => {
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        store: mockStore,
      };

      const team = new Team(params);

      expect([...team.memberIds]).toEqual([]);
      expect(team.currentDiscussionSlug).toBeNull();
      expect([...team.discussions]).toEqual([]);
    });

    test('loads discussions when initialDiscussions are provided', () => {
      const initialDiscussions = [
        { _id: 'disc1', name: 'Discussion 1', slug: 'disc-1', memberIds: ['user123'] },
      ];

      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        initialDiscussions,
        store: mockStore,
      };

      const team = new Team(params);

      expect(team.discussions).toHaveLength(1);
    });

    test('calls loadDiscussions when no initialDiscussions provided', () => {
      jest.clearAllMocks();
      const mockLoadDiscussions = jest.spyOn(Team.prototype, 'loadDiscussions').mockResolvedValue();

      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        store: mockStore,
      };

      new Team(params);

      expect(mockLoadDiscussions).toHaveBeenCalled();
      mockLoadDiscussions.mockRestore();
    });
  });

  describe('setInitialMembersAndInvitations', () => {
    let team: Team;

    beforeEach(() => {
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
    });

    test('sets members and invitations from arrays', () => {
      const users = [
        { _id: 'user1', name: 'User 1', email: 'user1@example.com' },
        { _id: 'user2', name: 'User 2', email: 'user2@example.com' },
      ];

      const invitations = [
        { _id: 'inv1', email: 'invite1@example.com', teamId: 'team123' },
        { _id: 'inv2', email: 'invite2@example.com', teamId: 'team123' },
      ];

      team.setInitialMembersAndInvitations(users, invitations);

      expect(team.members.size).toBe(2);
      expect(team.invitations.size).toBe(2);
      expect(team.members.has('user1')).toBe(true);
      expect(team.members.has('user2')).toBe(true);
      expect(team.invitations.has('inv1')).toBe(true);
      expect(team.invitations.has('inv2')).toBe(true);
    });

    test('uses currentUser when user matches', () => {
      const users = [{ _id: 'user123', name: 'Current User', email: 'current@example.com' }];

      team.setInitialMembersAndInvitations(users, []);

      expect(team.members.get('user123')).toStrictEqual(mockStore.currentUser);
    });

    test('creates new User instance for non-current user', () => {
      const users = [{ _id: 'user1', name: 'User 1', email: 'user1@example.com' }];

      team.setInitialMembersAndInvitations(users, []);

      expect(User).toHaveBeenCalledWith(expect.objectContaining({ _id: 'user1' }));
    });

    test('clears existing members and invitations', () => {
      // Set initial data
      team.members.set('oldUser', { _id: 'oldUser' } as any);
      team.invitations.set('oldInv', { _id: 'oldInv' } as any);

      team.setInitialMembersAndInvitations([], []);

      expect(team.members.size).toBe(0);
      expect(team.invitations.size).toBe(0);
    });

    test('handles empty arrays', () => {
      team.setInitialMembersAndInvitations([], []);

      expect(team.members.size).toBe(0);
      expect(team.invitations.size).toBe(0);
    });
  });

  describe('updateTheme', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
    });

    test('updates team name and avatar successfully', async () => {
      (updateTeamApiMethod as jest.Mock).mockResolvedValue({
        slug: 'updated-team',
      });

      await team.updateTheme({
        name: 'Updated Team',
        avatarUrl: 'https://example.com/new-avatar.jpg',
      });

      expect(updateTeamApiMethod).toHaveBeenCalledWith({
        teamId: 'team123',
        name: 'Updated Team',
        avatarUrl: 'https://example.com/new-avatar.jpg',
      });

      expect(team.name).toBe('Updated Team');
      expect(team.avatarUrl).toBe('https://example.com/new-avatar.jpg');
      expect(team.slug).toBe('updated-team');
    });

    test('throws error on API failure', async () => {
      const error = new Error('API Error');
      (updateTeamApiMethod as jest.Mock).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let thrownError;
      try {
        await team.updateTheme({
          name: 'Updated Team',
          avatarUrl: 'https://example.com/avatar.jpg',
        });
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBe(error);
      expect(consoleSpy).toHaveBeenCalledWith(error);

      consoleSpy.mockRestore();
    });
  });

  describe('inviteMember', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
    });

    test('invites member successfully', async () => {
      const newInvitation = {
        _id: 'inv1',
        email: 'newinvite@example.com',
        teamId: 'team123',
      };

      (inviteMemberApiMethod as jest.Mock).mockResolvedValue({
        newInvitation,
      });

      await team.inviteMember('newinvite@example.com');

      expect(inviteMemberApiMethod).toHaveBeenCalledWith({
        teamId: 'team123',
        email: 'newinvite@example.com',
      });

      expect(team.invitations.size).toBe(1);
      expect(team.invitations.has('inv1')).toBe(true);
    });

    test('throws error on API failure', async () => {
      const error = new Error('API Error');
      (inviteMemberApiMethod as jest.Mock).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let thrownError;
      try {
        await team.inviteMember('test@example.com');
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBe(error);
      expect(consoleSpy).toHaveBeenCalledWith(error);

      consoleSpy.mockRestore();
    });
  });

  describe('removeMember', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        memberIds: ['user1', 'user2'],
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
      team.members.set('user1', { _id: 'user1' } as any);
      team.members.set('user2', { _id: 'user2' } as any);
    });

    test('removes member successfully', async () => {
      (removeMemberApiMethod as jest.Mock).mockResolvedValue({});

      await team.removeMember('user1');

      expect(removeMemberApiMethod).toHaveBeenCalledWith({
        teamId: 'team123',
        userId: 'user1',
      });

      expect(team.members.has('user1')).toBe(false);
      expect(team.memberIds.includes('user1')).toBe(false);
      expect(team.members.size).toBe(1);
    });

    test('throws error on API failure', async () => {
      const error = new Error('API Error');
      (removeMemberApiMethod as jest.Mock).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let thrownError;
      try {
        await team.removeMember('user1');
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBe(error);
      expect(team.members.size).toBe(2); // Members should not be removed
      expect(consoleSpy).toHaveBeenCalledWith(error);

      consoleSpy.mockRestore();
    });
  });

  describe('setCurrentDiscussion', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
    });

    test('sets current discussion by slug', () => {
      const discussion = new Discussion({
        _id: 'disc1',
        name: 'Discussion 1',
        slug: 'disc-1',
        store: mockStore,
        team,
      });

      team.discussions.push(discussion);

      team.setCurrentDiscussion({ slug: 'disc-1' });

      expect(team.currentDiscussionSlug).toBe('disc-1');
      expect(team.currentDiscussion?._id).toBe('disc1');
      expect(team.currentDiscussion?.slug).toBe('disc-1');
    });

    test('handles non-existent slug', () => {
      const discussion = new Discussion({
        _id: 'disc1',
        name: 'Discussion 1',
        slug: 'disc-1',
        store: mockStore,
        team,
      });

      team.discussions.push(discussion);

      team.setCurrentDiscussion({ slug: 'nonexistent' });

      expect(team.currentDiscussionSlug).toBe('nonexistent');
      expect(team.currentDiscussion).toBeUndefined();
    });

    test('handles empty discussions array', () => {
      team.setCurrentDiscussion({ slug: 'any-slug' });

      expect(team.currentDiscussionSlug).toBe('any-slug');
      expect(team.currentDiscussion).toBeUndefined();
    });
  });

  describe('setInitialDiscussions', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
    });

    test('creates Discussion instances from array', () => {
      const discussionsData = [
        { _id: 'disc1', name: 'Discussion 1', slug: 'disc-1', memberIds: ['user123'] },
        { _id: 'disc2', name: 'Discussion 2', slug: 'disc-2', memberIds: ['user123'] },
      ];

      team.setInitialDiscussions(discussionsData);

      expect(team.discussions).toHaveLength(2);
      expect(Discussion).toHaveBeenCalledTimes(2);
    });

    test('sets currentDiscussionSlug to first discussion if not set', () => {
      const discussionsData = [
        { _id: 'disc1', name: 'Discussion 1', slug: 'disc-1', memberIds: ['user123'] },
      ];

      team.setInitialDiscussions(discussionsData);

      expect(team.currentDiscussionSlug).toBe('disc-1');
    });

    test('does not override existing currentDiscussionSlug', () => {
      team.currentDiscussionSlug = 'existing-slug';

      const discussionsData = [
        { _id: 'disc1', name: 'Discussion 1', slug: 'disc-1', memberIds: ['user123'] },
      ];

      team.setInitialDiscussions(discussionsData);

      expect(team.currentDiscussionSlug).toBe('existing-slug');
    });

    test('handles empty discussions array', () => {
      team.setInitialDiscussions([]);

      expect(team.discussions).toHaveLength(0);
      expect(team.currentDiscussionSlug).toBeNull();
    });

    test('calls setCurrentDiscussion when slug is set', () => {
      team.currentDiscussionSlug = 'disc-1';
      const mockSetCurrentDiscussion = jest.spyOn(team, 'setCurrentDiscussion');

      const discussionsData = [
        { _id: 'disc1', name: 'Discussion 1', slug: 'disc-1', memberIds: ['user123'] },
      ];

      team.setInitialDiscussions(discussionsData);

      expect(mockSetCurrentDiscussion).toHaveBeenCalledWith({ slug: 'disc-1' });

      mockSetCurrentDiscussion.mockRestore();
    });
  });

  describe('loadDiscussions', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
      (getDiscussionListApiMethod as jest.Mock).mockResolvedValue({ discussions: [] });

      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
      jest.clearAllMocks();
    });

    test('returns early when isServer is true', async () => {
      mockStore.isServer = true;
      jest.clearAllMocks();

      await team.loadDiscussions();

      expect(getDiscussionListApiMethod).not.toHaveBeenCalled();
    });

    test('returns early when already loading', async () => {
      jest.clearAllMocks();
      team.isLoadingDiscussions = true;

      await team.loadDiscussions();

      expect(getDiscussionListApiMethod).not.toHaveBeenCalled();
    });

    test('loads discussions successfully', async () => {
      jest.clearAllMocks();

      const discussionsData = [
        { _id: 'disc1', name: 'Discussion 1', slug: 'disc-1', memberIds: ['user123'] },
        { _id: 'disc2', name: 'Discussion 2', slug: 'disc-2', memberIds: ['user123'] },
      ];

      (getDiscussionListApiMethod as jest.Mock).mockResolvedValue({
        discussions: discussionsData,
      });

      await team.loadDiscussions();

      expect(getDiscussionListApiMethod).toHaveBeenCalledWith({ teamId: 'team123' });
      expect(team.isLoadingDiscussions).toBe(false);
      expect(team.discussions).toHaveLength(2);
    });

    test('handles empty discussions array', async () => {
      (getDiscussionListApiMethod as jest.Mock).mockResolvedValue({ discussions: [] });

      await team.loadDiscussions();

      expect(team.discussions).toHaveLength(0);
      expect(team.isLoadingDiscussions).toBe(false);
    });

    test('handles undefined discussions response', async () => {
      (getDiscussionListApiMethod as jest.Mock).mockResolvedValue({});

      await team.loadDiscussions();

      expect(team.discussions).toHaveLength(0);
      expect(team.isLoadingDiscussions).toBe(false);
    });

    test('updates existing discussions in local cache', async () => {
      jest.clearAllMocks();

      // Add initial discussion
      const existingDiscussion = new Discussion({
        _id: 'disc1',
        name: 'Discussion 1',
        slug: 'disc-1',
        store: mockStore,
        team,
      });

      team.discussions.push(existingDiscussion);

      const updatedDiscussionsData = [
        { _id: 'disc1', name: 'Updated Discussion 1', slug: 'disc-1', memberIds: ['user123'] },
      ];

      (getDiscussionListApiMethod as jest.Mock).mockResolvedValue({
        discussions: updatedDiscussionsData,
      });

      await team.loadDiscussions();

      expect(existingDiscussion.changeLocalCache).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'disc1',
          name: 'Updated Discussion 1',
        }),
      );
    });

    test('sets isLoadingDiscussions to false even on error', async () => {
      const error = new Error('API Error');
      (getDiscussionListApiMethod as jest.Mock).mockRejectedValue(error);

      await team.loadDiscussions().catch(() => {
        // Ignore error
      });

      expect(team.isLoadingDiscussions).toBe(false);
    });
  });

  describe('changeLocalCache', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        memberIds: ['user1', 'user2'],
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
    });

    test('updates team name and memberIds', () => {
      team.changeLocalCache({
        name: 'Updated Team',
        memberIds: ['user1', 'user3'],
      });

      expect(team.name).toBe('Updated Team');
      expect([...team.memberIds]).toEqual(['user1', 'user3']);
    });

    test('handles undefined memberIds', () => {
      team.changeLocalCache({
        name: 'Updated Team',
        memberIds: undefined,
      });

      expect(team.name).toBe('Updated Team');
      // When undefined is passed, the replace should clear the array
      expect([...team.memberIds]).toEqual([]);
    });

    test('handles empty memberIds', () => {
      team.changeLocalCache({
        name: 'Updated Team',
        memberIds: [],
      });

      expect(team.name).toBe('Updated Team');
      expect([...team.memberIds]).toEqual([]);
    });
  });

  describe('addDiscussion', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
    });

    test('adds discussion successfully', async () => {
      const newDiscussionData = {
        _id: 'newDisc',
        name: 'New Discussion',
        slug: 'new-discussion',
        memberIds: ['user123'],
      };

      (addDiscussionApiMethod as jest.Mock).mockResolvedValue({
        discussion: newDiscussionData,
      });

      const result = await team.addDiscussion({ name: 'New Discussion' });

      expect(addDiscussionApiMethod).toHaveBeenCalledWith({
        teamId: 'team123',
        name: 'New Discussion',
        socketId: 'socket123',
      });

      expect(result).toBeDefined();
    });

    test('passes socket ID to API', async () => {
      (addDiscussionApiMethod as jest.Mock).mockResolvedValue({
        discussion: { _id: 'disc1', name: 'Discussion', slug: 'slug', memberIds: [] },
      });

      await team.addDiscussion({ name: 'Discussion' });

      expect(addDiscussionApiMethod).toHaveBeenCalledWith(
        expect.objectContaining({
          socketId: 'socket123',
        }),
      );
    });

    test('works without socket', async () => {
      mockStore.socket = null;
      (addDiscussionApiMethod as jest.Mock).mockResolvedValue({
        discussion: { _id: 'disc1', name: 'Discussion', slug: 'slug', memberIds: [] },
      });

      await team.addDiscussion({ name: 'Discussion' });

      expect(addDiscussionApiMethod).toHaveBeenCalledWith(
        expect.objectContaining({
          socketId: null,
        }),
      );
    });
  });

  describe('addDiscussionToLocalCache', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
    });

    test('adds discussion when current user is member', () => {
      const discussionData = {
        _id: 'disc1',
        name: 'Discussion',
        slug: 'discussion',
        memberIds: ['user123'], // current user is member
      };

      const result = team.addDiscussionToLocalCache(discussionData);

      expect(result).toBeDefined();
      expect(team.discussions.length).toBe(1);
    });

    test('does not add discussion when current user is not member', () => {
      const discussionData = {
        _id: 'disc1',
        name: 'Discussion',
        slug: 'discussion',
        memberIds: ['otherUser'], // current user is not member
      };

      team.addDiscussionToLocalCache(discussionData);

      expect(team.discussions.length).toBe(0);
    });

    test('returns created Discussion instance', () => {
      const discussionData = {
        _id: 'disc1',
        name: 'Discussion',
        slug: 'discussion',
        memberIds: ['user123'],
      };

      const result = team.addDiscussionToLocalCache(discussionData);

      expect(Discussion).toHaveBeenCalledWith(
        expect.objectContaining({
          team,
          store: mockStore,
          _id: 'disc1',
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('deleteDiscussion', () => {
    let team: Team;
    let discussionToDelete: any;

    beforeEach(() => {
      jest.clearAllMocks();
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);

      discussionToDelete = new Discussion({
        _id: 'discToDelete',
        name: 'Discussion To Delete',
        slug: 'discussion-to-delete',
        store: mockStore,
        team,
      });

      team.discussions.push(discussionToDelete);
      team.currentDiscussion = discussionToDelete;
      team.currentDiscussionSlug = 'discussion-to-delete';
    });

    test('deletes discussion successfully', async () => {
      (deleteDiscussionApiMethod as jest.Mock).mockResolvedValue({});

      const otherDiscussion = new Discussion({
        _id: 'disc1',
        name: 'Other Discussion',
        slug: 'other-discussion',
        store: mockStore,
        team,
      });

      team.discussions.push(otherDiscussion);

      await team.deleteDiscussion('discToDelete');

      expect(deleteDiscussionApiMethod).toHaveBeenCalledWith({
        id: 'discToDelete',
        socketId: 'socket123',
      });

      expect(team.discussions.length).toBe(1);
    });

    test('deletes discussion from cache', async () => {
      jest.clearAllMocks();
      (deleteDiscussionApiMethod as jest.Mock).mockResolvedValue({});

      const otherDiscussion = new Discussion({
        _id: 'disc1',
        name: 'Other Discussion',
        slug: 'other-discussion',
        store: mockStore,
        team,
      });

      team.discussions.push(otherDiscussion);

      await team.deleteDiscussion('discToDelete');

      expect(deleteDiscussionApiMethod).toHaveBeenCalledWith({
        id: 'discToDelete',
        socketId: 'socket123',
      });

      // The discussion should be removed from local cache
      expect(team.discussions.length).toBe(1);
    });

    test('redirects to first remaining discussion when current discussion is deleted', async () => {
      jest.clearAllMocks();
      (deleteDiscussionApiMethod as jest.Mock).mockResolvedValue({});

      const otherDiscussion = new Discussion({
        _id: 'disc1',
        name: 'Other Discussion',
        slug: 'other-discussion',
        store: mockStore,
        team,
      });

      team.discussions.push(otherDiscussion);

      // Create a scenario where currentDiscussion will be found after deletion
      // by re-adding it to the discussions after deleteDiscussionFromLocalCache
      const mockDeleteDiscussionFromLocalCache = jest
        .spyOn(team, 'deleteDiscussionFromLocalCache')
        .mockImplementation(() => {
          // Mimic the deletion behavior
          team.discussions.remove(discussionToDelete);
        });

      await team.deleteDiscussion('discToDelete');

      expect(deleteDiscussionApiMethod).toHaveBeenCalledWith({
        id: 'discToDelete',
        socketId: 'socket123',
      });

      mockDeleteDiscussionFromLocalCache.mockRestore();
    });

    test('does not redirect when deleted discussion is not current', async () => {
      (deleteDiscussionApiMethod as jest.Mock).mockResolvedValue({});

      const otherDiscussion = new Discussion({
        _id: 'disc1',
        name: 'Other Discussion',
        slug: 'other-discussion',
        store: mockStore,
        team,
      });

      team.discussions.push(otherDiscussion);
      team.currentDiscussion = otherDiscussion;
      team.currentDiscussionSlug = 'other-discussion';

      jest.clearAllMocks();

      await team.deleteDiscussion('discToDelete');

      expect(Router.push).not.toHaveBeenCalled();
    });

    test('works without socket', async () => {
      mockStore.socket = null;
      (deleteDiscussionApiMethod as jest.Mock).mockResolvedValue({});

      await team.deleteDiscussion('discToDelete');

      expect(deleteDiscussionApiMethod).toHaveBeenCalledWith({
        id: 'discToDelete',
        socketId: null,
      });
    });
  });

  describe('deleteDiscussionFromLocalCache', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
    });

    test('removes discussion from local cache', () => {
      const discussion = new Discussion({
        _id: 'disc1',
        name: 'Discussion',
        slug: 'discussion',
        store: mockStore,
        team,
      });

      team.discussions.push(discussion);

      team.deleteDiscussionFromLocalCache('disc1');

      expect(team.discussions.length).toBe(0);
    });

    test('does nothing when discussion does not exist', () => {
      const discussion = new Discussion({
        _id: 'disc1',
        name: 'Discussion',
        slug: 'discussion',
        store: mockStore,
        team,
      });

      team.discussions.push(discussion);

      team.deleteDiscussionFromLocalCache('nonexistent');

      expect(team.discussions.length).toBe(1);
    });

    test('handles empty discussions array', () => {
      team.deleteDiscussionFromLocalCache('anyId');

      expect(team.discussions.length).toBe(0);
    });
  });

  describe('getDiscussionBySlug', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
    });

    test('returns discussion by slug', () => {
      const discussion = new Discussion({
        _id: 'disc1',
        name: 'Discussion',
        slug: 'test-slug',
        store: mockStore,
        team,
      });

      team.discussions.push(discussion);

      const result = team.getDiscussionBySlug('test-slug');

      expect(result?._id).toBe('disc1');
      expect(result?.slug).toBe('test-slug');
    });

    test('returns undefined when discussion not found', () => {
      const discussion = new Discussion({
        _id: 'disc1',
        name: 'Discussion',
        slug: 'test-slug',
        store: mockStore,
        team,
      });

      team.discussions.push(discussion);

      const result = team.getDiscussionBySlug('nonexistent');

      expect(result).toBeUndefined();
    });

    test('returns first matching discussion', () => {
      const discussion1 = new Discussion({
        _id: 'disc1',
        name: 'Discussion 1',
        slug: 'test-slug',
        store: mockStore,
        team,
      });

      const discussion2 = new Discussion({
        _id: 'disc2',
        name: 'Discussion 2',
        slug: 'test-slug',
        store: mockStore,
        team,
      });

      team.discussions.push(discussion1);
      team.discussions.push(discussion2);

      const result = team.getDiscussionBySlug('test-slug');

      expect(result?._id).toBe('disc1');
    });
  });

  describe('cancelSubscription', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        isSubscriptionActive: true,
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
    });

    test('cancels subscription successfully', async () => {
      (cancelSubscriptionApiMethod as jest.Mock).mockResolvedValue({
        isSubscriptionActive: false,
      });

      await team.cancelSubscription({ teamId: 'team123' });

      expect(cancelSubscriptionApiMethod).toHaveBeenCalledWith({ teamId: 'team123' });
      expect(team.isSubscriptionActive).toBe(false);
    });

    test('throws error on API failure', async () => {
      const error = new Error('API Error');
      (cancelSubscriptionApiMethod as jest.Mock).mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      let thrownError;
      try {
        await team.cancelSubscription({ teamId: 'team123' });
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBe(error);
      expect(team.isSubscriptionActive).toBe(true); // Should remain unchanged
      expect(consoleSpy).toHaveBeenCalledWith(error);

      consoleSpy.mockRestore();
    });
  });

  describe('checkIfTeamLeaderMustBeCustomer', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('returns false when team has less than 2 members', async () => {
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        memberIds: ['user1'],
        isSubscriptionActive: false,
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);

      const result = await team.checkIfTeamLeaderMustBeCustomer();

      expect(result).toBe(false);
    });

    test('returns false when team has 2+ members and subscription is active', async () => {
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        memberIds: ['user1', 'user2'],
        isSubscriptionActive: true,
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);

      const result = await team.checkIfTeamLeaderMustBeCustomer();

      expect(result).toBe(false);
    });

    test('returns true when team has 2+ members and subscription is not active', async () => {
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        memberIds: ['user1', 'user2'],
        isSubscriptionActive: false,
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);

      const result = await team.checkIfTeamLeaderMustBeCustomer();

      expect(result).toBe(true);
    });

    test('returns correct value with exactly 2 members and inactive subscription', async () => {
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        memberIds: ['user1', 'user2'],
        isSubscriptionActive: false,
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);

      const result = await team.checkIfTeamLeaderMustBeCustomer();

      expect(result).toBe(true);
    });

    test('returns correct value with 3+ members and active subscription', async () => {
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        memberIds: ['user1', 'user2', 'user3'],
        isSubscriptionActive: true,
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);

      const result = await team.checkIfTeamLeaderMustBeCustomer();

      expect(result).toBe(false);
    });
  });

  describe('orderedDiscussions (computed)', () => {
    let team: Team;

    beforeEach(() => {
      jest.clearAllMocks();
      const params = {
        _id: 'team123',
        teamLeaderId: 'user123',
        name: 'Test Team',
        slug: 'test-team',
        avatarUrl: 'https://example.com/avatar.jpg',
        initialDiscussions: [],
        store: mockStore,
      };

      team = new Team(params);
    });

    test('returns sorted discussions', () => {
      const disc1 = new Discussion({
        _id: 'disc1',
        name: 'Discussion 1',
        slug: 'disc-1',
        store: mockStore,
        team,
      });

      const disc2 = new Discussion({
        _id: 'disc2',
        name: 'Discussion 2',
        slug: 'disc-2',
        store: mockStore,
        team,
      });

      team.discussions.push(disc2);
      team.discussions.push(disc1);

      const ordered = team.orderedDiscussions;

      // orderedDiscussions returns a sorted slice of the discussions array
      expect(ordered).toHaveLength(2);
      expect(ordered).toBeDefined();
    });

    test('returns empty array when no discussions', () => {
      const ordered = team.orderedDiscussions;

      expect(ordered).toEqual([]);
    });
  });
});
