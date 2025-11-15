import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock mobx-react observer
jest.mock('mobx-react', () => ({
  observer: (component: any) => component,
}));

// Mock Material-UI Paper component
jest.mock('@mui/material/Paper', () => {
  return function MockPaper({ children, elevation, style, ...props }: any) {
    return (
      <div data-testid="paper" data-elevation={elevation} style={style} {...props}>
        {children}
      </div>
    );
  };
});

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, as, scroll, style, ...props }: any) {
    return (
      <a
        data-testid="link"
        data-href={href}
        data-as={as}
        data-scroll={scroll}
        style={style}
        {...props}
      >
        {children}
      </a>
    );
  };
});

// Mock DiscussionActionMenu component
jest.mock('../DiscussionActionMenu', () => {
  return function MockDiscussionActionMenu({ discussion, isMobile }: any) {
    return (
      <div
        data-testid="discussion-action-menu"
        data-discussion-id={discussion._id}
        data-is-mobile={isMobile}
      >
        Action Menu
      </div>
    );
  };
});

// Import the component after all mocks are set up
import DiscussionListItem from '../DiscussionListItem';

// Helper functions to create mock objects
const createMockStore = (overrides: any = {}) =>
  ({
    currentUser: {
      _id: 'user1',
      darkTheme: false,
      ...overrides.currentUser,
    },
    currentUrl: '/teams/test-team/discussions/test-discussion',
    isServer: false,
    teams: [],
    socket: null,
    changeCurrentUrl: jest.fn(),
    setCurrentUser: jest.fn(),
    setCurrentTeam: jest.fn(),
    ...overrides,
  }) as any;

const createMockTeam = (slug = 'test-team') =>
  ({
    _id: 'team1',
    slug,
    name: 'Test Team',
    teamLeaderId: 'user1',
    avatarUrl: '',
    memberIds: [],
    members: new Map(),
    invitations: new Map(),
    discussions: [],
    addDiscussion: jest.fn(),
    deleteDiscussion: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
  }) as any;

const createMockDiscussion = (name = 'Test Discussion', slug = 'test-discussion') =>
  ({
    _id: 'discussion1',
    name,
    slug,
    createdUserId: 'user1',
    memberIds: ['user1'],
    notificationType: 'default',
    store: null,
    team: null,
    posts: [],
    isLoadingPosts: false,
    addPost: jest.fn(),
    deletePost: jest.fn(),
    editDiscussion: jest.fn(),
    loadPosts: jest.fn(),
  }) as any;

describe('DiscussionListItem', () => {
  let mockStore: any;
  let mockTeam: any;
  let mockDiscussion: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStore = createMockStore();
    mockTeam = createMockTeam();
    mockDiscussion = createMockDiscussion();
  });

  describe('Rendering', () => {
    test('renders without errors with required props', () => {
      // Arrange & Act
      render(
        <DiscussionListItem
          store={mockStore}
          discussion={mockDiscussion}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert
      expect(screen.getByTestId('paper')).toBeInTheDocument();
      expect(screen.getByTestId('link')).toBeInTheDocument();
      expect(screen.getByTestId('discussion-action-menu')).toBeInTheDocument();
    });

    test('renders discussion name correctly', () => {
      // Arrange
      const shortName = 'Short';
      const mockDiscussionShort = createMockDiscussion(shortName);

      // Act
      render(
        <DiscussionListItem
          store={mockStore}
          discussion={mockDiscussionShort}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert
      expect(screen.getByText(shortName)).toBeInTheDocument();
    });

    test('truncates long discussion names to 16 characters', () => {
      // Arrange
      const longName = 'This is a very long discussion name that should be truncated';
      const expectedTruncated = 'This is a very l...';
      const mockDiscussionLong = createMockDiscussion(longName);

      // Act
      render(
        <DiscussionListItem
          store={mockStore}
          discussion={mockDiscussionLong}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert
      expect(screen.getByText(expectedTruncated)).toBeInTheDocument();
      expect(screen.queryByText(longName)).not.toBeInTheDocument();
    });
  });

  describe('Selected Discussion State', () => {
    test('applies selected styling when discussion matches current URL', () => {
      // Arrange
      const selectedStore = createMockStore({
        currentUrl: '/teams/test-team/discussions/test-discussion',
      });

      // Act
      render(
        <DiscussionListItem
          store={selectedStore}
          discussion={mockDiscussion}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert
      const paper = screen.getByTestId('paper');
      expect(paper).toHaveStyle({
        border: '1px rgba(0, 0, 0, 0.75) solid',
      });
      expect(paper).toHaveAttribute('data-elevation', '24');
    });

    test('applies default styling when discussion does not match current URL', () => {
      // Arrange
      const unselectedStore = createMockStore({
        currentUrl: '/teams/test-team/discussions/other-discussion',
      });

      // Act
      render(
        <DiscussionListItem
          store={unselectedStore}
          discussion={mockDiscussion}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert
      const paper = screen.getByTestId('paper');
      expect(paper).toHaveStyle({
        border: 'none',
      });
      expect(paper).toHaveAttribute('data-elevation', '1');
    });
  });

  describe('Dark Theme Support', () => {
    test('applies dark theme text color when user has dark theme enabled', () => {
      // Arrange
      const darkThemeStore = createMockStore({
        currentUser: {
          _id: 'user1',
          darkTheme: true,
        },
      });

      // Act
      render(
        <DiscussionListItem
          store={darkThemeStore}
          discussion={mockDiscussion}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert
      const link = screen.getByTestId('link');
      expect(link).toHaveStyle({
        color: '#fff',
      });
    });

    test('applies light theme text color when user has dark theme disabled', () => {
      // Arrange
      const lightThemeStore = createMockStore({
        currentUser: {
          _id: 'user1',
          darkTheme: false,
        },
      });

      // Act
      render(
        <DiscussionListItem
          store={lightThemeStore}
          discussion={mockDiscussion}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert
      const link = screen.getByTestId('link');
      expect(link).toHaveStyle({
        color: '#000',
      });
    });

    test('applies dark theme border when discussion is selected and dark theme is enabled', () => {
      // Arrange
      const selectedDarkStore = createMockStore({
        currentUrl: '/teams/test-team/discussions/test-discussion',
        currentUser: {
          _id: 'user1',
          darkTheme: true,
        },
      });

      // Act
      render(
        <DiscussionListItem
          store={selectedDarkStore}
          discussion={mockDiscussion}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert
      const paper = screen.getByTestId('paper');
      expect(paper).toHaveStyle({
        border: '1px rgba(255, 255, 255, 0.75) solid',
      });
    });
  });

  describe('Navigation', () => {
    test('renders link with correct href and as props', () => {
      // Arrange & Act
      render(
        <DiscussionListItem
          store={mockStore}
          discussion={mockDiscussion}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert
      const link = screen.getByTestId('link');
      expect(link).toHaveAttribute(
        'data-href',
        '/discussion?teamSlug=test-team&discussionSlug=test-discussion',
      );
      expect(link).toHaveAttribute('data-as', '/teams/test-team/discussions/test-discussion');
    });

    test('link has scroll disabled', () => {
      // Arrange & Act
      render(
        <DiscussionListItem
          store={mockStore}
          discussion={mockDiscussion}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert
      const link = screen.getByTestId('link');
      expect(link).toHaveAttribute('data-scroll', 'false');
    });
  });

  describe('DiscussionActionMenu Integration', () => {
    test('passes correct props to DiscussionActionMenu', () => {
      // Arrange & Act
      render(
        <DiscussionListItem
          store={mockStore}
          discussion={mockDiscussion}
          team={mockTeam}
          isMobile={true}
        />,
      );

      // Assert
      const actionMenu = screen.getByTestId('discussion-action-menu');
      expect(actionMenu).toHaveAttribute('data-discussion-id', 'discussion1');
      expect(actionMenu).toHaveAttribute('data-is-mobile', 'true');
    });

    test('DiscussionActionMenu is positioned on the right', () => {
      // Arrange & Act
      render(
        <DiscussionListItem
          store={mockStore}
          discussion={mockDiscussion}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert
      const actionMenu = screen.getByTestId('discussion-action-menu');
      expect(actionMenu.parentElement).toHaveStyle({
        float: 'right',
        marginRight: '-12px',
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty discussion name gracefully', () => {
      // Arrange
      const emptyNameDiscussion = createMockDiscussion('');

      // Act
      render(
        <DiscussionListItem
          store={mockStore}
          discussion={emptyNameDiscussion}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert - Component should still render without errors
      expect(screen.getByTestId('paper')).toBeInTheDocument();
      expect(screen.getByTestId('link')).toBeInTheDocument();
      expect(screen.getByTestId('discussion-action-menu')).toBeInTheDocument();

      // The link should be present even with empty text
      const link = screen.getByTestId('link');
      expect(link).toBeInTheDocument();
    });

    test('handles discussion name exactly 16 characters without truncation', () => {
      // Arrange
      const exactLengthName = '1234567890123456'; // Exactly 16 characters
      const mockDiscussionExact = createMockDiscussion(exactLengthName);

      // Act
      render(
        <DiscussionListItem
          store={mockStore}
          discussion={mockDiscussionExact}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert
      expect(screen.getByText(exactLengthName)).toBeInTheDocument();
    });

    test('handles discussion name exactly 17 characters with truncation', () => {
      // Arrange
      const seventeenCharName = '12345678901234567'; // Exactly 17 characters
      const expectedTruncated = '1234567890123456...'; // 16 chars + ...
      const mockDiscussionSeventeen = createMockDiscussion(seventeenCharName);

      // Act
      render(
        <DiscussionListItem
          store={mockStore}
          discussion={mockDiscussionSeventeen}
          team={mockTeam}
          isMobile={false}
        />,
      );

      // Assert
      expect(screen.getByText(expectedTruncated)).toBeInTheDocument();
      expect(screen.queryByText(seventeenCharName)).not.toBeInTheDocument();
    });
  });
});
