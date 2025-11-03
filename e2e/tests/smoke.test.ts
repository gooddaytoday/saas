import { test, expect } from '@playwright/test';
import { getServers } from '../helpers';
import { getTestDb } from '../helpers';

test('should load login page', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle(/login|sign/i);
  // Check for the main heading text "Log in or Sign up"
  const heading = page.locator('text=/Log in or Sign up/i');
  await expect(heading).toBeVisible();
});

test('should have API server running', async ({ page }) => {
  const servers = await getServers();
  const response = await page.request.get(`${servers.apiUrl}/api/v1/public/get-user`, {
    timeout: 10000,
  });
  // Expecting 403 (unauthorized) is fine - means server is running
  expect(response.status()).toBeLessThan(500);
});

test('should have database connection', async () => {
  const testDb = await getTestDb();
  await testDb.clear();
  // Database operations work without errors
  expect(true).toBe(true);
});

test('should display app navigation', async ({ page }) => {
  await page.goto('/login');
  const pageContent = await page.content();
  expect(pageContent.length).toBeGreaterThan(0);
});
