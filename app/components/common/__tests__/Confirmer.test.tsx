import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Confirmer, { openConfirmDialogExternal } from '../Confirmer';

// Mock Material-UI Dialog components to avoid styling issues in tests
jest.mock('@mui/material/Dialog', () => {
  return function MockDialog({ open, children, ...props }: any) {
    return (
      <div data-testid="dialog" data-open={open} {...props}>
        {open && children}
      </div>
    );
  };
});

jest.mock('@mui/material/DialogTitle', () => {
  return function MockDialogTitle({ children, ...props }: any) {
    return (
      <div data-testid="dialog-title" {...props}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/DialogContent', () => {
  return function MockDialogContent({ children, ...props }: any) {
    return (
      <div data-testid="dialog-content" {...props}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/DialogContentText', () => {
  return function MockDialogContentText({ children, ...props }: any) {
    return (
      <div data-testid="dialog-content-text" {...props}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/DialogActions', () => {
  return function MockDialogActions({ children, ...props }: any) {
    return (
      <div data-testid="dialog-actions" {...props}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Button', () => {
  return function MockButton({ children, onClick, variant, color, autoFocus, ...props }: any) {
    return (
      <button
        onClick={onClick}
        data-variant={variant}
        data-color={color}
        data-autofocus={autoFocus}
        {...props}
      >
        {children}
      </button>
    );
  };
});

describe('Confirmer', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let confirmerRef: React.RefObject<any>;

  beforeEach(() => {
    user = userEvent.setup();
    confirmerRef = React.createRef();
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    test('renders without crashing', () => {
      // Arrange & Act
      render(<Confirmer ref={confirmerRef} />);

      // Assert
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    test('dialog is closed by default', () => {
      // Arrange & Act
      render(<Confirmer ref={confirmerRef} />);

      // Assert
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
    });

    test('does not render dialog content when closed', () => {
      // Arrange & Act
      render(<Confirmer ref={confirmerRef} />);

      // Assert - dialog content should not be rendered when closed
      expect(screen.queryByTestId('dialog-title')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dialog-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dialog-actions')).not.toBeInTheDocument();
    });
  });

  describe('Opening Dialog', () => {
    test('opens dialog with custom title and message', () => {
      // Arrange
      render(<Confirmer ref={confirmerRef} />);

      // Act - simulate opening dialog
      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: 'Custom Title',
          message: 'Custom Message',
          onAnswer: jest.fn(),
        });
      });

      // Assert
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true');
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Custom Title');
      expect(screen.getByTestId('dialog-content-text')).toHaveTextContent('Custom Message');
    });

    test('renders default title when no title provided', () => {
      // Arrange
      render(<Confirmer ref={confirmerRef} />);

      // Act
      act(() => {
        confirmerRef.current.openConfirmDialog({
          message: 'Test Message',
          onAnswer: jest.fn(),
        });
      });

      // Assert
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Are you sure?');
    });

    test('renders empty message when no message provided', () => {
      // Arrange
      render(<Confirmer ref={confirmerRef} />);

      // Act
      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: 'Test Title',
          onAnswer: jest.fn(),
        });
      });

      // Assert
      expect(screen.getByTestId('dialog-content-text')).toHaveTextContent('');
    });
  });

  describe('Dialog Actions', () => {
    test('renders Cancel and OK buttons when dialog is open', () => {
      // Arrange
      render(<Confirmer ref={confirmerRef} />);

      // Act
      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: 'Test',
          message: 'Message',
          onAnswer: jest.fn(),
        });
      });

      // Assert
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
    });

    test('Cancel button has correct styling attributes', () => {
      // Arrange
      render(<Confirmer ref={confirmerRef} />);

      // Act
      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: 'Test',
          message: 'Message',
          onAnswer: jest.fn(),
        });
      });

      // Assert
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toHaveAttribute('data-variant', 'contained');
      expect(cancelButton).toHaveAttribute('data-color', 'primary');
      expect(cancelButton).toHaveAttribute('data-autofocus');
    });

    test('OK button has correct styling attributes', () => {
      // Arrange
      render(<Confirmer ref={confirmerRef} />);

      // Act
      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: 'Test',
          message: 'Message',
          onAnswer: jest.fn(),
        });
      });

      // Assert
      const okButton = screen.getByRole('button', { name: /ok/i });
      expect(okButton).toHaveAttribute('data-variant', 'contained');
      expect(okButton).toHaveAttribute('data-color', 'secondary');
    });
  });

  describe('User Interactions', () => {
    test('clicking Cancel button calls onAnswer with false and closes dialog', async () => {
      // Arrange
      const mockOnAnswer = jest.fn();
      render(<Confirmer ref={confirmerRef} />);

      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: 'Test',
          message: 'Message',
          onAnswer: mockOnAnswer,
        });
      });

      // Act
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Assert
      expect(mockOnAnswer).toHaveBeenCalledTimes(1);
      expect(mockOnAnswer).toHaveBeenCalledWith(false);
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
    });

    test('clicking OK button calls onAnswer with true and closes dialog', async () => {
      // Arrange
      const mockOnAnswer = jest.fn();
      render(<Confirmer ref={confirmerRef} />);

      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: 'Test',
          message: 'Message',
          onAnswer: mockOnAnswer,
        });
      });

      // Act
      await user.click(screen.getByRole('button', { name: /ok/i }));

      // Assert
      expect(mockOnAnswer).toHaveBeenCalledTimes(1);
      expect(mockOnAnswer).toHaveBeenCalledWith(true);
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
    });

    test('handles multiple open/close cycles correctly', async () => {
      // Arrange
      const mockOnAnswer1 = jest.fn();
      const mockOnAnswer2 = jest.fn();
      render(<Confirmer ref={confirmerRef} />);

      // Act - First dialog
      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: 'First Dialog',
          message: 'First Message',
          onAnswer: mockOnAnswer1,
        });
      });

      // Assert first dialog
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('First Dialog');
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true');

      // Act - Cancel first dialog
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Assert first dialog closed
      expect(mockOnAnswer1).toHaveBeenCalledWith(false);
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');

      // Act - Second dialog
      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: 'Second Dialog',
          message: 'Second Message',
          onAnswer: mockOnAnswer2,
        });
      });

      // Assert second dialog
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Second Dialog');
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true');

      // Act - Confirm second dialog
      await user.click(screen.getByRole('button', { name: /ok/i }));

      // Assert second dialog closed
      expect(mockOnAnswer2).toHaveBeenCalledWith(true);
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
    });
  });

  describe('External API', () => {
    test('openConfirmDialogExternal is exported and functional', () => {
      // Arrange
      render(<Confirmer ref={confirmerRef} />);

      // Assert that external API exists
      expect(typeof openConfirmDialogExternal).toBe('function');

      // Act - use external API
      act(() => {
        openConfirmDialogExternal({
          title: 'External Title',
          message: 'External Message',
          onAnswer: jest.fn(),
        });
      });

      // Assert dialog opened
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true');
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('External Title');
      expect(screen.getByTestId('dialog-content-text')).toHaveTextContent('External Message');
    });

    test('external API works with callback', async () => {
      // Arrange
      const mockCallback = jest.fn();
      render(<Confirmer ref={confirmerRef} />);

      // Act - open via external API and confirm
      act(() => {
        openConfirmDialogExternal({
          title: 'Test',
          message: 'Message',
          onAnswer: mockCallback,
        });
      });

      await user.click(screen.getByRole('button', { name: /ok/i }));

      // Assert
      expect(mockCallback).toHaveBeenCalledWith(true);
    });
  });

  describe('Edge Cases', () => {
    test('handles null callback gracefully', async () => {
      // Arrange
      render(<Confirmer ref={confirmerRef} />);

      // Act - open with null callback (shouldn't crash)
      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: 'Test',
          message: 'Message',
          onAnswer: null,
        });
      });

      // Should open without crashing
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true');

      // Act - click cancel (shouldn't crash with null callback)
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Assert - dialog should close
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
    });

    test('handles undefined callback gracefully', async () => {
      // Arrange
      render(<Confirmer ref={confirmerRef} />);

      // Act - open with undefined callback
      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: 'Test',
          message: 'Message',
          onAnswer: undefined,
        });
      });

      // Should open without crashing
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true');

      // Act - click OK
      await user.click(screen.getByRole('button', { name: /ok/i }));

      // Assert - dialog should close
      expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
    });

    test('handles empty strings for title and message', () => {
      // Arrange
      render(<Confirmer ref={confirmerRef} />);

      // Act
      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: '',
          message: '',
          onAnswer: jest.fn(),
        });
      });

      // Assert
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('');
      expect(screen.getByTestId('dialog-content-text')).toHaveTextContent('');
    });
  });

  describe('Accessibility', () => {
    test('dialog has proper ARIA attributes', () => {
      // Arrange
      render(<Confirmer ref={confirmerRef} />);

      // Act
      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: 'Test Title',
          message: 'Test Message',
          onAnswer: jest.fn(),
        });
      });

      // Assert
      const dialog = screen.getByTestId('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'alert-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'alert-dialog-description');
    });

    test('dialog content has proper ARIA attributes', () => {
      // Arrange
      render(<Confirmer ref={confirmerRef} />);

      // Act
      act(() => {
        confirmerRef.current.openConfirmDialog({
          title: 'Test Title',
          message: 'Test Message',
          onAnswer: jest.fn(),
        });
      });

      // Assert
      expect(screen.getByTestId('dialog-title')).toHaveAttribute('id', 'alert-dialog-title');
      expect(screen.getByTestId('dialog-content-text')).toHaveAttribute(
        'id',
        'alert-dialog-description',
      );
    });
  });
});
