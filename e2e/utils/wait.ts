/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 5,
  delayMs: number = 1000,
  backoffMultiplier: number = 1.5,
): Promise<T> {
  let lastError: Error | null = null;
  let currentDelay = delayMs;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < attempts - 1) {
        await sleep(currentDelay);
        currentDelay = Math.floor(currentDelay * backoffMultiplier);
      }
    }
  }

  throw lastError || new Error('Max retry attempts reached');
}

/**
 * Wait for a port to be available (ready to accept connections)
 */
export async function waitForPort(port: number, timeoutMs: number = 30000): Promise<void> {
  const startTime = Date.now();

  return retry(
    async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`http://localhost:${port}/`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        // Just checking if port is open
        return response;
      } catch (error) {
        throw error;
      }
    },
    Math.ceil(timeoutMs / 1000),
    200,
    1.2,
  ).then(() => {
    const elapsed = Date.now() - startTime;
    console.log(`✓ Port ${port} ready (${elapsed}ms)`);
  });
}

/**
 * Wait for a URL to respond successfully
 */
export async function waitForUrl(
  url: string,
  timeoutMs: number = 30000,
  expectedStatus: number = 200,
): Promise<void> {
  const startTime = Date.now();

  return retry(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
      }

      return response;
    },
    Math.ceil(timeoutMs / 1000),
    200,
    1.2,
  ).then(() => {
    const elapsed = Date.now() - startTime;
    console.log(`✓ URL ${url} ready (${elapsed}ms)`);
  });
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 30000,
  intervalMs: number = 100,
): Promise<void> {
  const startTime = Date.now();

  while (true) {
    const elapsed = Date.now() - startTime;

    if (elapsed > timeoutMs) {
      throw new Error(`Timeout waiting for condition after ${elapsed}ms`);
    }

    const result = await condition();
    if (result) {
      return;
    }

    await sleep(intervalMs);
  }
}

/**
 * Wait for a file to exist
 */
export async function waitForFile(
  filePath: string,
  timeoutMs: number = 30000,
): Promise<void> {
  const { existsSync } = await import('fs');

  return waitForCondition(
    () => existsSync(filePath),
    timeoutMs,
    100,
  );
}
