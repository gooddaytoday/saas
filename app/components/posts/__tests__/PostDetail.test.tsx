import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import moment from 'moment';
import PostDetail from '../PostDetail';
import { Post } from '../../../lib/store/post';
import { Discussion } from '../../../lib/store/discussion';
import { Store } from '../../../lib/store';
import { User } from '../../../lib/store/user';
import { Team } from '../../../lib/store/team';

// Mock external dependencies
jest.mock('../../../lib/confirm');
jest.mock('../../../lib/notify');

// Mock MobX observer
jest.mock('mobx-react', () => ({
  observer: (component: any) => component,
}));

// Mock PostContent to simplify HTML rendering testing
jest.mock('../PostContent', () => {
  return function MockPostContent({ html }: any) {
    return <div data-testid="post-content">{html}</div>;
  };
});

// Mock MenuWithMenuItems to simplify menu testing
jest.mock('../../common/MenuWithMenuItems', () => {
  return function MockMenuWithMenuItems({ menuOptions, itemOptions }: any) {
    return (
      <div data-testid="menu-with-items" data-id={menuOptions.dataId}>
        <button
          data-testid="menu-button"
          data-id={menuOptions.dataId}
          onClick={() => {
            // Simulate menu being opened and items displayed
            itemOptions.forEach((item: any) => {
              const event = { preventDefault: jest.fn() };
              item.onClick(event);
            });
          }}
        >
          Menu
        </button>
        {itemOptions.map((item: any, index: number) => (
          <div
            key={`${item.dataId}-${index}`}
            data-testid={`menu-item-${item.text}`}
            onClick={item.onClick}
          >
            {item.text}
          </div>
        ))}
      </div>
    );
  };
});

// Get mocked modules
jest.mocked = jest.mocked || ((fn: any) => fn);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const confirmModule = jest.mocked(require('../../../lib/confirm'));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const notifyModule = jest.mocked(require('../../../lib/notify'));

const confirm = confirmModule.default || confirmModule;
const notify = notifyModule.default || notifyModule;

// Helper function to create mock objects
function createMockUser(overrides = {}) {
  return {
    _id: 'user-1',
    slug: 'user-slug',
    email: 'user@example.com',
    displayName: 'Test User',
    avatarUrl: 'http://example.com/avatar.jpg',
    isSignedupViaGoogle: false,
    darkTheme: false,
    defaultTeamSlug: 'team-slug',
    stripeCard: null,
    hasCardInformation: false,
    stripeListOfInvoices: null,
    ...overrides,
  } as User;
}

function createMockTeam(overrides = {}) {
  const members = new Map();
  members.set('user-1', createMockUser());
  members.set('user-2', createMockUser({ _id: 'user-2', displayName: 'Other User' }));

  return {
    _id: 'team-1',
    slug: 'team-slug',
    name: 'Test Team',
    members,
    ...overrides,
  } as unknown as Team;
}

function createMockDiscussion(overrides = {}) {
  return {
    _id: 'discussion-1',
    createdUserId: 'user-1',
    name: 'Test Discussion',
    slug: 'test-discussion',
    posts: [],
    team: createMockTeam(),
    deletePost: jest.fn(),
    ...overrides,
  } as unknown as Discussion;
}

function createMockPost(overrides: any = {}) {
  const discussion = createMockDiscussion((overrides as any).discussion);
  const user = createMockUser((overrides as any).user);

  const post = {
    _id: 'post-1',
    createdUserId: 'user-1',
    createdAt: new Date('2024-01-15'),
    lastUpdatedAt: new Date('2024-01-16'),
    discussionId: 'discussion-1',
    content: 'Test post content',
    htmlContent: '<p>Test post content</p>',
    isEdited: false,
    discussion,
    user,
    ...overrides,
  } as unknown as Post;

  // Add post to discussion's posts array
  if (!discussion.posts.includes(post)) {
    discussion.posts.push(post);
  }

  return post;
}

function createMockStore(overrides = {}) {
  return {
    isServer: false,
    currentUser: createMockUser(),
    currentUrl: '/',
    currentTeam: createMockTeam(),
    teams: [],
    socket: null,
    ...overrides,
  } as unknown as Store;
}

describe('PostDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders post detail with all required elements', () => {
      // Arrange
      const post = createMockPost();
      const store = createMockStore();

      // Act
      const { container } = render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert - check post ID div exists
      const postDiv = container.querySelector(`#post-${post._id}`);
      expect(postDiv).toBeInTheDocument();

      // Check post content is rendered
      expect(screen.getByTestId('post-content')).toBeInTheDocument();
    });

    test('renders post content with HTML', () => {
      // Arrange
      const htmlContent = '<p>Test HTML content</p>';
      const post = createMockPost({ htmlContent });
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const postContent = screen.getByTestId('post-content');
      expect(postContent).toHaveTextContent(htmlContent);
    });

    test('renders user avatar with correct alt text', () => {
      // Arrange
      const post = createMockPost();
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const avatar = screen.getByAltText(post.user.displayName);
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', post.user.avatarUrl);
    });

    test('renders user display name', () => {
      // Arrange
      const post = createMockPost();
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      expect(screen.getByText(new RegExp(`By: ${post.user.displayName}`))).toBeInTheDocument();
    });

    test('renders created date in correct format', () => {
      // Arrange
      const createdAt = new Date('2024-01-15');
      const post = createMockPost({ createdAt });
      const store = createMockStore();
      const expectedDate = moment(createdAt).local().format('MMM Do YYYY');

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      expect(screen.getByText(new RegExp(expectedDate))).toBeInTheDocument();
    });

    test('does not render "Last edited" when post is not edited', () => {
      // Arrange
      const post = createMockPost({ isEdited: false });
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      expect(screen.queryByText(/Last edited:/)).not.toBeInTheDocument();
    });

    test('renders "Last edited" when post is edited', () => {
      // Arrange
      const lastUpdatedAt = new Date('2024-01-16');
      const post = createMockPost({ isEdited: true, lastUpdatedAt });
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      expect(screen.getByText(/Last edited:/)).toBeInTheDocument();
    });

    test('renders without avatar when post.user is null', () => {
      // Arrange
      const post = createMockPost({ user: null });
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      // Should still render without errors
      expect(screen.getByTestId('post-content')).toBeInTheDocument();
      // Check that avatar image is not rendered
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    test('applies mobile styling when isMobile is true', () => {
      // Arrange
      const post = createMockPost();
      const store = createMockStore();

      // Act
      const { container } = render(
        <PostDetail
          post={post}
          store={store}
          isMobile={true}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert - check that margin style is different for mobile
      const contentDiv = container.querySelector('div[style*="0px"]') as HTMLElement;
      expect(contentDiv).toBeInTheDocument();
    });

    test('applies desktop styling when isMobile is false', () => {
      // Arrange
      const post = createMockPost();
      const store = createMockStore();

      // Act
      const { container } = render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const contentDiv = container.querySelector('div[style*="70px"]') as HTMLElement;
      expect(contentDiv).toBeInTheDocument();
    });
  });

  describe('Menu Rendering and Visibility', () => {
    test('renders menu when post.user and currentUser exist', () => {
      // Arrange
      const post = createMockPost();
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const menuWithItems = screen.getByTestId('menu-with-items');
      expect(menuWithItems).toBeInTheDocument();
    });

    test('does not render menu when post.user is null', () => {
      // Arrange
      const post = createMockPost({ user: null });
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const menuWithItems = screen.queryByTestId('menu-with-items');
      expect(menuWithItems).not.toBeInTheDocument();
    });

    test('does not render menu when currentUser is null', () => {
      // Arrange
      const post = createMockPost();
      const store = createMockStore({ currentUser: null });

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const menuWithItems = screen.queryByTestId('menu-with-items');
      expect(menuWithItems).not.toBeInTheDocument();
    });
  });

  describe('Menu Items - Show Markdown', () => {
    test('shows "Show Markdown" option when post creator is different from current user', () => {
      // Arrange
      const post = createMockPost({ createdUserId: 'user-2' });
      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const showMarkdownItem = screen.getByTestId('menu-item-Show Markdown');
      expect(showMarkdownItem).toBeInTheDocument();
    });

    test('does not show "Show Markdown" option when post creator is current user', () => {
      // Arrange
      const post = createMockPost({ createdUserId: 'user-1' });
      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const showMarkdownItem = screen.queryByTestId('menu-item-Show Markdown');
      expect(showMarkdownItem).not.toBeInTheDocument();
    });

    test('calls onShowMarkdownClick when "Show Markdown" is clicked', () => {
      // Arrange
      const handleShowMarkdown = jest.fn();
      const post = createMockPost({ createdUserId: 'user-2' });
      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={handleShowMarkdown}
        />,
      );

      const showMarkdownItem = screen.getByTestId('menu-item-Show Markdown');
      fireEvent.click(showMarkdownItem);

      // Assert
      expect(handleShowMarkdown).toHaveBeenCalledWith(post);
      expect(handleShowMarkdown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Menu Items - Edit', () => {
    test('shows "Edit" option when post creator is current user', () => {
      // Arrange
      const post = createMockPost({ createdUserId: 'user-1' });
      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const editItem = screen.getByTestId('menu-item-Edit');
      expect(editItem).toBeInTheDocument();
    });

    test('does not show "Edit" option when post creator is different from current user', () => {
      // Arrange
      const post = createMockPost({ createdUserId: 'user-2' });
      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const editItem = screen.queryByTestId('menu-item-Edit');
      expect(editItem).not.toBeInTheDocument();
    });

    test('calls onEditClick when "Edit" is clicked', () => {
      // Arrange
      const handleEditClick = jest.fn();
      const post = createMockPost({ createdUserId: 'user-1' });
      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={handleEditClick}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      const editItem = screen.getByTestId('menu-item-Edit');
      fireEvent.click(editItem);

      // Assert
      expect(handleEditClick).toHaveBeenCalledWith(post);
      expect(handleEditClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Menu Items - Delete', () => {
    test('shows "Delete" option for post creator when post is not first post', () => {
      // Arrange
      const discussion = createMockDiscussion();
      createMockPost({ _id: 'post-0', discussion });
      const secondPost = createMockPost({ _id: 'post-1', createdUserId: 'user-1', discussion });

      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={secondPost}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const deleteItem = screen.getByTestId('menu-item-Delete');
      expect(deleteItem).toBeInTheDocument();
    });

    test('does not show "Delete" option when post is the first post', () => {
      // Arrange
      const discussion = createMockDiscussion();
      // Create first post - it will be added to discussion.posts during createMockPost
      const firstPost = createMockPost({ _id: 'post-0', createdUserId: 'user-1', discussion });
      // Keep only this first post in the array for this test
      (discussion.posts as any).length = 0;
      (discussion.posts as any).push(firstPost);

      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={firstPost}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const deleteItem = screen.queryByTestId('menu-item-Delete');
      expect(deleteItem).not.toBeInTheDocument();
    });

    test('does not show "Delete" option for other users', () => {
      // Arrange
      const discussion = createMockDiscussion();
      const post = createMockPost({ _id: 'post-1', createdUserId: 'user-2', discussion });
      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const deleteItem = screen.queryByTestId('menu-item-Delete');
      expect(deleteItem).not.toBeInTheDocument();
    });

    test('opens confirmation dialog when "Delete" is clicked', () => {
      // Arrange
      const discussion = createMockDiscussion();
      createMockPost({ _id: 'post-0', createdUserId: 'user-1', discussion });
      const secondPost = createMockPost({ _id: 'post-1', createdUserId: 'user-1', discussion });

      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={secondPost}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      const deleteItem = screen.getByTestId('menu-item-Delete');
      fireEvent.click(deleteItem);

      // Assert
      expect(confirm).toHaveBeenCalledWith({
        title: 'Are you sure?',
        message: '',
        onAnswer: expect.any(Function),
      });
    });

    test('deletes post when confirmation is accepted', async () => {
      // Arrange
      const discussion = createMockDiscussion();
      createMockPost({ _id: 'post-0', createdUserId: 'user-1', discussion });
      const secondPost = createMockPost({ _id: 'post-1', createdUserId: 'user-1', discussion });

      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Mock the confirm function to call the callback immediately
      confirm.mockImplementation((options: any) => {
        options.onAnswer(true);
      });

      // Act
      render(
        <PostDetail
          post={secondPost}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      const deleteItem = screen.getByTestId('menu-item-Delete');
      fireEvent.click(deleteItem);

      // Assert
      await waitFor(() => {
        expect(discussion.deletePost).toHaveBeenCalledWith(secondPost);
      });
      expect(notify).toHaveBeenCalledWith('You successfully deleted Post.');
    });

    test('does not delete post when confirmation is rejected', async () => {
      // Arrange
      const discussion = createMockDiscussion();
      createMockPost({ _id: 'post-0', createdUserId: 'user-1', discussion });
      const secondPost = createMockPost({ _id: 'post-1', createdUserId: 'user-1', discussion });

      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Mock the confirm function to call the callback with false
      confirm.mockImplementation((options: any) => {
        options.onAnswer(false);
      });

      // Act
      render(
        <PostDetail
          post={secondPost}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      const deleteItem = screen.getByTestId('menu-item-Delete');
      fireEvent.click(deleteItem);

      // Assert
      await waitFor(() => {
        expect(discussion.deletePost).not.toHaveBeenCalled();
      });
      expect(notify).not.toHaveBeenCalled();
    });
  });

  describe('Callback handling', () => {
    test('handles onEditClick when callback is not provided', () => {
      // Arrange
      const post = createMockPost({ createdUserId: 'user-1' });
      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={undefined}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Should render without errors
      const editItem = screen.getByTestId('menu-item-Edit');
      expect(editItem).toBeInTheDocument();
    });

    test('handles onShowMarkdownClick when callback is not provided', () => {
      // Arrange
      const post = createMockPost({ createdUserId: 'user-2' });
      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={undefined}
        />,
      );

      // Should render without errors
      const showMarkdownItem = screen.getByTestId('menu-item-Show Markdown');
      expect(showMarkdownItem).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    test('handles post with null user and undefined displayName', () => {
      // Arrange
      const post = createMockPost({ user: null });
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const postContent = screen.getByTestId('post-content');
      expect(postContent).toBeInTheDocument();
      // When user is null, "By: false" is rendered due to the OR operation
      expect(screen.getByText(/By:/)).toBeInTheDocument();
    });

    test('handles post with empty htmlContent', () => {
      // Arrange
      const post = createMockPost({ htmlContent: '' });
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      const postContent = screen.getByTestId('post-content');
      expect(postContent).toBeInTheDocument();
    });

    test('handles post with missing avatar URL', () => {
      // Arrange
      const userWithoutAvatar = createMockUser({ avatarUrl: null });
      const post = createMockPost({ user: userWithoutAvatar });
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert - should render without errors
      // When avatar has no URL, MUI Avatar will show a placeholder/icon
      expect(screen.getByTestId('post-content')).toBeInTheDocument();
      // Component still renders with the user info
      expect(screen.getByText(new RegExp(`By:`))).toBeInTheDocument();
    });

    test('handles post with empty displayName', () => {
      // Arrange - create a user with displayName as empty string
      const userWithoutDisplayName = createMockUser({ displayName: '' });
      const post = createMockPost({ user: userWithoutDisplayName });
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert - should render without errors
      expect(screen.getByTestId('post-content')).toBeInTheDocument();
      // Component renders the post successfully
      expect(screen.getByText(new RegExp(`By:`))).toBeInTheDocument();
    });

    test('handles post with different date formats', () => {
      // Arrange
      const createdAt = new Date('2020-01-01T00:00:00');
      const lastUpdatedAt = new Date('2024-12-31T23:59:59');
      const post = createMockPost({
        createdAt,
        lastUpdatedAt,
        isEdited: true,
      });
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      expect(screen.getByText(/Last edited:/)).toBeInTheDocument();
    });
  });

  describe('PropTypes and TypeScript validation', () => {
    test('renders with all required props', () => {
      // Arrange
      const props = {
        post: createMockPost(),
        store: createMockStore(),
        isMobile: false,
        onEditClick: jest.fn(),
        onShowMarkdownClick: jest.fn(),
      };

      // Act
      render(<PostDetail {...props} />);

      // Assert
      expect(screen.getByTestId('post-content')).toBeInTheDocument();
    });

    test('renders with optional callbacks undefined', () => {
      // Arrange
      const props = {
        post: createMockPost(),
        store: createMockStore(),
        isMobile: true,
        onEditClick: undefined,
        onShowMarkdownClick: undefined,
      };

      // Act
      render(<PostDetail {...props} />);

      // Assert
      expect(screen.getByTestId('post-content')).toBeInTheDocument();
    });
  });

  describe('Integration tests - complex scenarios', () => {
    test('handles post with null createdAt gracefully', () => {
      // Arrange
      const post = createMockPost({ createdAt: null });
      const store = createMockStore();

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert
      expect(screen.getByTestId('post-content')).toBeInTheDocument();
    });

    test('renders all menu options for post creator on non-first post', async () => {
      // Arrange
      const discussion = createMockDiscussion();
      createMockPost({ _id: 'post-0', createdUserId: 'user-1', discussion });
      const secondPost = createMockPost({ _id: 'post-1', createdUserId: 'user-1', discussion });

      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={secondPost}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert - verify both Edit and Delete options are available
      expect(screen.getByTestId('menu-item-Edit')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-Delete')).toBeInTheDocument();
      // Show Markdown should not be available for own posts
      expect(screen.queryByTestId('menu-item-Show Markdown')).not.toBeInTheDocument();
    });

    test('renders correct menu options for non-creator', () => {
      // Arrange
      const discussion = createMockDiscussion();
      const post = createMockPost({ createdUserId: 'user-2', discussion });

      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert - only Show Markdown should be available
      expect(screen.getByTestId('menu-item-Show Markdown')).toBeInTheDocument();
      // Edit and Delete should not be available for other's posts
      expect(screen.queryByTestId('menu-item-Edit')).not.toBeInTheDocument();
      expect(screen.queryByTestId('menu-item-Delete')).not.toBeInTheDocument();
    });

    test('handles rapid click on menu items', async () => {
      // Arrange
      const handleEditClick = jest.fn();
      const post = createMockPost({ createdUserId: 'user-1' });
      const store = createMockStore({ currentUser: createMockUser({ _id: 'user-1' }) });

      // Act
      render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={handleEditClick}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      const editItem = screen.getByTestId('menu-item-Edit');

      // Click multiple times rapidly
      fireEvent.click(editItem);
      fireEvent.click(editItem);

      // Assert - callback should be called twice
      expect(handleEditClick).toHaveBeenCalledTimes(2);
      expect(handleEditClick).toHaveBeenCalledWith(post);
    });

    test('avatar displays with correct dimensions', () => {
      // Arrange
      const post = createMockPost();
      const store = createMockStore();

      // Act
      const { container } = render(
        <PostDetail
          post={post}
          store={store}
          isMobile={false}
          onEditClick={jest.fn()}
          onShowMarkdownClick={jest.fn()}
        />,
      );

      // Assert - avatar should have correct dimensions
      const avatarParent = container.querySelector('div[style*="40px"]');
      expect(avatarParent).toBeInTheDocument();
    });
  });
});
