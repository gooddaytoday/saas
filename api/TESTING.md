# API Testing

This guide explains how to run and create unit tests in the API server.

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
yarn test --watch

# Run tests with a code-coverage report
yarn test --coverage
```

### Additional Jest options

```bash
# Run a specific test file
yarn test slugify.test.ts

# Run tests in a specific folder
yarn test server/utils

# Run tests with verbose output
yarn test --verbose

# Update snapshots
yarn test --updateSnapshot
```

## Test structure

Place tests inside `__tests__` folders next to the files under test:

```
server/
  utils/
    slugify.ts
    sum.ts
    __tests__/
      slugify.test.ts
      sum.test.ts
  models/
    User.ts
    __tests__/
      User.test.ts
  api/
    team-leader.ts
    __tests__/
      team-leader.test.ts
```

## Jest configuration

The Jest configuration is located in `jest.config.ts`. Key settings:

- **testEnvironment**: `node` for testing Node.js server code
- **setupFilesAfterEnv**: `jest.setup.ts` with additional setup including dotenv configuration
- **testMatch**: looks for test files in `__tests__` directories
- **preset**: `ts-jest` for TypeScript support

## Testing libraries

### Jest

Primary testing framework for the API server:

```typescript
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
```

### Database testing

When testing code that interacts with MongoDB, use MongoDB Memory Server for isolated in-memory database testing:

```typescript
import User from '../../models/User';
import { setupTestDb, teardownTestDb } from '../utils/__tests__/testDbHelper';

describe('database test', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  test('should interact with database', async () => {
    // Your database test logic
  });
});
```

MongoDB Memory Server automatically handles database lifecycle - it creates an in-memory MongoDB instance for each test suite and cleans it up afterward. No external database setup is required.

## Example tests

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

### Testing async functions

```typescript
import { asyncFunction } from '../asyncFunction';

describe('asyncFunction', () => {
  test('resolves with correct value', async () => {
    await expect(asyncFunction('input')).resolves.toBe('expected output');
  });

  test('rejects with error', async () => {
    await expect(asyncFunction('invalid')).rejects.toThrow('Error message');
  });
});
```

### Testing API endpoints

```typescript
import request from 'supertest';
import app from '../../server';

describe('API endpoints', () => {
  test('GET /api/test should return 200', async () => {
    const response = await request(app)
      .get('/api/test')
      .expect(200);
    
    expect(response.body).toEqual(expect.objectContaining({
      status: 'success'
    }));
  });
});
```

## Environment variables for testing

MongoDB Memory Server is used for database testing, so no `MONGO_URL_TEST` environment variable is required. However, you may still need other environment variables for testing:

```bash
NODE_ENV=test
```

## Code coverage

After running `yarn test --coverage`, the report will be available in the `coverage/` folder:

- `coverage/lcov-report/index.html` – HTML report
- `coverage/lcov.info` – LCOV format for CI/CD

## Debugging tests

### VS Code

Add the following to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug API",
  "program": "${workspaceFolder}/api/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen",
  "cwd": "${workspaceFolder}/api"
}
```

## Best practices

1. **Descriptive test names** – use clear descriptions of what is being tested
2. **Group related tests** – use `describe` to logically group tests
3. **Clean up after tests** – use `afterEach`/`beforeEach` to reset state
4. **Test behavior, not implementation** – test the expected outcomes
5. **Isolate tests** – each test should be independent
6. **Mock external dependencies** – use Jest mocks for external services
7. **Test edge cases** – include tests for error conditions and edge cases

## Database testing considerations

1. **Use MongoDB Memory Server** – in-memory database provides complete isolation and requires no external setup
2. **Clean up test data** – remove test data after each test (though MongoDB Memory Server handles this automatically)
3. **Seed test data consistently** – use fixtures or factories for test data in `beforeAll` hooks
4. **Test database constraints** – verify unique indexes and validation rules work correctly

## Useful resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Node.js Applications](https://nodejs.org/en/docs/guides/testing/)
- [Mongoose Testing Guide](https://mongoosejs.com/docs/jest.html) 