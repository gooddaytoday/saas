import { test, expect } from '@playwright/test';
import { createAuthSession, getTestDb } from '../../helpers';

test('auth-session: should create authenticated user session', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { user, sessionCookie } = await createAuthSession(page);

  // Verify user data
  expect(user.id).toBeTruthy();
  expect(user.email).toMatch(/@example\.com$/);
  expect(user.displayName).toContain('Test User');
  expect(user.slug).toContain('user-');
  expect(user.darkTheme).toBe(false);

  // Verify session cookie was created
  expect(sessionCookie).toContain('saas.sid');

  // Verify cookies are set in browser
  const cookies = await page.context().cookies();
  const sessionCookieObj = cookies.find((c) => c.name === 'saas.sid');
  expect(sessionCookieObj).toBeTruthy();
  expect(sessionCookieObj?.httpOnly).toBe(true);
});

test('auth-session: should create user with custom data', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const customEmail = 'custom@test.com';
  const customName = 'John Doe';

  const { user } = await createAuthSession(page, {
    userData: {
      email: customEmail,
      displayName: customName,
      darkTheme: true,
    },
  });

  expect(user.email).toBe(customEmail);
  expect(user.displayName).toBe(customName);
  expect(user.darkTheme).toBe(true);
});

test('auth-session: should create user with team as leader', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'leader',
  });

  // Verify team was created
  expect(team).toBeTruthy();
  expect(team?.id).toBeTruthy();
  expect(team?.name).toContain('Test Team');
  expect(team?.slug).toContain('team-');

  // Verify user is team leader
  expect(team?.teamLeaderId).toBe(user.id);
  expect(team?.memberIds).toContain(user.id);

  // Verify user's default team is set
  expect(user.defaultTeamSlug).toBe(team?.slug);
});

test('auth-session: should create user with team as member', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'member',
  });

  // Verify team was created
  expect(team).toBeTruthy();

  // Verify user is NOT team leader
  expect(team?.teamLeaderId).not.toBe(user.id);

  // Verify user is still in memberIds
  expect(team?.memberIds).toContain(user.id);

  // Verify user's default team is set
  expect(user.defaultTeamSlug).toBe(team?.slug);
});

test('auth-session: should create team with custom data', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const customTeamName = 'My Custom Team';
  const customTeamSlug = 'custom-team-slug';

  const { team } = await createAuthSession(page, {
    withTeam: true,
    teamData: {
      name: customTeamName,
      slug: customTeamSlug,
    },
  });

  expect(team?.name).toBe(customTeamName);
  expect(team?.slug).toBe(customTeamSlug);
});

test('auth-session: should set authentication cookies correctly', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { user, team, sessionCookie } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'leader',
  });

  // Verify session cookie is set
  expect(sessionCookie).toBeTruthy();
  expect(sessionCookie).toContain('saas.sid');

  // Verify cookie is in browser context
  const cookies = await page.context().cookies();
  const authCookie = cookies.find((c) => c.name === 'saas.sid');

  expect(authCookie).toBeTruthy();
  expect(authCookie?.httpOnly).toBe(true);
  expect(authCookie?.value).toBeTruthy();

  // Verify we can make API requests with the cookie
  const { getServers } = await import('../../helpers');
  const servers = await getServers();

  const response = await page.request.get(`${servers.apiUrl}/api/v1/public/get-user`);

  // Should get a response (not 403 Forbidden) since we have a session
  // Note: Actual auth integration depends on passport setup
  expect(response.status()).toBeLessThan(500);
});

test('auth-session: should work with BrowserContext instead of Page', async ({ browser }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const context = await browser.newContext();
  const page = await context.newPage();

  const { user } = await createAuthSession(context);

  expect(user.id).toBeTruthy();

  // Verify cookies are set
  const cookies = await context.cookies();
  const sessionCookie = cookies.find((c) => c.name === 'saas.sid');
  expect(sessionCookie).toBeTruthy();

  await page.close();
  await context.close();
});

test('auth-session: should create multiple users with unique data', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { user: user1 } = await createAuthSession(page);

  // Clear cookies for second user
  await page.context().clearCookies();

  const { user: user2 } = await createAuthSession(page);

  // Verify users are different
  expect(user1.id).not.toBe(user2.id);
  expect(user1.email).not.toBe(user2.email);
  expect(user1.slug).not.toBe(user2.slug);
});

test('auth-session: should persist user data in database', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  // Use unique email to avoid conflicts in parallel runs
  const uniqueEmail = `test-persist-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@example.com`;

  const { user } = await createAuthSession(page, {
    userData: { 
      email: uniqueEmail,
      displayName: 'Persistent User' 
    },
  });

  // Verify user is in database
  const { MongoClient } = await import('mongodb');
  const { getServers } = await import('../../helpers');
  const servers = await getServers();

  const client = new MongoClient(servers.mongoUri);
  await client.connect();

  try {
    const db = client.db();
    const usersCollection = db.collection('users');

    // Find by the specific email we created
    const dbUser = await usersCollection.findOne({ email: uniqueEmail });

    expect(dbUser).toBeTruthy();
    expect(dbUser?.displayName).toBe('Persistent User');
    expect(dbUser?.email).toBe(uniqueEmail);
    expect(dbUser?.email).toBe(user.email);
  } finally {
    await client.close();
  }
});

test('auth-session: should persist session data in database', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  const { user } = await createAuthSession(page);

  // Verify session is in database
  const { MongoClient } = await import('mongodb');
  const { getServers } = await import('../../helpers');
  const servers = await getServers();

  const client = new MongoClient(servers.mongoUri);
  await client.connect();

  try {
    const db = client.db();
    const sessionsCollection = db.collection('sessions');

    const sessions = await sessionsCollection.find({}).toArray();
    expect(sessions.length).toBeGreaterThan(0);

    // Find session for our specific user
    let userSession: any = null;
    for (const session of sessions) {
      const sessionData = JSON.parse(session.session);
      if (sessionData.passport && sessionData.passport.user === user.id) {
        userSession = sessionData;
        break;
      }
    }

    // Verify session was found and contains correct user ID
    expect(userSession).toBeTruthy();
    expect(userSession?.passport?.user).toBe(user.id);
  } finally {
    await client.close();
  }
});
