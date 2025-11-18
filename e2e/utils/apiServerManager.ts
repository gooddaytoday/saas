import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { waitForUrl, sleep, retry } from './wait';

export interface ApiServerConfig {
  port: number;
  mongoUri: string;
  env?: Record<string, string>;
}

let apiServerProcess: ChildProcess | null = null;
let apiServerLogs: string[] = [];

/**
 * Start API server
 */
export async function startApiServer(config: ApiServerConfig): Promise<void> {
  const { port, mongoUri, env = {} } = config;

  const apiDir = path.join(__dirname, '../../api');
  const serverFile = path.join(apiDir, 'server/server.ts');

  const envVars = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(port),
    MONGO_URL_TEST: mongoUri,
    MONGO_URL: mongoUri,
    SESSION_SECRET: 'test-secret-key-for-e2e',
    SESSION_NAME: 'saas-test.sid',
    COOKIE_DOMAIN: 'localhost',
    URL_API: `http://localhost:${port}`,
    NEXT_PUBLIC_URL_API: `http://localhost:${port}`,
    LOG_LEVEL: 'error',
    NO_EMAIL: 'true',
    ...env,
  };

  console.log(`Starting API server on port ${port}...`);

  try {
    // Use node to run ts-node script directly
    const tsNodeScript = path.join(apiDir, 'node_modules', 'ts-node', 'dist', 'bin.js');
    const nodeExecutable = process.execPath; // Use current node executable

    apiServerProcess = spawn(
      nodeExecutable,
      [tsNodeScript, '--project', 'tsconfig.json', 'server/server.ts'],
      {
        cwd: apiDir,
        env: { ...envVars, PATH: process.env.PATH },
        stdio: 'pipe',
      },
    );

    // Capture logs
    apiServerProcess.stdout?.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`[API] ${message}`);
        apiServerLogs.push(message);
      }
    });

    apiServerProcess.stderr?.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.error(`[API ERROR] ${message}`);
        apiServerLogs.push(`ERROR: ${message}`);
      }
    });

    apiServerProcess.on('error', (error) => {
      console.error('Failed to start API server:', error);
    });

    // Wait for server to be ready - check any endpoint that responds
    const apiUrl = `http://localhost:${port}`;
    // Try to reach the server - any status < 500 means it's running
    await retry(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await fetch(`${apiUrl}/api/v1/public/get-user`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (response.status >= 500) {
            throw new Error(`Server returned error status: ${response.status}`);
          }
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },
      30, // 30 attempts
      1000, // 1 second delay
      1.0, // no backoff
    );
    console.log('✓ API server is ready');
  } catch (error) {
    await stopApiServer();
    const logs = apiServerLogs.slice(-20).join('\n');
    throw new Error(
      `Failed to start API server: ${error instanceof Error ? error.message : String(error)}\n\nRecent logs:\n${logs}`,
    );
  }
}

/**
 * Stop API server gracefully
 */
export async function stopApiServer(): Promise<void> {
  if (!apiServerProcess) {
    return;
  }

  console.log('Stopping API server...');

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('API server did not stop gracefully, forcing...');
      if (apiServerProcess) {
        apiServerProcess.kill('SIGKILL');
      }
      resolve();
    }, 5000);

    apiServerProcess!.on('exit', () => {
      clearTimeout(timeout);
      apiServerProcess = null;
      console.log('✓ API server stopped');
      resolve();
    });

    apiServerProcess!.kill('SIGTERM');
  });
}

/**
 * Check if API server is healthy
 */
export async function isApiHealthy(port: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`http://localhost:${port}/api/v1/public/get-user`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.status < 500;
  } catch {
    return false;
  }
}

/**
 * Get API server process
 */
export function getApiServerProcess(): ChildProcess | null {
  return apiServerProcess;
}

/**
 * Get API server logs
 */
export function getApiServerLogs(): string[] {
  return [...apiServerLogs];
}

/**
 * Clear API server logs
 */
export function clearApiServerLogs(): void {
  apiServerLogs = [];
}
