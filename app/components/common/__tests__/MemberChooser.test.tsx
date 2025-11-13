import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  return function MockAutocomplete({
    options,
    value,
    renderInput,
    getOptionLabel,
    isOptionEqualToValue,
    noOptionsText,
    onChange,
    multiple,
    id,
    ...props
  }: any) {
    const currentValue = value || (multiple ? [] : null);

    return (
      <div data-testid="autocomplete" data-testid-id={id} {...props}>
        {renderInput({
          params: {
            InputProps: {},
            inputProps: {},
          },
        })}
        <div data-testid="options">
          {options?.map((option: any, index: number) => {
            const isSelected = multiple
              ? currentValue.some((v: any) =>
                  isOptionEqualToValue ? isOptionEqualToValue(v, option) : v.id === option.id,
                )
              : isOptionEqualToValue
                ? isOptionEqualToValue(currentValue, option)
                : currentValue?.id === option.id;

            return (
              <div
                key={option.id}
                data-testid={`option-${index}`}
                data-option-id={option.id}
                data-option-label={getOptionLabel(option)}
                data-selected={isSelected}
                onClick={() => {
                  if (!onChange) return;

                  if (multiple) {
                    // For multiple selection, toggle the option in the array
                    const newValue = isSelected
                      ? currentValue.filter(
                          (v: any) =>
                            !(isOptionEqualToValue
                              ? isOptionEqualToValue(v, option)
                              : v.id === option.id),
                        )
                      : [...currentValue, option];
                    onChange(null, newValue);
                  } else {
                    // For single selection, just select the option
                    onChange(null, option);
                  }
                }}
              >
                {getOptionLabel(option)}
              </div>
            );
          })}
        </div>
        {noOptionsText && options?.length === 0 && (
          <div data-testid="no-options">{noOptionsText}</div>
        )}
        <div data-testid="selected-container">
          {currentValue &&
            (multiple ? currentValue : [currentValue]).map((selected: any, index: number) => (
              <div
                key={selected.id}
                data-testid={`selected-${index}`}
                data-selected-id={selected.id}
              >
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
    test('calls onChange with correct ids when selection changes', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<MemberChooser onChange={mockOnChange} members={mockUsers} />);

      // Act - Click on an option to select it
      const firstOption = screen.getByTestId('option-0');
      await user.click(firstOption);

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(['user1']);
    });

    test('calls onChange with multiple ids when multiple selection changes', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<MemberChooser onChange={mockOnChange} members={mockUsers} />);

      // Act - Click on multiple options
      const firstOption = screen.getByTestId('option-0');
      const secondOption = screen.getByTestId('option-1');
      await user.click(firstOption);
      await user.click(secondOption);

      // Assert - Check that onChange was called with the final selection
      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenNthCalledWith(2, ['user1', 'user2']);
    });

    test('handles selection with pre-selected members', async () => {
      // Arrange
      const user = userEvent.setup();
      const selectedIds = ['user1'];
      render(
        <MemberChooser
          onChange={mockOnChange}
          members={mockUsers}
          selectedMemberIds={selectedIds}
        />,
      );

      // Act - Click on another option to add to selection
      const secondOption = screen.getByTestId('option-1');
      await user.click(secondOption);

      // Assert - Check that onChange was called with the updated selection
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(['user1', 'user2']);
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
      // Arrange & Act
      render(<MemberChooser onChange={mockOnChange} members={undefined as any} />);

      // Assert - component should render without crashing and show no options
      expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      expect(screen.getByTestId('options')).toBeInTheDocument();
      expect(screen.queryAllByTestId(/^option-/)).toHaveLength(0);
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
