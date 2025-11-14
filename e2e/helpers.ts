/**
 * Test helpers for accessing servers and database
 * These functions can be called inside tests to get access to test infrastructure
 */

import { Page, BrowserContext } from '@playwright/test';
import { getOrCreateServers, TestServers } from './utils/serverManager';
import { clearAllCollections } from './utils/testDbHelper';
import { generateEmail } from './utils/factories';

let cachedServers: TestServers | null = null;

/**
 * Get test servers (API and App URLs)
 * This function should be called inside tests to get server URLs
 */
export async function getServers(): Promise<TestServers> {
  if (!cachedServers) {
    cachedServers = await getOrCreateServers();
  }
  return cachedServers;
}

/**
 * Database helper interface
 */
export interface TestDb {
  clear: () => Promise<void>;
}

/**
 * Get test database helper
 */
export async function getTestDb(): Promise<TestDb> {
  const servers = await getServers();
  const { MongoClient } = await import('mongodb');

  return {
    clear: async () => {
      const client = new MongoClient(servers.mongoUri);
      await client.connect();
      try {
        const db = client.db();
        const collections = await db.listCollections().toArray();

        for (const collectionInfo of collections) {
          const collection = db.collection(collectionInfo.name);
          await collection.deleteMany({});
        }
      } finally {
        await client.close();
      }
    },
  };
}

/**
 * Authenticated user data
 */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  slug: string;
  darkTheme: boolean;
  defaultTeamSlug?: string;
}

/**
 * Team data
 */
export interface AuthTeam {
  id: string;
  name: string;
  slug: string;
  teamLeaderId: string;
  memberIds: string[];
}

/**
 * Auth session options
 */
export interface AuthSessionOptions {
  /** User data overrides */
  userData?: Partial<AuthUser>;
  /** Create a team for the user */
  withTeam?: boolean;
  /** Team data overrides (only used if withTeam=true) */
  teamData?: Partial<AuthTeam>;
  /** User role in team: 'leader' or 'member' */
  teamRole?: 'leader' | 'member';
}

/**
 * Auth session result
 */
export interface AuthSession {
  user: AuthUser;
  team?: AuthTeam;
  sessionCookie: string;
}

/**
 * Create an authenticated session for testing
 *
 * This helper function creates a user in the database and establishes
 * an authenticated session in the browser context.
 *
 * @param pageOrContext - Playwright Page or BrowserContext
 * @param options - Authentication options
 * @returns Auth session with user and optional team data
 *
 * @example
 * ```typescript
 * // Simple authenticated user
 * test('user feature', async ({ page }) => {
 *   const { user } = await createAuthSession(page);
 *   await page.goto('/your-settings');
 *   // User is now logged in
 * });
 *
 * // User with team (as leader)
 * test('team feature', async ({ page }) => {
 *   const { user, team } = await createAuthSession(page, {
 *     withTeam: true,
 *     teamRole: 'leader'
 *   });
 *   await page.goto('/team-settings');
 * });
 *
 * // Custom user data
 * test('custom user', async ({ page }) => {
 *   const { user } = await createAuthSession(page, {
 *     userData: { displayName: 'John Doe' }
 *   });
 * });
 * ```
 */
export async function createAuthSession(
  pageOrContext: Page | BrowserContext,
  options: AuthSessionOptions = {},
): Promise<AuthSession> {
  const servers = await getServers();
  const { MongoClient } = await import('mongodb');

  const {
    userData = {},
    withTeam = false,
    teamData = {},
    teamRole = 'leader',
  } = options;

  // Get browser context
  const context = 'context' in pageOrContext ? pageOrContext.context() : pageOrContext;

  // Connect to MongoDB
  const client = new MongoClient(servers.mongoUri);
  await client.connect();

  try {
    const db = client.db();

    // Generate user data
    const email = userData.email || generateEmail();
    const displayName = userData.displayName || `Test User ${Date.now()}`;
    const slug = userData.slug || `user-${Date.now()}`;

    // Create user in database
    const usersCollection = db.collection('users');
    const userDoc = {
      email,
      displayName,
      slug,
      createdAt: new Date(),
      darkTheme: userData.darkTheme ?? false,
      defaultTeamSlug: '',
      isSignedupViaGoogle: false,
      ...userData,
    };

    const userResult = await usersCollection.insertOne(userDoc);
    const userId = userResult.insertedId.toString();

    const user: AuthUser = {
      id: userId,
      email,
      displayName,
      slug,
      darkTheme: userDoc.darkTheme,
      defaultTeamSlug: userDoc.defaultTeamSlug,
    };

    let team: AuthTeam | undefined;

    // Create team if requested
    if (withTeam) {
      const teamName = teamData.name || `Test Team ${Date.now()}`;
      const teamSlug = teamData.slug || `team-${Date.now()}`;

      // If teamRole is 'member', we need to create a team leader first
      let actualLeaderId = userId;
      if (teamRole === 'member') {
        // Create a team leader user
        const leaderEmail = generateEmail();
        const leaderDisplayName = `Team Leader ${Date.now()}`;
        const leaderSlug = `leader-${Date.now()}`;

        const leaderDoc = {
          email: leaderEmail,
          displayName: leaderDisplayName,
          slug: leaderSlug,
          createdAt: new Date(),
          darkTheme: false,
          defaultTeamSlug: '',
          isSignedupViaGoogle: false,
        };

        const leaderResult = await usersCollection.insertOne(leaderDoc);
        actualLeaderId = leaderResult.insertedId.toString();
      }

      const teamsCollection = db.collection('teams');
      const teamDoc = {
        name: teamName,
        slug: teamSlug,
        createdAt: new Date(),
        teamLeaderId: actualLeaderId,
        memberIds: teamRole === 'member' ? [actualLeaderId, userId] : [userId],
        isSubscribed: false,
        ...teamData,
      };

      const teamResult = await teamsCollection.insertOne(teamDoc);
      const teamId = teamResult.insertedId.toString();

      team = {
        id: teamId,
        name: teamName,
        slug: teamSlug,
        teamLeaderId: actualLeaderId,
        memberIds: teamDoc.memberIds,
      };

      // Update user's default team
      await usersCollection.updateOne(
        { _id: userResult.insertedId },
        { $set: { defaultTeamSlug: teamSlug } }
      );

      user.defaultTeamSlug = teamSlug;
    }

    // Create session in MongoDB (compatible with connect-mongo format)
    const sessionsCollection = db.collection('sessions');
    const sessionId = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    const sessionData = {
      _id: sessionId,
      session: JSON.stringify({
        cookie: {
          originalMaxAge: 1209600000, // 14 days
          expires: new Date(Date.now() + 1209600000),
          secure: false,
          httpOnly: true,
          domain: 'localhost',
          path: '/',
        },
        passport: {
          user: userId, // Store as string - passport will handle ObjectId conversion
        },
      }),
      expires: new Date(Date.now() + 1209600000),
    };

    await sessionsCollection.insertOne(sessionData);

    // Create session cookie
    const sessionName = process.env.SESSION_NAME || 'saas.sid';
    const sessionCookie = `${sessionName}=s%3A${sessionId}.${generateSessionSignature(sessionId)}`;

    // Set cookie in browser context
    await context.addCookies([
      {
        name: sessionName,
        value: `s:${sessionId}.${generateSessionSignature(sessionId)}`,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        expires: Math.floor(Date.now() / 1000) + 1209600, // 14 days in seconds
      },
    ]);

    return {
      user,
      team,
      sessionCookie,
    };
  } finally {
    await client.close();
  }
}

/**
 * Generate session signature (simplified for testing)
 * In production, this would use the SESSION_SECRET to create an HMAC signature
 */
function generateSessionSignature(sessionId: string): string {
  // For testing purposes, we create a simple signature
  // In a real scenario, express-session uses HMAC with SESSION_SECRET
  const crypto = require('crypto');
  const secret = process.env.SESSION_SECRET || 'test-secret-key';
  return crypto
    .createHmac('sha256', secret)
    .update(sessionId)
    .digest('base64')
    .replace(/=+$/, '');
}
