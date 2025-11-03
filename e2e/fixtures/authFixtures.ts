import { Page } from '@playwright/test';
import { generateEmail } from '../utils/factories';

/**
 * Test user for authentication
 */
export interface TestUser {
  email: string;
  name: string;
  id?: string;
}

/**
 * Test team
 */
export interface TestTeam {
  name: string;
  slug: string;
  id?: string;
}

/**
 * Create test user via API
 */
export async function createTestUser(
  apiUrl: string,
  email: string = generateEmail(),
  name: string = 'Test User',
): Promise<TestUser> {
  // Note: This is a placeholder - actual implementation depends on your API
  // For now, we return a test user object
  return {
    email,
    name,
    id: Math.random().toString(36).substring(7),
  };
}

/**
 * Create test team via API
 */
export async function createTestTeam(
  apiUrl: string,
  cookies: Record<string, string>,
  teamName: string = 'Test Team',
  slug: string = `team-${Math.random().toString(36).substring(7)}`,
): Promise<TestTeam> {
  // Note: This is a placeholder - actual implementation depends on your API
  return {
    name: teamName,
    slug,
    id: Math.random().toString(36).substring(7),
  };
}

/**
 * Login user via page interaction
 */
export async function loginUserViaPage(
  page: Page,
  email: string,
  passwordless: boolean = true,
): Promise<void> {
  // Navigate to login page
  await page.goto('/login');

  if (passwordless) {
    // Enter email for passwordless login
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(email);

    // Click send link button
    const sendButton = page.locator('button:has-text("Send")');
    await sendButton.click();

    // Wait for magic link message
    await page.locator('text=Check your email').waitFor();
  } else {
    // Standard login flow
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(email);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('password123');

    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();
  }
}

/**
 * Get auth cookies from page
 */
export async function getAuthCookies(page: Page): Promise<Record<string, string>> {
  const cookies = await page.context().cookies();
  const authCookies: Record<string, string> = {};

  for (const cookie of cookies) {
    if (cookie.name.includes('session') || cookie.name.includes('auth')) {
      authCookies[cookie.name] = cookie.value;
    }
  }

  return authCookies;
}

/**
 * Set auth cookies on page
 */
export async function setAuthCookies(
  page: Page,
  cookies: Record<string, string>,
): Promise<void> {
  const cookieObjects = Object.entries(cookies).map(([name, value]) => ({
    name,
    value,
    url: process.env.E2E_APP_URL || 'http://localhost:3000',
  }));

  await page.context().addCookies(cookieObjects);
}
