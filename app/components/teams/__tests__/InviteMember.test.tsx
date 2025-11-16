import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import InviteMember from '../InviteMember';
import { Store } from '../../../lib/store';

// Mock external dependencies
jest.mock('../../../lib/notify', () => jest.fn());
jest.mock('nprogress', () => ({
  start: jest.fn(),
  done: jest.fn(),
}));

// Mock MobX inject/observer
jest.mock('mobx-react', () => ({
  inject: () => (Component: React.ComponentType) => Component,
  observer: (Component: React.ComponentType) => Component,
}));

// Import mocked notify after mocking
import notify from '../../../lib/notify';
import NProgress from 'nprogress';

const mockNotify = notify as jest.MockedFunction<typeof notify>;
const mockNProgressStart = NProgress.start as jest.MockedFunction<typeof NProgress.start>;
const mockNProgressDone = NProgress.done as jest.MockedFunction<typeof NProgress.done>;

describe('InviteMember', () => {
  let mockStore: Store;
  let mockOnClose: jest.Mock;
  let mockInviteMember: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockInviteMember = jest.fn();
    mockOnClose = jest.fn();

    mockStore = {
      currentTeam: {
        inviteMember: mockInviteMember,
      },
    } as any;
  });

  describe('Rendering', () => {
    test('renders dialog when open is true', () => {
      render(<InviteMember store={mockStore} onClose={mockOnClose} open={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Invite member')).toBeInTheDocument();
    });

    test('does not render dialog when open is false', () => {
      render(<InviteMember store={mockStore} onClose={mockOnClose} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders form elements correctly', () => {
      render(<InviteMember store={mockStore} onClose={mockOnClose} open={true} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Disabled in this demo due to high bounce rate (people submitting fake emails)',
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /invite/i })).toBeInTheDocument();
    });

    test('textbox is disabled', () => {
      render(<InviteMember store={mockStore} onClose={mockOnClose} open={true} />);

      const textbox = screen.getByRole('textbox');
      expect(textbox).toBeDisabled();
    });

    test('invite button is disabled', () => {
      render(<InviteMember store={mockStore} onClose={mockOnClose} open={true} />);

      const inviteButton = screen.getByRole('button', { name: /invite/i });
      expect(inviteButton).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    test('cancel button calls onClose and resets state', async () => {
      const user = userEvent.setup();
      render(<InviteMember store={mockStore} onClose={mockOnClose} open={true} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('form submission is prevented when textbox is disabled', () => {
      render(<InviteMember store={mockStore} onClose={mockOnClose} open={true} />);

      // Find form by its style attribute (since it doesn't have role="form")
      const form = document.querySelector('form[style*="padding: 20px"]') as HTMLFormElement;
      expect(form).toBeInTheDocument();

      fireEvent.submit(form);

      // Since textbox is disabled and invite button is disabled,
      // form submission should not trigger validation
      expect(mockInviteMember).not.toHaveBeenCalled();
    });
  });

  describe('Demo Behavior', () => {
    test('shows demo message explaining disabled state', () => {
      render(<InviteMember store={mockStore} onClose={mockOnClose} open={true} />);

      expect(
        screen.getByText(
          'Disabled in this demo due to high bounce rate (people submitting fake emails)',
        ),
      ).toBeInTheDocument();
    });

    test('textbox remains disabled preventing user input', () => {
      render(<InviteMember store={mockStore} onClose={mockOnClose} open={true} />);

      const textbox = screen.getByRole('textbox');
      expect(textbox).toBeDisabled();
      expect(textbox).toHaveAttribute('placeholder', 'Email');
    });

    test('invite button remains disabled in demo mode', () => {
      render(<InviteMember store={mockStore} onClose={mockOnClose} open={true} />);

      const inviteButton = screen.getByRole('button', { name: /invite/i });
      expect(inviteButton).toBeDisabled();
      expect(inviteButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Dialog Close Behavior', () => {
    test('dialog can be closed via close button', async () => {
      const user = userEvent.setup();
      render(<InviteMember store={mockStore} onClose={mockOnClose} open={true} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    test('dialog has correct aria-labelledby', () => {
      render(<InviteMember store={mockStore} onClose={mockOnClose} open={true} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'invite-member-dialog-title');
    });

    test('dialog title has correct id', () => {
      render(<InviteMember store={mockStore} onClose={mockOnClose} open={true} />);

      expect(screen.getByText('Invite member')).toHaveAttribute('id', 'invite-member-dialog-title');
    });
  });

  describe('Core Logic Testing', () => {
    // These tests cover the internal logic that would execute if inputs weren't disabled in demo mode

    test('handleClose method resets state correctly', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const component = new (InviteMember as any)({
          store: mockStore,
          onClose: mockOnClose,
          open: true,
        });

        // Simulate component having state
        component.state = { email: 'test@example.com', disabled: true };

        component.handleClose();

        expect(mockOnClose).toHaveBeenCalledTimes(1);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('onSubmit validates team selection', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const storeWithoutTeam = { currentTeam: null } as any;
        const component = new (InviteMember as any)({
          store: storeWithoutTeam,
          onClose: mockOnClose,
          open: true,
        });

        component.state = { email: 'test@example.com' };

        const mockEvent = {
          preventDefault: jest.fn(),
        } as any;

        await component.onSubmit(mockEvent);

        expect(mockNotify).toHaveBeenCalledWith('Team have not selected');
        expect(mockInviteMember).not.toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('onSubmit validates email presence', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const component = new (InviteMember as any)({
          store: mockStore,
          onClose: mockOnClose,
          open: true,
        });

        component.state = { email: '' };

        const mockEvent = {
          preventDefault: jest.fn(),
        } as any;

        await component.onSubmit(mockEvent);

        expect(mockNotify).toHaveBeenCalledWith('Email is required');
        expect(mockInviteMember).not.toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('onSubmit handles successful invitation', async () => {
      mockInviteMember.mockResolvedValueOnce({ success: true });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const component = new (InviteMember as any)({
          store: mockStore,
          onClose: mockOnClose,
          open: true,
        });

        component.state = { email: 'test@example.com' };

        const mockEvent = {
          preventDefault: jest.fn(),
        } as any;

        await component.onSubmit(mockEvent);

        expect(mockNProgressStart).toHaveBeenCalledTimes(1);
        expect(mockInviteMember).toHaveBeenCalledWith('test@example.com');
        expect(mockNotify).toHaveBeenCalledWith('You successfully sent invitation.');
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockNProgressDone).toHaveBeenCalledTimes(2);
      } finally {
        consoleSpy.mockRestore();
      }
    });

    test('onSubmit handles invitation error', async () => {
      const errorMessage = 'Failed to invite member';
      mockInviteMember.mockRejectedValueOnce(new Error(errorMessage));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      try {
        const component = new (InviteMember as any)({
          store: mockStore,
          onClose: mockOnClose,
          open: true,
        });

        component.state = { email: 'test@example.com' };

        const mockEvent = {
          preventDefault: jest.fn(),
        } as any;

        await component.onSubmit(mockEvent);

        expect(consoleLogSpy).toHaveBeenCalledWith(new Error(errorMessage));
        expect(mockNotify).toHaveBeenCalledWith(new Error(errorMessage));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockNProgressDone).toHaveBeenCalledTimes(1); // Only called in finally block
      } finally {
        consoleSpy.mockRestore();
        consoleLogSpy.mockRestore();
      }
    });
  });

  describe('Edge Cases', () => {
    test('handles null store gracefully', () => {
      expect(() => {
        render(<InviteMember store={null as any} onClose={mockOnClose} open={true} />);
      }).not.toThrow();
    });

    test('handles undefined onClose gracefully', () => {
      expect(() => {
        render(<InviteMember store={mockStore} onClose={undefined as any} open={true} />);
      }).not.toThrow();
    });
  });
});
