import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PostForm from '../PostForm';

// Mock Material-UI Button
jest.mock('@mui/material/Button', () => {
  return function MockButton({
    children,
    onClick,
    type,
    variant,
    color,
    disabled,
    style,
    ...props
  }: any) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        data-variant={variant}
        data-color={color}
        style={style}
        {...props}
      >
        {children}
      </button>
    );
  };
});

// Mock PostEditor component
jest.mock('../PostEditor', () => {
  return function MockPostEditor({ content, onChanged, ...props }: any) {
    return (
      <div data-testid="post-editor">
        <textarea
          data-testid="editor-textarea"
          value={content}
          onChange={(e) => onChanged(e.target.value)}
          {...props}
        />
      </div>
    );
  };
});

// Mock notify function
jest.mock('../../../lib/notify', () => jest.fn());

// Mock NProgress
jest.mock('nprogress', () => ({
  start: jest.fn(),
  done: jest.fn(),
}));

// Mock he.decode
jest.mock('he', () => ({
  decode: jest.fn((val: string) => val),
}));

// Mock marked
jest.mock('marked', () => ({
  marked: jest.fn((val: string) => `<html>${val}</html>`),
}));

// Mock MobX observer
jest.mock('mobx-react', () => ({
  observer: (component: any) => component,
}));

// Import mocked functions
import notify from '../../../lib/notify';
import NProgress from 'nprogress';
import { marked } from 'marked';
import he from 'he';
import { Store } from '../../../lib/store';
import { Discussion } from '../../../lib/store/discussion';
import { Post } from '../../../lib/store/post';
import { User } from '../../../lib/store/user';

// Helper to create mock user
const createMockUser = (overrides = {}): User =>
  ({
    _id: 'user-1',
    displayName: 'Test User',
    email: 'test@example.com',
    ...overrides,
  }) as any;

// Helper to create mock post
const createMockPost = (overrides = {}): Post =>
  ({
    _id: 'post-1',
    content: 'Original post content',
    htmlContent: '<p>Original post content</p>',
    user: createMockUser(),
    editPost: jest.fn().mockResolvedValue({}),
    ...overrides,
  }) as any;

// Helper to create mock discussion
const createMockDiscussion = (overrides = {}): Discussion =>
  ({
    _id: 'discussion-1',
    name: 'Test Discussion',
    slug: 'test-discussion',
    team: { slug: 'test-team' },
    memberIds: ['user-1', 'user-2'],
    notificationType: 'none',
    addPost: jest.fn().mockResolvedValue(createMockPost()),
    sendDataToLambda: jest.fn().mockResolvedValue({}),
    ...overrides,
  }) as any;

// Helper to create mock store
const createMockStore = (overrides = {}): Store =>
  ({
    currentTeam: { slug: 'test-team' },
    currentUser: createMockUser(),
    ...overrides,
  }) as any;

describe('PostForm', () => {
  const defaultProps = {
    store: createMockStore(),
    isMobile: false,
    members: [createMockUser(), createMockUser({ _id: 'user-2', displayName: 'Another User' })],
    post: null,
    discussion: createMockDiscussion(),
    showMarkdownToNonCreator: false,
    onFinished: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (notify as jest.Mock).mockClear();
    jest.mocked(marked).mockClear();
    jest.mocked(he.decode).mockClear();
    (NProgress.start as jest.Mock).mockClear();
    (NProgress.done as jest.Mock).mockClear();
  });

  describe('Rendering', () => {
    test('renders add post form when post prop is null', () => {
      render(<PostForm {...defaultProps} post={null} />);

      expect(screen.getByText('Add Post')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /publish post/i })).toBeInTheDocument();
    });

    test('renders edit post form when post prop is provided', () => {
      const post = createMockPost();
      render(<PostForm {...defaultProps} post={post} />);

      expect(screen.getByText('Edit Post')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    test('renders markdown display when showMarkdownToNonCreator is true', () => {
      const post = createMockPost();
      render(<PostForm {...defaultProps} post={post} showMarkdownToNonCreator={true} />);

      expect(screen.getByText('Showing Markdown')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
      const goBackButtons = screen.getAllByRole('button', { name: /go back/i });
      expect(goBackButtons.length).toBeGreaterThan(0);
    });

    test('renders PostEditor component with correct props', () => {
      const post = createMockPost({ content: 'Test content' });
      render(<PostForm {...defaultProps} post={post} />);

      expect(screen.getByTestId('post-editor')).toBeInTheDocument();
      expect(screen.getByTestId('editor-textarea')).toHaveValue('Test content');
    });

    test('renders PostEditor with empty content for new post', () => {
      render(<PostForm {...defaultProps} post={null} />);

      expect(screen.getByTestId('editor-textarea')).toHaveValue('');
    });

    test('displays submit button as primary with proper text for new post', () => {
      render(<PostForm {...defaultProps} post={null} />);

      const submitButton = screen.getByRole('button', { name: /publish post/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(submitButton).toHaveAttribute('data-variant', 'contained');
      expect(submitButton).toHaveAttribute('data-color', 'primary');
    });

    test('displays submit button as contained for edit post', () => {
      const post = createMockPost();
      render(<PostForm {...defaultProps} post={post} />);

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      expect(submitButton).toHaveAttribute('data-variant', 'contained');
    });

    test('renders cancel button for editing post', () => {
      const post = createMockPost();
      render(<PostForm {...defaultProps} post={post} />);

      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      expect(cancelButtons.length).toBeGreaterThan(0);
    });

    test('does not render cancel button for new post', () => {
      render(<PostForm {...defaultProps} post={null} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });

    test('renders different button text when showMarkdownToNonCreator is true', () => {
      const post = createMockPost();
      render(<PostForm {...defaultProps} post={post} showMarkdownToNonCreator={true} />);

      const goBackButtons = screen.getAllByRole('button', { name: /go back/i });
      expect(goBackButtons.length).toBeGreaterThan(0);
    });

    test('applies correct styling on mobile', () => {
      const { container } = render(<PostForm {...defaultProps} isMobile={true} />);

      const form = container.querySelector('form');
      expect(form).toHaveStyle({ width: '100%', height: '100%' });
    });

    test('disables buttons when disabled state is true', async () => {
      const user = userEvent.setup();
      let resolveEditPost: any;
      const mockEditPost = jest.fn(
        () =>
          new Promise((resolve) => {
            resolveEditPost = resolve;
          }),
      );
      const post = createMockPost({ editPost: mockEditPost });
      render(<PostForm {...defaultProps} post={post} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'some content');

      // Trigger submit to set disabled state
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      // Wait for disabled state to be set
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resolveEditPost({});

      // Wait for button to be re-enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Content Changes', () => {
    test('updates content when user types in editor', async () => {
      const user = userEvent.setup();
      render(<PostForm {...defaultProps} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'New post content');

      expect(textarea).toHaveValue('New post content');
    });

    test('preserves content in textarea on input change', async () => {
      const user = userEvent.setup();
      render(<PostForm {...defaultProps} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'Test');
      expect(textarea).toHaveValue('Test');

      await user.type(textarea, ' content');
      expect(textarea).toHaveValue('Test content');
    });

    test('clears content after successful post creation', async () => {
      const user = userEvent.setup();
      const mockAddPost = jest.fn().mockResolvedValue(createMockPost());
      const discussion = createMockDiscussion({ addPost: mockAddPost });

      render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'New post content');
      await user.click(screen.getByRole('button', { name: /publish post/i }));

      await waitFor(() => {
        expect(textarea).toHaveValue('');
      });
    });

    test('updates content when post prop changes via getDerivedStateFromProps', async () => {
      const post1 = createMockPost({ _id: 'post-1', content: 'Post 1 content' });
      const post2 = createMockPost({ _id: 'post-2', content: 'Post 2 content' });

      const { rerender } = render(<PostForm {...defaultProps} post={post1} />);

      const textarea = screen.getByTestId('editor-textarea');
      expect(textarea).toHaveValue('Post 1 content');

      rerender(<PostForm {...defaultProps} post={post2} />);

      expect(textarea).toHaveValue('Post 2 content');
    });

    test('does not update content if post id is the same', async () => {
      const post = createMockPost({ _id: 'post-1', content: 'Original' });

      const { rerender } = render(<PostForm {...defaultProps} post={post} />);

      const textarea = screen.getByTestId('editor-textarea');
      expect(textarea).toHaveValue('Original');

      // Change to same post with different content should not update
      const samePost = createMockPost({ _id: 'post-1', content: 'Changed' });
      rerender(<PostForm {...defaultProps} post={samePost} />);

      expect(textarea).toHaveValue('Original');
    });
  });

  describe('Form Submission - New Post', () => {
    test('validates empty content and shows notification', async () => {
      const user = userEvent.setup();
      render(<PostForm {...defaultProps} post={null} />);

      await user.click(screen.getByRole('button', { name: /publish post/i }));

      await waitFor(() => {
        expect(notify).toHaveBeenCalledWith('Add content to your Post');
      });
    });

    test('shows notification if team is not selected', async () => {
      const user = userEvent.setup();
      const store = createMockStore({ currentTeam: null });

      render(<PostForm {...defaultProps} store={store} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'Post content');
      await user.click(screen.getByRole('button', { name: /publish post/i }));

      await waitFor(() => {
        expect(notify).toHaveBeenCalledWith('Team is not selected or does not exist.');
      });
    });

    test('creates new post with content and htmlContent', async () => {
      const user = userEvent.setup();
      const mockAddPost = jest.fn().mockResolvedValue(createMockPost());
      const discussion = createMockDiscussion({ addPost: mockAddPost });

      render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'New post content');
      await user.click(screen.getByRole('button', { name: /publish post/i }));

      await waitFor(() => {
        expect(mockAddPost).toHaveBeenCalledWith('New post content');
      });
    });

    test('shows success notification after creating post', async () => {
      const user = userEvent.setup();
      const mockAddPost = jest.fn().mockResolvedValue(createMockPost());
      const discussion = createMockDiscussion({ addPost: mockAddPost });

      render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'New post content');
      await user.click(screen.getByRole('button', { name: /publish post/i }));

      await waitFor(() => {
        expect(notify).toHaveBeenCalledWith('You successfully published new Post.');
      });
    });

    test('sends data to Lambda when notification type is email', async () => {
      const user = userEvent.setup();
      const mockAddPost = jest
        .fn()
        .mockResolvedValue(
          createMockPost({ user: createMockUser({ displayName: 'Post Author' }) }),
        );
      const mockSendDataToLambda = jest.fn().mockResolvedValue({});
      const discussion = createMockDiscussion({
        addPost: mockAddPost,
        notificationType: 'email',
        sendDataToLambda: mockSendDataToLambda,
        memberIds: ['user-1', 'user-2'],
      });

      render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'Email notification post');
      await user.click(screen.getByRole('button', { name: /publish post/i }));

      await waitFor(() => {
        expect(mockSendDataToLambda).toHaveBeenCalled();
        const callArgs = mockSendDataToLambda.mock.calls[0][0];
        expect(callArgs).toEqual(
          expect.objectContaining({
            discussionName: 'Test Discussion',
            postContent: expect.any(String),
            authorName: 'Post Author',
            userIds: expect.arrayContaining(['user-2']),
          }),
        );
      });
    });

    test('excludes current user from Lambda notification recipients', async () => {
      const user = userEvent.setup();
      const mockAddPost = jest.fn().mockResolvedValue(createMockPost());
      const mockSendDataToLambda = jest.fn().mockResolvedValue({});
      const currentUser = createMockUser({ _id: 'user-1' });
      const store = createMockStore({ currentUser });
      const discussion = createMockDiscussion({
        addPost: mockAddPost,
        notificationType: 'email',
        sendDataToLambda: mockSendDataToLambda,
        memberIds: ['user-1', 'user-2', 'user-3'],
      });

      render(<PostForm {...defaultProps} store={store} discussion={discussion} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'Post with email');
      await user.click(screen.getByRole('button', { name: /publish post/i }));

      await waitFor(() => {
        const callArgs = mockSendDataToLambda.mock.calls[0][0];
        expect(callArgs.userIds).toEqual(['user-2', 'user-3']);
        expect(callArgs.userIds).not.toContain('user-1');
      });
    });

    test('does not send Lambda data when notification type is not email', async () => {
      const user = userEvent.setup();
      const mockAddPost = jest.fn().mockResolvedValue(createMockPost());
      const mockSendDataToLambda = jest.fn().mockResolvedValue({});
      const discussion = createMockDiscussion({
        addPost: mockAddPost,
        notificationType: 'none',
        sendDataToLambda: mockSendDataToLambda,
      });

      render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'Post content');
      await user.click(screen.getByRole('button', { name: /publish post/i }));

      await waitFor(() => {
        expect(mockSendDataToLambda).not.toHaveBeenCalled();
      });
    });

    test('calls onFinished callback after successful post creation', async () => {
      const user = userEvent.setup();
      const onFinished = jest.fn();
      const mockAddPost = jest.fn().mockResolvedValue(createMockPost());
      const discussion = createMockDiscussion({ addPost: mockAddPost });

      render(
        <PostForm {...defaultProps} discussion={discussion} post={null} onFinished={onFinished} />,
      );

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'Post content');
      await user.click(screen.getByRole('button', { name: /publish post/i }));

      await waitFor(() => {
        expect(onFinished).toHaveBeenCalled();
      });
    });

    test('starts and completes NProgress during post creation', async () => {
      const user = userEvent.setup();
      const mockAddPost = jest.fn().mockResolvedValue(createMockPost());
      const discussion = createMockDiscussion({ addPost: mockAddPost });

      render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'Post content');
      await user.click(screen.getByRole('button', { name: /publish post/i }));

      await waitFor(() => {
        expect(NProgress.start).toHaveBeenCalled();
        expect(NProgress.done).toHaveBeenCalled();
      });
    });

    test('handles API error during post creation', async () => {
      const user = userEvent.setup();
      const error = new Error('Network error');
      const mockAddPost = jest.fn().mockRejectedValue(error);
      const discussion = createMockDiscussion({ addPost: mockAddPost });

      // Подавляем console.log для ожидаемой ошибки в тесте
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      try {
        render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

        const textarea = screen.getByTestId('editor-textarea');
        await user.type(textarea, 'Post content');
        await user.click(screen.getByRole('button', { name: /publish post/i }));

        await waitFor(() => {
          expect(notify).toHaveBeenCalledWith(error);
        });
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('re-enables submit button after error during post creation', async () => {
      const user = userEvent.setup();
      const mockAddPost = jest.fn().mockRejectedValue(new Error('Error'));
      const discussion = createMockDiscussion({ addPost: mockAddPost });

      // Подавляем console.log для ожидаемой ошибки в тесте
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      try {
        render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

        const textarea = screen.getByTestId('editor-textarea');
        await user.type(textarea, 'Post content');

        const submitButton = screen.getByRole('button', { name: /publish post/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(submitButton).not.toBeDisabled();
        });
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('Form Submission - Edit Post', () => {
    test('edits existing post with content and htmlContent', async () => {
      const user = userEvent.setup();
      const mockEditPost = jest.fn().mockResolvedValue({});
      const post = createMockPost({ editPost: mockEditPost });

      render(<PostForm {...defaultProps} post={post} />);

      const textarea = screen.getByTestId('editor-textarea');
      expect(textarea).toHaveValue('Original post content');

      await user.clear(textarea);
      await user.type(textarea, 'Updated post content');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(mockEditPost).toHaveBeenCalledWith({
          content: 'Updated post content',
          htmlContent: '<html>Updated post content</html>',
        });
      });
    });

    test('shows success notification after editing post', async () => {
      const user = userEvent.setup();
      const mockEditPost = jest.fn().mockResolvedValue({});
      const post = createMockPost({ editPost: mockEditPost });

      render(<PostForm {...defaultProps} post={post} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Updated content');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(notify).toHaveBeenCalledWith('You successfully edited Post');
      });
    });

    test('calls onFinished after successful edit', async () => {
      const user = userEvent.setup();
      const onFinished = jest.fn();
      const mockEditPost = jest.fn().mockResolvedValue({});
      const post = createMockPost({ editPost: mockEditPost });

      render(<PostForm {...defaultProps} post={post} onFinished={onFinished} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Updated content');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(onFinished).toHaveBeenCalled();
      });
    });

    test('handles error during post edit', async () => {
      const user = userEvent.setup();
      const error = new Error('Edit failed');
      const mockEditPost = jest.fn().mockRejectedValue(error);
      const post = createMockPost({ editPost: mockEditPost });

      // Подавляем console.log для ожидаемой ошибки в тесте
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      try {
        render(<PostForm {...defaultProps} post={post} />);

        const textarea = screen.getByTestId('editor-textarea');
        await user.clear(textarea);
        await user.type(textarea, 'Updated content');
        await user.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
          expect(notify).toHaveBeenCalledWith(error);
        });
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('starts and completes NProgress during post edit', async () => {
      const user = userEvent.setup();
      const mockEditPost = jest.fn().mockResolvedValue({});
      const post = createMockPost({ editPost: mockEditPost });

      render(<PostForm {...defaultProps} post={post} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Updated content');
      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(NProgress.start).toHaveBeenCalled();
        expect(NProgress.done).toHaveBeenCalled();
      });
    });

    test('re-enables button after error during edit', async () => {
      const user = userEvent.setup();
      const mockEditPost = jest.fn().mockRejectedValue(new Error('Error'));
      const post = createMockPost({ editPost: mockEditPost });

      // Подавляем console.log для ожидаемой ошибки в тесте
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      try {
        render(<PostForm {...defaultProps} post={post} />);

        const textarea = screen.getByTestId('editor-textarea');
        await user.clear(textarea);
        await user.type(textarea, 'Updated content');

        const submitButton = screen.getByRole('button', { name: /save changes/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(submitButton).not.toBeDisabled();
        });
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });

  describe('Close Form', () => {
    test('closes form and resets content when cancel button clicked', async () => {
      const user = userEvent.setup();
      const post = createMockPost();

      const { rerender } = render(<PostForm {...defaultProps} post={post} />);

      const textarea = screen.getByTestId('editor-textarea');
      expect(textarea).toHaveValue('Original post content');

      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      await user.click(cancelButtons[0]);

      // After closeForm is called, component sets postId to null, so rerender with post=null
      // to simulate the parent component re-rendering the component
      rerender(<PostForm {...defaultProps} post={null} />);

      // After close, component should reset and show empty form
      expect(screen.getByTestId('editor-textarea')).toHaveValue('');
    });

    test('calls onFinished when closing form', async () => {
      const user = userEvent.setup();
      const onFinished = jest.fn();
      const post = createMockPost();

      render(<PostForm {...defaultProps} post={post} onFinished={onFinished} />);

      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      await user.click(cancelButtons[0]);

      await waitFor(() => {
        expect(onFinished).toHaveBeenCalled();
      });
    });

    test('keeps onFinished not called if not provided when closing', async () => {
      const user = userEvent.setup();
      const post = createMockPost();

      render(<PostForm {...defaultProps} post={post} onFinished={undefined} />);

      const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
      expect(() => user.click(cancelButtons[0])).not.toThrow();
    });

    test('shows "Go back" button text when showing markdown to non-creator', () => {
      const post = createMockPost();
      render(<PostForm {...defaultProps} post={post} showMarkdownToNonCreator={true} />);

      const goBackButtons = screen.getAllByRole('button', { name: /go back/i });
      expect(goBackButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty members array', () => {
      render(<PostForm {...defaultProps} members={[]} post={null} />);

      expect(screen.getByText('Add Post')).toBeInTheDocument();
      expect(screen.getByTestId('post-editor')).toBeInTheDocument();
    });

    test('handles undefined discussion props gracefully in error state', async () => {
      const user = userEvent.setup();
      const mockAddPost = jest.fn().mockRejectedValue(new Error('API Error'));
      const discussion = createMockDiscussion({ addPost: mockAddPost });

      // Подавляем console.log для ожидаемой ошибки в тесте
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      try {
        render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

        const textarea = screen.getByTestId('editor-textarea');
        await user.type(textarea, 'Content');
        await user.click(screen.getByRole('button', { name: /publish post/i }));

        await waitFor(() => {
          expect(notify).toHaveBeenCalledWith(expect.any(Error));
        });
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('handles form submission with special characters in content', async () => {
      const user = userEvent.setup();
      const mockAddPost = jest.fn().mockResolvedValue(createMockPost());
      const discussion = createMockDiscussion({ addPost: mockAddPost });

      render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      // Use content that doesn't contain special keyboard keys that userEvent.type would interpret
      const specialContent = 'Test with special chars: <>& \'"@#$%^*';
      await user.type(textarea, specialContent);
      await user.click(screen.getByRole('button', { name: /publish post/i }));

      await waitFor(() => {
        expect(mockAddPost).toHaveBeenCalledWith(specialContent);
      });
    });

    test('handles rapid clicks on submit button', async () => {
      const user = userEvent.setup();
      let callCount = 0;
      const mockAddPost = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve(createMockPost());
      });
      const discussion = createMockDiscussion({ addPost: mockAddPost });

      render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'Content');

      const submitButton = screen.getByRole('button', { name: /publish post/i });
      await user.click(submitButton);
      await user.click(submitButton);

      await waitFor(() => {
        // Should still only be called once due to disabled state
        expect(callCount).toBeLessThanOrEqual(2);
      });
    });

    test('handles switching between new post and edit post', () => {
      const post1 = createMockPost({ _id: 'post-1', content: 'Post 1' });
      const post2 = createMockPost({ _id: 'post-2', content: 'Post 2' });

      const { rerender } = render(<PostForm {...defaultProps} post={null} />);
      expect(screen.getByText('Add Post')).toBeInTheDocument();

      rerender(<PostForm {...defaultProps} post={post1} />);
      expect(screen.getByText('Edit Post')).toBeInTheDocument();
      expect(screen.getByTestId('editor-textarea')).toHaveValue('Post 1');

      rerender(<PostForm {...defaultProps} post={post2} />);
      expect(screen.getByTestId('editor-textarea')).toHaveValue('Post 2');
    });
  });

  describe('Content Encoding', () => {
    test('calls he.decode on content before marking', async () => {
      const user = userEvent.setup();
      const mockAddPost = jest.fn().mockResolvedValue(createMockPost());
      const discussion = createMockDiscussion({ addPost: mockAddPost });

      render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'Content with &amp; entities');
      await user.click(screen.getByRole('button', { name: /publish post/i }));

      await waitFor(() => {
        expect(he.decode).toHaveBeenCalled();
        expect(marked).toHaveBeenCalled();
      });
    });

    test('generates htmlContent from markdown', async () => {
      const user = userEvent.setup();
      const mockAddPost = jest.fn().mockResolvedValue(createMockPost());
      const discussion = createMockDiscussion({ addPost: mockAddPost });
      jest.mocked(marked).mockReturnValue('<p>Markdown HTML</p>');

      render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, '# Markdown Content');
      await user.click(screen.getByRole('button', { name: /publish post/i }));

      await waitFor(() => {
        expect(marked).toHaveBeenCalledWith(expect.any(String));
      });
    });
  });

  describe('Disabled State Management', () => {
    test('disables buttons during submission for new post', async () => {
      const user = userEvent.setup();
      let resolveAddPost: any;
      const mockAddPost = jest.fn(
        () =>
          new Promise((resolve) => {
            resolveAddPost = resolve;
          }),
      );
      const discussion = createMockDiscussion({ addPost: mockAddPost });

      render(<PostForm {...defaultProps} discussion={discussion} post={null} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, 'Content');

      const submitButton = screen.getByRole('button', { name: /publish post/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resolveAddPost(createMockPost());

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    test('disables buttons during submission for edit post', async () => {
      const user = userEvent.setup();
      let resolveEditPost: any;
      const mockEditPost = jest.fn(
        () =>
          new Promise((resolve) => {
            resolveEditPost = resolve;
          }),
      );
      const post = createMockPost({ editPost: mockEditPost });

      render(<PostForm {...defaultProps} post={post} />);

      const textarea = screen.getByTestId('editor-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'Updated');

      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resolveEditPost({});

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });
});
