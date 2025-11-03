import * as fs from 'fs';
import * as path from 'path';

export interface TestState {
  mongoUri: string;
  apiUrl: string;
  apiPort: number;
  appUrl: string;
  appPort: number;
  workerId: string;
  createdAt: number;
}

const STATE_DIR = path.join(__dirname, '..', '.test-state');
const GLOBAL_STATE_FILE = path.join(STATE_DIR, 'global-state.json');

/**
 * Ensure state directory exists
 */
function ensureStateDirExists(): void {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

/**
 * Save global state (MongoDB URI, server URLs)
 */
export function saveGlobalState(state: Omit<TestState, 'workerId' | 'createdAt'>): void {
  ensureStateDirExists();
  const stateWithMetadata: TestState = {
    ...state,
    workerId: 'global',
    createdAt: Date.now(),
  };
  fs.writeFileSync(GLOBAL_STATE_FILE, JSON.stringify(stateWithMetadata, null, 2));
}

/**
 * Load global state
 */
export function loadGlobalState(): TestState | null {
  if (!fs.existsSync(GLOBAL_STATE_FILE)) {
    return null;
  }
  try {
    const data = fs.readFileSync(GLOBAL_STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Save worker-specific state
 */
export function saveWorkerState(workerId: string, state: Partial<TestState>): void {
  ensureStateDirExists();
  const workerFile = path.join(STATE_DIR, `worker-${workerId}.json`);
  const stateWithMetadata: TestState = {
    mongoUri: '',
    apiUrl: '',
    apiPort: 8000,
    appUrl: '',
    appPort: 3000,
    workerId,
    createdAt: Date.now(),
    ...state,
  };
  fs.writeFileSync(workerFile, JSON.stringify(stateWithMetadata, null, 2));
}

/**
 * Load worker-specific state
 */
export function loadWorkerState(workerId: string): TestState | null {
  const workerFile = path.join(STATE_DIR, `worker-${workerId}.json`);
  if (!fs.existsSync(workerFile)) {
    return null;
  }
  try {
    const data = fs.readFileSync(workerFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Clean state files
 */
export function cleanState(workerId?: string): void {
  if (workerId) {
    const workerFile = path.join(STATE_DIR, `worker-${workerId}.json`);
    if (fs.existsSync(workerFile)) {
      fs.unlinkSync(workerFile);
    }
  } else {
    // Clean all state files
    if (fs.existsSync(STATE_DIR)) {
      const files = fs.readdirSync(STATE_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(STATE_DIR, file));
      }
      fs.rmdirSync(STATE_DIR);
    }
  }
}

/**
 * Clean only global state file
 */
export function cleanGlobalState(): void {
  if (fs.existsSync(GLOBAL_STATE_FILE)) {
    fs.unlinkSync(GLOBAL_STATE_FILE);
  }
}
