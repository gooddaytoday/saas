/**
 * Example test file demonstrating fixtures/index.ts usage
 *
 * This file shows various patterns for using the centralized fixtures export.
 * These tests are examples only - they won't run in CI.
 */

import { test, expect } from '../../fixtures';
import {
  getServers,
  getTestDb,
  createAuthSession,
  createTeamContext,
  generateEmail,
  createUserData,
  createTeamData,
} from '../../fixtures';

// ============================================================================
// PATTERN 1: Basic Test with Server Access
// ============================================================================

test('EXAMPLE: access servers', async ({ page }) => {
  const servers = await getServers();

  // Use server URLs
  const response = await page.request.get(`${servers.apiUrl}/api/v1/public/get-user`);
  expect(response.status()).toBeLessThan(500);

  // Navigate to app
  await page.goto(servers.appUrl + '/login');
  await expect(page).toHaveTitle(/login|sign/i);
});

// ============================================================================
// PATTERN 2: Clean Database Before Test
// ============================================================================

test('EXAMPLE: clean database', async ({ page }) => {
  const testDb = await getTestDb();

  // Clear all collections before test
  await testDb.clear();

  // Database is now empty
  await page.goto('/login');
});

// ============================================================================
// PATTERN 3: Authenticated User Test
// ============================================================================

test('EXAMPLE: authenticated user', async ({ page }) => {
  const { user } = await createAuthSession(page);

  // User is now logged in
  await page.goto('/your-settings');

  // Check user data is displayed
  await expect(page.locator('input[name="displayName"]'))
    .toHaveValue(user.displayName);
});

// ============================================================================
// PATTERN 4: Team Leader Test
// ============================================================================

test('EXAMPLE: team leader', async ({ page }) => {
  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'leader'
  });

  // Verify user is team leader
  expect(team?.teamLeaderId).toBe(user.id);

  // Access team settings (leader only)
  await page.goto(`/team-settings?teamSlug=${team?.slug}`);
  await expect(page).toHaveURL(/team-settings/);
});

// ============================================================================
// PATTERN 5: Team Member Test
// ============================================================================

test('EXAMPLE: team member', async ({ page }) => {
  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'member'
  });

  // Verify user is NOT team leader
  expect(team?.teamLeaderId).not.toBe(user.id);
  expect(team?.memberIds).toContain(user.id);

  // Team settings should be forbidden for members
  await page.goto(`/team-settings?teamSlug=${team?.slug}`);
  // Expect redirect or 403 error
});

// ============================================================================
// PATTERN 6: Custom User Data
// ============================================================================

test('EXAMPLE: custom user data', async ({ page }) => {
  const customData = createUserData({
    displayName: 'John Doe',
    email: 'john@example.com',
    darkTheme: true
  });

  const { user } = await createAuthSession(page, {
    userData: customData
  });

  expect(user.displayName).toBe('John Doe');
  expect(user.email).toBe('john@example.com');
  expect(user.darkTheme).toBe(true);
});

// ============================================================================
// PATTERN 7: Team with Multiple Members
// ============================================================================

test('EXAMPLE: team with members', async ({ page }) => {
  const { owner, team, members, allMembers } = await createTeamContext(page, {
    membersCount: 3
  });

  // Verify team structure
  expect(team.teamLeaderId).toBe(owner.id);
  expect(members).toHaveLength(3);
  expect(allMembers).toHaveLength(4); // owner + 3 members

  // Navigate to team page
  await page.goto(`/team-settings?teamSlug=${team.slug}`);

  // Check all members are visible
  for (const member of allMembers) {
    await expect(page.locator(`text=${member.displayName}`)).toBeVisible();
  }
});

// ============================================================================
// PATTERN 8: Team with Custom Members
// ============================================================================

test('EXAMPLE: custom team members', async ({ page }) => {
  const { members } = await createTeamContext(page, {
    membersData: [
      createUserData({ displayName: 'Alice Smith', email: 'alice@example.com' }),
      createUserData({ displayName: 'Bob Jones', email: 'bob@example.com' })
    ]
  });

  expect(members[0].displayName).toBe('Alice Smith');
  expect(members[1].displayName).toBe('Bob Jones');
});

// ============================================================================
// PATTERN 9: Team with Invitations
// ============================================================================

test('EXAMPLE: team with invitations', async ({ page }) => {
  const { team, invitations } = await createTeamContext(page, {
    invitationEmails: [
      'invite1@example.com',
      'invite2@example.com'
    ]
  });

  // Verify invitations created
  expect(invitations).toHaveLength(2);
  expect(invitations[0].token).toBeTruthy();
  expect(invitations[0].email).toBe('invite1@example.com');
  expect(invitations[0].teamId).toBe(team.id);

  // Test invitation acceptance flow
  const invitationUrl = `/invitation?token=${invitations[0].token}`;
  await page.goto(invitationUrl);
  await expect(page.locator(`text=${team.name}`)).toBeVisible();
});

// ============================================================================
// PATTERN 10: Complete Team Setup
// ============================================================================

test('EXAMPLE: complete team setup', async ({ page }) => {
  const { owner, team, members, invitations } = await createTeamContext(page, {
    ownerData: createUserData({ displayName: 'Team Leader' }),
    teamData: createTeamData({ name: 'Engineering Team', slug: 'engineering' }),
    membersCount: 2,
    invitationEmails: ['pending@example.com']
  });

  // Verify complete setup
  expect(owner.displayName).toBe('Team Leader');
  expect(team.name).toBe('Engineering Team');
  expect(team.slug).toBe('engineering');
  expect(members).toHaveLength(2);
  expect(invitations).toHaveLength(1);

  // Test navigation
  await page.goto(`/team-settings?teamSlug=${team.slug}`);
  await expect(page).toHaveURL(/team-settings/);
  await expect(page.locator(`text=${team.name}`)).toBeVisible();
});

// ============================================================================
// PATTERN 11: API Request with Authentication
// ============================================================================

test('EXAMPLE: authenticated API request', async ({ page }) => {
  const servers = await getServers();
  const { user } = await createAuthSession(page);

  // Make authenticated API request
  const response = await page.request.get(`${servers.apiUrl}/api/v1/public/get-user`);

  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.user?.email).toBe(user.email);
});

// ============================================================================
// PATTERN 12: Generate Unique Test Data
// ============================================================================

test('EXAMPLE: unique test data', async ({ page }) => {
  // Generate unique emails for each test run
  const email1 = generateEmail();
  const email2 = generateEmail();

  expect(email1).not.toBe(email2);
  expect(email1).toMatch(/@test\.com$/);

  // Use in test
  const { user } = await createAuthSession(page, {
    userData: { email: email1 }
  });

  expect(user.email).toBe(email1);
});

// ============================================================================
// PATTERN 13: Multiple Test Steps with Database Cleanup
// ============================================================================

test('EXAMPLE: multi-step with cleanup', async ({ page }) => {
  const testDb = await getTestDb();

  // Step 1: Clean start
  await testDb.clear();

  // Step 2: Create user
  const { user } = await createAuthSession(page);

  // Step 3: Test feature
  await page.goto('/your-settings');
  await expect(page.locator('input[name="displayName"]'))
    .toHaveValue(user.displayName);

  // Step 4: Clean up (automatic in most cases, but can be explicit)
  await testDb.clear();
});

// ============================================================================
// NOTES
// ============================================================================

/**
 * Key Benefits of This Approach:
 *
 * 1. **Single Import Source**: All helpers from one place
 * 2. **Standard Playwright**: No custom fixtures, no test.describe() errors
 * 3. **Type Safety**: Full TypeScript support
 * 4. **Flexibility**: Mix and match helpers as needed
 * 5. **Easy to Understand**: Helper functions are intuitive
 * 6. **No Magic**: Explicit calls, clear data flow
 *
 * Migration from Legacy Fixtures:
 *
 * OLD:
 * ```typescript
 * import { test } from '../fixtures';
 * test('old', async ({ authSession }) => {
 *   // authSession was a fixture
 * });
 * ```
 *
 * NEW:
 * ```typescript
 * import { test, createAuthSession } from '../fixtures';
 * test('new', async ({ page }) => {
 *   const { user } = await createAuthSession(page);
 * });
 * ```
 */
