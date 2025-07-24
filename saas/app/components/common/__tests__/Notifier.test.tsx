import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Notifier, { openSnackbarExternal } from '../Notifier';

// Mock Material-UI Snackbar
jest.mock('@mui/material/Snackbar', () => {
  return function MockSnackbar({
    open,
    message,
    onClose,
    autoHideDuration,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    anchorOrigin,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ContentProps,
    ...props
  }: any) {
    return (
      <div
        data-testid="snackbar"
        data-open={open}
        data-auto-hide-duration={autoHideDuration}
        {...props}
      >
        {open && (
          <>
            {message}
            <button data-testid="close-button" onClick={onClose}>
              Close
            </button>
          </>
        )}
      </div>
    );
  };
});

describe('Notifier', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders without errors', () => {
    render(<Notifier />);
    const snackbar = screen.getByTestId('snackbar');
    expect(snackbar).toBeInTheDocument();
  });

  test('initially the snackbar is closed', () => {
    render(<Notifier />);
    const snackbar = screen.getByTestId('snackbar');
    expect(snackbar).toHaveAttribute('data-open', 'false');
  });

  test('opens the snackbar with a message via the external function', async () => {
    render(<Notifier />);

    const testMessage = 'Test message';

    // Use the external function to open the snackbar
    act(() => {
      openSnackbarExternal({ message: testMessage });
    });

    await waitFor(() => {
      const snackbar = screen.getByTestId('snackbar');
      expect(snackbar).toHaveAttribute('data-open', 'true');
    });

    // Check that the message is displayed
    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  test('closes the snackbar when clicking the close button', async () => {
    render(<Notifier />);

    // Open snackbar
    act(() => {
      openSnackbarExternal({ message: 'Test' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('snackbar')).toHaveAttribute('data-open', 'true');
    });

    // Click the close button
    const closeButton = screen.getByTestId('close-button');
    act(() => {
      fireEvent.click(closeButton);
    });

    await waitFor(() => {
      const snackbar = screen.getByTestId('snackbar');
      expect(snackbar).toHaveAttribute('data-open', 'false');
    });
  });

  test('renders HTML content in the message', async () => {
    render(<Notifier />);

    const htmlMessage = '<strong>Bold text</strong>';

    act(() => {
      openSnackbarExternal({ message: htmlMessage });
    });

    await waitFor(() => {
      // Find the element by id 'snackbar-message-id'
      const messageElement = document.getElementById('snackbar-message-id');
      expect(messageElement).toBeInTheDocument();
      expect(messageElement?.innerHTML).toBe(htmlMessage);
    });
  });

  test('sets the correct props for Material-UI Snackbar', () => {
    render(<Notifier />);

    const snackbar = screen.getByTestId('snackbar');

    // Check that the correct props are passed
    expect(snackbar).toHaveAttribute('data-auto-hide-duration', '5000');
  });
});
