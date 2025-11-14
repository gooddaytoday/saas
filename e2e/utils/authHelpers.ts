/**
 * Authentication helpers for E2E tests
 * Functions to create authenticated users and manage sessions for testing
 */

import { Page } from '@playwright/test';
import { getServers } from '../helpers';
import { getTestDb } from '../helpers';
import { generateEmail, createUserData, createTeamData } from './factories';
import { MongoClient } from 'mongodb';

// Use generic types to avoid importing from API models (which causes TypeScript to compile them)
type UserDocument = any;
type TeamDocument = any;

/**
 * Test user interface
 */
export interface TestUser {
  _id: string;
  email: string;
  displayName: string;
  slug: string;
  defaultTeamSlug?: string;
  isSignedupViaGoogle?: boolean;
}

/**
 * Test team interface
 */
export interface TestTeam {
  _id: string;
  name: string;
  slug: string;
  teamLeaderId: string;
  memberIds: string[];
}

/**
 * Create a user directly in the database
 */
export async function createUserInDb(overrides: Partial<UserDocument> = {}): Promise<TestUser> {
  const testDb = await getTestDb();
  const servers = await getServers();

  const client = new MongoClient(servers.mongoUri);
  await client.connect();

  try {
    const db = client.db();

    // Generate user data
    const userData = {
      ...createUserData(),
      createdAt: new Date(),
      slug: `user-${Math.random().toString(36).substring(7)}`,
      defaultTeamSlug: '',
      isSignedupViaGoogle: false,
      ...overrides,
    };

    // Insert user
    const result = await db.collection('users').insertOne(userData);

    return {
      _id: result.insertedId.toString(),
      email: userData.email,
      displayName: userData.name,
      slug: userData.slug,
      defaultTeamSlug: userData.defaultTeamSlug,
      isSignedupViaGoogle: userData.isSignedupViaGoogle,
    };
  } finally {
    await client.close();
  }
}

/**
 * Create a team directly in the database
 */
export async function createTeamInDb(teamLeaderId: string, overrides: Partial<TeamDocument> = {}): Promise<TestTeam> {
  const testDb = await getTestDb();
  const servers = await getServers();

  const client = new MongoClient(servers.mongoUri);
  await client.connect();

  try {
    const db = client.db();

    // Generate team data
    const teamData = {
      ...createTeamData(),
      teamLeaderId,
      memberIds: [teamLeaderId],
      createdAt: new Date(),
      defaultTeam: true,
      avatarUrl: 'https://storage.googleapis.com/saas-boilerplate-main/default-team-avatar.png',
      ...overrides,
    };

    // Insert team
    const result = await db.collection('teams').insertOne(teamData);

    return {
      _id: result.insertedId.toString(),
      name: teamData.name,
      slug: teamData.slug,
      teamLeaderId: teamData.teamLeaderId,
      memberIds: teamData.memberIds,
    };
  } finally {
    await client.close();
  }
}

/**
 * Create a user with a team and update user's defaultTeamSlug
 */
export async function createUserWithTeamInDb(): Promise<{ user: TestUser; team: TestTeam }> {
  const user = await createUserInDb();
  const team = await createTeamInDb(user._id);

  // Update user's defaultTeamSlug
  const servers = await getServers();
  const client = new MongoClient(servers.mongoUri);
  await client.connect();

  try {
    const db = client.db();
    await db.collection('users').updateOne(
      { _id: user._id as any },
      { $set: { defaultTeamSlug: team.slug } }
    );

    return {
      user: { ...user, defaultTeamSlug: team.slug },
      team,
    };
  } finally {
    await client.close();
  }
}

/**
 * Create a session for a user and return session cookie
 * This simulates a logged-in session
 */
export async function createSessionForUser(userId: string): Promise<string> {
  const servers = await getServers();

  // Create a simple session object (simplified version of what Passport creates)
  const sessionData = {
    passport: {
      user: userId,
    },
    cookie: {
      originalMaxAge: 1209600000, // 14 days in milliseconds
      expires: new Date(Date.now() + 1209600000),
      secure: false,
      httpOnly: true,
      path: '/',
    },
  };

  // In a real scenario, this would be stored in MongoDB session store
  // For testing, we'll create a mock session ID
  const sessionId = `test-session-${Math.random().toString(36).substring(7)}`;

  // Store session in database (simplified)
  const client = new MongoClient(servers.mongoUri);
  await client.connect();

  try {
    const db = client.db();
    await db.collection('sessions').insertOne({
      _id: sessionId,
      session: JSON.stringify(sessionData),
      expires: sessionData.cookie.expires,
    } as any);

    return sessionId;
  } finally {
    await client.close();
  }
}

/**
 * Set authentication cookies on a page to simulate logged-in user
 */
export async function authenticateUserOnPage(page: Page, userId: string): Promise<void> {
  const sessionId = await createSessionForUser(userId);
  const servers = await getServers();

  // Set session cookie
  await page.context().addCookies([
    {
      name: 'connect.sid', // Default session cookie name for express-session
      value: sessionId,
      url: servers.appUrl,
      httpOnly: true,
      secure: false,
    },
  ]);
}

/**
 * Create a user and authenticate them on a page
 */
export async function createAndAuthenticateUser(page: Page, withTeam: boolean = false): Promise<TestUser> {
  let user: TestUser;

  if (withTeam) {
    const { user: userWithTeam } = await createUserWithTeamInDb();
    user = userWithTeam;
  } else {
    user = await createUserInDb();
  }

  await authenticateUserOnPage(page, user._id);
  return user;
}

/**
 * Clean up test users and sessions
 */
export async function cleanupTestUsers(): Promise<void> {
  const testDb = await getTestDb();
  const servers = await getServers();

  const client = new MongoClient(servers.mongoUri);
  await client.connect();

  try {
    const db = client.db();

    // Remove test users (those with email starting with 'test-')
    await db.collection('users').deleteMany({
      email: { $regex: '^test-' },
    });

    // Remove test teams
    await db.collection('teams').deleteMany({
      name: { $regex: '^Test Team' },
    });

    // Remove test sessions
    await db.collection('sessions').deleteMany({
      _id: { $regex: '^test-session-' } as any,
    });
  } finally {
    await client.close();
  }
}
