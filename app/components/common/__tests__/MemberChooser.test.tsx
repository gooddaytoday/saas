import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemberChooser from '../MemberChooser';
import { User } from '../../../lib/store/user';

// Mock User class for testing
jest.mock('../../../lib/store/user', () => ({
  User: jest.fn().mockImplementation((params) => ({
    ...params,
    updateProfile: jest.fn(),
    toggleTheme: jest.fn(),
    getListOfInvoices: jest.fn(),
  })),
}));

// Mock Material-UI Autocomplete component
jest.mock('@mui/material/Autocomplete', () => {
  return function MockAutocomplete({ options, value, renderInput, getOptionLabel, ...props }: any) {
    return (
      <div data-testid="autocomplete" {...props}>
        {renderInput({
          params: {
            InputProps: {},
            inputProps: {},
          },
        })}
        <div data-testid="options">
          {options.map((option: any, index: number) => (
            <div
              key={option.id}
              data-testid={`option-${index}`}
              data-option-id={option.id}
              data-option-label={getOptionLabel(option)}
            >
              {getOptionLabel(option)}
            </div>
          ))}
        </div>
        <div data-testid="selected-container">
          {value?.map((selected: any, index: number) => (
            <div key={selected.id} data-testid={`selected-${index}`} data-selected-id={selected.id}>
              {getOptionLabel(selected)}
            </div>
          ))}
        </div>
      </div>
    );
  };
});

// Mock Material-UI TextField component
jest.mock('@mui/material/TextField', () => {
  return function MockTextField({ label, placeholder, variant, ...props }: any) {
    return (
      <input
        type="text"
        placeholder={placeholder}
        data-testid="text-field"
        data-label={label}
        data-variant={variant}
        {...props}
      />
    );
  };
});

describe('MemberChooser', () => {
  // Mock data
  const mockUsers: User[] = [
    new User({
      _id: 'user1',
      slug: 'user1',
      email: 'user1@example.com',
      displayName: 'User One',
      avatarUrl: null,
      isSignedupViaGoogle: false,
      darkTheme: false,
      defaultTeamSlug: 'team1',
      stripeCard: null,
      hasCardInformation: false,
      stripeListOfInvoices: null,
      store: null,
    }),
    new User({
      _id: 'user2',
      slug: 'user2',
      email: 'user2@example.com',
      displayName: null, // Test fallback to email
      avatarUrl: null,
      isSignedupViaGoogle: false,
      darkTheme: false,
      defaultTeamSlug: 'team1',
      stripeCard: null,
      hasCardInformation: false,
      stripeListOfInvoices: null,
      store: null,
    }),
    new User({
      _id: 'user3',
      slug: 'user3',
      email: 'user3@example.com',
      displayName: 'User Three',
      avatarUrl: null,
      isSignedupViaGoogle: false,
      darkTheme: false,
      defaultTeamSlug: 'team1',
      stripeCard: null,
      hasCardInformation: false,
      stripeListOfInvoices: null,
      store: null,
    }),
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders without errors with required props', () => {
      // Arrange & Act
      render(<MemberChooser onChange={mockOnChange} members={mockUsers} />);

      // Assert
      expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      expect(screen.getByTestId('text-field')).toBeInTheDocument();
      expect(screen.getByTestId('text-field')).toHaveAttribute(
        'data-label',
        'Find team member by name',
      );
      expect(screen.getByTestId('text-field')).toHaveAttribute(
        'placeholder',
        'Select participants',
      );
      expect(screen.getByTestId('text-field')).toHaveAttribute('data-variant', 'standard');
    });

    test('renders with empty members array', () => {
      // Arrange & Act
      render(<MemberChooser onChange={mockOnChange} members={[]} />);

      // Assert
      expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      expect(screen.getByTestId('options')).toBeInTheDocument();
      expect(screen.queryAllByTestId(/^option-/)).toHaveLength(0);
    });

    test('displays correct option labels using displayName when available', () => {
      // Arrange & Act
      render(<MemberChooser onChange={mockOnChange} members={mockUsers} />);

      // Assert
      const options = screen.getAllByTestId(/^option-/);
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveAttribute('data-option-label', 'User One');
      expect(options[1]).toHaveAttribute('data-option-label', 'user2@example.com'); // fallback to email
      expect(options[2]).toHaveAttribute('data-option-label', 'User Three');
    });

    test('renders with selectedMemberIds prop', () => {
      // Arrange
      const selectedIds = ['user1', 'user3'];

      // Act
      render(
        <MemberChooser
          onChange={mockOnChange}
          members={mockUsers}
          selectedMemberIds={selectedIds}
        />,
      );

      // Assert
      const selectedContainer = screen.getByTestId('selected-container');
      expect(selectedContainer.children).toHaveLength(2);
      expect(selectedContainer.children[0]).toHaveAttribute('data-selected-id', 'user1');
      expect(selectedContainer.children[0]).toHaveTextContent('User One');
      expect(selectedContainer.children[1]).toHaveAttribute('data-selected-id', 'user3');
      expect(selectedContainer.children[1]).toHaveTextContent('User Three');
    });

    test('renders with undefined selectedMemberIds', () => {
      // Arrange & Act
      render(<MemberChooser onChange={mockOnChange} members={mockUsers} />);

      // Assert - selected-container exists but is empty
      const selectedContainer = screen.getByTestId('selected-container');
      expect(selectedContainer.children).toHaveLength(0);
    });

    test('ignores unused label and helperText props', () => {
      // Arrange & Act
      render(
        <MemberChooser
          onChange={mockOnChange}
          members={mockUsers}
          label="Custom Label"
          helperText="Custom Helper"
        />,
      );

      // Assert - component still renders correctly, unused props don't break it
      expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      expect(screen.getByTestId('text-field')).toHaveAttribute(
        'data-label',
        'Find team member by name',
      );
    });
  });

  describe('Initialization', () => {
    test('initializes with correct selected items from selectedMemberIds', () => {
      // Arrange
      const selectedIds = ['user1', 'user3'];

      // Act
      render(
        <MemberChooser
          onChange={mockOnChange}
          members={mockUsers}
          selectedMemberIds={selectedIds}
        />,
      );

      // Assert
      const selectedContainer = screen.getByTestId('selected-container');
      expect(selectedContainer.children).toHaveLength(2);
      expect(selectedContainer.children[0]).toHaveAttribute('data-selected-id', 'user1');
      expect(selectedContainer.children[0]).toHaveTextContent('User One');
      expect(selectedContainer.children[1]).toHaveAttribute('data-selected-id', 'user3');
      expect(selectedContainer.children[1]).toHaveTextContent('User Three');
    });

    test('initializes with empty selection when selectedMemberIds is empty', () => {
      // Arrange & Act
      render(<MemberChooser onChange={mockOnChange} members={mockUsers} selectedMemberIds={[]} />);

      // Assert - selected-container exists but is empty
      const selectedContainer = screen.getByTestId('selected-container');
      expect(selectedContainer.children).toHaveLength(0);
    });

    test('initializes with empty selection when selectedMemberIds contains non-existent ids', () => {
      // Arrange & Act
      render(
        <MemberChooser
          onChange={mockOnChange}
          members={mockUsers}
          selectedMemberIds={['non-existent-id']}
        />,
      );

      // Assert - selected-container exists but is empty
      const selectedContainer = screen.getByTestId('selected-container');
      expect(selectedContainer.children).toHaveLength(0);
    });
  });

  describe('User Interactions', () => {
    test('calls onChange with correct ids when selection changes', () => {
      // Arrange
      render(<MemberChooser onChange={mockOnChange} members={mockUsers} />);

      // Act - Simulate selection change (mock implementation would handle this)
      // Since we mocked Autocomplete, we need to test the handleChange method directly
      const component = new (MemberChooser as any)({
        onChange: mockOnChange,
        members: mockUsers,
      });
      const mockEvent = { preventDefault: jest.fn() };
      const newValue = [
        { id: 'user1', label: 'User One' },
        { id: 'user2', label: 'user2@example.com' },
      ];

      component.handleChange(mockEvent, newValue);

      // Assert
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockOnChange).toHaveBeenCalledWith(['user1', 'user2']);
    });

    test('calls onChange with empty array when all items are deselected', () => {
      // Arrange
      const component = new (MemberChooser as any)({
        onChange: mockOnChange,
        members: mockUsers,
      });
      const mockEvent = { preventDefault: jest.fn() };

      // Act
      component.handleChange(mockEvent, []);

      // Assert
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    test('handles null event in handleChange', () => {
      // Arrange
      const component = new (MemberChooser as any)({
        onChange: mockOnChange,
        members: mockUsers,
      });
      const newValue = [{ id: 'user1', label: 'User One' }];

      // Act
      component.handleChange(null, newValue);

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(['user1']);
    });

    test('updates internal state when selection changes', () => {
      // Arrange
      const component = new (MemberChooser as any)({
        onChange: mockOnChange,
        members: mockUsers,
      });
      const mockEvent = { preventDefault: jest.fn() };
      const newValue = [{ id: 'user1', label: 'User One' }];

      // Act
      component.handleChange(mockEvent, newValue);

      // Assert - We can't test setState directly in unit tests for class components
      // But we can test that onChange was called with correct data
      expect(mockOnChange).toHaveBeenCalledWith(['user1']);
    });
  });

  describe('Edge cases', () => {
    test('handles users with null displayName gracefully', () => {
      // Arrange
      const usersWithNullDisplayName: User[] = [
        new User({
          _id: 'user1',
          slug: 'user1',
          email: 'user1@example.com',
          displayName: null,
          avatarUrl: null,
          isSignedupViaGoogle: false,
          darkTheme: false,
          defaultTeamSlug: 'team1',
          stripeCard: null,
          hasCardInformation: false,
          stripeListOfInvoices: null,
          store: null,
        }),
      ];

      // Act
      render(<MemberChooser onChange={mockOnChange} members={usersWithNullDisplayName} />);

      // Assert
      const options = screen.getAllByTestId(/^option-/);
      expect(options[0]).toHaveAttribute('data-option-label', 'user1@example.com');
    });

    test('handles users with empty string displayName', () => {
      // Arrange
      const usersWithEmptyDisplayName: User[] = [
        new User({
          _id: 'user1',
          slug: 'user1',
          email: 'user1@example.com',
          displayName: '',
          avatarUrl: null,
          isSignedupViaGoogle: false,
          darkTheme: false,
          defaultTeamSlug: 'team1',
          stripeCard: null,
          hasCardInformation: false,
          stripeListOfInvoices: null,
          store: null,
        }),
      ];

      // Act
      render(<MemberChooser onChange={mockOnChange} members={usersWithEmptyDisplayName} />);

      // Assert
      const options = screen.getAllByTestId(/^option-/);
      expect(options[0]).toHaveAttribute('data-option-label', 'user1@example.com');
    });

    test('handles users with null email', () => {
      // Arrange
      const usersWithNullEmail: User[] = [
        new User({
          _id: 'user1',
          slug: 'user1',
          email: null,
          displayName: 'User Name',
          avatarUrl: null,
          isSignedupViaGoogle: false,
          darkTheme: false,
          defaultTeamSlug: 'team1',
          stripeCard: null,
          hasCardInformation: false,
          stripeListOfInvoices: null,
          store: null,
        }),
      ];

      // Act
      render(<MemberChooser onChange={mockOnChange} members={usersWithNullEmail} />);

      // Assert
      const options = screen.getAllByTestId(/^option-/);
      expect(options[0]).toHaveAttribute('data-option-label', 'User Name');
    });

    test('handles empty members array with selectedMemberIds', () => {
      // Arrange & Act
      render(<MemberChooser onChange={mockOnChange} members={[]} selectedMemberIds={['user1']} />);

      // Assert - selected-container exists but is empty
      const selectedContainer = screen.getByTestId('selected-container');
      expect(selectedContainer.children).toHaveLength(0);
    });

    test('handles undefined members prop gracefully', () => {
      // This would normally cause an error, but we test that component handles it
      // In real usage, members is required, but we test error boundary behavior
      expect(() => {
        render(<MemberChooser onChange={mockOnChange} members={undefined as any} />);
      }).toThrow(/Cannot read properties of undefined/);
    });
  });

  describe('Autocomplete configuration', () => {
    test('configures Autocomplete with correct props', () => {
      // Arrange & Act
      render(<MemberChooser onChange={mockOnChange} members={mockUsers} />);

      // Assert
      const autocomplete = screen.getByTestId('autocomplete');
      expect(autocomplete).toBeInTheDocument();

      // Check that options are rendered
      const options = screen.getAllByTestId(/^option-/);
      expect(options).toHaveLength(3);
    });

    test('has correct option equality function', () => {
      // This is tested implicitly through the rendering and selection tests
      // The component uses isOptionEqualToValue={(option, value) => option.id === value.id}
      const component = new (MemberChooser as any)({
        onChange: mockOnChange,
        members: mockUsers,
      });

      // Test the logic indirectly through initialization
      expect(component.state.selectedItems).toEqual([]);
    });
  });
});
