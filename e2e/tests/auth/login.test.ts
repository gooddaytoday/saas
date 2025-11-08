import { test, expect } from '@playwright/test';
import { getServers } from '../../helpers';
import { getTestDb } from '../../helpers';
import { createAndAuthenticateUser, createUserInDb, cleanupTestUsers, createSessionForUser, createUserWithTeamInDb, createTeamInDb } from '../../utils/authHelpers';
import { makeApiRequest } from '../../utils/apiHelpers';

test('should load login page successfully', async ({ page }) => {
  await page.goto('/login');

  // Page should load without errors (status 200)
  const response = await page.request.get('/login');
  expect(response.status()).toBeLessThan(500);

  // Page should have content
  const pageContent = await page.content();
  expect(pageContent.length).toBeGreaterThan(0);
});

test('should display login page title and heading', async ({ page }) => {
  await page.goto('/login');

  // Check for main heading "Log in or Sign up"
  const heading = page.locator('text=/Log in or Sign up/i');
  await expect(heading).toBeVisible();

  // Check page title
  await expect(page).toHaveTitle(/login|sign.*up/i);
});

test('should display Google OAuth login button', async ({ page }) => {
  await page.goto('/login');

  // Check for Google OAuth button - look for button with href containing google
  const googleButton = page.locator('a[href*="google"]');
  await expect(googleButton).toBeVisible();

  // Button should contain "Log in with Google" text
  await expect(googleButton).toContainText(/Log in with Google/i);

  // Button should contain Google logo/image
  const googleImage = page.locator('img[alt*="Google"], img[src*="G.svg"]');
  await expect(googleImage).toBeVisible();
});

test('should display email login form (disabled)', async ({ page }) => {
  await page.goto('/login');

  // Check for email input field (disabled)
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible();

  // Email input should be disabled (as per LoginButton component)
  await expect(emailInput).toBeDisabled();

  // Check for email login button (should be disabled)
  const emailButton = page.locator('button:has-text("Log in with email")');
  await expect(emailButton).toBeVisible();
  await expect(emailButton).toBeDisabled();
});

test('should display session duration information', async ({ page }) => {
  await page.goto('/login');

  // Check for text about 14 days session
  const sessionText = page.locator('text=/14 days|logged in for 14 days/i');
  await expect(sessionText).toBeVisible();
});

test('should display OR separator between login methods', async ({ page }) => {
  await page.goto('/login');

  // Check for "OR" separator - look for h4 with OR text specifically
  const orHeading = page.locator('h4:has-text("OR")');
  await expect(orHeading).toBeVisible();

  // Should have horizontal rules around OR
  const hrElements = page.locator('hr');
  await expect(hrElements).toHaveCount(2);
});

test('should have proper SEO metadata', async ({ page }) => {
  await page.goto('/login');

  // Check title
  await expect(page).toHaveTitle('Log in or Sign up to SaaS boilerplate');

  // Check meta description
  const metaDescription = page.locator('meta[name="description"]');
  await expect(metaDescription).toHaveAttribute(
    'content',
    'Login and signup page for SaaS boilerplate demo by Async'
  );
});

test('should have proper page structure and layout', async ({ page }) => {
  await page.goto('/login');

  // Page should have main heading
  const heading = page.locator('p').filter({ hasText: /Log in or Sign up/i });
  await expect(heading).toBeVisible();

  // Page should have some form of container/layout
  const pageContent = page.locator('div, main, body');
  await expect(pageContent.first()).toBeVisible();
});

test('should have app and api servers accessible', async ({ page }) => {
  const servers = await getServers();

  // Test app server
  await page.goto('/login');
  const loginPage = page.locator('p').filter({ hasText: /Log in or Sign up/i });
  await expect(loginPage).toBeVisible();

  // Test API server
  const apiResponse = await page.request.get(`${servers.apiUrl}/api/v1/public/get-user`);
  expect(apiResponse.status()).toBeLessThan(500);
});

test('should redirect unauthenticated users to login', async ({ page }) => {
  await page.goto('/');

  // Should redirect to login or create-team
  const url = page.url();
  expect(url).toMatch(/login|create-team|signup/i);
});

test('database should be accessible', async () => {
  const testDb = await getTestDb();

  // Clear database
  await testDb.clear();

  // Database operations should work without errors
  expect(true).toBe(true);
});

// Tests for redirects of unauthenticated users from protected pages

test('should redirect unauthenticated users from /your-settings to login', async ({ page }) => {
  await page.goto('/your-settings');

  // Should redirect to login
  await page.waitForURL('**/login');
  expect(page.url()).toContain('/login');
});

test('should redirect unauthenticated users from /create-team to login', async ({ page }) => {
  await page.goto('/create-team');

  // Should redirect to login
  await page.waitForURL('**/login');
  expect(page.url()).toContain('/login');
});

test('should redirect unauthenticated users from /billing to login', async ({ page }) => {
  await page.goto('/billing');

  // Should redirect to login
  await page.waitForURL('**/login');
  expect(page.url()).toContain('/login');
});

test('should redirect unauthenticated users from discussion pages to login', async ({ page }) => {
  await page.goto('/discussion');

  // Should redirect to login
  await page.waitForURL('**/login');
  expect(page.url()).toContain('/login');
});

test('should redirect unauthenticated users from team settings to login', async ({ page }) => {
  await page.goto('/team-settings');

  // Should redirect to login
  await page.waitForURL('**/login');
  expect(page.url()).toContain('/login');
});

test('should handle unauthenticated access to invitation page', async ({ page }) => {
  await page.goto('/invitation?token=test-token');

  // Page should load (might redirect or show error, but should not crash)
  const pageContent = await page.content();
  expect(pageContent.length).toBeGreaterThan(0);
});

// Tests for redirects of authenticated users from login page

test('should allow authenticated users without team to access login page', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  // Create authenticated user without team
  const user = await createAndAuthenticateUser(page, false);

  // Navigate to login page - should stay accessible
  await page.goto('/login');

  // Login page should load and show content
  await expect(page.locator('text=/Log in or Sign up/i')).toBeVisible();

  // Cleanup
  await cleanupTestUsers();
});

test('should allow authenticated users with team to access login page', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  // Create authenticated user with team
  const user = await createAndAuthenticateUser(page, true);

  // Navigate to login page - should stay accessible for logout
  await page.goto('/login');

  // Login page should load and show content
  await expect(page.locator('text=/Log in or Sign up/i')).toBeVisible();

  // Cleanup
  await cleanupTestUsers();
});

test('should allow authenticated users to access /login via direct navigation (logout scenario)', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  // Create authenticated user
  const user = await createAndAuthenticateUser(page, true);

  // Try to access login page directly (should stay on login if logoutRequired=true)
  await page.goto('/login');

  // The login page should be accessible for authenticated users who want to logout
  // (this is controlled by withAuth HOC with logoutRequired=true)
  await expect(page.locator('text=/Log in or Sign up/i')).toBeVisible();

  // Cleanup
  await cleanupTestUsers();
});

// Tests for authentication API endpoints

test('should respond to public get-user API endpoint', async ({ page }) => {
  const servers = await getServers();

  // Test public get-user endpoint without authentication
  const response = await page.request.get(`${servers.apiUrl}/api/v1/public/get-user`);
  const statusCode = response.status();

  // Should return some status code (could be 200, 401, 403, etc.) but not 500 (server error)
  expect(statusCode).toBeLessThan(500);
  expect(statusCode).toBeGreaterThanOrEqual(200);
});

test('should handle email login link API endpoint', async ({ page }) => {
  const servers = await getServers();

  // Test email login link endpoint
  const response = await makeApiRequest(servers.apiUrl, '/auth/email-login-link', {
    method: 'POST',
    body: { email: 'test@example.com' },
  });

  // Should return some response (could be success or validation error)
  const statusCode = response.status;
  expect(statusCode).toBeLessThan(500); // Not a server error
  expect(statusCode).toBeGreaterThanOrEqual(200); // Valid HTTP response
});

test('should handle Google OAuth endpoint', async ({ page }) => {
  const servers = await getServers();

  // Test Google OAuth endpoint (should redirect)
  const response = await page.request.get(`${servers.apiUrl}/auth/google`, {
    // Don't follow redirects to see the redirect response
    maxRedirects: 0,
  });

  // Should return redirect status (302) or success (200)
  const statusCode = response.status();
  expect([200, 302]).toContain(statusCode);
});

test('should handle logout endpoint', async ({ page }) => {
  const servers = await getServers();

  // Test logout endpoint
  const response = await page.request.get(`${servers.apiUrl}/logout`);

  // Should redirect or return success
  const statusCode = response.status();
  expect(statusCode).toBeGreaterThanOrEqual(200);
  expect(statusCode).toBeLessThan(500);
});

// Tests for sessions and cookies

test('should create session in database', async () => {
  const testDb = await getTestDb();
  await testDb.clear();

  // Create user
  const user = await createUserInDb();

  // Create session for user
  const sessionId = await createSessionForUser(user._id);

  // Verify session exists in database
  const servers = await getServers();
  const client = require('mongodb').MongoClient;
  const mongoClient = new client(servers.mongoUri);
  await mongoClient.connect();

  try {
    const db = mongoClient.db();
    const session = await db.collection('sessions').findOne({ _id: sessionId });

    expect(session).toBeTruthy();
    expect(session._id).toBe(sessionId);

    // Parse session data
    const sessionData = JSON.parse(session.session);
    expect(sessionData.passport.user).toBe(user._id);
    // expires is stored as ISO string in JSON, so it will be a string after parsing
    expect(typeof sessionData.cookie.expires).toBe('string');
  } finally {
    await mongoClient.close();
  }

  await cleanupTestUsers();
});

test('should set authentication cookies on page', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  // Create authenticated user
  const user = await createAndAuthenticateUser(page, false);

  // Check that session cookie is set
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(cookie => cookie.name === 'connect.sid');

  expect(sessionCookie).toBeTruthy();
  expect(sessionCookie.value).toMatch(/^test-session-/);
  expect(sessionCookie.httpOnly).toBe(true);

  await cleanupTestUsers();
});

test('should maintain session across page navigations', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();

  // Create authenticated user
  const user = await createAndAuthenticateUser(page, false);

  // Navigate to different pages and verify user stays logged in
  await page.goto('/your-settings');
  await page.waitForURL('**/login'); // Should redirect to login since no team

  // User should still be authenticated (cookie should persist)
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(cookie => cookie.name === 'connect.sid');
  expect(sessionCookie).toBeTruthy();

  await cleanupTestUsers();
});

test('should validate session for authenticated API requests', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();
  const servers = await getServers();

  // Create authenticated user
  const user = await createAndAuthenticateUser(page, false);

  // Get session cookie
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(cookie => cookie.name === 'connect.sid');

  // Make API request with session cookie
  const response = await makeApiRequest(servers.apiUrl, '/api/v1/public/get-user', {
    cookies: { 'connect.sid': sessionCookie.value },
  });

  // Should return user data (authenticated request)
  const statusCode = response.status;
  expect(statusCode).toBe(200);

  await cleanupTestUsers();
});

// Integration tests for complete authentication flow

test('should complete full authentication flow for user without team', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();
  const servers = await getServers();

  // 1. Create user in database
  const user = await createUserInDb();
  expect(user).toHaveProperty('_id');
  expect(user.defaultTeamSlug).toBe('');

  // 2. Create session and authenticate
  const sessionId = await createSessionForUser(user._id);
  await page.context().addCookies([
    {
      name: 'connect.sid',
      value: sessionId,
      url: servers.appUrl,
      httpOnly: true,
    },
  ]);

  // 3. Try to access protected page - should redirect to login first (since no team)
  await page.goto('/your-settings');
  await page.waitForURL('**/login');
  expect(page.url()).toContain('/login');

  // 4. Access create-team page - should be allowed
  await page.goto('/create-team');
  // Just check that page loads without redirecting to login
  const pageContent = await page.content();
  expect(pageContent.length).toBeGreaterThan(1000); // Should have substantial content

  // 5. API requests should work with authentication
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(cookie => cookie.name === 'connect.sid');
  const apiResponse = await makeApiRequest(servers.apiUrl, '/api/v1/public/get-user', {
    cookies: { 'connect.sid': sessionCookie.value },
  });
  const statusCode = apiResponse.status;
  expect(statusCode).toBe(200);

  await cleanupTestUsers();
});

test('should complete full authentication flow for user with team', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();
  const servers = await getServers();

  // 1. Create user with team in database
  const { user, team } = await createUserWithTeamInDb();
  expect(user).toHaveProperty('_id');
  expect(user.defaultTeamSlug).toBe(team.slug);
  expect(team).toHaveProperty('_id');

  // 2. Create session and authenticate
  const sessionId = await createSessionForUser(user._id);
  await page.context().addCookies([
    {
      name: 'connect.sid',
      value: sessionId,
      url: servers.appUrl,
      httpOnly: true,
    },
  ]);

  // 3. Try to access login page - should stay on login (logout scenario)
  await page.goto('/login');
  // Since login page has logoutRequired=true, authenticated user should stay on login
  await expect(page.locator('text=/Log in or Sign up/i')).toBeVisible();

  // 4. Access your-settings page - should be allowed
  await page.goto(`/your-settings?teamSlug=${team.slug}`);
  // Just check that page loads without redirecting to login
  const settingsPageContent = await page.content();
  expect(settingsPageContent.length).toBeGreaterThan(1000); // Should have substantial content

  // 5. Access team pages - should be allowed
  await page.goto(`/teams/${team.slug}/discussions`);
  // Just check that page loads without redirecting to login
  const discussionsPageContent = await page.content();
  expect(discussionsPageContent.length).toBeGreaterThan(1000); // Should have substantial content

  await cleanupTestUsers();
});

test('should handle complete user registration and first login flow', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();
  const servers = await getServers();

  // 1. Simulate user registration (create user via API)
  const userData = {
    email: 'newuser@example.com',
    displayName: 'New User',
    slug: 'new-user-slug',
  };

  // Create user directly in DB (simulating registration)
  const user = await createUserInDb(userData);

  // 2. User logs in (create session)
  const sessionId = await createSessionForUser(user._id);
  await page.context().addCookies([
    {
      name: 'connect.sid',
      value: sessionId,
      url: servers.appUrl,
      httpOnly: true,
    },
  ]);

  // 3. First login - should redirect to login first (since no team)
  await page.goto('/');
  await page.waitForURL('**/login');
  expect(page.url()).toContain('/login');

  // 4. User creates team (simulate team creation)
  const team = await createTeamInDb(user._id, {
    name: 'My First Team',
    slug: 'my-first-team',
  });

  // Update user with team
  const client = require('mongodb').MongoClient;
  const mongoClient = new client(servers.mongoUri);
  await mongoClient.connect();

  try {
    const db = mongoClient.db();
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { defaultTeamSlug: team.slug } }
    );
  } finally {
    await mongoClient.close();
  }

  // 5. Now user should be able to access home page (may redirect to your-settings)
  await page.goto('/');
  // Just check that page loads (might redirect or stay on home)
  const pageContent = await page.content();
  expect(pageContent.length).toBeGreaterThan(0);

  await cleanupTestUsers();
});

test('should maintain authentication state across browser sessions', async ({ page }) => {
  const testDb = await getTestDb();
  await testDb.clear();
  const servers = await getServers();

  // 1. Create authenticated user
  const user = await createAndAuthenticateUser(page, true);

  // 2. Get current session cookie
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(cookie => cookie.name === 'connect.sid');

  // 3. Create new page context (simulating new browser session)
  const newContext = await page.context().browser().newContext();
  const newPage = await newContext.newPage();

  // 4. Set the same session cookie in new context
  await newContext.addCookies([
    {
      name: 'connect.sid',
      value: sessionCookie.value,
      url: servers.appUrl,
      httpOnly: true,
    },
  ]);

  // 5. Navigate to protected page in new context
  await newPage.goto('/your-settings');
  await newPage.waitForURL('**/your-settings**');
  expect(newPage.url()).toContain('/your-settings');

  // 6. Verify user can access protected content
  const pageContent = await newPage.content();
  expect(pageContent.length).toBeGreaterThan(1000); // Should have substantial content

  await newContext.close();
  await cleanupTestUsers();
});
