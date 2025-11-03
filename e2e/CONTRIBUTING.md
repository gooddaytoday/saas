# E2E Testing Contributing Guide

Guidelines for writing, maintaining, and improving e2e tests.

## Test Structure

### File Organization

```
tests/
├── feature/
│   ├── feature.test.ts
│   └── feature-advanced.test.ts
└── auth/
    └── login.test.ts
```

### Test Organization Pattern

```typescript
import { test, expect } from '../fixtures';

test.describe('Feature', () => {
  test.beforeEach(async ({ testDb }) => {
    await testDb.clear();
    // Additional setup
  });

  test('should do X', async ({ page }) => {
    // Arrange
    await page.goto('/path');
    
    // Act
    await page.click('button');
    
    // Assert
    await expect(page.locator('text=Result')).toBeVisible();
  });
});
```

## Naming Conventions

### Test Suites
Use descriptive names for test describe blocks:
- ✅ `'User Authentication Flow'`
- ❌ `'Auth'`

### Individual Tests
Use `should...` pattern:
- ✅ `'should login with valid credentials'`
- ❌ `'login test'`

### Fixtures and Factories
Use noun names:
- ✅ `createUserData()`
- ❌ `makeUser()`

## Best Practices

### 1. Test Independence

Each test should be completely independent:

```typescript
test('should create team', async ({ page, testDb }) => {
  // Clear database - no dependency on other tests
  await testDb.clear();
  
  // Complete setup for this test
  await loginUser(page);
  
  // Test logic
});
```

### 2. Use Semantic Selectors

Priority order for selectors:

```typescript
// 1. Best: Semantic selectors
page.locator('[role="button"]')
page.locator('button:has-text("Submit")')

// 2. Good: Test IDs
page.locator('[data-testid="login-form"]')

// 3. OK: Class/ID
page.locator('.submit-button')

// 4. Avoid: Complex XPath
page.locator('//div[@class="form"]//button[1]')
```

### 3. Explicit Waits

Always wait for elements when needed:

```typescript
// Good
await expect(page.locator('text=Success')).toBeVisible();

// Avoid - no wait
const text = await page.textContent('.message');
```

### 4. Descriptive Assertions

```typescript
// Good - clear intent
await expect(page.locator('button[aria-label="Save"]')).toBeEnabled();

// Less clear
await expect(page.locator('.btn')).toBeVisible();
```

### 5. Fixture Usage

Use fixtures for:
- Server access
- Database operations
- Authenticated pages
- Common setup/teardown

```typescript
test('authenticated flow', async ({ 
  page,      // Playwright page
  servers,   // API/App URLs  
  testDb     // Database access
}) => {
  // Use fixtures
  await testDb.clear();
  const apiUrl = servers.apiUrl;
});
```

## Testing Patterns

### Login Flow

```typescript
test('after login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'user@example.com');
  await page.click('button:has-text("Send")');
  
  // Wait for redirect
  await page.waitForURL('/create-team');
});
```

### API Testing

```typescript
test('api endpoint', async ({ page, servers }) => {
  const response = await page.request.post(
    `${servers.apiUrl}/api/v1/teams`,
    {
      data: { name: 'New Team' }
    }
  );
  
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.name).toBe('New Team');
});
```

### Database Operations

```typescript
test('with database', async ({ testDb }) => {
  // Clear all collections
  await testDb.clear();
  
  // Proceed with test
  // Database is clean
});
```

### Multiple Pages/Contexts

```typescript
test('multi-page scenario', async ({ context, servers }) => {
  const page1 = await context.newPage();
  const page2 = await context.newPage();
  
  // User 1 actions
  await page1.goto(servers.appUrl);
  
  // User 2 actions
  await page2.goto(servers.appUrl);
  
  // Both browser pages are isolated
});
```

## Common Issues & Solutions

### Issue: Flaky Tests

**Symptoms**: Test passes sometimes, fails others

**Solutions**:
```typescript
// ❌ Don't rely on timing
await new Promise(resolve => setTimeout(resolve, 1000));

// ✅ Wait for actual state changes
await expect(page.locator('text=Loaded')).toBeVisible();

// ✅ Use waitForURL for navigation
await page.waitForURL('/dashboard');
```

### Issue: Test Timeout

**Solutions**:
- Increase individual test timeout:
  ```typescript
  test.setTimeout(60000); // 60 seconds
  ```
- Check if waiting for slow operations
- Verify database/API responsiveness

### Issue: Database Conflicts

**Solutions**:
```typescript
test('isolated test', async ({ testDb }) => {
  // Always clear database at start
  await testDb.clear();
});
```

## Code Review Checklist

Before submitting tests:

- [ ] Tests run locally successfully
- [ ] No hardcoded URLs or credentials
- [ ] Uses fixtures properly
- [ ] Database cleared before test
- [ ] Semantic selectors used
- [ ] No unnecessary sleeps
- [ ] Fixtures not shared between tests
- [ ] Descriptive test names
- [ ] Comments for complex logic
- [ ] Follows naming conventions

## Performance Considerations

### Parallel Execution

Tests run in parallel by default. Ensure:
- No port conflicts
- Database isolation (MongoDB Memory Server handles this)
- No shared state between tests

### Slow Tests

If test is slow:
1. Check for unnecessary waits
2. Verify database operations
3. Profile with `--reporter=list` for timing

```bash
yarn test:e2e --reporter=list
```

## Adding New Fixtures

```typescript
// In fixtures/customFixtures.ts
import { test as base } from './baseFixtures';

export const test = base.extend<{ customFixture: any }>({
  customFixture: async ({ }, use) => {
    // Setup
    const fixture = setupCustomFixture();
    
    await use(fixture);
    
    // Cleanup
    await fixture.cleanup();
  },
});
```

## Adding Test Data Factories

```typescript
// In utils/factories.ts
export function createCustomData(overrides?: Partial<any>) {
  return {
    field: 'value',
    timestamp: new Date(),
    ...overrides,
  };
}

// In tests
const data = createCustomData({ field: 'custom' });
```

## Debugging

### Print Debug Info

```typescript
test('debug example', async ({ page }) => {
  const element = page.locator('.selector');
  console.log(await element.textContent());
  console.log(await element.getAttribute('class'));
});
```

### Screenshot on Failure

Already configured in `playwright.config.ts`:
```typescript
screenshot: 'only-on-failure',
```

### Video Recording

Already configured in `playwright.config.ts`:
```typescript
video: 'retain-on-failure',
```

View in Playwright report.

### Debug Mode

```bash
yarn test:e2e:debug
```

Pauses at each step for inspection.

## Related Documentation

- [E2E Testing README](./README.md)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library](https://testing-library.com)
- [API Testing](./utils/apiHelpers.ts)
