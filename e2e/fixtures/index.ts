/**
 * E2E Test Fixtures and Helpers - Centralized Export
 *
 * This file provides a single import point for all test helpers and utilities.
 *
 * IMPORTANT: We use STANDARD test/expect from Playwright, NOT custom fixtures.
 * According to e2e-testing.mdc rules, custom fixtures cause errors with test.describe().
 * Instead, we use helper functions that can be called inside tests.
 *
 * @example Basic usage
 * ```typescript
 * import { test, expect } from '../fixtures';
 * import { getServers, createAuthSession } from '../fixtures';
 *
 * test('my test', async ({ page }) => {
 *   const servers = await getServers();
 *   const { user } = await createAuthSession(page);
 *   await page.goto(servers.appUrl + '/dashboard');
 * });
 * ```
 */

// ============================================================================
// STANDARD PLAYWRIGHT TEST AND EXPECT (NO CUSTOM EXTENSIONS)
// ============================================================================

export { test, expect } from '@playwright/test';

// ============================================================================
// CORE HELPERS FROM helpers.ts
// ============================================================================

export {
  // Server and database access
  getServers,
  getTestDb,

  // Authentication helpers
  createAuthSession,

  // Team context helpers
  createTeamContext,
} from '../helpers';

// ============================================================================
// TYPE EXPORTS FROM helpers.ts
// ============================================================================

export type {
  // Database types
  TestDb,

  // Authentication types
  AuthUser,
  AuthTeam,
  AuthSessionOptions,
  AuthSession,

  // Team context types
  TeamMember,
  TeamInvitation,
  TeamContextOptions,
  TeamContext,
} from '../helpers';

// Server types from serverManager
export type { TestServers } from '../utils/serverManager';

// ============================================================================
// UTILITY EXPORTS (Optional - for convenience)
// ============================================================================

// Data factories
export {
  generateEmail,
  createUserData,
  createTeamData,
  createDiscussionData,
  createPostData,
} from '../utils/factories';

// Auth utilities
export {
  createUserInDb,
  createTeamInDb,
  createSessionForUser,
  createAndAuthenticateUser,
  createUserWithTeamInDb,
  cleanupTestUsers,
  authenticateUserOnPage,
} from '../utils/authHelpers';

export type {
  TestUser,
  TestTeam,
} from '../utils/authHelpers';

// ============================================================================
// USAGE EXAMPLES AND PATTERNS
// ============================================================================

/**
 * PATTERN 1: Basic authenticated test
 *
 * ```typescript
 * import { test, expect, createAuthSession } from '../fixtures';
 *
 * test('user profile', async ({ page }) => {
 *   const { user } = await createAuthSession(page);
 *   await page.goto('/your-settings');
 *   await expect(page.locator('input[name="displayName"]')).toHaveValue(user.displayName);
 * });
 * ```
 */

/**
 * PATTERN 2: Team leader test
 *
 * ```typescript
 * import { test, expect, createAuthSession } from '../fixtures';
 *
 * test('team settings', async ({ page }) => {
 *   const { user, team } = await createAuthSession(page, {
 *     withTeam: true,
 *     teamRole: 'leader'
 *   });
 *
 *   await page.goto(`/team-settings?teamSlug=${team.slug}`);
 *   await expect(page).toHaveURL(/team-settings/);
 * });
 * ```
 */

/**
 * PATTERN 3: Team with multiple members
 *
 * ```typescript
 * import { test, expect, createTeamContext } from '../fixtures';
 *
 * test('team members', async ({ page }) => {
 *   const { owner, team, members } = await createTeamContext(page, {
 *     membersCount: 3
 *   });
 *
 *   await page.goto(`/team-settings?teamSlug=${team.slug}`);
 *   await expect(page.locator(`text=${members[0].displayName}`)).toBeVisible();
 * });
 * ```
 */

/**
 * PATTERN 4: Clean database before test
 *
 * ```typescript
 * import { test, expect, getTestDb } from '../fixtures';
 *
 * test('fresh start', async ({ page }) => {
 *   const testDb = await getTestDb();
 *   await testDb.clear();
 *
 *   // Database is now empty
 *   await page.goto('/login');
 * });
 * ```
 */

/**
 * PATTERN 5: API requests
 *
 * ```typescript
 * import { test, expect, getServers } from '../fixtures';
 *
 * test('api endpoint', async ({ page }) => {
 *   const servers = await getServers();
 *   const response = await page.request.get(`${servers.apiUrl}/api/v1/public/get-user`);
 *   expect(response.status()).toBeLessThan(500);
 * });
 * ```
 */

/**
 * PATTERN 6: Custom test data
 *
 * ```typescript
 * import { test, expect, createAuthSession, createUserData } from '../fixtures';
 *
 * test('custom user', async ({ page }) => {
 *   const { user } = await createAuthSession(page, {
 *     userData: createUserData({
 *       displayName: 'John Doe',
 *       email: 'john@example.com',
 *       darkTheme: true
 *     })
 *   });
 *
 *   expect(user.displayName).toBe('John Doe');
 * });
 * ```
 */
