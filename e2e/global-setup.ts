import { FullConfig } from '@playwright/test';
import { startAllServers } from './utils/serverManager';
import { getTestConfig } from './config/env';

/**
 * Global setup runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║     GLOBAL SETUP: Initializing Test Environment     ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    // Load and validate configuration
    const testConfig = getTestConfig();
    console.log('Configuration loaded:');
    console.log(`  API Port: ${testConfig.apiPort}`);
    console.log(`  App Port: ${testConfig.appPort}`);
    console.log(`  CI Mode: ${testConfig.isCI}`);

    // Start all servers
    const servers = await startAllServers('global');

    // Store server info for tests
    process.env.E2E_API_URL = servers.apiUrl;
    process.env.E2E_APP_URL = servers.appUrl;

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║           GLOBAL SETUP COMPLETE             ║');
    console.log('╚════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n✗ GLOBAL SETUP FAILED:');
    console.error(error);
    process.exit(1);
  }
}

export default globalSetup;
