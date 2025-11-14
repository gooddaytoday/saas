# E2E Testing Guide

Comprehensive end-to-end testing setup for the SaaS application using Playwright with TypeScript, MongoDB Memory Server integration, and support for both local and CI/CD environments.

## Quick Start

### Prerequisites

- Node.js >= 18.17.0
- Yarn >= 1.22.19
- All dependencies installed: `yarn install`

### Local Testing

1. **Copy environment template:**
   ```bash
   cp .env.test.example .env.test
   ```

2. **Run e2e tests:**
   ```bash
   yarn test:e2e
   ```

### Headed Mode (with browser visible)

See tests running in a real browser:

```bash
yarn test:e2e:headed
```

### Debug Mode

Interactive debugging with step-by-step execution:

```bash
yarn test:e2e:debug
```

### UI Mode

Run tests with Playwright's UI test runner:

```bash
yarn test:e2e:ui
```

### View Test Reports

After tests run, view the HTML report:

```bash
yarn test:e2e:report
```

## Architecture

### Test Infrastructure

- **Global Setup** (`global-setup.ts`): Initializes servers and database before all tests
- **Global Teardown** (`global-teardown.ts`): Cleans up servers and database after all tests
- **Fixtures** (`fixtures/`): Reusable test utilities and contexts
- **Utilities** (`utils/`): Helper functions for server management, database operations, etc.

### Server Management

```
┌─────────────────────────────────────┐
│     MongoDB Memory Server           │  In-memory database
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                 │
┌──────▼────────┐  ┌────▼──────────┐
│  API Server   │  │ App Server    │  Express + Next.js
│  (Port 8000)  │  │ (Port 3000)   │
└───────────────┘  └───────────────┘
```

### Database Testing

Tests use MongoDB Memory Server, which provides:
- Complete isolation between test runs
- No external database setup required
- Automatic cleanup after each test
- Support for parallel test execution

## Test Organization

```
tests/
├── smoke.test.ts           # Smoke tests - basic functionality
└── auth/
    └── login.test.ts       # Authentication flow tests
```

## Test Planning & Roadmap

**Comprehensive Test Coverage Strategy**: See [docs/e2e-test-coverage-plan.md](../docs/e2e-test-coverage-plan.md) for the complete 140-160 test coverage plan across 5 phases.

**Detailed Phase Plans**:
- **[Phase 1: Foundation](./plans/phase-1-foundation.md)** (Week 1-2) - 🟡 In Progress (~40%)
  - Infrastructure (✅ Done), Fixtures (🔴 TODO), P0 Tests (🔴 TODO)
  - Deliverables: 40-56 tests, `authSession` & `teamContext` fixtures
- **[Phase 2: Core Features](./plans/phase-2-core-features.md)** (Week 3-4) - 🔴 Not Started (Plan Ready ✅)
  - Teams, Discussions, Posts modules (50-70 tests)
  - Deliverables: `discussionContext` fixture, P1 tests, CI/CD integration
- **Phase 3: Real-time** (Week 5-6) - 🔴 Not Started
  - WebSockets, Billing, User Settings
- **Phase 4: Extended** (Week 7-8) - 🔴 Not Started
  - Notifications, Billing completion, Edge Cases
- **Phase 5: Polish** (Week 9-10) - 🔴 Not Started
  - Stabilization, Documentation, Optimization

**Progress Overview**: See [plans/README.md](./plans/README.md) for current status and next steps.

## Fixtures and Helpers

### Base Helpers

- **`getServers()`**: Returns API and App server URLs
- **`getTestDb()`**: Returns database utilities (clear collections)
- **`createAuthSession()`**: Creates authenticated user session (NEW!)

### Auth Session Helper

The `createAuthSession()` helper creates an authenticated user in the database and sets up a session in the browser context.

#### Basic Usage

```typescript
import { test, expect } from '@playwright/test';
import { createAuthSession } from '../helpers';

test('authenticated user feature', async ({ page }) => {
  // Create authenticated user
  const { user } = await createAuthSession(page);
  
  // User is now logged in
  await page.goto('/your-settings');
  // Test authenticated features
});
```

#### With Team (as Leader)

```typescript
test('team leader feature', async ({ page }) => {
  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'leader'
  });
  
  // User is team leader
  expect(team?.teamLeaderId).toBe(user.id);
});
```

#### With Team (as Member)

```typescript
test('team member feature', async ({ page }) => {
  const { user, team } = await createAuthSession(page, {
    withTeam: true,
    teamRole: 'member'
  });
  
  // User is team member (not leader)
  expect(team?.memberIds).toContain(user.id);
  expect(team?.teamLeaderId).not.toBe(user.id);
});
```

#### Custom User Data

```typescript
test('custom user', async ({ page }) => {
  const { user } = await createAuthSession(page, {
    userData: {
      displayName: 'John Doe',
      email: 'john@example.com',
      darkTheme: true
    }
  });
  
  expect(user.displayName).toBe('John Doe');
  expect(user.darkTheme).toBe(true);
});
```

### Legacy Fixtures (deprecated, use helpers instead)

```typescript
import { test, expect } from '../fixtures';

test('should do something', async ({ page, servers, testDb }) => {
  // Clear database before test
  await testDb.clear();
  
  // Navigate to app
  await page.goto('/login');
  
  // Make API requests
  const response = await page.request.get(`${servers.apiUrl}/api/v1/data`);
  expect(response.ok).toBe(true);
});
```

## Environment Variables

Key environment variables in `.env.test`:

```bash
E2E_API_PORT=8000           # API server port
E2E_APP_PORT=3000           # App server port
E2E_API_URL=http://localhost:8000
E2E_APP_URL=http://localhost:3000
NODE_ENV=test
SESSION_SECRET=test-key
```

See `.env.test.example` for complete list.

## Docker Testing

### Local Docker Testing

```bash
yarn test:e2e:docker
```

This uses `docker-compose.yml` for local development.

### CI Docker Testing

```bash
cd e2e
docker compose -f docker-compose.ci.yml up --build --abort-on-container-exit
```

## Writing New Tests

### 1. Create test file

```bash
touch e2e/tests/feature.test.ts
```

### 2. Write tests

```typescript
import { test, expect } from '../fixtures';

test.describe('Feature Name', () => {
  test('should do X', async ({ page, servers, testDb }) => {
    // Setup
    await testDb.clear();
    
    // Action
    await page.goto('/feature');
    
    // Assert
    await expect(page.locator('text=Feature')).toBeVisible();
  });
});
```

### 3. Run specific test file

```bash
yarn test:e2e tests/feature.test.ts
```

## CI/CD Integration

### GitHub Actions

Workflow: `.github/workflows/e2e-tests.yml`

Runs on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

Two parallel jobs:
1. Native Node.js runner
2. Docker runner

### GitLab CI

Configuration: `.gitlab-ci.yml`

Jobs:
- `e2e-tests`: Run in Playwright image
- `e2e-tests-docker`: Run in Docker container

## Troubleshooting

### Server startup fails

Check server logs in console output. Common issues:

1. **Port already in use**: Change `E2E_API_PORT` or `E2E_APP_PORT` in `.env.test`
2. **Dependencies not installed**: Run `yarn install` in root, api/, and app/
3. **MongoDB Memory Server issues**: Ensure sufficient disk space

### Tests timeout

Increase timeout in `playwright.config.ts`:

```typescript
timeout: 60000, // 60 seconds
```

### Database not clearing

Manually clear in test setup:

```typescript
test.beforeEach(async ({ testDb }) => {
  await testDb.clear();
});
```

### Cannot find module errors

Ensure all dependencies are installed:

```bash
yarn install
cd api && yarn install
cd ../app && yarn install
cd ../e2e && yarn install --peer
```

## Performance Optimization

### Parallel Execution

Tests run in parallel by default. Configure workers in `playwright.config.ts`:

```typescript
workers: 4,  // Local
workers: 2,  // CI
```

### Test Isolation

Each test gets a clean database via fixtures. No cleanup required between tests.

### Caching

- Install with `--frozen-lockfile` for reproducible builds
- Use Docker layer caching for Docker tests

## Advanced Usage

### Creating Test Data

```typescript
import { createUserData, createTeamData } from '../utils/factories';

test('with test data', async ({ page, testDb }) => {
  const userData = createUserData({ name: 'Custom Name' });
  const teamData = createTeamData();
  
  // Use data in test
});
```

### API Testing Helpers

```typescript
import { makeApiRequest, createUserViaApi } from '../utils/apiHelpers';

test('api operations', async ({ servers }) => {
  const user = await createUserViaApi(servers.apiUrl, {
    email: 'test@example.com',
    name: 'Test User'
  });
});
```

### Waiting Utilities

```typescript
import { retry, waitForCondition } from '../utils/wait';

test('with retry', async ({ page }) => {
  await retry(async () => {
    const response = await page.request.get('/api/data');
    expect(response.ok).toBe(true);
  }, 5); // Retry up to 5 times
});
```

## See Also

- [Playwright Documentation](https://playwright.dev)
- [MongoDB Memory Server](https://github.com/mongodb-js/mongodb-memory-server)
- [Jest Configuration](../../api/jest.config.ts)
- [Project Structure](../../README.md)
