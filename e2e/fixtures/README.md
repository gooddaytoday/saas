# E2E Test Fixtures and Helpers

This directory provides a centralized export point for all test helpers and utilities used in E2E tests.

## Architecture Decision

**⚠️ IMPORTANT**: We use **helper functions**, NOT custom Playwright fixtures.

According to our testing rules (`.cursor/rules/e2e-testing.mdc`), custom fixtures created with `test.extend()` cause Playwright errors with `test.describe()` blocks. Instead, we use **helper functions** that can be called inside standard Playwright tests.

## Quick Start

### Basic Import

```typescript
import { test, expect } from '../fixtures';
import { getServers, createAuthSession, createTeamContext } from '../fixtures';
```

### What's Available

- **Standard Playwright**: `test`, `expect` (no custom extensions)
- **Core Helpers**: `getServers()`, `getTestDb()`, `createAuthSession()`, `createTeamContext()`
- **Data Factories**: `generateEmail()`, `createUserData()`, `createTeamData()`, etc.
- **Auth Utilities**: `createUserInDb()`, `createSessionForUser()`, etc.
- **Types**: `TestServers`, `AuthSession`, `TeamContext`, etc.

## Usage Patterns

### Pattern 1: Basic Authenticated Test

```typescript
import { test, expect, createAuthSession } from '../fixtures';

test('should access user settings', async ({ page }) => {
  // Create authenticated user
  const { user } = await createAuthSession(page);
  
  // User is now logged in
  await page.goto('/your-settings');
  
  // Test authenticated features
  await expect(page.locator('input[name="displayName"]'))
    .toHaveValue(user.displayName);
});
```

### Pattern 2: Team Leader Test

```typescript
import { test, expect, createAuthSession } from '../fixtures';

test('should manage team settings', async ({ page }) => {
  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'leader'
  });
  
  expect(team?.teamLeaderId).toBe(user.id);
  
  await page.goto(`/team-settings?teamSlug=${team.slug}`);
  await expect(page).toHaveURL(/team-settings/);
});
```

### Pattern 3: Team with Multiple Members

```typescript
import { test, expect, createTeamContext } from '../fixtures';

test('should display team members', async ({ page }) => {
  const { owner, team, members, allMembers } = await createTeamContext(page, {
    membersCount: 3
  });
  
  // Team has owner + 3 members
  expect(members).toHaveLength(3);
  expect(allMembers).toHaveLength(4);
  
  await page.goto(`/team-settings?teamSlug=${team.slug}`);
  
  // Check all members are visible
  for (const member of allMembers) {
    await expect(page.locator(`text=${member.displayName}`)).toBeVisible();
  }
});
```

### Pattern 4: Clean Database

```typescript
import { test, expect, getTestDb } from '../fixtures';

test('should start with empty database', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();
  
  // Database is now completely empty
  await page.goto('/login');
});
```

### Pattern 5: API Requests

```typescript
import { test, expect, getServers } from '../fixtures';

test('should access API endpoint', async ({ page }) => {
  const servers = await getServers();
  
  const response = await page.request.get(
    `${servers.apiUrl}/api/v1/public/get-user`
  );
  
  expect(response.status()).toBeLessThan(500);
  const data = await response.json();
  expect(data).toBeDefined();
});
```

### Pattern 6: Custom User Data

```typescript
import { test, expect, createAuthSession, createUserData } from '../fixtures';

test('should create user with custom data', async ({ page }) => {
  const { user } = await createAuthSession(page, {
    userData: createUserData({
      displayName: 'John Doe',
      email: 'john@example.com',
      darkTheme: true
    })
  });
  
  expect(user.displayName).toBe('John Doe');
  expect(user.email).toBe('john@example.com');
  expect(user.darkTheme).toBe(true);
});
```

### Pattern 7: Team with Invitations

```typescript
import { test, expect, createTeamContext } from '../fixtures';

test('should create team with pending invitations', async ({ page }) => {
  const { team, invitations } = await createTeamContext(page, {
    invitationEmails: ['invite1@example.com', 'invite2@example.com']
  });
  
  expect(invitations).toHaveLength(2);
  expect(invitations[0].token).toBeTruthy();
  expect(invitations[0].email).toBe('invite1@example.com');
});
```

## Available Helpers

### Core Helpers

#### `getServers()`
Returns API and App server URLs.

```typescript
const servers = await getServers();
// servers.apiUrl = 'http://localhost:8000'
// servers.appUrl = 'http://localhost:3000'
// servers.mongoUri = 'mongodb://...'
```

#### `getTestDb()`
Returns database helper with `clear()` method.

```typescript
const testDb = await getTestDb();
await testDb.clear(); // Clears all collections
```

#### `createAuthSession(page, options?)`
Creates authenticated user session in browser.

**Options:**
- `withTeam: boolean` - Create team (default: false)
- `teamRole: 'leader' | 'member'` - Role in team (default: 'leader')
- `userData: Partial<UserData>` - Custom user data
- `teamData: Partial<TeamData>` - Custom team data

**Returns:** `{ user, team?, cookies }`

#### `createTeamContext(page, options?)`
Creates complete team setup with owner, members, and invitations.

**Options:**
- `ownerData: Partial<UserData>` - Custom owner data
- `teamData: Partial<TeamData>` - Custom team data
- `membersCount: number` - Number of members (default: 0)
- `membersData: Partial<UserData>[]` - Custom members data
- `invitationEmails: string[]` - Emails to invite

**Returns:** `{ owner, team, members, allMembers, invitations }`

### Data Factories

#### `generateEmail()`
Generates unique email address for testing.

```typescript
const email = generateEmail();
// Returns: "user-1234567890@test.com"
```

#### `createUserData(overrides?)`
Creates test user data.

```typescript
const userData = createUserData({
  displayName: 'Custom Name',
  email: 'custom@example.com',
  darkTheme: true
});
```

#### `createTeamData(overrides?)`
Creates test team data.

```typescript
const teamData = createTeamData({
  name: 'My Team',
  slug: 'my-team'
});
```

#### `createDiscussionData(overrides?)`
Creates test discussion data.

#### `createPostData(overrides?)`
Creates test post data.

### Auth Utilities

#### `createUserInDb(userData?)`
Creates user directly in database.

#### `createTeamInDb(teamData, ownerId)`
Creates team directly in database.

#### `createSessionForUser(userId)`
Creates session for user in database.

#### `setSessionCookies(page, sessionId, appUrl)`
Sets session cookies in browser context.

#### `cleanupTestUsers()`
Cleans up test users from database.

## Type Exports

All TypeScript types are exported for convenience:

```typescript
import type {
  TestServers,
  TestDb,
  AuthUser,
  AuthTeam,
  AuthSession,
  AuthSessionOptions,
  TeamContext,
  TeamContextOptions,
  TeamMember,
  TeamInvitation,
  UserData,
  TeamData,
  DiscussionData,
  PostData,
  TestUser,
  TestTeam,
} from '../fixtures';
```

## Why Not Custom Fixtures?

**Problem with Custom Fixtures:**
```typescript
// ❌ This causes "test.describe() not expected here" error
import { test } from '../fixtures';

test.describe('Feature', () => {
  test('should work', async ({ authSession }) => {
    // Custom fixture causes Playwright errors
  });
});
```

**Solution with Helpers:**
```typescript
// ✅ This works perfectly
import { test, createAuthSession } from '../fixtures';

test('should work', async ({ page }) => {
  const { user } = await createAuthSession(page);
  // Standard Playwright test with helper function
});
```

## File Structure

```
fixtures/
├── index.ts           # Main export file (this module)
└── README.md          # This documentation

Related:
├── helpers.ts         # Core helper implementations
└── utils/
    ├── factories.ts   # Data factories
    ├── authHelpers.ts # Auth utilities
    └── ...
```

## Migration from Legacy Fixtures

If you have old code using custom fixtures:

**Before (legacy):**
```typescript
import { test, expect } from '../fixtures';

test('old way', async ({ page, authSession }) => {
  // authSession was a fixture
});
```

**After (current):**
```typescript
import { test, expect, createAuthSession } from '../fixtures';

test('new way', async ({ page }) => {
  const { user } = await createAuthSession(page);
  // authSession is now a helper function
});
```

## See Also

- **Main E2E README**: [../README.md](../README.md)
- **Testing Rules**: [../.cursor/rules/e2e-testing.mdc](../../.cursor/rules/e2e-testing.mdc)
- **Phase 1 Plan**: [../plans/phase-1-foundation.md](../plans/phase-1-foundation.md)
- **Helpers Implementation**: [../helpers.ts](../helpers.ts)
