import {
  setupE2EDatabase,
  teardownE2EDatabase,
  clearAllCollections,
} from './testDbHelper';
import { startApiServer, stopApiServer } from './apiServerManager';
import { startAppServer, stopAppServer } from './appServerManager';
import { saveGlobalState, loadGlobalState } from './sharedState';

export interface TestServers {
  apiUrl: string;
  appUrl: string;
  mongoUri: string;
  stop: () => Promise<void>;
}

let activeServers: TestServers | null = null;

/**
 * Start all servers (Database, API, App)
 */
export async function startAllServers(workerId: string = 'main'): Promise<TestServers> {
  console.log(`\n========================================`);
  console.log(`Starting servers for worker: ${workerId}`);
  console.log(`========================================\n`);

  try {
    // Step 1: Setup MongoDB Memory Server
    console.log('Step 1: Setting up MongoDB Memory Server...');
    const mongoUri = await setupE2EDatabase();
    console.log('✓ MongoDB Memory Server ready');

    // Step 2: Start API server
    console.log('\nStep 2: Starting API server...');
    const apiPort = parseInt(process.env.E2E_API_PORT || '8000', 10);
    const apiUrl = `http://localhost:${apiPort}`;

    await startApiServer({
      port: apiPort,
      mongoUri,
    });

    // Step 3: Start App server
    console.log('\nStep 3: Starting App server...');
    const appPort = parseInt(process.env.E2E_APP_PORT || '3000', 10);
    const appUrl = `http://localhost:${appPort}`;

    await startAppServer({
      port: appPort,
      apiUrl,
    });

    // Step 4: Save state for other workers
    console.log('\nStep 4: Saving global state...');
    saveGlobalState({
      mongoUri,
      apiUrl,
      apiPort,
      appUrl,
      appPort,
    });

    const servers: TestServers = {
      apiUrl,
      appUrl,
      mongoUri,
      stop: () => stopAllServers(servers),
    };

    activeServers = servers;

    console.log(`\n========================================`);
    console.log(`✓ All servers started successfully`);
    console.log(`  API:  ${apiUrl}`);
    console.log(`  App:  ${appUrl}`);
    console.log(`========================================\n`);

    return servers;
  } catch (error) {
    console.error('\n✗ Failed to start servers:', error);
    // Cleanup partial startup
    await stopAllServers(
      activeServers || {
        apiUrl: '',
        appUrl: '',
        mongoUri: '',
        stop: async () => {},
      },
    );
    throw error;
  }
}

/**
 * Stop all servers with proper shutdown sequence
 */
export async function stopAllServers(servers: TestServers): Promise<void> {
  console.log(`\n========================================`);
  console.log(`Stopping all servers`);
  console.log(`========================================\n`);

  const errors: Error[] = [];

  try {
    // Step 1: Stop App server
    console.log('Step 1: Stopping App server...');
    try {
      await stopAppServer();
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }

    // Step 2: Stop API server
    console.log('\nStep 2: Stopping API server...');
    try {
      await stopApiServer();
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }

    // Step 3: Teardown database
    console.log('\nStep 3: Tearing down MongoDB Memory Server...');
    try {
      await teardownE2EDatabase();
      console.log('✓ MongoDB Memory Server stopped');
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }

    activeServers = null;

    if (errors.length === 0) {
      console.log(`\n========================================`);
      console.log(`✓ All servers stopped successfully`);
      console.log(`========================================\n`);
    } else {
      console.warn(`\n========================================`);
      console.warn(`⚠ Some servers had issues during shutdown:`);
      errors.forEach((error) => {
        console.warn(`  - ${error.message}`);
      });
      console.warn(`========================================\n`);
    }
  } catch (error) {
    console.error('Fatal error during server shutdown:', error);
    throw error;
  }
}

/**
 * Clear database (reset between test suites)
 */
export async function clearDatabase(): Promise<void> {
  console.log('Clearing database...');
  await clearAllCollections();
  console.log('✓ Database cleared');
}

/**
 * Get active servers (for fixtures)
 */
export function getActiveServers(): TestServers | null {
  return activeServers;
}

/**
 * Get or create servers from global state
 */
export async function getOrCreateServers(): Promise<TestServers> {
  if (activeServers) {
    return activeServers;
  }

  const state = loadGlobalState();
  if (state) {
    const servers: TestServers = {
      apiUrl: state.apiUrl,
      appUrl: state.appUrl,
      mongoUri: state.mongoUri,
      stop: () => stopAllServers(servers),
    };
    return servers;
  }

  // If no active servers or saved state, start new ones
  return startAllServers();
}
