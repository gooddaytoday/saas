// Mock environment variables
const originalEnv = process.env;

// Mock external modules before imports
jest.mock('../../../lib/api/public');
jest.mock('../../../lib/notify');
jest.mock('../../../lib/api/makeQueryString');

// Import mocks after jest.mock calls
import { emailLoginLinkApiMethod } from '../../../lib/api/public';
import notify from '../../../lib/notify';
import { makeQueryString } from '../../../lib/api/makeQueryString';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginButton from '../LoginButton';

describe('LoginButton', () => {
  beforeAll(() => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'development',
      NEXT_PUBLIC_URL_API: 'http://localhost:3001',
      NEXT_PUBLIC_PRODUCTION_URL_API: 'https://api.example.com',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    (makeQueryString as jest.Mock).mockReturnValue('');
    (emailLoginLinkApiMethod as jest.Mock).mockResolvedValue({ success: true });
  });

  describe('Rendering', () => {
    test('renders without errors', () => {
      // Arrange & Act
      render(<LoginButton />);

      // Assert
      expect(screen.getByRole('link', { name: /log in with google/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log in with email/i })).toBeInTheDocument();
      expect(screen.getByText('OR')).toBeInTheDocument();
      expect(screen.getByText(/disabled in this demo/i)).toBeInTheDocument();
    });

    test('renders Google login button with correct href in development', () => {
      // Arrange - default mock returns ''

      // Act
      render(<LoginButton />);

      // Assert
      const googleButton = screen.getByRole('link', { name: /log in with google/i });
      expect(googleButton).toHaveAttribute('href', 'http://localhost:3001/auth/google');
    });

    test('renders Google login button with invitationToken in query string', () => {
      // Arrange
      (makeQueryString as jest.Mock).mockReturnValue('invitationToken=abc123');

      // Act
      render(<LoginButton invitationToken="abc123" />);

      // Assert
      const googleButton = screen.getByRole('link', { name: /log in with google/i });
      expect(googleButton).toHaveAttribute(
        'href',
        'http://localhost:3001/auth/google?invitationToken=abc123',
      );
    });


    test('renders Google login button without query string when makeQueryString returns empty', () => {
      // Arrange - default mock returns ''

      // Act
      render(<LoginButton invitationToken="abc123" />);

      // Assert
      const googleButton = screen.getByRole('link', { name: /log in with google/i });
      expect(googleButton).toHaveAttribute('href', 'http://localhost:3001/auth/google');
    });


    test('renders disabled email form elements', () => {
      // Arrange & Act
      render(<LoginButton />);

      // Assert
      const emailInput = screen.getByRole('textbox', { name: /email address/i });
      const emailButton = screen.getByRole('button', { name: /log in with email/i });

      expect(emailInput).toBeDisabled();
      expect(emailButton).toBeDisabled();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });
  });

  describe('User Interactions', () => {

    test('handles form submission with valid email', async () => {
      // Arrange - default mocks are set up in beforeEach

      // Test the onSubmit method directly since UI is disabled
      const loginComponent = new LoginButton({});

      // Set up component with test state
      (loginComponent as any).state = { email: 'test@example.com' };

      // Act
      const mockEvent = { preventDefault: jest.fn() } as any;
      await (loginComponent as any).onSubmit(mockEvent);

      // Assert
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(emailLoginLinkApiMethod).toHaveBeenCalledWith({
        email: 'test@example.com',
        invitationToken: undefined,
      });
      expect(notify).toHaveBeenCalledWith('SaaS boilerplate emailed you a login link.');
    });

    test('handles form submission with invitationToken', async () => {
      // Arrange - default mocks are set up in beforeEach

      // Act - Test method directly
      const loginComponent = new LoginButton({ invitationToken: 'token123' });
      (loginComponent as any).state = { email: 'test@example.com' };

      const mockEvent = { preventDefault: jest.fn() } as any;
      await (loginComponent as any).onSubmit(mockEvent);

      // Assert
      expect(emailLoginLinkApiMethod).toHaveBeenCalledWith({
        email: 'test@example.com',
        invitationToken: 'token123',
      });
    });

    test('shows error notification when email is empty', async () => {
      // Arrange
      const loginComponent = new LoginButton({});
      (loginComponent as any).state = { email: '' };

      // Act
      const mockEvent = { preventDefault: jest.fn() } as any;
      await (loginComponent as any).onSubmit(mockEvent);

      // Assert
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(emailLoginLinkApiMethod).not.toHaveBeenCalled();
      expect(notify).toHaveBeenCalledWith('Email is required');
    });

    test('handles API error during form submission', async () => {
      // Arrange
      const testError = new Error('API Error');
      (emailLoginLinkApiMethod as jest.Mock).mockRejectedValue(testError);

      const loginComponent = new LoginButton({});
      (loginComponent as any).state = { email: 'test@example.com' };

      // Act
      const mockEvent = { preventDefault: jest.fn() } as any;
      await (loginComponent as any).onSubmit(mockEvent);

      // Assert
      expect(emailLoginLinkApiMethod).toHaveBeenCalledWith({
        email: 'test@example.com',
        invitationToken: undefined,
      });
      expect(notify).toHaveBeenCalledWith(testError);
    });

    test('calls API with correct parameters on successful submission', async () => {
      // Arrange - default mocks are set up in beforeEach

      const loginComponent = new LoginButton({ invitationToken: 'token123' });
      (loginComponent as any).state = { email: 'test@example.com' };

      // Act
      const mockEvent = { preventDefault: jest.fn() } as any;
      await (loginComponent as any).onSubmit(mockEvent);

      // Assert
      expect(emailLoginLinkApiMethod).toHaveBeenCalledWith({
        email: 'test@example.com',
        invitationToken: 'token123',
      });
      expect(notify).toHaveBeenCalledWith('SaaS boilerplate emailed you a login link.');
    });
  });

  describe('Props handling', () => {
    test('passes invitationToken to makeQueryString', () => {
      // Arrange
      const invitationToken = 'test-token-123';

      // Act
      render(<LoginButton invitationToken={invitationToken} />);

      // Assert
      expect(makeQueryString).toHaveBeenCalledWith({ invitationToken });
    });

    test('handles undefined invitationToken', () => {
      // Arrange
      const invitationToken = undefined;

      // Act
      render(<LoginButton invitationToken={invitationToken} />);

      // Assert
      expect(makeQueryString).toHaveBeenCalledWith({ invitationToken: undefined });
    });
  });

  describe('Edge cases', () => {
    test('handles empty invitationToken prop', () => {
      // Arrange
      (makeQueryString as jest.Mock).mockReturnValue('');

      // Act
      render(<LoginButton invitationToken="" />);

      // Assert
      const googleButton = screen.getByRole('link', { name: /log in with google/i });
      expect(googleButton).toHaveAttribute('href', 'http://localhost:3001/auth/google');
    });

    test('handles null email state gracefully', async () => {
      // Arrange
      const loginComponent = new LoginButton({});
      (loginComponent as any).state = { email: null };

      // Act
      const mockEvent = { preventDefault: jest.fn() } as any;
      await (loginComponent as any).onSubmit(mockEvent);

      // Assert
      expect(notify).toHaveBeenCalledWith('Email is required');
      expect(emailLoginLinkApiMethod).not.toHaveBeenCalled();
    });

    test('handles undefined email state gracefully', async () => {
      // Arrange
      const loginComponent = new LoginButton({});
      (loginComponent as any).state = { email: undefined };

      // Act
      const mockEvent = { preventDefault: jest.fn() } as any;
      await (loginComponent as any).onSubmit(mockEvent);

      // Assert
      expect(notify).toHaveBeenCalledWith('Email is required');
      expect(emailLoginLinkApiMethod).not.toHaveBeenCalled();
    });

    test('handles whitespace-only email as valid input', async () => {
      // Arrange - JavaScript considers whitespace string as truthy
      const loginComponent = new LoginButton({});
      (loginComponent as any).state = { email: '   ' };

      // Act
      const mockEvent = { preventDefault: jest.fn() } as any;
      await (loginComponent as any).onSubmit(mockEvent);

      // Assert - whitespace is considered valid input, so API should be called
      expect(emailLoginLinkApiMethod).toHaveBeenCalledWith({
        email: '   ',
        invitationToken: undefined,
      });
      expect(notify).toHaveBeenCalledWith('SaaS boilerplate emailed you a login link.');
    });

    test('handles makeQueryString returning null', () => {
      // Arrange
      (makeQueryString as jest.Mock).mockReturnValue(null);

      // Act
      render(<LoginButton invitationToken="test" />);

      // Assert
      const googleButton = screen.getByRole('link', { name: /log in with google/i });
      expect(googleButton).toHaveAttribute('href', 'http://localhost:3001/auth/google');
    });

    test('handles makeQueryString returning undefined', () => {
      // Arrange
      (makeQueryString as jest.Mock).mockReturnValue(undefined);

      // Act
      render(<LoginButton invitationToken="test" />);

      // Assert
      const googleButton = screen.getByRole('link', { name: /log in with google/i });
      expect(googleButton).toHaveAttribute('href', 'http://localhost:3001/auth/google');
    });
  });
});
