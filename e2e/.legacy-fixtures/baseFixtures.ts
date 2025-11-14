import { test as base, Page, BrowserContext } from '@playwright/test';
import { getOrCreateServers, TestServers } from '../utils/serverManager';
import { clearAllCollections } from '../utils/testDbHelper';

/**
 * Database fixture interface
 */
export interface TestDb {
  clear: () => Promise<void>;
}

/**
 * Extended test fixtures
 */
export type TestFixtures = {
  page: Page;
  context: BrowserContext;
  servers: TestServers;
  testDb: TestDb;
};

/**
 * Base fixtures
 */
export const test = base.extend<TestFixtures>({
  // Servers fixture - provides API and App URLs
  servers: async ({}, use) => {
    const servers = await getOrCreateServers();
    await use(servers);
  },

  // Database fixture - provides database access
  testDb: async ({ servers }, use) => {
    const testDb: TestDb = {
      clear: async () => {
        await clearAllCollections();
      },
    };

    await use(testDb);

    // Cleanup after each test
    try {
      await testDb.clear();
    } catch (error) {
      console.warn('Failed to clear database after test:', error);
    }
  },

  // Page fixture - extended with servers context
  page: async ({ page, servers }, use) => {
    // Store servers in page context
    (page as any).__servers = servers;
    await use(page);
  },

  // Context fixture - same as default but we keep it for consistency
  context: async ({ context }, use) => {
    await use(context);
  },
});

export { expect } from '@playwright/test';
