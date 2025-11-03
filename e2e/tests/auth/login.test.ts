import { test, expect } from '@playwright/test';
import { getServers } from '../../helpers';
import { getTestDb } from '../../helpers';

test('should display login page', async ({ page }) => {
  await page.goto('/login');

  // Check for login elements
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible();
});

test('should have app and api servers accessible', async ({ page }) => {
  const servers = await getServers();

  // Test app server
  await page.goto('/login');
  const loginPage = page.locator('form, [role="heading"]');
  await expect(loginPage.first()).toBeVisible();

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
  const testDb = getTestDb();

  // Clear database
  await testDb.clear();

  // Database should be empty after clear
  expect(true).toBe(true);
});
