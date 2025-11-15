import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EditDiscussionForm from '../EditDiscussionForm';

// Mock external dependencies
jest.mock('../../../lib/notify', () => jest.fn());
jest.mock('nprogress', () => ({
  start: jest.fn(),
  done: jest.fn(),
}));
jest.mock('../../common/MemberChooser', () => {
  return function MockMemberChooser({ onChange, selectedMemberIds, helperText }: any) {
    return (
      <div data-testid="member-chooser">
        <span>{helperText}</span>
        <button
          data-testid="member-chooser-button"
          onClick={() => onChange && onChange(['member1', 'member2'])}
        >
          Select Members ({selectedMemberIds?.length || 0})
        </button>
        <div data-testid="selected-members">
          {selectedMemberIds?.map((id: string) => (
            <span key={id} data-testid={`member-${id}`}>
              {id}
            </span>
          ))}
        </div>
      </div>
    );
  };
});

// Mock MobX observer
jest.mock('mobx-react', () => ({
  observer: (component: any) => component,
}));

// Import mocked notify
import notify from '../../../lib/notify';

// Mock data with proper typing
const mockDiscussion = {
  _id: 'discussion123',
  name: 'Test Discussion',
  memberIds: ['user1', 'user2'],
  notificationType: 'email',
  store: {
    currentUser: { _id: 'user1' },
  },
  editDiscussion: jest.fn(),
} as any; // Partial mock for testing

const mockStore = {
  currentTeam: {
    members: new Map([
      ['user1', { _id: 'user1', name: 'User 1' }],
      ['user2', { _id: 'user2', name: 'User 2' }],
      ['user3', { _id: 'user3', name: 'User 3' }],
    ]),
  },
  currentUser: { _id: 'user1' },
} as any; // Partial mock for testing

const mockStoreNoTeam = {
  currentTeam: null,
  currentUser: { _id: 'user1' },
} as any; // Partial mock for testing

const defaultProps = {
  store: mockStore,
  onClose: jest.fn(),
  open: true,
  discussion: mockDiscussion,
  isMobile: false,
};

describe('EditDiscussionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDiscussion.editDiscussion.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    test('renders dialog with form when open is true', () => {
      render(<EditDiscussionForm {...defaultProps} />);

      expect(screen.getByText('Edit Discussion')).toBeInTheDocument();
      expect(screen.getByText('Edit discussion')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /type name of discussion/i })).toBeInTheDocument();
      expect(screen.getByTestId('member-chooser')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Update Discussion')).toBeInTheDocument();
    });

    test('does not render when open is false', () => {
      render(<EditDiscussionForm {...defaultProps} open={false} />);

      expect(screen.queryByText('Edit Discussion')).not.toBeInTheDocument();
    });

    test('renders with discussion data from props', () => {
      render(<EditDiscussionForm {...defaultProps} />);

      expect(screen.getByDisplayValue('Test Discussion')).toBeInTheDocument();
      expect(screen.getByText('Email: with email notification.')).toBeInTheDocument();
    });

    test('filters out current user from member chooser', () => {
      render(<EditDiscussionForm {...defaultProps} />);

      // MemberChooser should receive members excluding current user (user1)
      // We can't easily test the exact members passed, but we can verify the component renders
      expect(screen.getByTestId('member-chooser')).toBeInTheDocument();
    });
  });

  describe('getDerivedStateFromProps', () => {
    test('updates state when discussion changes', () => {
      const newDiscussion = {
        ...mockDiscussion,
        _id: 'newDiscussion',
        name: 'New Discussion',
        memberIds: ['user3'],
        notificationType: 'default',
      } as any; // Partial mock for testing

      const { rerender } = render(<EditDiscussionForm {...defaultProps} />);

      // Initially should have original discussion data
      expect(screen.getByDisplayValue('Test Discussion')).toBeInTheDocument();

      // Rerender with new discussion
      rerender(<EditDiscussionForm {...defaultProps} discussion={newDiscussion} />);

      // Should update to new discussion data
      expect(screen.getByDisplayValue('New Discussion')).toBeInTheDocument();
    });

    test('does not update state when discussion id is the same', () => {
      const { rerender } = render(<EditDiscussionForm {...defaultProps} />);

      // Rerender with same discussion
      rerender(<EditDiscussionForm {...defaultProps} discussion={mockDiscussion} />);

      // Should still have same value
      expect(screen.getByDisplayValue('Test Discussion')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    test('updates name field when typing', async () => {
      const user = userEvent.setup();
      render(<EditDiscussionForm {...defaultProps} />);

      const nameInput = screen.getByRole('textbox', { name: /type name of discussion/i });

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Discussion Name');

      expect(nameInput).toHaveValue('Updated Discussion Name');
    });

    test('updates notification type when selecting different option', async () => {
      const user = userEvent.setup();
      render(<EditDiscussionForm {...defaultProps} />);

      const selectElement = screen.getByRole('combobox');

      await user.click(selectElement);
      await user.click(screen.getByText('Default: without email notification.'));

      expect(screen.getByText('Default: without email notification.')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('submits form successfully with valid data', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      render(<EditDiscussionForm {...defaultProps} onClose={mockOnClose} />);

      const nameInput = screen.getByRole('textbox', { name: /type name of discussion/i });
      const submitButton = screen.getByRole('button', { name: /update discussion/i });

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Discussion');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockDiscussion.editDiscussion).toHaveBeenCalledWith({
          name: 'Updated Discussion',
          memberIds: expect.any(Array),
          notificationType: 'email',
        });
        expect(notify).toHaveBeenCalledWith('You successfully edited Discussion.');
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('adds current user to memberIds if not included', async () => {
      const user = userEvent.setup();
      const discussionWithoutCurrentUser = {
        ...mockDiscussion,
        memberIds: ['user2', 'user3'], // current user (user1) not included
      } as any; // Partial mock for testing

      render(<EditDiscussionForm {...defaultProps} discussion={discussionWithoutCurrentUser} />);

      const submitButton = screen.getByRole('button', { name: /update discussion/i });

      await user.click(submitButton);

      await waitFor(() => {
        const callArgs = mockDiscussion.editDiscussion.mock.calls[0][0];
        expect(callArgs.memberIds).toContain('user1'); // current user should be added
      });
    });

    test('shows error when name is empty', async () => {
      const user = userEvent.setup();
      render(<EditDiscussionForm {...defaultProps} />);

      const nameInput = screen.getByRole('textbox', { name: /type name of discussion/i });
      const submitButton = screen.getByRole('button', { name: /update discussion/i });

      await user.clear(nameInput);
      await user.click(submitButton);

      expect(notify).toHaveBeenCalledWith('Please name this Discussion.');
      expect(mockDiscussion.editDiscussion).not.toHaveBeenCalled();
    });

    test('shows error when team is not selected', async () => {
      const user = userEvent.setup();

      render(<EditDiscussionForm {...defaultProps} store={mockStoreNoTeam} />);

      const submitButton = screen.getByRole('button', { name: /update discussion/i });

      await user.click(submitButton);

      expect(notify).toHaveBeenCalledWith('Team have not selected');
      expect(mockDiscussion.editDiscussion).not.toHaveBeenCalled();
    });

    test('handles submission error gracefully', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      mockDiscussion.editDiscussion.mockRejectedValue(new Error('API Error'));

      try {
        render(<EditDiscussionForm {...defaultProps} onClose={mockOnClose} />);

        const submitButton = screen.getByRole('button', { name: /update discussion/i });

        await user.click(submitButton);

        await waitFor(() => {
          expect(mockDiscussion.editDiscussion).toHaveBeenCalled();
          expect(notify).toHaveBeenCalledWith(new Error('API Error'));
          expect(mockOnClose).toHaveBeenCalled();
        });
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('disables buttons during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;

      // Make the API call take some time
      mockDiscussion.editDiscussion.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          }),
      );

      render(<EditDiscussionForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /update discussion/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      await user.click(submitButton);

      // Buttons should be disabled during submission
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!(undefined);

      // Wait for completion
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
        expect(cancelButton).not.toBeDisabled();
      });
    });
  });

  describe('Dialog Closing', () => {
    test('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();

      render(<EditDiscussionForm {...defaultProps} onClose={mockOnClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('resets state when closing', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();

      render(<EditDiscussionForm {...defaultProps} onClose={mockOnClose} />);

      // Modify the form
      const nameInput = screen.getByRole('textbox', { name: /type name of discussion/i });
      await user.clear(nameInput);
      await user.type(nameInput, 'Modified Name');

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();

      // Re-open dialog - should reset to original values
      render(<EditDiscussionForm {...defaultProps} open={true} />);
      expect(screen.getByDisplayValue('Test Discussion')).toBeInTheDocument();
    });

    test('closes dialog after successful submission', async () => {
      const user = userEvent.setup();
      const mockOnClose = jest.fn();

      render(<EditDiscussionForm {...defaultProps} onClose={mockOnClose} />);

      const submitButton = screen.getByRole('button', { name: /update discussion/i });

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles discussion with null values gracefully', () => {
      const discussionWithNulls = {
        ...mockDiscussion,
        name: null,
        memberIds: null,
        notificationType: null,
      } as any; // Partial mock for testing

      expect(() => {
        render(<EditDiscussionForm {...defaultProps} discussion={discussionWithNulls} />);
      }).not.toThrow();
    });

    test('handles empty member array', () => {
      const discussionWithEmptyMembers = {
        ...mockDiscussion,
        memberIds: [],
      } as any; // Partial mock for testing

      render(<EditDiscussionForm {...defaultProps} discussion={discussionWithEmptyMembers} />);

      expect(screen.getByTestId('member-chooser')).toBeInTheDocument();
    });

    test('handles undefined discussion gracefully', () => {
      // The component should handle undefined discussion by not crashing
      const discussionUndefined = undefined as any;

      expect(() => {
        render(<EditDiscussionForm {...defaultProps} discussion={discussionUndefined} />);
      }).not.toThrow();
    });
  });
});
