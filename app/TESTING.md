# Application Testing

This guide explains how to run and create unit tests in this Next.js application.

## Installing dependencies

Make sure all dependencies are installed:

```bash
yarn install
```

## Running tests

### Basic commands

```bash
# Run all tests once
yarn test

# Run tests in watch mode (reruns on changes)
yarn test:watch

# Run tests with a code-coverage report
yarn test:coverage
```

### Additional Jest options

```bash
# Run a specific test file
yarn test Notifier.test.tsx

# Run tests in a specific folder
yarn test components/common

# Run tests with verbose output
yarn test --verbose

# Update snapshots
yarn test --updateSnapshot
```

## Test structure

Place tests inside `__tests__` folders next to the files under test:

```
src/
  components/
    common/
      Notifier.tsx
      __tests__/
        Notifier.test.tsx
  lib/
    isMobile.ts
    __tests__/
      isMobile.test.ts
```

## Jest configuration

The Jest configuration is located in `jest.config.js`. Key settings:

- **testEnvironment**: `jest-environment-jsdom` for testing React components
- **setupFilesAfterEnv**: `jest.setup.js` with additional setup
- **moduleNameMapper**: supports path aliases (`@/...`)

## Testing libraries

### React Testing Library

Primary library for testing React components:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

### Jest DOM

Extra matchers for asserting on DOM nodes:

```typescript
expect(element).toBeInTheDocument();
expect(element).toHaveAttribute('data-testid', 'button');
expect(element).toHaveTextContent('Text');
```

## Example tests

### Testing a React component

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Testing a utility function

```typescript
import { myUtilFunction } from '../myUtilFunction';

describe('myUtilFunction', () => {
  test('returns the correct result', () => {
    const result = myUtilFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Mocking modules

```typescript
// Mocking an external library
jest.mock('@mui/material/Button', () => {
  return function MockButton({ children, onClick }) {
    return <button onClick={onClick}>{children}</button>;
  };
});

// Mocking a function
const mockFn = jest.fn();
mockFn.mockReturnValue('mocked value');
```

## Code coverage

After running `yarn test:coverage`, the report will be available in the `coverage/` folder:

- `coverage/lcov-report/index.html` – HTML report
- `coverage/lcov.info` – LCOV format for CI/CD

## Debugging tests

### VS Code

Add the following to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Using debug inside tests

```typescript
test('debug example', () => {
  const { debug } = render(<MyComponent />);
  debug(); // Outputs the HTML to the console
});
```

## Best practices

1. **Descriptive test names** – use clear descriptions of what is being tested
2. **Group related tests** – use `describe` to logically group tests
3. **Clean up after tests** – use `afterEach`/`beforeEach` to reset state
4. **Test behaviour, not implementation** – test what the user sees
5. **One assertion per test** – each test should verify a single behaviour

## Console Error Suppression Strategy (Hybrid Approach)

### Global Suppression (jest.setup.js)

We suppress ONLY truly safe errors that will never be regressions:

- `Warning: ReactDOM.render is no longer supported` - old React API
- `Warning: React does not recognize the \`disable` - MUI props in mocks

### Local Suppression in Tests

For expected errors in `toThrow()` tests we use local suppression:

```typescript
test('throws error when team is null', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
  try {
    expect(() => {
      render(<DiscussionList store={mockStore} team={null as any} />);
    }).toThrow();
  } finally {
    consoleSpy.mockRestore();
  }
});
```

**Benefits:**

- ✅ Explicitly show where we expect errors
- ✅ Protection against hidden regressions
- ✅ Easy to find all places with expected errors (grep by `mockImplementation`)
- ✅ Don't hide unexpected errors in other tests

## Useful resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM](https://github.com/testing-library/jest-dom)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) 