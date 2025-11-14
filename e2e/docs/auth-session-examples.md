# Auth Session Helper - Usage Examples

Complete guide to using the `createAuthSession()` helper for E2E tests.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Team Management](#team-management)
3. [Custom Data](#custom-data)
4. [Multiple Users](#multiple-users)
5. [Advanced Scenarios](#advanced-scenarios)
6. [Best Practices](#best-practices)

## Basic Usage

### Simple Authenticated User

```typescript
import { test, expect } from '@playwright/test';
import { createAuthSession, getTestDb } from '../helpers';

test('user can view their settings', async ({ page }) => {
  // Clear database before test
  const testDb = await getTestDb();
  await testDb.clear();

  // Create authenticated user
  const { user } = await createAuthSession(page);

  // Navigate to settings page
  await page.goto('/your-settings');

  // User should see their name
  await expect(page.locator(`text=${user.displayName}`)).toBeVisible();
});
```

### With Browser Context

```typescript
test('auth with browser context', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  const { user } = await createAuthSession(context);

  await page.goto('/your-settings');
  // Test logic...

  await page.close();
  await context.close();
});
```

## Team Management

### Team Leader

```typescript
test('team leader can manage team settings', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  // Create user as team leader
  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'leader',
  });

  // Verify user is leader
  expect(team?.teamLeaderId).toBe(user.id);
  expect(team?.memberIds).toContain(user.id);

  // Navigate to team settings
  await page.goto('/team-settings');

  // Leader can access settings
  await expect(page.locator('text=Team Settings')).toBeVisible();
});
```

### Team Member

```typescript
test('team member has limited permissions', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  // Create user as team member
  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'member',
  });

  // Verify user is NOT leader
  expect(team?.teamLeaderId).not.toBe(user.id);
  expect(team?.memberIds).toContain(user.id);

  // Member can view discussions
  await page.goto(`/team/${team?.slug}/discussions`);
  // But cannot access team settings
  await page.goto('/team-settings');
  // Should be redirected or see error
});
```

### Custom Team Data

```typescript
test('create team with specific details', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'leader',
    teamData: {
      name: 'Engineering Team',
      slug: 'engineering',
    },
  });

  expect(team?.name).toBe('Engineering Team');
  expect(team?.slug).toBe('engineering');

  await page.goto('/team/engineering/discussions');
  await expect(page.locator('text=Engineering Team')).toBeVisible();
});
```

## Custom Data

### Custom User Profile

```typescript
test('user with custom profile data', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { user } = await createAuthSession(page, {
    userData: {
      displayName: 'Alice Johnson',
      email: 'alice@acme.com',
      darkTheme: true,
    },
  });

  expect(user.displayName).toBe('Alice Johnson');
  expect(user.email).toBe('alice@acme.com');
  expect(user.darkTheme).toBe(true);

  await page.goto('/your-settings');
  
  // Verify dark theme is applied
  const body = page.locator('body');
  await expect(body).toHaveAttribute('class', /dark/);
});
```

### Specific Email Domain

```typescript
test('user from specific company', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { user } = await createAuthSession(page, {
    userData: {
      email: 'john.doe@company.com',
      displayName: 'John Doe',
    },
  });

  expect(user.email).toContain('@company.com');
});
```

## Multiple Users

### Two Users in Same Test

```typescript
test('interaction between two users', async ({ browser }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  // Create first user
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  const { user: user1, team } = await createAuthSession(context1, {
    withTeam: true,
    teamRole: 'leader',
    userData: { displayName: 'Leader User' },
  });

  // Create second user in same team
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  const { user: user2 } = await createAuthSession(context2, {
    withTeam: true,
    teamRole: 'member',
    userData: { displayName: 'Member User' },
  });

  // Both users navigate to team discussions
  await page1.goto(`/team/${team?.slug}/discussions`);
  await page2.goto(`/team/${team?.slug}/discussions`);

  // Test real-time collaboration...

  await page1.close();
  await context1.close();
  await page2.close();
  await context2.close();
});
```

### Sequential User Creation

```typescript
test('multiple users created sequentially', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  // Create first user
  const { user: user1 } = await createAuthSession(page, {
    userData: { displayName: 'User 1' },
  });

  // Clear cookies for second user
  await page.context().clearCookies();

  // Create second user
  const { user: user2 } = await createAuthSession(page, {
    userData: { displayName: 'User 2' },
  });

  // Verify users are different
  expect(user1.id).not.toBe(user2.id);
  expect(user1.email).not.toBe(user2.email);
});
```

## Advanced Scenarios

### Pre-populate Team with Discussions

```typescript
import { MongoClient } from 'mongodb';
import { getServers } from '../helpers';

test('team with existing discussions', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'leader',
  });

  // Add discussions to the team
  const servers = await getServers();
  const client = new MongoClient(servers.mongoUri);
  await client.connect();

  try {
    const db = client.db();
    const discussionsCollection = db.collection('discussions');

    await discussionsCollection.insertMany([
      {
        name: 'Project Planning',
        slug: 'project-planning',
        teamId: team?.id,
        createdAt: new Date(),
        memberIds: [user.id],
      },
      {
        name: 'Technical Discussion',
        slug: 'technical-discussion',
        teamId: team?.id,
        createdAt: new Date(),
        memberIds: [user.id],
      },
    ]);
  } finally {
    await client.close();
  }

  await page.goto(`/team/${team?.slug}/discussions`);

  // Should see pre-populated discussions
  await expect(page.locator('text=Project Planning')).toBeVisible();
  await expect(page.locator('text=Technical Discussion')).toBeVisible();
});
```

### Testing Subscription Status

```typescript
test('team with subscription', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'leader',
    teamData: {
      isSubscribed: true,
    },
  });

  await page.goto('/billing');

  // Should show active subscription
  await expect(page.locator('text=Active Subscription')).toBeVisible();
});
```

## Best Practices

### 1. Always Clear Database

```typescript
test.beforeEach(async () => {
  const testDb = await getTestDb();
  await testDb.clear();
});

test('my test', async ({ page }) => {
  const { user } = await createAuthSession(page);
  // Test logic...
});
```

### 2. Use Descriptive Test Data

```typescript
// ✅ Good - clear what the test is about
const { user } = await createAuthSession(page, {
  userData: {
    displayName: 'Test Admin User',
    email: 'admin@testcompany.com',
  },
});

// ❌ Bad - unclear, random data
const { user } = await createAuthSession(page);
```

### 3. Test Isolation

```typescript
// Each test should be independent
test('test 1', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear(); // Clean start

  const { user } = await createAuthSession(page);
  // Test logic...
});

test('test 2', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear(); // Clean start

  const { user } = await createAuthSession(page);
  // Test logic...
});
```

### 4. Use Team Context When Needed

```typescript
// If testing team features, always create with team
test('team feature', async ({ page }) => {
  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'leader', // or 'member'
  });

  // Now you have user and team context
});
```

### 5. Clear Cookies Between Users

```typescript
test('switching users', async ({ page }) => {
  const { user: user1 } = await createAuthSession(page);
  await page.goto('/dashboard');

  // Clear cookies before creating second user
  await page.context().clearCookies();

  const { user: user2 } = await createAuthSession(page);
  await page.goto('/dashboard');

  // Now logged in as user2
});
```

## Troubleshooting

### Session Not Working

If the session doesn't work as expected:

1. Verify database is cleared before test
2. Check that cookies are set correctly
3. Ensure SESSION_SECRET is set in environment

```typescript
test('debug session', async ({ page }) => {
  const { user, sessionCookie } = await createAuthSession(page);

  console.log('User ID:', user.id);
  console.log('Session Cookie:', sessionCookie);

  const cookies = await page.context().cookies();
  console.log('Browser Cookies:', cookies);
});
```

### Team Not Found

If team-related tests fail:

1. Ensure `withTeam: true` is set
2. Verify team data is returned
3. Check team slug is correct

```typescript
test('debug team', async ({ page }) => {
  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'leader',
  });

  console.log('User:', user);
  console.log('Team:', team);

  expect(team).toBeTruthy();
  expect(team?.slug).toBeTruthy();
});
```

## Related Documentation

- [E2E Testing Guide](../../.cursor/rules/e2e-testing.mdc)
- [Main README](../README.md)
- [Phase 1 Plan](../plans/phase-1-foundation.md)
