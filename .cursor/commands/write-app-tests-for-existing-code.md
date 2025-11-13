# Writing unit tests for existing Frontend app components

Write unit tests for already existing and working modules using the rules from [app-testing.mdc](../rules/app-testing.mdc).

## Test writing process

### Step 1: Analyze existing module

1. **Read the module source code:**
   - Study the complete source file of the module
   - Understand the architecture and structure of the component/function
   - Define all public APIs (props, parameters, return values)

2. **Determine module type and create test structure:**
   - React component (`.tsx`) → tests in `__tests__/*.test.tsx`
   - Utility/function (`.ts`) → tests in `__tests__/*.test.ts`
   - Create `__tests__` folder next to the module (if it doesn't exist)
   - File name: `ModuleName.test.tsx` or `ModuleName.test.ts`

3. **Analyze functionality:**
   - Define all component states (if it's a React component)
   - Find all methods and functions
   - Identify conditional branches (if/else, switch, guard clauses)
   - Define all possible usage scenarios
   - Find dependencies (API calls, external libraries, MobX stores, contexts)

4. **Determine edge cases and boundary conditions:**
   - Empty/null values
   - Minimum/maximum values
   - Unexpected data types
   - Error states

### Step 2: Test file structure

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import MyComponent from '../MyComponent';

// Mock external dependencies (if needed)
jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
}));

describe('MyComponent', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  // Group tests by functionality
  describe('Rendering', () => {
    test('renders without errors', () => {
      // Arrange & Act
      render(<MyComponent />);

      // Assert
      expect(screen.getByRole('...')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('handles click events', async () => {
      // Arrange
      const handleClick = jest.fn();
      render(<MyComponent onClick={handleClick} />);

      // Act
      await userEvent.click(screen.getByRole('button'));

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Step 3: Writing tests for existing code

1. **Start with basic rendering:**
   - Write a test that the component renders without errors with minimal props
   - Check for the presence of main UI elements

2. **Test main usage scenarios:**
   - Happy path - main usage flow
   - All supported prop configurations
   - All user interactions

3. **Cover edge cases:**
   - Empty values, null, undefined
   - Boundary values (min/max)
   - Error states and their handling

4. **Test all conditional branches:**
   - Each if/else block
   - All switch case variants
   - Guard clauses and validations

5. **Check asynchronous operations:**
   - API calls and their handling
   - Loading states
   - Error handling

### Step 4: Mandatory test requirements

#### ✅ DO (Mandatory):

1. **Use AAA pattern (Arrange → Act → Assert):**
   ```typescript
   test('example', () => {
     // Arrange - data preparation
     const props = { title: 'Test' };

     // Act - perform action
     render(<MyComponent {...props} />);

     // Assert - check result
     expect(screen.getByText('Test')).toBeInTheDocument();
   });
   ```

2. **Use correct queries (priority):**
   - `screen.getByRole()` - most preferred
   - `screen.getByLabelText()` - for forms
   - `screen.getByPlaceholderText()` - for input fields
   - `screen.getByText()` - for text content
   - `screen.getByTestId()` - only as last resort

3. **Cover all conditional branches:**
   ```typescript
   // ✅ DO: cover all variants
   it.each([
     { variant: 'success' },
     { variant: 'error' },
     { variant: 'warning' },
     { variant: 'info' }
   ])('renders $variant message correctly', ({ variant }) => {
     render(<Notifier message={{ open: true, message: 'Test', variant }} />);
     expect(screen.getByText('Test')).toBeInTheDocument();
   });
   ```

4. **Test behavior, not implementation:**
   ```typescript
   // ✅ DO: test what user sees
   test('shows error message when validation fails', () => {
     render(<FormComponent />);
     fireEvent.submit(screen.getByRole('form'));
     expect(screen.getByText(/invalid/i)).toBeInTheDocument();
   });

   // ❌ DON'T: don't test internal state
   // expect(component.state.error).toBe(true);
   ```

5. **Use `userEvent` instead of `fireEvent` for user actions:**
   ```typescript
   // ✅ DO
   const user = userEvent.setup();
   await user.type(input, 'test');
   await user.click(button);

   // ❌ DON'T (only for simple cases)
   fireEvent.click(button);
   ```

6. **Cover edge cases:**
   - Empty values
   - Null/undefined
   - Minimum/maximum values
   - Boundary conditions

7. **Use `waitFor` for asynchronous operations:**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Loaded')).toBeInTheDocument();
   });
   ```

#### ❌ DON'T (Forbidden):

1. **Don't use `querySelector` or `getElementById`:**
   ```typescript
   // ❌ DON'T
   container.querySelector('.button');

   // ✅ DO
   screen.getByRole('button');
   ```

2. **Don't test implementation:**
   ```typescript
   // ❌ DON'T
   expect(component.state.isOpen).toBe(true);

   // ✅ DO
   expect(screen.getByText('Content')).toBeVisible();
   ```

3. **Don't write unstable tests with time dependencies:**
   ```typescript
   // ❌ DON'T
   setTimeout(() => {
     expect(...).toBe(...);
   }, 1000);

   // ✅ DO
   jest.useFakeTimers();
   // or
   await waitFor(() => { ... });
   ```

4. **Don't hide logic in `beforeEach`:**
   ```typescript
   // ❌ DON'T: complex logic in beforeEach
   beforeEach(() => {
     // 50 lines of data preparation
   });

   // ✅ DO: explicit preparation in each test
   test('example', () => {
     const data = prepareTestData();
     render(<Component data={data} />);
   });
   ```

5. **Don't write one test for multiple scenarios:**
   ```typescript
   // ❌ DON'T
   test('handles all cases', () => {
     // check case 1
     // check case 2
     // check case 3
   });

   // ✅ DO: separate into individual tests
   test('handles case 1', () => { ... });
   test('handles case 2', () => { ... });
   test('handles case 3', () => { ... });
   ```

### Step 5: Mocks and dependencies

#### Mocking Material-UI components:
```typescript
jest.mock('@mui/material/Snackbar', () => {
  return function MockSnackbar({ open, message, onClose, ...props }: any) {
    return (
      <div data-testid="snackbar" data-open={open} {...props}>
        {open && (
          <>
            {message}
            <button data-testid="close-button" onClick={onClose}>Close</button>
          </>
        )}
      </div>
    );
  };
});
```

#### Mocking Next.js Router:
```typescript
jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
}));
```

#### Mocking API calls:
```typescript
const mockApiCall = jest.fn().mockResolvedValue({ success: true });
jest.mock('../api', () => ({
  fetchData: mockApiCall,
}));
```

#### Mocking MobX stores:
```typescript
const mockStore = {
  user: { id: '1', name: 'Test User' },
  isAuthenticated: true,
};
jest.mock('../../lib/store', () => ({
  useStore: () => mockStore,
}));
```

### Step 6: Code coverage ≥ 80%

**Required metrics:**
- Lines: ≥ 80%
- Functions: ≥ 80%
- Branches: ≥ 80%
- Statements: ≥ 80%

**How to achieve coverage:**

1. **Cover all conditional branches:**
   ```typescript
   // If there is if/else - test both cases
   test('handles true condition', () => { ... });
   test('handles false condition', () => { ... });
   ```

2. **Cover all prop variants:**
   ```typescript
   it.each([
     { variant: 'primary' },
     { variant: 'secondary' },
     { variant: 'danger' }
   ])('renders with $variant variant', ({ variant }) => {
     render(<Button variant={variant} />);
     expect(screen.getByRole('button')).toHaveClass(variant);
   });
   ```

3. **Cover error cases:**
   ```typescript
   test('shows error when API call fails', async () => {
     const mockError = jest.fn().mockRejectedValue(new Error('API Error'));
     render(<Component onError={mockError} />);
     // check error handling
   });
   ```

4. **Check coverage:**
   ```bash
   # Run tests with coverage for specific file
   yarn test MyComponent.test.tsx --coverage

   # Check full coverage before closing task
   yarn test:coverage
   ```

### Step 7: Examples from codebase

**React component test example:**
See [Notifier.test.tsx](../../app/components/common/__tests__/Notifier.test.tsx)

**Utility test example:**
See [isMobile.test.ts](../../app/lib/__tests__/isMobile.test.ts)

### Step 8: Running tests

**During development (fast):**
```bash
# Run only tests for the module being developed
yarn test MyComponent.test.tsx

# Run with verbose output
yarn test MyComponent.test.tsx --verbose

# Stop on first error
yarn test MyComponent.test.tsx --bail
```

**Before commit (full check):**
```bash
# Run all tests
yarn test

# Check coverage (all metrics ≥ 80%)
yarn test:coverage
```

### Step 9: Checklist before completion

- [ ] All tests pass (`yarn test`) - check that all the tests are passing, it's very important.
- [ ] Coverage ≥ 80% for all metrics (`yarn test:coverage`) - check that the coverage of the new/changed test's code is at least 80%.
- [ ] All conditional branches covered by tests
- [ ] Edge cases covered by tests
- [ ] Correct queries used (getByRole, getByText, etc.)
- [ ] Tests follow AAA pattern
- [ ] Tests check behavior, not implementation
- [ ] Mocks configured correctly
- [ ] No unstable tests (time dependencies without mocks)
- [ ] Tests are independent of each other

### Step 10: File structure

```
app/
  components/
    common/
      MyComponent.tsx
      __tests__/
        MyComponent.test.tsx  ← создай здесь
  lib/
    myUtil.ts
    __tests__/
      myUtil.test.ts  ← создай здесь
```

## Additional resources

- **Testing rules**: [app-testing.mdc](../rules/app-testing.mdc)
- **Testing documentation**: [TESTING.md](../../app/TESTING.md)
- **Test examples**:
  - [Notifier.test.tsx](../../app/components/common/__tests__/Notifier.test.tsx)
  - [isMobile.test.ts](../../app/lib/__tests__/isMobile.test.ts)
- **Jest configuration**: [jest.config.js](../../app/jest.config.js)
- **Jest setup**: [jest.setup.js](../../app/jest.setup.js)

## Important reminders

1. **Components are already working** - tests are needed to ensure quality and prevent regressions
2. **Analyze existing behavior** - tests should reflect the real behavior of components
3. **Never commit code without passing tests and coverage ≥ 80%**
4. **Before closing the task, make sure to run `yarn test:coverage`**
5. **If coverage < 80% - add tests or refactoring, don't close the task**
6. **Test what the user sees, not the internal implementation**
7. **Cover all existing usage scenarios** - component may have more functionality than it seems at first glance

## Features of testing existing components

- **Reverse engineering**: First study how the component works, then write tests
- **Regression testing**: Tests should prevent breaking existing functionality
- **Behavioral testing**: Focus on what the component does, not how it does it
- **Documentation**: Tests serve as living documentation of component behavior
