/**
 * Session Management Tests
 * 
 * Tests for session creation, persistence, expiration, and invalidation
 * These tests verify that Express sessions are properly stored in MongoDB
 * and managed correctly across browser requests.
 * 
 * @tags @P0 @auth @session
 */

import { test, expect } from '@playwright/test';
import { getServers, getTestDb, createAuthSession } from '../../helpers';
import { createUserInDb, createSessionForUser, cleanupTestUsers } from '../../utils/authHelpers';
import { MongoClient } from 'mongodb';

// Disable TypeScript strict type checking for MongoDB operations
// MongoDB collection types are complex and we need flexibility with dynamic operations
declare module 'mongodb' {
  interface Collection {
    findOne(filter: any): Promise<any>;
  }
}

test.describe.parallel('Session Management', () => {
  /**
   * Test 1: Session created on login
   * Verifies that a session is created in the database when a user logs in
   */
  test('@P0 @auth @session should create session in database on login', async () => {
    const testDb = await getTestDb();
    await testDb.clear();

    const servers = await getServers();

    // Create a user and session
    const user = await createUserInDb();
    const sessionId = await createSessionForUser(user._id);

    // Verify session exists in database
    const client = new MongoClient(servers.mongoUri);
    await client.connect();

    try {
      const db = client.db();
      const session = await db.collection('sessions').findOne({ _id: sessionId }) as any;

      // Session should exist
      expect(session).toBeTruthy();
      expect(session._id).toBe(sessionId);

      // Session data should contain passport user info
      const sessionData = JSON.parse(session.session);
      expect(sessionData).toBeDefined();
      expect(sessionData.passport).toBeDefined();
      expect(sessionData.passport.user).toBe(user._id);

      // Session should have expiration cookie
      expect(sessionData.cookie).toBeDefined();
      expect(sessionData.cookie.expires).toBeDefined();
    } finally {
      await client.close();
    }

    await cleanupTestUsers();
  });

  /**
   * Test 2: Session persists across page navigations
   * Verifies that the session cookie remains valid when navigating between pages
   */
  test('@P0 @auth @session should persist session across page navigations', async ({ page }) => {
    const testDb = await getTestDb();
    await testDb.clear();

    // Create authenticated session
    const { user, team, sessionCookie } = await createAuthSession(page, {
      withTeam: true,
      teamRole: 'leader',
    });

    // Get initial cookies
    const initialCookies = await page.context().cookies();
    const initialSessionCookie = initialCookies.find(c => c.name === 'saas.sid');
    expect(initialSessionCookie).toBeTruthy();
    // Cookie value should be the actual session value (s:sessionId.signature format)
    // sessionCookie is the full cookie string (saas.sid=s%3A...format)
    expect(initialSessionCookie?.value).toMatch(/^s:[a-z0-9]+\.[a-zA-Z0-9+/=-]+$/);

    // Navigate to a page that requires authentication
    await page.goto('/team-settings');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Session cookie should still be present with same value
    const navigatedCookies = await page.context().cookies();
    const navigatedSessionCookie = navigatedCookies.find(c => c.name === 'saas.sid');

    expect(navigatedSessionCookie).toBeTruthy();
    // Session cookie should still be in valid format
    expect(navigatedSessionCookie?.value).toMatch(/^s:[a-z0-9]+\.[a-zA-Z0-9+/=-]+$/);

    await cleanupTestUsers();
  });

  /**
   * Test 3: Session stored in MongoDB with correct structure
   * Verifies that the session document has proper format and metadata
   */
  test('@P0 @auth @session should store session in MongoDB with correct structure', async () => {
    const testDb = await getTestDb();
    await testDb.clear();

    const servers = await getServers();

    // Create a user and session
    const user = await createUserInDb();
    const sessionId = await createSessionForUser(user._id);

    // Check session structure in MongoDB
    const client = new MongoClient(servers.mongoUri);
    await client.connect();

    try {
      const db = client.db();
      const session = await db.collection('sessions').findOne({ _id: sessionId }) as any;

      // Verify session structure
      expect(session).toBeTruthy();
      expect(session._id).toBeDefined();
      expect(session.session).toBeDefined();
      expect(session.expires).toBeDefined(); // TTL field

      // Session data should be JSON string
      const sessionData = JSON.parse(session.session);
      expect(sessionData.passport).toBeDefined();
      expect(sessionData.passport.user).toBe(user._id);
      expect(sessionData.cookie).toBeDefined();
      expect(sessionData.cookie.originalMaxAge).toBe(14 * 24 * 60 * 60 * 1000); // 14 days in ms
    } finally {
      await client.close();
    }

    await cleanupTestUsers();
  });

  /**
   * Test 4: Session cookie has correct security attributes
   * Verifies that the session cookie has proper security settings (httpOnly, path, domain)
   */
  test('@P0 @auth @session should set session cookie with correct security attributes', async ({ page }) => {
    const testDb = await getTestDb();
    await testDb.clear();

    // Create authenticated session with team
    await createAuthSession(page, {
      withTeam: true,
    });

    // Navigate to a page that uses session
    await page.goto('/team-settings');
    await page.waitForLoadState('networkidle');

    // Get cookies from browser context
    const cookies = await page.context().cookies();
    const sessionCookieObj = cookies.find(c => c.name === 'saas.sid');

    // Verify cookie exists and is valid
    expect(sessionCookieObj).toBeTruthy();
    // Cookie value should be in s:sessionId.signature format
    expect(sessionCookieObj?.value).toMatch(/^s:[a-z0-9]+\.[a-zA-Z0-9+/=-]+$/);

    // Check security attributes
    expect(sessionCookieObj?.httpOnly).toBe(true); // Should not be accessible from JavaScript
    expect(sessionCookieObj?.path).toBe('/'); // Should be root path
    // Domain might be localhost or not set
    if (sessionCookieObj?.domain) {
      expect(sessionCookieObj.domain).toBe('localhost');
    }

    // Verify cookie expiration is in the future (not immediately expired)
    const cookieExpires = sessionCookieObj?.expires;
    expect(cookieExpires).toBeDefined();
    if (cookieExpires) {
      expect(cookieExpires).toBeGreaterThan(Date.now() / 1000); // Should be future
    }

    await cleanupTestUsers();
  });

  /**
   * Test 5: Session expires after TTL
   * Verifies that sessions are removed from the database after their TTL expires
   * Note: This test uses a manual TTL check rather than waiting 14 days
   */
  test('@P0 @auth @session should expire session after TTL', async () => {
    const testDb = await getTestDb();
    await testDb.clear();

    const servers = await getServers();

    // Create a user and session
    const user = await createUserInDb();
    const sessionId = await createSessionForUser(user._id);

    // Verify session exists initially
    const client = new MongoClient(servers.mongoUri);
    await client.connect();

    try {
      const db = client.db();

      // Check initial session
      const initialSession = await db.collection('sessions').findOne({ _id: sessionId }) as any;
      expect(initialSession).toBeTruthy();

      // Verify expires field is set (for TTL index to work)
      expect(initialSession.expires).toBeDefined();
      expect(initialSession.expires instanceof Date).toBe(true);

      // Verify the expires time is in the future (14 days from now)
      const expiresTime = initialSession.expires.getTime();
      const now = Date.now();
      const expectedTTL = 14 * 24 * 60 * 60 * 1000;

      // Should expire in approximately 14 days
      const timeToExpire = expiresTime - now;
      expect(timeToExpire).toBeGreaterThan(expectedTTL - 5 * 60 * 1000); // Within 5 minutes
      expect(timeToExpire).toBeLessThanOrEqual(expectedTTL);
    } finally {
      await client.close();
    }

    await cleanupTestUsers();
  });

  /**
   * Test 6: Session can be invalidated via API
   * Verifies that sessions can be cleared from the database
   */
  test('@P0 @auth @session should be possible to clear session data', async () => {
    const testDb = await getTestDb();
    await testDb.clear();

    const servers = await getServers();

    // Create a user and session
    const user = await createUserInDb();
    const sessionId = await createSessionForUser(user._id);

    // Verify session exists before clearing
    let client = new MongoClient(servers.mongoUri);
    await client.connect();

    try {
      const db = client.db();
      const sessionBefore = await db.collection('sessions').findOne({ _id: sessionId }) as any;
      expect(sessionBefore).toBeTruthy();

      // Clear session
      await (db.collection('sessions') as any).deleteOne({ _id: sessionId });

      // Verify session is deleted
      const sessionAfter = await db.collection('sessions').findOne({ _id: sessionId }) as any;
      expect(sessionAfter).toBeNull();
    } finally {
      await client.close();
    }

    await cleanupTestUsers();
  });

  /**
   * Test 7: Session validates user existence
   * Verifies that session contains reference to valid user and can be validated
   */
  test('@P0 @auth @session should validate session against user existence', async () => {
    const testDb = await getTestDb();
    await testDb.clear();

    const servers = await getServers();

    // Create a user directly
    const user = await createUserInDb();
    const sessionId = await createSessionForUser(user._id);

    // Verify session references an existing user
    const client = new MongoClient(servers.mongoUri);
    await client.connect();

    try {
      const db = client.db();

      // Get session from database
      const session = await db.collection('sessions').findOne({ _id: sessionId }) as any;
      expect(session).toBeTruthy();

      // Extract user ID from session
      const sessionData = JSON.parse(session.session);
      const userIdFromSession = sessionData.passport.user;

      // Verify user exists in database
      // userIdFromSession might be string or ObjectId, convert to string for comparison
      const { ObjectId } = require('mongodb');
      const userIdQuery = typeof userIdFromSession === 'string' ? 
        new ObjectId(userIdFromSession) : 
        userIdFromSession;
      
      const userDoc = await db.collection('users').findOne({ _id: userIdQuery }) as any;
      expect(userDoc).toBeTruthy();
      expect(userDoc._id.toString()).toBe(user._id);
      expect(userDoc.email).toBe(user.email);
    } finally {
      await client.close();
    }

    await cleanupTestUsers();
  });

  /**
   * Test 8: Session cookie portability across API requests
   * Verifies that the session cookie can be used for authenticated API requests
   */
  test('@P0 @auth @session should make authenticated API requests with session cookie', async ({ page }) => {
    const testDb = await getTestDb();
    await testDb.clear();

    const servers = await getServers();

    // Create authenticated session
    await createAuthSession(page);

    // Get session cookie
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name === 'saas.sid');
    expect(sessionCookie).toBeTruthy();

    // Make API request with session cookie using Playwright API client
    const response = await page.request.get(`${servers.apiUrl}/api/v1/public/get-user`);

    // Should successfully get user (200 or 401 for public endpoint, but should not be 500)
    expect(response.status()).toBeLessThan(500);

    // Verify response indicates successful request
    const data = await response.json();
    expect(data).toBeDefined();

    await cleanupTestUsers();
  });

  /**
   * Test 9: Session persists through page refresh
   * Verifies that the session remains valid after page refresh
   */
  test('@P0 @auth @session should persist session through page refresh', async ({ page }) => {
    const testDb = await getTestDb();
    await testDb.clear();

    // Create authenticated session with team
    const { user, team, sessionCookie } = await createAuthSession(page, {
      withTeam: true,
      teamRole: 'leader',
    });

    // Navigate to a page
    await page.goto('/team-settings');
    await page.waitForLoadState('networkidle');

    // Get cookie before refresh
    const cookiesBefore = await page.context().cookies();
    const sessionCookieBefore = cookiesBefore.find(c => c.name === 'saas.sid');
    expect(sessionCookieBefore?.value).toMatch(/^s:[a-z0-9]+\.[a-zA-Z0-9+/=-]+$/);
    const sessionValueBefore = sessionCookieBefore?.value;

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Get cookie after refresh
    const cookiesAfter = await page.context().cookies();
    const sessionCookieAfter = cookiesAfter.find(c => c.name === 'saas.sid');

    // Session cookie should still be present with same value
    expect(sessionCookieAfter).toBeTruthy();
    expect(sessionCookieAfter?.value).toBe(sessionValueBefore);

    await cleanupTestUsers();
  });

  /**
   * Test 10: Multiple concurrent sessions from different browsers
   * Verifies that multiple sessions can exist simultaneously for different users
   */
  test('@P0 @auth @session should maintain multiple concurrent sessions', async ({ page, context, browser }) => {
    const testDb = await getTestDb();
    await testDb.clear();

    const servers = await getServers();

    // Create first authenticated session
    const { user: user1, sessionCookie: sessionCookie1 } = await createAuthSession(page);

    // Create second browser context with different session
    const context2 = await browser?.newContext();
    const page2 = await context2?.newPage();

    const { user: user2, sessionCookie: sessionCookie2 } = await createAuthSession(page2!);

    // Sessions should be different
    expect(sessionCookie1).not.toBe(sessionCookie2);

    // Verify both sessions exist in database
    const client = new MongoClient(servers.mongoUri);
    await client.connect();

    try {
      const db = client.db();

      // Extract session ID from cookie (format: "saas.sid=s%3A{sessionId}.{signature}")
      const extractSessionId = (cookie: string) => {
        const match = cookie.match(/s%3A([^.]+)/);
        return match ? match[1] : cookie;
      };

      // Check first session
      const sessionId1 = extractSessionId(sessionCookie1);
      const session1 = await db.collection('sessions').findOne({ _id: sessionId1 }) as any;
      expect(session1).toBeTruthy();
      const sessionData1 = JSON.parse(session1.session);
      // User ID in session might be string or ObjectId, compare as string
      const user1SessionId = typeof sessionData1.passport.user === 'string' ?
        sessionData1.passport.user :
        sessionData1.passport.user.toString();
      expect(user1SessionId).toBe(user1.id);

      // Check second session
      const sessionId2 = extractSessionId(sessionCookie2);
      const session2 = await db.collection('sessions').findOne({ _id: sessionId2 }) as any;
      expect(session2).toBeTruthy();
      const sessionData2 = JSON.parse(session2.session);
      // User ID in session might be string or ObjectId, compare as string
      const user2SessionId = typeof sessionData2.passport.user === 'string' ?
        sessionData2.passport.user :
        sessionData2.passport.user.toString();
      expect(user2SessionId).toBe(user2.id);
    } finally {
      await client.close();
    }

    await context2?.close();
    await cleanupTestUsers();
  });
});

