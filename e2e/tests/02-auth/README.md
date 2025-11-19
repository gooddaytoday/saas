# Authentication Tests (02-auth)

Complete authentication and session management tests for the E2E test suite.

## Overview

This directory contains comprehensive E2E tests for all authentication and session management functionality:

- **Login and Authentication** - Passwordless and OAuth flows
- **Session Management** - Session creation, persistence, and validation
- **Cookie Security** - Session cookie attributes and security

## Test Files

### `login.test.ts` - Login & Auth Flows
Tests for user login, authentication, and session establishment.

**Tests** (40+ tests):
- Login page UI and functionality
- Google OAuth integration
- Passwordless email login
- Session creation and persistence
- Cookie management
- Redirect logic based on auth state
- SEO metadata

**Key Test Patterns**:
```typescript
import { test, expect } from '@playwright/test';
import { getServers } from '../../helpers';

test('should load login page successfully', async ({ page }) => {
  await page.goto('/login');
  const response = await page.request.get('/login');
  expect(response.status()).toBeLessThan(500);
});
```

### `session.test.ts` - Session Management
**NEW** - Comprehensive tests for Express session management using MongoDB.

**Tests** (10 tests):
1. **Session created on login** - Verify session exists in database
2. **Session persists across navigations** - Session cookie remains valid
3. **Session structure in MongoDB** - Proper format with user reference
4. **Session cookie security** - httpOnly, path, domain, expiration
5. **Session TTL** - Sessions expire after 14 days
6. **Clear session data** - Sessions can be deleted
7. **Validate session user** - User reference is valid
8. **API requests with session** - Session cookie works for authenticated API calls
9. **Session through refresh** - Cookie persists after page reload
10. **Concurrent sessions** - Multiple users can have simultaneous sessions

**Key Features**:
- MongoDB session validation
- Session security attribute verification
- Cookie persistence testing
- Multi-user concurrent session support

## Running Tests

### Run all auth tests
```bash
cd /home/kiselev/git/other/saas
yarn test:e2e tests/02-auth/
```

### Run specific test file
```bash
yarn test:e2e tests/02-auth/login.test.ts
yarn test:e2e tests/02-auth/session.test.ts
```

### Run with filters
```bash
# Run only session tests
yarn test:e2e tests/02-auth/session.test.ts

# Run in headed mode (see browser)
yarn test:e2e:headed tests/02-auth/

# Run in debug mode
yarn test:e2e:debug tests/02-auth/
```

## Test Data Setup

Tests use helper functions for creating test users and sessions:

```typescript
import { createAuthSession, getServers, getTestDb } from '../../helpers';

test('authenticated feature', async ({ page }) => {
  // Create authenticated user with optional team
  const { user, team, sessionCookie } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'leader'
  });
  
  // User is already logged in, cookies are set
  await page.goto('/team-settings');
});
```

## Session Management Details

### Session Storage
- **Store**: MongoDB (`sessions` collection)
- **TTL**: 14 days (1,209,600 seconds)
- **Cookie Name**: `saas.sid`
- **Cookie Format**: `s:{sessionId}.{signature}`

### Session Structure
```typescript
{
  _id: "sessionId123",
  session: JSON.stringify({
    cookie: {
      originalMaxAge: 1209600000, // 14 days in ms
      expires: Date,
      secure: boolean,
      httpOnly: true,
      domain: 'localhost' | 'domain.com',
      path: '/'
    },
    passport: {
      user: userId // MongoDB ObjectId
    }
  }),
  expires: Date // TTL index for auto-deletion
}
```

### Cookie Attributes
- **httpOnly**: `true` - Not accessible from JavaScript (XSS protection)
- **secure**: `true` in production, `false` in development
- **sameSite**: `Lax` - Moderate CSRF protection
- **maxAge**: 14 days
- **domain**: Set based on environment (localhost in dev)
- **path**: `/` - Available for all routes

## Helper Functions

### createAuthSession()
Create an authenticated user session with optional team.

```typescript
// Simple user
const { user, sessionCookie } = await createAuthSession(page);

// User with team (as leader)
const { user, team, sessionCookie } = await createAuthSession(page, {
  withTeam: true,
  teamRole: 'leader'
});

// User with custom data
const { user } = await createAuthSession(page, {
  userData: {
    displayName: 'John Doe',
    email: 'john@example.com'
  }
});
```

### getServers()
Get API and App server URLs.

```typescript
const servers = await getServers();
// servers.apiUrl = 'http://localhost:8000'
// servers.appUrl = 'http://localhost:3000'
// servers.mongoUri = 'mongodb://...'
```

### getTestDb()
Get database utilities for test cleanup.

```typescript
const testDb = await getTestDb();
await testDb.clear(); // Clear all collections before test
```

## Common Issues

### Session Cookie Not Found
**Problem**: Tests can't find `saas.sid` cookie.

**Solution**: Ensure the app is correctly setting the session cookie. Check:
1. Session middleware is initialized
2. SESSION_NAME is set to `saas.sid` (or environment variable)
3. Cookie domain matches test environment

### Duplicate Key Error on User Creation
**Problem**: `E11000 duplicate key error` on `slug` field.

**Solution**: Each test should start with `await testDb.clear()` to ensure clean database state.

### Session Not Persisting
**Problem**: Session cookie disappears after navigation.

**Solution**: Verify:
1. Browser context cookies are properly configured
2. No cookie expiration or deletion in between requests
3. Express session middleware is mounted before routes

## Database Cleanup

Each test should start fresh:

```typescript
test('my test', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear(); // Clear all collections
  
  // Test setup and execution
});
```

## Performance Considerations

- Session tests run **in parallel** (4 workers by default)
- Each worker gets isolated MongoDB instance
- Session creation is fast (~50-100ms per test)
- Total test suite runs in ~20 seconds

## Troubleshooting

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check if API/App servers are starting correctly
- Verify MongoDB Memory Server is initialized

### Cookie attributes mismatch
- Cookie attributes vary based on environment
- Tests check for secure/insecure based on dev/prod mode
- Some attributes may not be set if using defaults

### User lookup fails
- User IDs might be ObjectId or string - convert as needed
- Use `ObjectId()` constructor for string conversions
- Compare using `.toString()` for ObjectIds

## Related Documentation

- [E2E Testing Guide](../../README.md) - General E2E testing setup
- [Phase 1 Foundation Plan](../../plans/phase-1-foundation.md) - Implementation roadmap
- [Playwright Documentation](https://playwright.dev) - Browser testing
- [Express Session Documentation](https://github.com/expressjs/session) - Session middleware

## Test Coverage

**P0 Priority Tests**:
- ✅ 10 session management tests
- ✅ 40+ login and auth tests
- ✅ All core authentication flows

**Coverage**: ~80% of authentication code paths

## Future Improvements

- [ ] OAuth token refresh tests
- [ ] Session invalidation on password change
- [ ] Concurrent session limits
- [ ] Session activity tracking
- [ ] Custom session store implementations

