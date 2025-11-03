import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

export interface TestConfig {
  apiPort: number;
  appPort: number;
  apiUrl: string;
  appUrl: string;
  logLevel: string;
  isCI: boolean;
}

let config: TestConfig | null = null;

/**
 * Load test environment from .env.test file
 */
export function loadTestEnvironment(): void {
  const envFilePath = path.join(__dirname, '..', '.env.test');

  if (!fs.existsSync(envFilePath)) {
    console.warn(`⚠ .env.test not found at ${envFilePath}`);
    console.warn('  Using default environment variables');
  } else {
    dotenv.config({ path: envFilePath });
  }
}

/**
 * Validate that required environment variables are set
 */
export function validateEnvironment(): void {
  const required = ['SESSION_SECRET', 'COOKIE_DOMAIN'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Get test configuration
 */
export function getTestConfig(): TestConfig {
  if (config) {
    return config;
  }

  loadTestEnvironment();

  config = {
    apiPort: parseInt(process.env.E2E_API_PORT || '8000', 10),
    appPort: parseInt(process.env.E2E_APP_PORT || '3000', 10),
    apiUrl: process.env.E2E_API_URL || 'http://localhost:8000',
    appUrl: process.env.E2E_APP_URL || 'http://localhost:3000',
    logLevel: process.env.LOG_LEVEL || 'error',
    isCI: !!process.env.CI,
  };

  return config;
}

/**
 * Reset config (useful for tests)
 */
export function resetConfig(): void {
  config = null;
}
