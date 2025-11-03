/**
 * Test helpers for accessing servers and database
 * These functions can be called inside tests to get access to test infrastructure
 */

import { getOrCreateServers, TestServers } from './utils/serverManager';
import { clearAllCollections } from './utils/testDbHelper';

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
export function getTestDb(): TestDb {
  return {
    clear: async () => {
      await clearAllCollections();
    },
  };
}
