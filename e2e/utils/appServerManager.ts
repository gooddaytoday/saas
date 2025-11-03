import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { waitForUrl, sleep, retry } from './wait';

export interface AppServerConfig {
  port: number;
  apiUrl: string;
  env?: Record<string, string>;
}

let appServerProcess: ChildProcess | null = null;
let appServerLogs: string[] = [];

/**
 * Start Next.js app server
 */
export async function startAppServer(config: AppServerConfig): Promise<void> {
  const { port, apiUrl, env = {} } = config;

  const appDir = path.join(__dirname, '../../app');
  const serverFile = path.join(appDir, 'server/server.ts');

  const envVars = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(port),
    NEXT_PUBLIC_URL_APP: `http://localhost:${port}`,
    URL_APP: `http://localhost:${port}`,
    NEXT_PUBLIC_URL_API: apiUrl,
    URL_API: apiUrl,
    PRODUCTION_URL_APP: `http://localhost:${port}`,
    NEXT_PUBLIC_PRODUCTION_URL_APP: `http://localhost:${port}`,
    PRODUCTION_URL_API: apiUrl,
    NEXT_PUBLIC_PRODUCTION_URL_API: apiUrl,
    LOG_LEVEL: 'error',
    ...env,
  };

  console.log(`Starting App server on port ${port}...`);

  try {
    // Use node to run ts-node script directly
    const tsNodeScript = path.join(appDir, 'node_modules', 'ts-node', 'dist', 'bin.js');
    const nodeExecutable = process.execPath; // Use current node executable

    appServerProcess = spawn(
      nodeExecutable,
      [tsNodeScript, '--project', 'tsconfig.server.json', 'server/server.ts'],
      {
        cwd: appDir,
        env: { ...envVars, PATH: process.env.PATH },
        stdio: 'pipe',
      },
    );

    // Capture logs
    appServerProcess.stdout?.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`[APP] ${message}`);
        appServerLogs.push(message);
      }
    });

    appServerProcess.stderr?.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.error(`[APP ERROR] ${message}`);
        appServerLogs.push(`ERROR: ${message}`);
      }
    });

    appServerProcess.on('error', (error) => {
      console.error('Failed to start App server:', error);
    });

    // Wait for server to be ready - Next.js server takes longer to compile
    const appUrl = `http://localhost:${port}`;
    // Try to reach the server - any status < 500 means it's running
    await retry(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await fetch(`${appUrl}/login`, {
            signal: controller.signal,
            redirect: 'manual',
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
      60, // 60 attempts (60 seconds total)
      1000, // 1 second delay
      1.0, // no backoff
    );
    console.log('✓ App server is ready');
  } catch (error) {
    await stopAppServer();
    const logs = appServerLogs.slice(-20).join('\n');
    throw new Error(
      `Failed to start App server: ${error instanceof Error ? error.message : String(error)}\n\nRecent logs:\n${logs}`,
    );
  }
}

/**
 * Stop app server gracefully
 */
export async function stopAppServer(): Promise<void> {
  if (!appServerProcess) {
    return;
  }

  console.log('Stopping App server...');

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('App server did not stop gracefully, forcing...');
      if (appServerProcess) {
        appServerProcess.kill('SIGKILL');
      }
      resolve();
    }, 10000);

    appServerProcess!.on('exit', () => {
      clearTimeout(timeout);
      appServerProcess = null;
      console.log('✓ App server stopped');
      resolve();
    });

    appServerProcess!.kill('SIGTERM');
  });
}

/**
 * Check if app server is healthy
 */
export async function isAppHealthy(port: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`http://localhost:${port}/login`, {
      signal: controller.signal,
      redirect: 'manual',
    });
    clearTimeout(timeoutId);
    return response.status < 500;
  } catch {
    return false;
  }
}

/**
 * Get app server process
 */
export function getAppServerProcess(): ChildProcess | null {
  return appServerProcess;
}

/**
 * Get app server logs
 */
export function getAppServerLogs(): string[] {
  return [...appServerLogs];
}

/**
 * Clear app server logs
 */
export function clearAppServerLogs(): void {
  appServerLogs = [];
}
