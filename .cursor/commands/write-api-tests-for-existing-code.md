# Writing unit tests for existing API server components

Write unit tests for already existing and working modules in the API server using the rules from [api-testing.mdc](../rules/api-testing.mdc).

## Test writing process

### Step 1: Analyze existing module

1. **Read the module source code:**
   - Study the complete source file of the module
   - Understand the architecture and structure of the function/model/API endpoint
   - Define all public APIs (parameters, return values, side effects)

2. **Determine module type and create test structure:**
   - Utility function (`.ts`) → tests in `__tests__/*.test.ts`
   - Database model (`.ts`) → tests in `__tests__/*.test.ts`
   - API endpoint (`.ts`) → tests in `__tests__/*.test.ts`
   - Create `__tests__` folder next to the module (if it doesn't exist)
   - File name: `ModuleName.test.ts`

3. **Analyze functionality:**
   - Define all function parameters and return values
   - Find all database operations (MongoDB queries, updates, etc.)
   - Identify conditional branches (if/else, switch, guard clauses)
   - Find external dependencies (Stripe, AWS, Google Auth, email services)
   - Define all possible usage scenarios

4. **Determine edge cases and boundary conditions:**
   - Empty/null/undefined inputs
   - Invalid data types
   - Database errors (connection issues, validation failures)
   - External service failures
   - Network timeouts

### Step 2: Test file structure

```typescript
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { setupTestDb, teardownTestDb } from '../../utils/__tests__/testDbHelper';
import { functionToTest } from '../functionToTest';

describe('functionToTest', () => {
  beforeAll(async () => {
    // Setup test database for database-related tests
    await setupTestDb();
  });

  afterAll(async () => {
    // Cleanup test database
    await teardownTestDb();
  });

  afterEach(async () => {
    // Clean up test data after each test
    // await SomeModel.deleteMany({});
  });

  describe('Basic functionality', () => {
    test('should return expected result', () => {
      const result = functionToTest('input');
      expect(result).toBe('expected output');
    });
  });

  describe('Database operations', () => {
    test('should save data to database', async () => {
      // Test database operations
    });
  });
});
```

### Step 3: Writing tests for existing code

1. **Start with basic function testing:**
   - Write tests for pure functions without external dependencies
   - Test basic input/output behavior
   - Verify parameter validation

2. **Test database operations:**
   - Use MongoDB Memory Server for isolated database testing
   - Test CRUD operations (Create, Read, Update, Delete)
   - Verify data validation and constraints
   - Test error handling for database failures

3. **Test API endpoints:**
   - Use supertest for HTTP endpoint testing
   - Test all HTTP methods (GET, POST, PUT, DELETE)
   - Verify request/response formats
   - Test authentication and authorization

4. **Cover edge cases:**
   - Invalid inputs and validation errors
   - Database connection failures
   - External service unavailability
   - Network timeouts and retries

5. **Test asynchronous operations:**
   - Promise-based functions
   - External API calls
   - File system operations
   - Email sending

### Step 4: Mandatory test requirements

#### ✅ DO (Mandatory):

1. **Use AAA pattern (Arrange → Act → Assert):**
   ```typescript
   test('example', async () => {
     // Arrange - setup test data and mocks
     const testData = { name: 'Test' };
     await setupTestData(testData);

     // Act - perform the action
     const result = await functionToTest(testData);

     // Assert - verify the result
     expect(result).toEqual(expect.objectContaining(testData));
   });
   ```

2. **Use MongoDB Memory Server for database tests:**
   ```typescript
   import { setupTestDb, teardownTestDb } from '../../utils/__tests__/testDbHelper';

   describe('Database tests', () => {
     beforeAll(async () => {
       await setupTestDb();
     });

     afterAll(async () => {
       await teardownTestDb();
     });
   });
   ```

3. **Mock external dependencies:**
   ```typescript
   import Stripe from 'stripe';

   jest.mock('stripe', () => {
     return jest.fn().mockImplementation(() => ({
       paymentIntents: {
         create: jest.fn().mockResolvedValue({ id: 'pi_test' }),
       },
     }));
   });
   ```

4. **Test API endpoints with supertest:**
   ```typescript
   import request from 'supertest';
   import app from '../../server';

   test('GET /api/test should return 200', async () => {
     const response = await request(app)
       .get('/api/test')
       .expect(200);

     expect(response.body).toEqual(expect.objectContaining({
       status: 'success'
     }));
   });
   ```

5. **Cover all conditional branches:**
   ```typescript
   it.each([
     { input: 'valid', expected: true },
     { input: 'invalid', expected: false },
     { input: '', expected: false },
     { input: null, expected: false }
   ])('validates input "$input" as $expected', ({ input, expected }) => {
     const result = validateInput(input);
     expect(result).toBe(expected);
   });
   ```

6. **Test error handling:**
   ```typescript
   test('handles database errors gracefully', async () => {
     // Mock database error
     jest.spyOn(User, 'findOne').mockRejectedValue(new Error('DB Error'));

     await expect(findUser('invalid-id')).rejects.toThrow('DB Error');
   });
   ```

7. **Clean up after tests:**
   ```typescript
   afterEach(async () => {
     // Clean database collections
     await User.deleteMany({});
     await Team.deleteMany({});

     // Reset mocks
     jest.clearAllMocks();
   });
   ```

#### ❌ DON'T (Forbidden):

1. **Don't test against production database:**
   ```typescript
   // ❌ DON'T
   const db = connectToProductionDb();

   // ✅ DO
   // Use MongoDB Memory Server via setupTestDb()
   ```

2. **Don't make real external API calls:**
   ```typescript
   // ❌ DON'T
   await stripe.paymentIntents.create({ amount: 1000 });

   // ✅ DO
   jest.mock('stripe');
   ```

3. **Don't leave test data after tests:**
   ```typescript
   // ❌ DON'T: no cleanup
   test('creates user', async () => {
     await User.create({ name: 'Test' });
   });

   // ✅ DO: cleanup in afterEach
   afterEach(async () => {
     await User.deleteMany({});
   });
   ```

4. **Don't write unstable async tests:**
   ```typescript
   // ❌ DON'T
   setTimeout(() => {
     expect(result).toBe('done');
   }, 1000);

   // ✅ DO
   await waitFor(() => {
     expect(result).toBe('done');
   });
   ```

5. **Don't test implementation details:**
   ```typescript
   // ❌ DON'T
   expect(spy).toHaveBeenCalledWith('internalFunction');

   // ✅ DO
   expect(result).toEqual(expectedOutput);
   ```

### Step 5: Mocks and dependencies

#### Mocking external services:

**Stripe:**
```typescript
jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded'
      })
    },
    customers: {
      create: jest.fn().mockResolvedValue({
        id: 'cus_test_123',
        email: 'test@example.com'
      })
    }
  }))
}));
```

**AWS S3:**
```typescript
jest.mock('aws-sdk', () => ({
  S3: jest.fn().mockImplementation(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://s3.amazonaws.com/bucket/file.jpg',
        Key: 'file.jpg'
      })
    }),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    })
  }))
}));
```

**Google Auth:**
```typescript
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: 'google-user-id',
        email: 'user@example.com',
        name: 'Test User'
      })
    })
  }))
}));
```

**Email services (SES):**
```typescript
jest.mock('aws-sdk', () => ({
  SES: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        MessageId: 'email-message-id'
      })
    })
  }))
}));
```

#### Mocking utility functions:
```typescript
jest.mock('../utils/slugify', () => ({
  slugify: jest.fn().mockReturnValue('slugified-string')
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
   test('handles success case', async () => { ... });
   test('handles error case', async () => { ... });
   ```

2. **Cover all async scenarios:**
   ```typescript
   test('handles resolved promise', async () => {
     mockApiCall.mockResolvedValue({ success: true });
     // test success path
   });

   test('handles rejected promise', async () => {
     mockApiCall.mockRejectedValue(new Error('API Error'));
     // test error path
   });
   ```

3. **Cover database operations:**
   ```typescript
   test('handles successful database save', async () => {
     // Test successful save
   });

   test('handles database validation error', async () => {
     // Test validation failure
   });

   test('handles database connection error', async () => {
     // Mock connection failure
   });
   ```

4. **Check coverage:**
   ```bash
   # Run tests with coverage for specific file
   cd api && yarn test myFunction.test.ts --coverage

   # Check full coverage before closing task
   cd api && yarn test --coverage
   ```

### Step 7: Examples from codebase

**Utility function test example:**
See [slugify.test.ts](../../api/server/utils/__tests__/slugify.test.ts)

**Database model test example:**
See [sum.test.ts](../../api/server/utils/__tests__/sum.test.ts)

### Step 8: Running tests

**During development (fast):**
```bash
# Run only tests for the module being developed
cd api && yarn test myFunction.test.ts

# Run with verbose output
cd api && yarn test myFunction.test.ts --verbose

# Stop on first error
cd api && yarn test myFunction.test.ts --bail
```

**Before commit (full check):**
```bash
# Run all API tests
cd api && yarn test

# Check coverage (all metrics ≥ 80%)
cd api && yarn test --coverage
```

### Step 9: Checklist before completion

- [ ] All tests pass (`cd api && yarn test`) - check that all the tests are passing, it's very important.
- [ ] Coverage ≥ 80% for all metrics (`cd api && yarn test --coverage`) - check that the coverage of the new/changed test's code is at least 80%.
- [ ] All conditional branches covered by tests
- [ ] Edge cases covered by tests (null, undefined, invalid inputs)
- [ ] Database operations tested with MongoDB Memory Server
- [ ] External dependencies properly mocked
- [ ] Error handling tested
- [ ] Tests follow AAA pattern
- [ ] Tests are deterministic (no external dependencies)
- [ ] Test data cleaned up after each test
- [ ] No tests against production database

### Step 10: File structure

```
api/
  server/
    utils/
      slugify.ts
      __tests__/
        slugify.test.ts  ← create here
    models/
      User.ts
      __tests__/
        User.test.ts  ← create here
    api/
      team-leader.ts
      __tests__/
        team-leader.test.ts  ← create here
```

## Additional resources

- **Testing rules**: [api-testing.mdc](../rules/api-testing.mdc)
- **Testing documentation**: [TESTING.md](../../api/TESTING.md)
- **Test examples**:
  - [slugify.test.ts](../../api/server/utils/__tests__/slugify.test.ts)
  - [sum.test.ts](../../api/server/utils/__tests__/sum.test.ts)
- **Jest configuration**: [jest.config.ts](../../api/jest.config.ts)
- **Jest setup**: [jest.setup.ts](../../api/jest.setup.ts)
- **Database test helper**: `server/utils/__tests__/testDbHelper.ts`

## Important reminders

1. **Components are already working** - tests are needed to ensure quality and prevent regressions
2. **Analyze existing behavior** - tests should reflect the real behavior of server functions
3. **Never commit code without passing tests and coverage ≥ 80%**
4. **Before closing the task, make sure to run `cd api && yarn test --coverage`**
5. **If coverage < 80% - add tests or refactoring, don't close the task**
6. **Use MongoDB Memory Server for all database tests** - never test against real database
7. **Mock all external dependencies** - Stripe, AWS, Google Auth, email services
8. **Clean up test data** - use afterEach to clean database collections
9. **Test behavior, not implementation** - focus on inputs, outputs, and side effects

## Features of testing existing API components

- **Reverse engineering**: First study how the server function works, then write tests
- **Regression testing**: Tests should prevent breaking existing API functionality
- **Integration testing**: Test how components work together (database + business logic + external services)
- **Error scenario testing**: Ensure proper error handling for all failure modes
- **Documentation**: Tests serve as living documentation of API behavior and contracts
