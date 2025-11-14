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
  avatarUrl?: string;
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

    await sessionsCollection.insertOne(sessionData as any);

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

/**
 * Team member data
 */
export interface TeamMember {
  id: string;
  email: string;
  displayName: string;
  slug: string;
  isLeader: boolean;
}

/**
 * Invitation data
 */
export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  token: string;
  createdAt: Date;
}

/**
 * Team context options
 */
export interface TeamContextOptions {
  /** Owner (team leader) data overrides */
  ownerData?: Partial<AuthUser>;
  /** Team data overrides */
  teamData?: Partial<AuthTeam>;
  /** Number of additional members to create */
  membersCount?: number;
  /** Custom data for members */
  membersData?: Array<Partial<AuthUser>>;
  /** Invitation emails to create tokens for */
  invitationEmails?: string[];
}

/**
 * Team context result
 */
export interface TeamContext {
  /** Team owner (leader) */
  owner: AuthUser;
  /** Team data */
  team: AuthTeam;
  /** Team members (excluding owner) */
  members: TeamMember[];
  /** All team members (including owner) */
  allMembers: TeamMember[];
  /** Invitation tokens */
  invitations: TeamInvitation[];
  /** Owner's session cookie */
  sessionCookie: string;
}

/**
 * Generate invitation token
 */
function generateInvitationToken(): string {
  const gen = () =>
    Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
  return gen();
}

/**
 * Create a team context for testing
 *
 * This helper creates a complete team setup including:
 * - Team owner (leader) with authenticated session
 * - Team with specified configuration
 * - Additional team members (optional)
 * - Invitation tokens (optional)
 *
 * @param pageOrContext - Playwright Page or BrowserContext
 * @param options - Team context options
 * @returns Team context with owner, team, members, and invitations
 *
 * @example
 * ```typescript
 * // Simple team with owner
 * test('team feature', async ({ page }) => {
 *   const { owner, team } = await createTeamContext(page);
 *   // Owner is logged in, team is created
 * });
 *
 * // Team with additional members
 * test('team with members', async ({ page }) => {
 *   const { owner, team, members } = await createTeamContext(page, {
 *     membersCount: 3
 *   });
 *   // Team has owner + 3 members
 * });
 *
 * // Team with invitations
 * test('team with invitations', async ({ page }) => {
 *   const { team, invitations } = await createTeamContext(page, {
 *     invitationEmails: ['invite1@example.com', 'invite2@example.com']
 *   });
 *   // Invitation tokens created for specified emails
 * });
 *
 * // Custom team and owner data
 * test('custom team', async ({ page }) => {
 *   const { owner, team } = await createTeamContext(page, {
 *     ownerData: { displayName: 'Team Leader' },
 *     teamData: { name: 'My Custom Team' }
 *   });
 * });
 * ```
 */
export async function createTeamContext(
  pageOrContext: Page | BrowserContext,
  options: TeamContextOptions = {},
): Promise<TeamContext> {
  const servers = await getServers();
  const { MongoClient } = await import('mongodb');

  const {
    ownerData = {},
    teamData = {},
    membersCount = 0,
    membersData = [],
    invitationEmails = [],
  } = options;

  // Get browser context
  const context = 'context' in pageOrContext ? pageOrContext.context() : pageOrContext;

  // Connect to MongoDB
  const client = new MongoClient(servers.mongoUri);
  await client.connect();

  try {
    const db = client.db();
    const usersCollection = db.collection('users');
    const teamsCollection = db.collection('teams');
    const invitationsCollection = db.collection('invitations');

    // 1. Create team owner (leader)
    const ownerEmail = ownerData.email || generateEmail();
    const ownerDisplayName = ownerData.displayName || `Team Leader ${Date.now()}`;
    const ownerSlug = ownerData.slug || `leader-${Date.now()}`;

    const ownerDoc = {
      email: ownerEmail,
      displayName: ownerDisplayName,
      slug: ownerSlug,
      createdAt: new Date(),
      darkTheme: ownerData.darkTheme ?? false,
      defaultTeamSlug: '',
      isSignedupViaGoogle: false,
      ...ownerData,
    };

    const ownerResult = await usersCollection.insertOne(ownerDoc);
    const ownerId = ownerResult.insertedId.toString();

    // 2. Create team
    const teamName = teamData.name || `Test Team ${Date.now()}`;
    const teamSlug = teamData.slug || `team-${Date.now()}`;

    const teamDoc = {
      name: teamName,
      slug: teamSlug,
      createdAt: new Date(),
      teamLeaderId: ownerId,
      memberIds: [ownerId],
      isSubscriptionActive: false,
      avatarUrl: teamData.avatarUrl || 'https://example.com/avatar.jpg',
      defaultTeam: true,
      ...teamData,
    };

    const teamResult = await teamsCollection.insertOne(teamDoc);
    const teamId = teamResult.insertedId.toString();

    // Update owner's default team
    await usersCollection.updateOne(
      { _id: ownerResult.insertedId },
      { $set: { defaultTeamSlug: teamSlug } }
    );

    const owner: AuthUser = {
      id: ownerId,
      email: ownerEmail,
      displayName: ownerDisplayName,
      slug: ownerSlug,
      darkTheme: ownerDoc.darkTheme,
      defaultTeamSlug: teamSlug,
    };

    // 3. Create additional team members
    const members: TeamMember[] = [];
    const allMemberIds = [ownerId];

    const totalMembers = Math.max(membersCount, membersData.length);
    for (let i = 0; i < totalMembers; i++) {
      const memberOverrides = membersData[i] || {};
      const memberEmail = memberOverrides.email || generateEmail();
      const memberDisplayName = memberOverrides.displayName || `Team Member ${i + 1}`;
      const memberSlug = memberOverrides.slug || `member-${Date.now()}-${i}`;

      const memberDoc = {
        email: memberEmail,
        displayName: memberDisplayName,
        slug: memberSlug,
        createdAt: new Date(),
        darkTheme: memberOverrides.darkTheme ?? false,
        defaultTeamSlug: teamSlug,
        isSignedupViaGoogle: false,
        ...memberOverrides,
      };

      const memberResult = await usersCollection.insertOne(memberDoc);
      const memberId = memberResult.insertedId.toString();
      allMemberIds.push(memberId);

      members.push({
        id: memberId,
        email: memberEmail,
        displayName: memberDisplayName,
        slug: memberSlug,
        isLeader: false,
      });
    }

    // Update team with all member IDs
    if (members.length > 0) {
      await teamsCollection.updateOne(
        { _id: teamResult.insertedId },
        { $set: { memberIds: allMemberIds } }
      );
    }

    const team: AuthTeam = {
      id: teamId,
      name: teamName,
      slug: teamSlug,
      teamLeaderId: ownerId,
      memberIds: allMemberIds,
    };

    // 4. Create invitation tokens
    const invitations: TeamInvitation[] = [];
    for (const email of invitationEmails) {
      const token = generateInvitationToken();
      const invitationDoc = {
        teamId,
        email,
        token,
        createdAt: new Date(),
      };

      const invitationResult = await invitationsCollection.insertOne(invitationDoc);

      invitations.push({
        id: invitationResult.insertedId.toString(),
        teamId,
        email,
        token,
        createdAt: invitationDoc.createdAt,
      });
    }

    // 5. Create session for owner
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
          user: ownerId,
        },
      }),
      expires: new Date(Date.now() + 1209600000),
    };

    await sessionsCollection.insertOne(sessionData as any);

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

    // Build allMembers list
    const allMembers: TeamMember[] = [
      {
        id: ownerId,
        email: ownerEmail,
        displayName: ownerDisplayName,
        slug: ownerSlug,
        isLeader: true,
      },
      ...members,
    ];

    return {
      owner,
      team,
      members,
      allMembers,
      invitations,
      sessionCookie,
    };
  } finally {
    await client.close();
  }
}
