import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { observable } from 'mobx';

import DiscussionActionMenu from '../DiscussionActionMenu';
import { User } from '../../../lib/store/user';

// Mock external dependencies
jest.mock('../../../lib/confirm', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../lib/notify', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('nprogress', () => ({
  start: jest.fn(),
  done: jest.fn(),
}));

jest.mock('../../common/MenuWithMenuItems', () => {
  return function MockMenuWithMenuItems({ menuOptions, itemOptions }: any) {
    return (
      <div data-testid="menu-with-menu-items">
        <button
          data-testid="menu-trigger"
          data-id={menuOptions.dataId}
          onClick={(e) => {
            // Simulate menu item clicks
            const mockEvent = {
              currentTarget: {
                dataset: { id: menuOptions.dataId },
              },
            };

            // Find the clicked item by text and call its onClick
            const target = e.target as HTMLElement;
            const clickedItem = itemOptions.find((item) =>
              target.textContent?.includes(item.text)
            );
            if (clickedItem) {
              clickedItem.onClick(mockEvent);
            }
          }}
        >
          Menu
        </button>
        {itemOptions.map((item, index) => (
          <button
            key={index}
            data-testid={`menu-item-${index}`}
            data-id={item.dataId}
            onClick={() => item.onClick({
              currentTarget: {
                dataset: { id: item.dataId },
              },
            })}
          >
            {item.text}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock('../EditDiscussionForm', () => {
  return function MockEditDiscussionForm({ open, onClose }: any) {
    return open ? (
      <div data-testid="edit-discussion-form">
        <button data-testid="close-form" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null;
  };
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Import mocked functions
import confirm from '../../../lib/confirm';
import notify from '../../../lib/notify';
import NProgress from 'nprogress';

// Helper function to create mock objects
const createMockUser = (id = 'user1', name = 'Test User') => {
  const user = new User({ _id: id, name, avatarUrl: '', email: 'test@example.com' });
  // Mock the observable properties to prevent MobX issues
  Object.defineProperty(user, '_id', { value: id, writable: true });
  return user;
};

const createMockTeam = (slug = 'test-team') => {
  const team = {
    _id: 'team1',
    name: 'Test Team',
    slug,
    avatarUrl: '',
    memberIds: ['user1'],
    createdUserId: 'user1',
    discussions: observable.array([]),
    deleteDiscussion: jest.fn().mockResolvedValue(undefined),
  };

  // Add a mock discussion to the team
  const mockDiscussion = {
    _id: 'discussion1',
    name: 'Test Discussion',
    slug: 'test-discussion',
    createdUserId: 'user1',
    memberIds: ['user1'],
    notificationType: 'default',
  };

  team.discussions.replace([mockDiscussion]);

  return team;
};

const createMockStore = (currentUserId = 'user1', currentTeamSlug = 'test-team') => {
  return {
    currentUser: createMockUser(currentUserId),
    currentTeam: createMockTeam(currentTeamSlug),
    isServer: false,
  };
};


describe('DiscussionActionMenu', () => {
  let mockStore: any;
  let mockDiscussion: any;

  // Mock console.error for error handling tests
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment variables
    process.env.NEXT_PUBLIC_URL_APP = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_PRODUCTION_URL_APP = 'https://app.example.com';

    mockStore = createMockStore();
    mockDiscussion = {
      _id: 'discussion1',
      name: 'Test Discussion',
      slug: 'test-discussion',
      createdUserId: 'user1',
      memberIds: ['user1'],
      notificationType: 'default',
    };
  });

  describe('Rendering', () => {
    test('renders menu for discussion creator with all options', () => {
      // Arrange
      const creatorDiscussion = {
        ...mockDiscussion,
        createdUserId: 'user1', // user1 is creator
      };

      // Act
      render(
        <DiscussionActionMenu
          discussion={creatorDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Assert
      expect(screen.getByTestId('menu-with-menu-items')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-0')).toHaveTextContent('Copy URL');
      expect(screen.getByTestId('menu-item-1')).toHaveTextContent('Edit');
      expect(screen.getByTestId('menu-item-2')).toHaveTextContent('Delete');
    });

    test('renders menu for non-creator with only Copy URL option', () => {
      // Arrange
      const nonCreatorDiscussion = {
        ...mockDiscussion,
        createdUserId: 'user2', // user2 is creator, user1 is current user
      };

      // Act
      render(
        <DiscussionActionMenu
          discussion={nonCreatorDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Assert
      expect(screen.getByTestId('menu-with-menu-items')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-0')).toHaveTextContent('Copy URL');
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    test('does not render EditDiscussionForm by default', () => {
      // Arrange & Act
      render(
        <DiscussionActionMenu
          discussion={mockDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Assert
      expect(screen.queryByTestId('edit-discussion-form')).not.toBeInTheDocument();
    });
  });

  describe('handleCopyUrl', () => {
    test('successfully copies discussion URL to clipboard', async () => {
      // Arrange
      const mockClipboard = navigator.clipboard.writeText as jest.MockedFunction<any>;
      mockClipboard.mockResolvedValueOnce(undefined);

      render(
        <DiscussionActionMenu
          discussion={mockDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Act
      const copyButton = screen.getByTestId('menu-item-0'); // Copy URL button
      await userEvent.click(copyButton);

      // Assert
      expect(mockClipboard).toHaveBeenCalledWith(
        'http://localhost:3000/teams/test-team/discussions/test-discussion'
      );
      expect(notify).toHaveBeenCalledWith('You successfully copied URL.');
    });

    test('handles clipboard error gracefully', async () => {
      // Arrange
      const mockClipboard = navigator.clipboard.writeText as jest.MockedFunction<any>;
      const mockError = new Error('Clipboard not available');
      mockClipboard.mockRejectedValueOnce(mockError);

      render(
        <DiscussionActionMenu
          discussion={mockDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Act
      const copyButton = screen.getByTestId('menu-item-0');
      await userEvent.click(copyButton);

      // Assert
      expect(mockClipboard).toHaveBeenCalled();
      expect(notify).toHaveBeenCalledWith(mockError);
    });

    test('does nothing when event target has no dataset id', async () => {
      // Arrange
      render(
        <DiscussionActionMenu
          discussion={mockDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Act - simulate click with no dataset id
      const mockEvent = {
        currentTarget: {
          dataset: {}, // No id
        },
      };

      // Manually call the method since our mock doesn't handle this edge case
      const component = new (DiscussionActionMenu as any)({
        discussion: mockDiscussion,
        store: mockStore,
        isMobile: false,
      });

      // Act
      await component.handleCopyUrl(mockEvent);

      // Assert
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
      expect(notify).not.toHaveBeenCalled();
    });

    test('uses production URL in production environment', async () => {
      // Arrange
      const originalNodeEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
      });

      // Re-import the component to get updated dev variable
      jest.resetModules();
      const DiscussionActionMenuProd = require('../DiscussionActionMenu').default;

      const mockClipboard = navigator.clipboard.writeText as jest.MockedFunction<any>;
      mockClipboard.mockResolvedValueOnce(undefined);

      render(
        <DiscussionActionMenuProd
          discussion={mockDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Act
      const copyButton = screen.getByTestId('menu-item-0');
      await userEvent.click(copyButton);

      // Assert
      expect(mockClipboard).toHaveBeenCalledWith(
        'https://app.example.com/teams/test-team/discussions/test-discussion'
      );

      // Cleanup
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
      });
    });
  });

  describe('editDiscussion', () => {
    test('opens edit form when user is creator', async () => {
      // Arrange
      const creatorDiscussion = {
        ...mockDiscussion,
        createdUserId: 'user1',
      };

      render(
        <DiscussionActionMenu
          discussion={creatorDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Act
      const editButton = screen.getByTestId('menu-item-1'); // Edit button
      await userEvent.click(editButton);

      // Assert
      expect(screen.getByTestId('edit-discussion-form')).toBeInTheDocument();
    });

    test('shows error notification when no team is selected', async () => {
      // Arrange
      const storeWithoutTeam = {
        ...createMockStore(),
        currentTeam: null,
      } as any;

      render(
        <DiscussionActionMenu
          discussion={mockDiscussion}
          store={storeWithoutTeam}
          isMobile={false}
        />
      );

      // Act
      const editButton = screen.getByTestId('menu-item-1');
      await userEvent.click(editButton);

      // Assert
      expect(notify).toHaveBeenCalledWith('You have not selected Team.');
      expect(screen.queryByTestId('edit-discussion-form')).not.toBeInTheDocument();
    });

    test('does nothing when event target has no dataset id', async () => {
      // Arrange
      render(
        <DiscussionActionMenu
          discussion={mockDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Act - simulate click with no dataset id
      const mockEvent = {
        currentTarget: {
          dataset: {}, // No id
        },
      };

      const component = new (DiscussionActionMenu as any)({
        discussion: mockDiscussion,
        store: mockStore,
        isMobile: false,
      });

      await component.editDiscussion(mockEvent);

      // Assert
      expect(screen.queryByTestId('edit-discussion-form')).not.toBeInTheDocument();
    });
  });

  describe('deleteDiscussion', () => {
    test('successfully deletes discussion when user confirms', async () => {
      // Arrange
      const mockConfirm = confirm as jest.MockedFunction<any>;
      mockConfirm.mockImplementation(({ onAnswer }) => {
        onAnswer(true); // User confirms
      });

      const mockDeleteDiscussion = jest.fn().mockResolvedValueOnce(undefined);
      mockStore.currentTeam.deleteDiscussion = mockDeleteDiscussion;

      render(
        <DiscussionActionMenu
          discussion={mockDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Act
      const deleteButton = screen.getByTestId('menu-item-2'); // Delete button
      await userEvent.click(deleteButton);

      // Assert
      expect(mockConfirm).toHaveBeenCalledWith({
        title: 'Are you sure?',
        message: '',
        onAnswer: expect.any(Function),
      });
      expect(NProgress.start).toHaveBeenCalled();
      expect(mockDeleteDiscussion).toHaveBeenCalledWith('discussion1');
      expect(notify).toHaveBeenCalledWith('You successfully deleted Discussion.');
      expect(NProgress.done).toHaveBeenCalled();
    });

    test('does not delete discussion when user cancels', async () => {
      // Arrange
      const mockConfirm = confirm as jest.MockedFunction<any>;
      mockConfirm.mockImplementation(({ onAnswer }) => {
        onAnswer(false); // User cancels
      });

      const mockDeleteDiscussion = jest.fn();
      mockStore.currentTeam.deleteDiscussion = mockDeleteDiscussion;

      render(
        <DiscussionActionMenu
          discussion={mockDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Act
      const deleteButton = screen.getByTestId('menu-item-2');
      await userEvent.click(deleteButton);

      // Assert
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockDeleteDiscussion).not.toHaveBeenCalled();
      expect(notify).not.toHaveBeenCalledWith('You successfully deleted Discussion.');
    });

    test('handles delete error gracefully', async () => {
      // Arrange
      const mockConfirm = confirm as jest.MockedFunction<any>;
      mockConfirm.mockImplementation(({ onAnswer }) => {
        onAnswer(true);
      });

      const mockError = new Error('Delete failed');
      const mockDeleteDiscussion = jest.fn().mockRejectedValueOnce(mockError);
      mockStore.currentTeam.deleteDiscussion = mockDeleteDiscussion;

      render(
        <DiscussionActionMenu
          discussion={mockDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Act
      const deleteButton = screen.getByTestId('menu-item-2');
      await userEvent.click(deleteButton);

      // Assert
      expect(mockDeleteDiscussion).toHaveBeenCalledWith('discussion1');
      expect(console.error as jest.MockedFunction<any>).toHaveBeenCalledWith(mockError);
      expect(notify).toHaveBeenCalledWith(mockError);
      expect(NProgress.done).toHaveBeenCalled();
    });

    test('shows error notification when no team is selected', async () => {
      // Arrange
      const storeWithoutTeam = {
        ...createMockStore(),
        currentTeam: null,
      } as any;

      render(
        <DiscussionActionMenu
          discussion={mockDiscussion}
          store={storeWithoutTeam}
          isMobile={false}
        />
      );

      // Act
      const deleteButton = screen.getByTestId('menu-item-2');
      await userEvent.click(deleteButton);

      // Assert
      expect(notify).toHaveBeenCalledWith('You have not selected Team.');
      expect(NProgress.start).not.toHaveBeenCalled();
    });
  });

  describe('handleDiscussionFormClose', () => {
    test('closes edit form and resets state', async () => {
      // Arrange
      const creatorDiscussion = {
        ...mockDiscussion,
        createdUserId: 'user1',
      };

      render(
        <DiscussionActionMenu
          discussion={creatorDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Open the form first
      const editButton = screen.getByTestId('menu-item-1');
      await userEvent.click(editButton);
      expect(screen.getByTestId('edit-discussion-form')).toBeInTheDocument();

      // Act - close the form
      const closeButton = screen.getByTestId('close-form');
      await userEvent.click(closeButton);

      // Assert
      expect(screen.queryByTestId('edit-discussion-form')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined navigator gracefully', async () => {
      // Arrange
      const originalNavigator = global.navigator;
      delete (global as any).navigator;

      render(
        <DiscussionActionMenu
          discussion={mockDiscussion}
          store={mockStore}
          isMobile={false}
        />
      );

      // Act
      const copyButton = screen.getByTestId('menu-item-0');
      await userEvent.click(copyButton);

      // Assert
      expect(notify).not.toHaveBeenCalled();

      // Cleanup
      global.navigator = originalNavigator;
    });

  });
});
