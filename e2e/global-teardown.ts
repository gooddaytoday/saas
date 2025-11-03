import { FullConfig } from '@playwright/test';
import { stopAllServers, getActiveServers } from './utils/serverManager';
import { cleanState } from './utils/sharedState';

/**
 * Global teardown runs once after all tests
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║     GLOBAL TEARDOWN: Cleaning Up            ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    const servers = getActiveServers();

    if (servers) {
      await stopAllServers(servers);
    } else {
      console.log('No active servers to stop');
    }

    // Clean up state files
    console.log('\nCleaning up state files...');
    cleanState();
    console.log('✓ State files cleaned');

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║           GLOBAL TEARDOWN COMPLETE          ║');
    console.log('╚════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n⚠ GLOBAL TEARDOWN ERROR:');
    console.error(error);
    // Don't exit with error - tests are already done
  }
}

export default globalTeardown;
