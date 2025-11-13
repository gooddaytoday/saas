# Фаза 5: Polish & Optimization - Детальный план реализации

> **Период**: Week 9-10 (10 рабочих дней)  
> **Цель**: Стабилизация, производительность, документация, мониторинг  
> **Статус**: 🔴 Не начата  
> **Прогресс**: 0%  
> **Зависимости**: ✅ Фазы 1-4 должны быть завершены (135-165 тестов готовы)

---

## 📋 Содержание

1. [Обзор фазы](#обзор-фазы)
2. [Предварительные требования](#предварительные-требования)
3. [Задачи фазы 5](#задачи-фазы-5)
4. [Детальный план по направлениям](#детальный-план-по-направлениям)
5. [Чек-лист выполнения](#чек-лист-выполнения)
6. [Acceptance Criteria](#acceptance-criteria)
7. [Риски и митигации](#риски-и-митигации)

---

## 1. Обзор фазы

### 1.1 Цели

Завершить E2E testing project с **production-ready** качеством:
- **Stabilization**: Устранить flaky tests, оптимизировать retry strategies
- **Performance**: Ускорить выполнение тестов, оптимизировать CI/CD
- **Documentation**: Полная документация для разработчиков и QA
- **Monitoring**: Настроить отчетность, алерты, метрики

### 1.2 Ожидаемые результаты

| Метрика | Целевое значение |
|---------|------------------|
| **Flaky Rate** | < 2% (было: возможно 5-10%) |
| **Test Execution Time (P0+P1)** | < 15 минут (цель: 12-13 мин) |
| **Full Suite Time** | < 35 минут (цель: 30-33 мин) |
| **Documentation Coverage** | 100% (все fixtures, модули, troubleshooting) |
| **CI/CD Stability** | 95%+ success rate |
| **Monitoring Setup** | Allure/Slack/Dashboards настроены |
| **Code Quality** | No linter errors, DRY principles enforced |

### 1.3 Связь с общим планом

- **Предыдущая фаза**: [Фаза 4 - Notifications & Billing Complete](./phase-4-notifications-billing.md) (Email tests, Edge Cases)
- **Следующая фаза**: Production deployment, continuous maintenance
- **Общий план**: [E2E Test Coverage Plan](../../docs/e2e-test-coverage-plan.md#фаза-5-polish--optimization-week-9-10)

---

## 2. Предварительные требования

### 2.1 ✅ Должно быть готово из Фаз 1-4

| Компонент | Статус | Количество | Комментарий |
|-----------|--------|------------|-------------|
| **P0 Tests** | ✅ Обязательно | 20-30 | Smoke, Auth, Onboarding |
| **P1 Tests** | ✅ Обязательно | 45-65 | Teams, Discussions, Posts, Realtime |
| **P2 Tests** | ✅ Обязательно | ~70 | Billing, Notifications, Edge Cases |
| **Fixtures** | ✅ Обязательно | 7-8 | auth, team, discussion, realtime, billing, email, file |
| **CI/CD Basic** | ✅ Обязательно | GitHub Actions | P0/P1/P2 jobs настроены |
| **Test Infrastructure** | ✅ Обязательно | Complete | MongoDB, Servers, Docker |

**Итого тестов на входе**: 135-165 tests

### 2.2 ❌ Новые требования для Фазы 5

| Компонент | Необходимость | Описание |
|-----------|---------------|----------|
| **Allure Reporter** | 🟡 Желательно | Для богатой отчетности |
| **Grafana/InfluxDB** | 🟢 Опционально | Для custom dashboards |
| **Slack Webhooks** | 🟡 Желательно | Для notifications |
| **Test Analytics Tools** | 🟡 Желательно | Flaky test detection |
| **Performance Profiling** | 🔴 Критично | Для оптимизации медленных тестов |

### 2.3 📦 Новые зависимости

```bash
# В e2e/package.json добавить (опционально):
yarn add -D allure-playwright@^2.10.0              # Allure reporting
yarn add -D @playwright/test-reporter@^1.41.0      # Custom reporters
yarn add -D dotenv-cli@^7.3.0                      # Environment management
```

---

## 3. Задачи фазы 5

### 3.1 Общая таблица задач

| # | Задача | Приоритет | Оценка | Зависимости | Ответственный |
|---|--------|-----------|--------|-------------|---------------|
| **5.1** | Flaky Tests Analysis & Fixes | P0 | 2 дня | Все тесты работают | QA Lead |
| **5.2** | Retry Strategies & Timeout Tuning | P0 | 1 день | Flaky analysis готов | Dev |
| **5.3** | Performance Profiling & Optimization | P1 | 2 дня | Test suite stable | Dev/QA |
| **5.4** | Parallelization Optimization | P1 | 1 день | Performance data | Dev |
| **5.5** | Documentation - Fixtures & Modules | P0 | 1.5 дня | All fixtures ready | Tech Writer |
| **5.6** | Troubleshooting Guide | P1 | 1 день | Common issues identified | Tech Writer |
| **5.7** | Allure Integration (optional) | P2 | 1 день | Tests stable | Dev |
| **5.8** | Slack Notifications Setup | P1 | 0.5 дня | CI/CD working | DevOps |
| **5.9** | CI/CD Pipeline Optimization | P1 | 1 день | Performance data | DevOps |
| **5.10** | Final Testing & Sign-off | P0 | 0.5 дня | All above complete | Team |

**Общее время**: 10-11 дней (укладываемся в 2 недели)

### 3.2 Распределение по неделям

#### Week 9 (Days 1-5): Stabilization & Performance
- **Day 1-2**: Flaky tests analysis & fixes
- **Day 3**: Retry strategies, timeout tuning
- **Day 4-5**: Performance profiling & optimization

#### Week 10 (Days 6-10): Documentation & Monitoring
- **Day 6-7**: Documentation (fixtures, modules, troubleshooting)
- **Day 8**: Monitoring setup (Allure, Slack, dashboards)
- **Day 9**: CI/CD optimization
- **Day 10**: Final review, testing, sign-off

---

## 4. Детальный план по направлениям

### 4.1 Stabilization

#### 4.1.1 Flaky Tests Analysis

**Цель**: Идентифицировать и устранить все flaky tests (< 2% от общего числа)

**Файл**: `e2e/scripts/analyze-flaky-tests.ts`

```typescript
/**
 * Скрипт для анализа flaky tests
 * Запускает каждый тест N раз и собирает статистику
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

interface TestResult {
  testName: string;
  runs: number;
  passes: number;
  failures: number;
  flakyRate: number;
  failureReasons: string[];
}

async function analyzeFlaky(testPattern: string, runs: number = 10): Promise<TestResult[]> {
  const results: Map<string, TestResult> = new Map();
  
  for (let i = 0; i < runs; i++) {
    console.log(`Run ${i + 1}/${runs}...`);
    
    try {
      const output = execSync(
        `npx playwright test ${testPattern} --reporter=json`,
        { encoding: 'utf-8' }
      );
      
      const report = JSON.parse(output);
      
      report.suites.forEach((suite: any) => {
        suite.specs.forEach((spec: any) => {
          const testName = spec.title;
          
          if (!results.has(testName)) {
            results.set(testName, {
              testName,
              runs: 0,
              passes: 0,
              failures: 0,
              flakyRate: 0,
              failureReasons: [],
            });
          }
          
          const result = results.get(testName)!;
          result.runs++;
          
          if (spec.ok) {
            result.passes++;
          } else {
            result.failures++;
            result.failureReasons.push(spec.tests[0]?.results[0]?.error?.message || 'Unknown');
          }
        });
      });
    } catch (error) {
      console.error(`Run ${i + 1} failed:`, error.message);
    }
  }
  
  // Calculate flaky rate
  results.forEach((result) => {
    result.flakyRate = (result.failures / result.runs) * 100;
  });
  
  return Array.from(results.values()).sort((a, b) => b.flakyRate - a.flakyRate);
}

async function main() {
  console.log('🔍 Analyzing flaky tests...\n');
  
  const results = await analyzeFlaky('tests/**/*.test.ts', 20);
  
  // Filter flaky tests (failure rate > 0% and < 100%)
  const flakyTests = results.filter(r => r.flakyRate > 0 && r.flakyRate < 100);
  
  console.log(`\n📊 Results:`);
  console.log(`Total tests: ${results.length}`);
  console.log(`Flaky tests: ${flakyTests.length} (${((flakyTests.length / results.length) * 100).toFixed(2)}%)`);
  
  if (flakyTests.length > 0) {
    console.log('\n⚠️  Flaky Tests:\n');
    flakyTests.forEach((test) => {
      console.log(`- ${test.testName}`);
      console.log(`  Flaky Rate: ${test.flakyRate.toFixed(2)}%`);
      console.log(`  Passes: ${test.passes}/${test.runs}`);
      console.log(`  Common failures: ${[...new Set(test.failureReasons)].slice(0, 3).join(', ')}`);
      console.log('');
    });
  }
  
  // Save report
  fs.writeFileSync(
    'e2e/reports/flaky-tests-report.json',
    JSON.stringify({ timestamp: new Date().toISOString(), results: flakyTests }, null, 2)
  );
  
  console.log('✅ Report saved to e2e/reports/flaky-tests-report.json');
  
  // Exit with error if flaky rate > 2%
  const flakyRate = (flakyTests.length / results.length) * 100;
  if (flakyRate > 2) {
    console.error(`\n❌ Flaky rate (${flakyRate.toFixed(2)}%) exceeds threshold (2%)`);
    process.exit(1);
  }
}

main();
```

**Использование**:
```bash
# Анализ всех тестов
yarn analyze:flaky

# Анализ конкретного модуля
yarn analyze:flaky tests/07-realtime/**
```

#### 4.1.2 Common Flaky Patterns & Fixes

**Pattern 1: Race Conditions in Async Operations**

❌ **Плохо**:
```typescript
test('creates post', async ({ page, discussionContext }) => {
  await page.click('[data-testid="submit-post"]');
  
  // Race condition: может не успеть появиться
  const post = page.locator('[data-testid="post-content"]');
  await expect(post).toBeVisible();
});
```

✅ **Хорошо**:
```typescript
test('creates post', async ({ page, discussionContext }) => {
  await page.click('[data-testid="submit-post"]');
  
  // Explicit wait с timeout
  await page.waitForResponse(
    (resp) => resp.url().includes('/posts/add') && resp.status() === 200,
    { timeout: 10000 }
  );
  
  const post = page.locator('[data-testid="post-content"]');
  await expect(post).toBeVisible({ timeout: 5000 });
});
```

**Pattern 2: WebSocket Timing Issues**

❌ **Плохо**:
```typescript
test('receives live update', async ({ page, realtimeObserver }) => {
  await realtimeObserver.connect();
  
  // Может не успеть подписаться
  await triggerUpdate();
  
  const event = await realtimeObserver.waitForEvent('discussionEvent');
  expect(event).toBeTruthy();
});
```

✅ **Хорошо**:
```typescript
test('receives live update', async ({ page, realtimeObserver }) => {
  await realtimeObserver.connect();
  await realtimeObserver.waitForConnection(); // NEW: explicit wait
  
  // Setup event listener BEFORE triggering
  const eventPromise = realtimeObserver.waitForEvent('discussionEvent', {
    timeout: 15000,
  });
  
  await triggerUpdate();
  
  const event = await eventPromise;
  expect(event).toBeTruthy();
});
```

**Pattern 3: Email Timing Issues**

❌ **Плохо**:
```typescript
test('sends email', async ({ emailInbox }) => {
  await triggerEmailAction();
  
  // Может быть delay в SMTP
  const email = await emailInbox.getLatestEmail();
  expect(email).toBeTruthy();
});
```

✅ **Хорошо**:
```typescript
test('sends email', async ({ emailInbox }) => {
  await triggerEmailAction();
  
  // Poll с retry
  const email = await emailInbox.waitForEmail({
    subject: 'Expected Subject',
    timeout: 10000, // Generous timeout
  });
  
  expect(email).toBeTruthy();
});
```

**Pattern 4: Test Data Cleanup**

❌ **Плохо**:
```typescript
test('test A', async ({ testDb }) => {
  await createData();
  // No cleanup - может повлиять на следующий тест
});

test('test B', async ({ testDb }) => {
  // Может получить данные от test A
});
```

✅ **Хорошо**:
```typescript
test('test A', async ({ testDb }) => {
  await testDb.clear(); // Всегда очищать в начале
  await createData();
  // Fixture автоматически очищает в конце
});

test('test B', async ({ testDb }) => {
  await testDb.clear(); // Каждый тест независим
  await createDifferentData();
});
```

#### 4.1.3 Retry Strategies

**Файл**: `e2e/utils/retryHelpers.ts`

```typescript
/**
 * Retry helpers для нестабильных операций
 */

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    exponentialBackoff = false,
    onRetry,
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      if (onRetry) {
        onRetry(attempt, lastError);
      }
      
      const delay = exponentialBackoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export async function retryUntil<T>(
  fn: () => Promise<T>,
  predicate: (result: T) => boolean,
  options: RetryOptions & { timeout?: number } = {}
): Promise<T> {
  const { timeout = 30000, maxAttempts = Infinity, delayMs = 500 } = options;
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < timeout && attempts < maxAttempts) {
    attempts++;
    
    try {
      const result = await fn();
      if (predicate(result)) {
        return result;
      }
    } catch (error) {
      // Continue retrying
    }
    
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  
  throw new Error(
    `Timeout after ${timeout}ms and ${attempts} attempts`
  );
}
```

**Использование**:
```typescript
import { retryAsync, retryUntil } from '../utils/retryHelpers';

test('flaky API call with retry', async ({ servers }) => {
  const data = await retryAsync(
    () => fetch(`${servers.apiUrl}/api/v1/data`).then(r => r.json()),
    {
      maxAttempts: 3,
      delayMs: 1000,
      exponentialBackoff: true,
      onRetry: (attempt, error) => {
        console.log(`Retry ${attempt}: ${error.message}`);
      },
    }
  );
  
  expect(data).toBeTruthy();
});

test('wait for condition', async ({ page }) => {
  await page.click('[data-testid="submit"]');
  
  const element = await retryUntil(
    () => page.locator('[data-testid="result"]').textContent(),
    (text) => text?.includes('Success') || false,
    { timeout: 10000, delayMs: 500 }
  );
  
  expect(element).toContain('Success');
});
```

#### 4.1.4 Timeout Configuration

**Файл**: `e2e/playwright.config.ts` (update)

```typescript
export default defineConfig({
  // Global timeout для всего теста
  timeout: 60000, // 60 seconds (было: 30s)
  
  // Expect timeout
  expect: {
    timeout: 10000, // 10 seconds (было: 5s)
  },
  
  use: {
    // Action timeout
    actionTimeout: 15000, // 15 seconds (было: 10s)
    
    // Navigation timeout
    navigationTimeout: 30000, // 30 seconds
  },
  
  // Per-project timeouts (если нужно)
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Real-time tests need more time
        contextOptions: {
          // Увеличенные timeouts для WebSocket
        }
      },
      // Специфичный timeout для медленных модулей
      grep: /@realtime|@billing/,
      timeout: 90000, // 90 seconds
    },
  ],
});
```

**Per-test timeouts**:
```typescript
// Увеличить timeout для конкретного теста
test('slow operation', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  
  await page.goto('/slow-page');
  // ...
});

// Группа тестов с увеличенным timeout
test.describe('Real-time tests', () => {
  test.describe.configure({ timeout: 90000 });
  
  test('websocket test 1', async ({ page }) => {
    // ...
  });
  
  test('websocket test 2', async ({ page }) => {
    // ...
  });
});
```

#### 4.1.5 Чек-лист Stabilization

- [ ] **Flaky Analysis**
  - [ ] Создать `analyze-flaky-tests.ts` script
  - [ ] Запустить анализ 20 раз для всех тестов
  - [ ] Идентифицировать flaky tests (> 0% failure rate)
  - [ ] Создать GitHub Issues для каждого flaky теста
  
- [ ] **Fixes**
  - [ ] Исправить все race conditions
  - [ ] Добавить explicit waits где нужно
  - [ ] Улучшить WebSocket timing
  - [ ] Улучшить email polling
  - [ ] Проверить test data cleanup
  
- [ ] **Retry Strategies**
  - [ ] Создать `retryHelpers.ts`
  - [ ] Применить retry для нестабильных операций
  - [ ] Добавить exponential backoff где нужно
  
- [ ] **Timeout Tuning**
  - [ ] Обновить `playwright.config.ts`
  - [ ] Увеличить timeouts для медленных модулей
  - [ ] Добавить per-test timeouts где нужно
  
- [ ] **Verification**
  - [ ] Запустить все тесты 10 раз подряд
  - [ ] Flaky rate < 2%
  - [ ] Все тесты стабильны

---

### 4.2 Performance Optimization

#### 4.2.1 Performance Profiling

**Скрипт**: `e2e/scripts/profile-tests.ts`

```typescript
/**
 * Профилирование тестов для поиска узких мест
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

interface TestPerformance {
  testName: string;
  duration: number;
  retries: number;
  status: 'passed' | 'failed' | 'skipped';
}

async function profileTests(): Promise<TestPerformance[]> {
  console.log('📊 Profiling test performance...\n');
  
  const output = execSync('npx playwright test --reporter=json', {
    encoding: 'utf-8',
  });
  
  const report = JSON.parse(output);
  const results: TestPerformance[] = [];
  
  report.suites.forEach((suite: any) => {
    suite.specs.forEach((spec: any) => {
      spec.tests.forEach((test: any) => {
        results.push({
          testName: `${suite.title} > ${spec.title}`,
          duration: test.results[0]?.duration || 0,
          retries: test.results[0]?.retry || 0,
          status: test.results[0]?.status || 'unknown',
        });
      });
    });
  });
  
  return results.sort((a, b) => b.duration - a.duration);
}

async function main() {
  const results = await profileTests();
  
  console.log('🐌 Slowest tests:\n');
  results.slice(0, 20).forEach((test, idx) => {
    console.log(`${idx + 1}. ${test.testName}`);
    console.log(`   Duration: ${(test.duration / 1000).toFixed(2)}s`);
    console.log(`   Retries: ${test.retries}`);
    console.log('');
  });
  
  const avgDuration = results.reduce((sum, t) => sum + t.duration, 0) / results.length;
  console.log(`\n📈 Average test duration: ${(avgDuration / 1000).toFixed(2)}s`);
  
  const slowTests = results.filter(t => t.duration > avgDuration * 2);
  console.log(`⚠️  Tests > 2x avg: ${slowTests.length}`);
  
  // Save report
  fs.writeFileSync(
    'e2e/reports/performance-profile.json',
    JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
  );
  
  console.log('\n✅ Report saved to e2e/reports/performance-profile.json');
}

main();
```

#### 4.2.2 Optimization Techniques

**Technique 1: Параллелизация**

```typescript
// playwright.config.ts - оптимизация workers
export default defineConfig({
  // Локально: больше workers
  workers: process.env.CI ? 2 : 4,
  
  // Fully parallel mode (по умолчанию)
  fullyParallel: true,
  
  // Retry failed tests (только в CI)
  retries: process.env.CI ? 2 : 0,
});
```

**Technique 2: Test Data Caching**

```typescript
// utils/testDataCache.ts
const cache = new Map<string, any>();

export async function getCachedTeam(key: string, factory: () => Promise<any>) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const team = await factory();
  cache.set(key, team);
  return team;
}

// Использование (осторожно! только для read-only данных)
test('read team data', async ({ servers }) => {
  const team = await getCachedTeam('default-team', () =>
    createTeamInDb({ name: 'Test Team' })
  );
  
  // Только чтение, без изменений!
  expect(team.name).toBe('Test Team');
});
```

**Technique 3: Fixture Optimization**

```typescript
// Ленивая загрузка фикстур
export const optimizedFixtures = base.extend<{
  heavyFixture: HeavyType;
}>({
  // Scope: 'worker' - создается один раз для worker'а
  heavyFixture: [async ({}, use, workerInfo) => {
    const heavy = await createHeavyResource();
    await use(heavy);
    await heavy.cleanup();
  }, { scope: 'worker' }],
});

// Использование
test('uses heavy fixture', async ({ heavyFixture }) => {
  // heavyFixture создан один раз для всех тестов в worker'е
  await heavyFixture.doSomething();
});
```

**Technique 4: Избегать ненужных навигаций**

❌ **Плохо**:
```typescript
test('test 1', async ({ page, servers }) => {
  await page.goto(`${servers.appUrl}/page`);
  // ... test ...
});

test('test 2', async ({ page, servers }) => {
  // Заново загружает страницу (медленно!)
  await page.goto(`${servers.appUrl}/page`);
  // ... test ...
});
```

✅ **Хорошо** (если страница не меняется):
```typescript
test.describe.serial('page tests', () => {
  test.beforeAll(async ({ page, servers }) => {
    await page.goto(`${servers.appUrl}/page`);
  });
  
  test('test 1', async ({ page }) => {
    // Страница уже загружена
    // ... test ...
  });
  
  test('test 2', async ({ page }) => {
    // Переиспользуем загруженную страницу
    // ... test ...
  });
});
```

**Technique 5: Шардирование в CI**

```yaml
# .github/workflows/e2e-tests.yml
jobs:
  e2e-p1:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - run: npx playwright test --grep '@P1' --shard=${{ matrix.shard }}/4
```

#### 4.2.3 CI/CD Pipeline Optimization

**Optimization 1: Docker Layer Caching**

```dockerfile
# e2e/Dockerfile (оптимизированный)
FROM mcr.microsoft.com/playwright:v1.41.0-focal

WORKDIR /app

# Копировать только package files сначала (cache layer)
COPY package.json yarn.lock ./
COPY e2e/package.json e2e/yarn.lock ./e2e/

# Install dependencies (будет закэширован если package.json не изменился)
RUN yarn install --frozen-lockfile
RUN cd e2e && yarn install --frozen-lockfile

# Копировать остальное
COPY . .

# Compiled TypeScript (cache layer)
RUN cd e2e && npx tsc --noEmit

CMD ["yarn", "test:e2e"]
```

**Optimization 2: GitHub Actions Caching**

```yaml
# .github/workflows/e2e-tests.yml
jobs:
  e2e-p0:
    steps:
      - uses: actions/checkout@v3
      
      # Cache node_modules
      - uses: actions/cache@v3
        with:
          path: |
            node_modules
            e2e/node_modules
            api/node_modules
            app/node_modules
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-yarn-
      
      # Cache Playwright browsers
      - uses: actions/cache@v3
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ hashFiles('e2e/yarn.lock') }}
      
      - run: yarn install --frozen-lockfile
      - run: yarn test:e2e --grep '@P0'
```

**Optimization 3: Conditional Test Runs**

```yaml
# Запускать только измененные модули
jobs:
  detect-changes:
    outputs:
      api-changed: ${{ steps.changes.outputs.api }}
      app-changed: ${{ steps.changes.outputs.app }}
      e2e-changed: ${{ steps.changes.outputs.e2e }}
    steps:
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            api:
              - 'api/**'
            app:
              - 'app/**'
            e2e:
              - 'e2e/**'
  
  e2e-tests:
    needs: detect-changes
    if: needs.detect-changes.outputs.e2e-changed == 'true'
    steps:
      - run: yarn test:e2e
```

#### 4.2.4 Чек-лист Performance

- [ ] **Profiling**
  - [ ] Создать `profile-tests.ts` script
  - [ ] Запустить профилирование
  - [ ] Идентифицировать 20 самых медленных тестов
  - [ ] Анализировать причины медлительности
  
- [ ] **Optimization**
  - [ ] Увеличить workers (локально до 4-6)
  - [ ] Применить test data caching где безопасно
  - [ ] Оптимизировать fixtures (worker scope)
  - [ ] Избавиться от избыточных навигаций
  - [ ] Группировать serial tests где возможно
  
- [ ] **CI/CD**
  - [ ] Docker layer caching
  - [ ] GitHub Actions caching (node_modules, Playwright)
  - [ ] Шардирование для P1 тестов
  - [ ] Conditional runs для changed modules
  
- [ ] **Verification**
  - [ ] P0+P1 execution time < 15 минут
  - [ ] Full suite < 35 минут
  - [ ] CI/CD success rate > 95%

---

### 4.3 Documentation

#### 4.3.1 Fixtures Documentation

**Файл**: `e2e/fixtures/README.md`

```markdown
# E2E Test Fixtures

Полная документация всех фикстур для E2E тестирования.

## 📚 Содержание

1. [Базовые фикстуры](#базовые-фикстуры)
2. [Auth фикстуры](#auth-фикстуры)
3. [Team фикстуры](#team-фикстуры)
4. [Discussion фикстуры](#discussion-фикстуры)
5. [Real-time фикстуры](#real-time-фикстуры)
6. [Billing фикстуры](#billing-фикстуры)
7. [Email фикстуры](#email-фикстуры)
8. [File Upload фикстуры](#file-upload-фикстуры)

---

## Базовые фикстуры

### `servers`

Предоставляет URLs для API и App серверов.

**Файл**: `baseFixtures.ts`

**Интерфейс**:
```typescript
interface Servers {
  apiUrl: string;      // http://localhost:8000
  appUrl: string;      // http://localhost:3000
  mongoUri: string;    // mongodb://127.0.0.1:xxxxx/test
}
```

**Использование**:
```typescript
test('example', async ({ servers }) => {
  await page.goto(`${servers.appUrl}/login`);
  
  const response = await fetch(`${servers.apiUrl}/api/health`);
  expect(response.ok).toBeTruthy();
});
```

---

### `testDb`

Управление тестовой базой данных MongoDB.

**Файл**: `baseFixtures.ts`

**Интерфейс**:
```typescript
interface TestDb {
  clear(): Promise<void>;
  getCollection(name: string): Collection;
  seed(data: any): Promise<void>;
}
```

**Использование**:
```typescript
test('clean database', async ({ testDb }) => {
  // Очистить ВСЕ коллекции
  await testDb.clear();
  
  // Работать с конкретной коллекцией
  const users = testDb.getCollection('users');
  await users.insertOne({ email: 'test@test.com' });
  
  const count = await users.countDocuments();
  expect(count).toBe(1);
});
```

---

## Auth Фикстуры

### `authSession`

Создание и управление аутентифицированными сессиями.

**Файл**: `authFixtures.ts`

**Интерфейс**:
```typescript
interface AuthSession {
  createUser(data?: Partial<UserData>): Promise<User>;
  createAndAuthenticate(data?: Partial<UserData>): Promise<User>;
  authenticate(user: User): Promise<void>;
  logout(): Promise<void>;
}
```

**Использование**:
```typescript
test('authenticated user', async ({ page, servers, authSession }) => {
  // Создать пользователя И автоматически залогинить
  const user = await authSession.createAndAuthenticate({
    email: 'user@test.com',
    displayName: 'Test User',
  });
  
  // Пользователь уже залогинен, session cookie установлена
  await page.goto(`${servers.appUrl}/your-settings`);
  
  await expect(page.locator('[data-testid="user-email"]')).toContainText(
    user.email
  );
});

test('logout', async ({ page, servers, authSession }) => {
  const user = await authSession.createAndAuthenticate();
  
  await page.goto(`${servers.appUrl}/your-settings`);
  await authSession.logout();
  
  // После logout перенаправляет на login
  await page.goto(`${servers.appUrl}/your-settings`);
  await page.waitForURL(/\/login/);
});
```

---

## Team Фикстуры

### `teamContext`

Создание команды с участниками и ролями.

**Файл**: `teamFixtures.ts`

**Интерфейс**:
```typescript
interface TeamContext {
  team: Team;
  owner: User;
  members: User[];
  
  createTeam(data?: Partial<TeamData>): Promise<Team>;
  addMember(user: User, role?: 'member' | 'leader'): Promise<void>;
  removeMember(userId: string): Promise<void>;
  createInvitation(email: string): Promise<Invitation>;
}
```

**Использование**:
```typescript
test('team with members', async ({ page, servers, teamContext }) => {
  // Автоматически создает team с owner и 2 members
  const { team, owner, members } = teamContext;
  
  // Owner может приглашать
  await teamContext.createInvitation('newmember@test.com');
  
  // Navigate to team
  await page.goto(`${servers.appUrl}/discussion?teamSlug=${team.slug}`);
  
  await expect(page.locator('[data-testid="team-name"]')).toContainText(
    team.name
  );
});
```

---

## Discussion Фикстуры

### `discussionContext`

Создание обсуждения с постами и участниками.

**Файл**: `discussionFixtures.ts`

**Интерфейс**:
```typescript
interface DiscussionContext {
  discussion: Discussion;
  posts: Post[];
  members: User[];
  
  createPost(content: string, author?: User): Promise<Post>;
  editPost(postId: string, content: string): Promise<Post>;
  deletePost(postId: string): Promise<void>;
}
```

**Использование**:
```typescript
test('discussion with posts', async ({ page, servers, discussionContext }) => {
  const { discussion, posts, members } = discussionContext;
  
  // Discussion уже создана с 2-3 начальными постами
  expect(posts.length).toBeGreaterThan(0);
  
  // Создать новый пост
  const newPost = await discussionContext.createPost(
    'New post content',
    members[0]
  );
  
  // Navigate и проверить
  await page.goto(
    `${servers.appUrl}/discussion?discussionSlug=${discussion.slug}`
  );
  
  await expect(
    page.locator(`[data-testid="post-${newPost._id}"]`)
  ).toContainText('New post content');
});
```

---

## Real-time Фикстуры

### `realtimeObserver`

WebSocket клиент для тестирования real-time обновлений.

**Файл**: `realtimeFixtures.ts`

**Интерфейс**:
```typescript
interface RealtimeObserver {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  joinTeamRoom(teamId: string): Promise<void>;
  joinDiscussionRoom(discussionId: string): Promise<void>;
  waitForEvent(
    eventName: string,
    options?: { timeout?: number; filter?: (event: any) => boolean }
  ): Promise<any>;
}
```

**Использование**:
```typescript
test('receive live discussion update', async ({
  page,
  servers,
  discussionContext,
  realtimeObserver,
}) => {
  const { discussion } = discussionContext;
  
  // Подключиться и подписаться на события
  await realtimeObserver.connect();
  await realtimeObserver.joinDiscussionRoom(discussion._id);
  
  // Настроить ожидание события ДО триггера
  const eventPromise = realtimeObserver.waitForEvent('discussionEvent', {
    timeout: 10000,
    filter: (e) => e.actionType === 'edited',
  });
  
  // Триггер: редактировать обсуждение в UI
  await page.goto(`${servers.appUrl}/discussion?id=${discussion._id}`);
  await page.click('[data-testid="edit-discussion"]');
  await page.fill('[data-testid="discussion-name"]', 'Updated Name');
  await page.click('[data-testid="save-discussion"]');
  
  // Проверить, что событие получено
  const event = await eventPromise;
  expect(event.discussion.name).toBe('Updated Name');
});
```

---

## Billing Фикстуры

### `billingContext`

Stripe integration для тестирования billing.

**Файл**: `billingFixtures.ts`

**Интерфейс**:
```typescript
interface BillingContext {
  createSubscriptionForTeam(teamId: string, ownerId: string): Promise<Subscription>;
  createInvoicesForTeam(teamId: string, count: number): Promise<Invoice[]>;
  triggerStripeWebhook(event: StripeEvent): Promise<void>;
  fillStripeCheckoutForm(page: Page, cardData: CardData): Promise<void>;
}
```

**Использование**:
```typescript
test('view subscription', async ({ page, servers, teamContext, billingContext }) => {
  const { team, owner } = teamContext;
  
  // Создать subscription через Stripe test mode
  await billingContext.createSubscriptionForTeam(team._id, owner._id);
  
  // Navigate to billing
  await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
  
  await expect(page.locator('[data-testid="subscription-status"]')).toContainText(
    'Active'
  );
});
```

---

## Email Фикстуры

### `emailInbox`

Mailhog integration для захвата и проверки email'ов.

**Файл**: `emailFixtures.ts`

**Интерфейс**:
```typescript
interface EmailInbox {
  getEmails(): Promise<Email[]>;
  getLatestEmail(): Promise<Email | null>;
  findEmailBySubject(subject: string): Promise<Email | null>;
  findEmailByRecipient(email: string): Promise<Email[]>;
  waitForEmail(options: {
    subject?: string;
    to?: string;
    timeout?: number;
  }): Promise<Email>;
  extractLinkFromEmail(email: Email, pattern: RegExp): string | null;
  clear(): Promise<void>;
}
```

**Использование**:
```typescript
test('send invitation email', async ({
  page,
  servers,
  teamContext,
  emailInbox,
}) => {
  const { team } = teamContext;
  const inviteeEmail = 'invitee@test.com';
  
  // Отправить приглашение
  await page.goto(`${servers.appUrl}/team-settings?teamSlug=${team.slug}`);
  await page.fill('[data-testid="invite-email"]', inviteeEmail);
  await page.click('[data-testid="send-invitation"]');
  
  // Ждать email (с polling)
  const email = await emailInbox.waitForEmail({
    subject: 'invited to join',
    to: inviteeEmail,
    timeout: 5000,
  });
  
  // Проверить содержимое
  expect(email.subject).toContain(team.name);
  expect(email.body).toContain('Accept invitation');
  
  // Извлечь ссылку
  const invitationLink = emailInbox.extractLinkFromEmail(
    email,
    /https?:\/\/[^\\s]+\/invitation\\?token=[^\\s]+/
  );
  
  expect(invitationLink).toBeTruthy();
  
  // Перейти по ссылке
  await page.goto(invitationLink);
  await expect(page.locator('[data-testid="accept-button"]')).toBeVisible();
});
```

---

## File Upload Фикстуры

### `fileUploadContext`

Моки для S3 upload.

**Файл**: `fileFixtures.ts`

**Интерфейс**:
```typescript
interface FileUploadContext {
  mockS3Upload(response: 'success' | 'failure', url?: string): void;
  uploadFile(page: Page, selector: string, filePath: string): Promise<void>;
  getUploadedFiles(): string[];
}
```

**Использование**:
```typescript
test('upload avatar', async ({ page, servers, authSession, fileUploadContext }) => {
  await authSession.createAndAuthenticate();
  
  // Mock S3 upload
  fileUploadContext.mockS3Upload('success', 'https://s3.../avatar.jpg');
  
  // Upload file
  await page.goto(`${servers.appUrl}/your-settings`);
  await fileUploadContext.uploadFile(
    page,
    '[data-testid="avatar-upload"]',
    'e2e/fixtures/test-avatar.jpg'
  );
  
  // Проверить preview
  await expect(page.locator('[data-testid="avatar-preview"]')).toHaveAttribute(
    'src',
    /avatar\.jpg/
  );
});
```

---

## Комбинирование Фикстур

Все фикстуры можно использовать вместе:

```typescript
test('complex scenario', async ({
  page,
  servers,
  authSession,
  teamContext,
  discussionContext,
  realtimeObserver,
  billingContext,
  emailInbox,
}) => {
  // 1. Auth
  const user = await authSession.createAndAuthenticate();
  
  // 2. Team with subscription
  const { team } = teamContext;
  await billingContext.createSubscriptionForTeam(team._id, user._id);
  
  // 3. Discussion with real-time
  const { discussion } = discussionContext;
  await realtimeObserver.connect();
  await realtimeObserver.joinDiscussionRoom(discussion._id);
  
  // 4. Trigger action
  await page.goto(`${servers.appUrl}/discussion?id=${discussion._id}`);
  await page.fill('[data-testid="post-editor"]', 'New post');
  await page.click('[data-testid="submit-post"]');
  
  // 5. Verify real-time
  const event = await realtimeObserver.waitForEvent('postEvent');
  expect(event.actionType).toBe('added');
  
  // 6. Verify email
  const email = await emailInbox.waitForEmail({
    subject: 'New post',
    timeout: 5000,
  });
  expect(email).toBeTruthy();
});
```

---

## Лучшие практики

1. **Всегда очищайте БД**: `await testDb.clear()` в начале теста
2. **Используйте фикстуры**: Не создавайте данные вручную
3. **Explicit waits**: Используйте `waitForEvent`, `waitForEmail` вместо `setTimeout`
4. **Cleanup автоматический**: Фикстуры сами очищаются после теста
5. **Переиспользуйте**: DRY - создавайте фикстуры вместо копипасты

---

## Troubleshooting

### Фикстура не работает

```typescript
// ❌ Неправильно
import { test, expect } from '@playwright/test';

// ✅ Правильно
import { test, expect } from '../fixtures'; // Наши расширенные фикстуры
```

### Timeout в email/websocket

```typescript
// Увеличить timeout
const email = await emailInbox.waitForEmail({
  subject: 'Test',
  timeout: 15000, // 15 секунд
});

const event = await realtimeObserver.waitForEvent('test', {
  timeout: 20000, // 20 секунд
});
```

### База данных не очищается

```typescript
// Всегда очищайте в начале теста
test('my test', async ({ testDb }) => {
  await testDb.clear(); // ВАЖНО!
  
  // ... ваш тест ...
});
```
```

#### 4.3.2 Module Documentation

Создать README для каждого модуля тестов:

```markdown
# Authentication Tests

## Обзор

Тесты аутентификации покрывают:
- Google OAuth flow
- Passwordless email login
- Session management
- Logout functionality

## Файлы

- `passwordless.test.ts` - Passwordless authentication (10 тестов)
- `google-oauth.test.ts` - Google OAuth (6 тестов)
- `session.test.ts` - Session management (8 тестов)
- `logout.test.ts` - Logout flow (5 тестов)

## Запуск

```bash
# Все auth тесты
yarn test:e2e tests/02-auth/

# Конкретный файл
yarn test:e2e tests/02-auth/passwordless.test.ts

# С тегом
yarn test:e2e --grep '@auth'
```

## Типичные проблемы

### Passwordless token expired

**Проблема**: Тест падает с "Token expired"
**Решение**: Увеличить timeout в `waitForEmail`

### Google OAuth не работает

**Проблема**: Redirect не происходит
**Решение**: Проверить `GOOGLE_CLIENTID` в `.env.test`

## Примеры

См. [примеры](./examples/auth-examples.md)
```

#### 4.3.3 Troubleshooting Guide

**Файл**: `e2e/TROUBLESHOOTING.md`

```markdown
# E2E Testing Troubleshooting Guide

Руководство по решению типичных проблем.

## 📋 Содержание

1. [Серверы не запускаются](#серверы-не-запускаются)
2. [Тесты падают с timeout](#тесты-падают-с-timeout)
3. [База данных не очищается](#база-данных-не-очищается)
4. [Email не приходят](#email-не-приходят)
5. [WebSocket не подключается](#websocket-не-подключается)
6. [Stripe тесты не работают](#stripe-тесты-не-работают)

---

## Серверы не запускаются

### Симптомы
```
Error: Could not connect to API server at http://localhost:8000
```

### Причины и решения

**1. Порты заняты**
```bash
# Проверить, что занимает порты 8000/3000
lsof -i :8000
lsof -i :3000

# Убить процессы
kill -9 <PID>
```

**2. MongoDB не запустился**
```bash
# Проверить MongoDB Memory Server
cat e2e/global-state.json

# Если пусто - перезапустить тесты
yarn test:e2e
```

**3. Dependencies не установлены**
```bash
# Переустановить зависимости
rm -rf node_modules e2e/node_modules api/node_modules app/node_modules
yarn install
cd e2e && yarn install
cd ../api && yarn install
cd ../app && yarn install
```

---

## Тесты падают с timeout

### Симптомы
```
Test timeout of 60000ms exceeded
```

### Причины и решения

**1. Медленный CI**
```typescript
// Увеличить timeout в playwright.config.ts
export default defineConfig({
  timeout: process.env.CI ? 120000 : 60000,
});
```

**2. WebSocket/Email ожидание**
```typescript
// Увеличить timeout конкретно
await realtimeObserver.waitForEvent('event', {
  timeout: 20000, // было: 10000
});

await emailInbox.waitForEmail({
  timeout: 15000, // было: 5000
});
```

**3. Серверы тормозят**
```bash
# Проверить загрузку системы
top
htop

# Уменьшить workers если нужно
# playwright.config.ts
workers: process.env.CI ? 1 : 2,
```

---

## База данных не очищается

### Симптомы
```
Duplicate key error: email already exists
```

### Причины и решения

**1. Забыли testDb.clear()**
```typescript
test('my test', async ({ testDb }) => {
  await testDb.clear(); // ДОБАВИТЬ ЭТО!
  
  // ... тест ...
});
```

**2. Предыдущий тест не почистился**
```typescript
// Проверить afterEach hooks
test.afterEach(async ({ testDb }) => {
  await testDb.clear();
});
```

**3. MongoDB connection leaked**
```bash
# Перезапустить с чистым state
rm -f e2e/global-state.json
yarn test:e2e
```

---

## Email не приходят

### Симптомы
```
Error: Email not found after 5000ms
```

### Причины и решения

**1. Mailhog не запущен**
```bash
# Проверить Mailhog
curl http://localhost:8025/api/v2/messages

# Если не работает - запустить Docker
docker-compose -f docker-compose.test.yml up -d mailhog

# Или использовать yarn скрипт
yarn mailhog:start
```

**2. SMTP не настроен**
```bash
# Проверить .env.test
cat e2e/.env.test | grep SMTP

# Должно быть:
SMTP_HOST=localhost
SMTP_PORT=1025
MAILHOG_API_URL=http://localhost:8025
```

**3. Email действительно не отправлен**
```bash
# Проверить логи API сервера
# Должны быть записи о sendEmail()

# Проверить Mailhog UI
open http://localhost:8025
```

---

## WebSocket не подключается

### Симптомы
```
Error: WebSocket connection failed
```

### Причины и решения

**1. Session не установлена**
```typescript
// Убедиться, что пользователь залогинен
test('websocket test', async ({ page, authSession, realtimeObserver }) => {
  await authSession.createAndAuthenticate(); // ВАЖНО!
  
  await realtimeObserver.connect(); // Теперь работает
});
```

**2. Timeout слишком короткий**
```typescript
// Увеличить timeout подключения
await realtimeObserver.connect({ timeout: 10000 });
```

**3. Socket.IO порт неправильный**
```typescript
// Проверить, что используется правильный порт
// realtimeFixtures.ts
const socket = io(servers.apiUrl, { // Должен быть API URL
  transports: ['polling', 'websocket'],
});
```

---

## Stripe тесты не работают

### Симптомы
```
Error: Invalid API key provided
```

### Причины и решения

**1. Test keys не настроены**
```bash
# Проверить .env.test
cat e2e/.env.test | grep STRIPE

# Должно быть:
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
```

**2. Webhook secret неправильный**
```bash
# Получить webhook secret из Stripe Dashboard
# Test mode -> Webhooks -> Add endpoint

# Добавить в .env.test
STRIPE_TEST_WEBHOOK_SECRET=whsec_test_...
```

**3. Test mode не активен**
```typescript
// Убедиться, что используется test mode
// billingFixtures.ts
const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});
```

---

## Другие проблемы

### Module not found

```bash
# Проверить imports
# Должно быть:
import { test } from '../fixtures'; // ✅
// Не:
import { test } from '@playwright/test'; // ❌ (для тестов с кастомными fixtures)
```

### TypeScript errors

```bash
# Проверить компиляцию
cd e2e && npx tsc --noEmit

# Если ошибки - починить и проверить снова
```

### Flaky tests

```bash
# Запустить анализ
yarn analyze:flaky

# Изучить отчет
cat e2e/reports/flaky-tests-report.json
```

---

## Получить помощь

1. Проверить [FAQ](./FAQ.md)
2. Поискать в [GitHub Issues](https://github.com/.../issues)
3. Создать новый issue с:
   - Описанием проблемы
   - Шагами для воспроизведения
   - Логами (`e2e/test-results/`)
   - Скриншотами (если UI issue)
```

#### 4.3.4 Чек-лист Documentation

- [ ] **Fixtures Documentation**
  - [ ] Создать `e2e/fixtures/README.md` (полный)
  - [ ] Документировать все 8 фикстур с примерами
  - [ ] Примеры использования для каждой
  - [ ] Best practices
  
- [ ] **Module Documentation**
  - [ ] README для каждого модуля (11 модулей)
  - [ ] Обзор, файлы, запуск, troubleshooting
  - [ ] Примеры кода
  
- [ ] **Troubleshooting Guide**
  - [ ] Создать `e2e/TROUBLESHOOTING.md`
  - [ ] Покрыть все типичные проблемы
  - [ ] Решения с примерами команд
  
- [ ] **Contributing Guide**
  - [ ] Создать `e2e/CONTRIBUTING.md`
  - [ ] Как писать новые тесты
  - [ ] Как добавлять фикстуры
  - [ ] Code style, review process

---

### 4.4 Reporting & Monitoring

#### 4.4.1 Allure Integration (опционально)

**Установка**:
```bash
yarn add -D allure-playwright@^2.10.0
```

**Конфигурация**: `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    ['html'],
    ['junit', { outputFile: 'e2e/reports/junit.xml' }],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'e2e/allure-results',
      suiteTitle: true,
    }],
  ],
});
```

**Генерация отчета**:
```bash
# Запустить тесты
yarn test:e2e

# Сгенерировать Allure report
yarn allure:generate

# Открыть report
yarn allure:open
```

**package.json scripts**:
```json
{
  "scripts": {
    "allure:generate": "allure generate e2e/allure-results -o e2e/allure-report --clean",
    "allure:open": "allure open e2e/allure-report",
    "allure:serve": "allure serve e2e/allure-results"
  }
}
```

#### 4.4.2 Slack Notifications

**Скрипт**: `e2e/scripts/notify-slack.ts`

```typescript
/**
 * Отправка результатов тестов в Slack
 */

import * as fs from 'fs';
import axios from 'axios';

interface TestResults {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  flakyRate: number;
}

async function notifySlack(results: TestResults) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('⚠️  SLACK_WEBHOOK_URL not set, skipping notification');
    return;
  }
  
  const emoji = results.failed === 0 ? ':white_check_mark:' : ':x:';
  const color = results.failed === 0 ? 'good' : 'danger';
  
  const message = {
    text: `${emoji} E2E Tests ${results.failed === 0 ? 'Passed' : 'Failed'}`,
    attachments: [
      {
        color,
        fields: [
          {
            title: 'Total Tests',
            value: results.total.toString(),
            short: true,
          },
          {
            title: 'Passed',
            value: results.passed.toString(),
            short: true,
          },
          {
            title: 'Failed',
            value: results.failed.toString(),
            short: true,
          },
          {
            title: 'Duration',
            value: `${(results.duration / 1000 / 60).toFixed(2)} min`,
            short: true,
          },
          {
            title: 'Flaky Rate',
            value: `${results.flakyRate.toFixed(2)}%`,
            short: true,
          },
          {
            title: 'Environment',
            value: process.env.CI ? 'CI' : 'Local',
            short: true,
          },
        ],
        footer: 'Playwright E2E Tests',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
  
  try {
    await axios.post(webhookUrl, message);
    console.log('✅ Slack notification sent');
  } catch (error) {
    console.error('❌ Failed to send Slack notification:', error.message);
  }
}

async function main() {
  // Читать результаты из Playwright JSON reporter
  const reportPath = 'e2e/reports/results.json';
  
  if (!fs.existsSync(reportPath)) {
    console.error('❌ Test results not found');
    process.exit(1);
  }
  
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
  
  const results: TestResults = {
    total: report.stats.expected + report.stats.unexpected + report.stats.skipped,
    passed: report.stats.expected,
    failed: report.stats.unexpected,
    skipped: report.stats.skipped,
    duration: report.stats.duration,
    flakyRate: report.stats.flaky / (report.stats.expected + report.stats.unexpected) * 100,
  };
  
  await notifySlack(results);
}

main();
```

**GitHub Actions Integration**:
```yaml
# .github/workflows/e2e-tests.yml
jobs:
  e2e-tests:
    steps:
      - run: yarn test:e2e --reporter=json > e2e/reports/results.json
        continue-on-error: true
      
      - name: Notify Slack
        if: always()
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: yarn notify:slack
```

#### 4.4.3 Test Metrics Dashboard

**Скрипт**: `e2e/scripts/generate-metrics.ts`

```typescript
/**
 * Генерация метрик для мониторинга
 */

import * as fs from 'fs';

interface Metrics {
  timestamp: string;
  totalTests: number;
  passRate: number;
  failRate: number;
  flakyRate: number;
  avgDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  slowestTests: Array<{ name: string; duration: number }>;
}

async function generateMetrics(): Promise<Metrics> {
  const report = JSON.parse(
    fs.readFileSync('e2e/reports/results.json', 'utf-8')
  );
  
  const durations = report.suites
    .flatMap((s: any) => s.specs.map((spec: any) => ({
      name: spec.title,
      duration: spec.tests[0]?.results[0]?.duration || 0,
    })))
    .sort((a, b) => b.duration - a.duration);
  
  const p50 = durations[Math.floor(durations.length * 0.5)]?.duration || 0;
  const p95 = durations[Math.floor(durations.length * 0.95)]?.duration || 0;
  const p99 = durations[Math.floor(durations.length * 0.99)]?.duration || 0;
  
  const metrics: Metrics = {
    timestamp: new Date().toISOString(),
    totalTests: report.stats.expected + report.stats.unexpected,
    passRate: (report.stats.expected / (report.stats.expected + report.stats.unexpected)) * 100,
    failRate: (report.stats.unexpected / (report.stats.expected + report.stats.unexpected)) * 100,
    flakyRate: (report.stats.flaky / (report.stats.expected + report.stats.unexpected)) * 100,
    avgDuration: durations.reduce((sum, t) => sum + t.duration, 0) / durations.length,
    p50Duration: p50,
    p95Duration: p95,
    p99Duration: p99,
    slowestTests: durations.slice(0, 10),
  };
  
  return metrics;
}

async function main() {
  const metrics = await generateMetrics();
  
  // Append to metrics history
  const historyPath = 'e2e/reports/metrics-history.jsonl';
  fs.appendFileSync(historyPath, JSON.stringify(metrics) + '\n');
  
  // Save latest
  fs.writeFileSync(
    'e2e/reports/metrics-latest.json',
    JSON.stringify(metrics, null, 2)
  );
  
  console.log('📊 Metrics generated:');
  console.log(`  Pass Rate: ${metrics.passRate.toFixed(2)}%`);
  console.log(`  Fail Rate: ${metrics.failRate.toFixed(2)}%`);
  console.log(`  Flaky Rate: ${metrics.flakyRate.toFixed(2)}%`);
  console.log(`  Avg Duration: ${(metrics.avgDuration / 1000).toFixed(2)}s`);
  console.log(`  P95 Duration: ${(metrics.p95Duration / 1000).toFixed(2)}s`);
}

main();
```

#### 4.4.4 Coverage Badges

**Скрипт**: `e2e/scripts/generate-badge.ts`

```typescript
/**
 * Генерация badge для README
 */

import * as fs from 'fs';

function generateBadge(label: string, value: string, color: string): string {
  return `https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(value)}-${color}`;
}

async function main() {
  const metrics = JSON.parse(
    fs.readFileSync('e2e/reports/metrics-latest.json', 'utf-8')
  );
  
  const passRateColor = metrics.passRate >= 95 ? 'brightgreen' : metrics.passRate >= 90 ? 'green' : 'yellow';
  const flakyRateColor = metrics.flakyRate <= 2 ? 'brightgreen' : metrics.flakyRate <= 5 ? 'yellow' : 'red';
  
  const badges = [
    generateBadge('tests', metrics.totalTests.toString(), 'blue'),
    generateBadge('pass rate', `${metrics.passRate.toFixed(1)}%`, passRateColor),
    generateBadge('flaky rate', `${metrics.flakyRate.toFixed(1)}%`, flakyRateColor),
  ];
  
  console.log('\n📛 Badges:\n');
  badges.forEach(badge => console.log(`![Badge](${badge})`));
  
  // Update README
  const readme = fs.readFileSync('e2e/README.md', 'utf-8');
  const updated = readme.replace(
    /<!-- BADGES_START -->[\s\S]*<!-- BADGES_END -->/,
    `<!-- BADGES_START -->\n${badges.map(b => `![](${b})`).join(' ')}\n<!-- BADGES_END -->`
  );
  
  fs.writeFileSync('e2e/README.md', updated);
  console.log('\n✅ Badges updated in README.md');
}

main();
```

#### 4.4.5 Чек-лист Reporting & Monitoring

- [ ] **Allure Integration** (опционально)
  - [ ] Установить allure-playwright
  - [ ] Настроить reporter в playwright.config.ts
  - [ ] Создать scripts для генерации отчетов
  - [ ] Интегрировать в CI (опционально)
  
- [ ] **Slack Notifications**
  - [ ] Создать `notify-slack.ts` script
  - [ ] Получить Slack webhook URL
  - [ ] Добавить в GitHub Actions
  - [ ] Протестировать notifications
  
- [ ] **Metrics Dashboard**
  - [ ] Создать `generate-metrics.ts` script
  - [ ] Собирать метрики после каждого запуска
  - [ ] Хранить историю в `metrics-history.jsonl`
  - [ ] Визуализировать (Grafana опционально)
  
- [ ] **Coverage Badges**
  - [ ] Создать `generate-badge.ts` script
  - [ ] Генерировать badges
  - [ ] Обновлять README автоматически
  - [ ] Отображать в GitHub

---

## 5. Чек-лист выполнения

### Week 9: Stabilization & Performance

#### Day 1-2: Flaky Tests
- [ ] **Analysis**
  - [ ] Создать `analyze-flaky-tests.ts`
  - [ ] Запустить анализ (20 runs)
  - [ ] Идентифицировать flaky tests (> 0% failure)
  - [ ] Создать GitHub Issues

- [ ] **Fixes**
  - [ ] Починить race conditions
  - [ ] Добавить explicit waits
  - [ ] Улучшить WebSocket handling
  - [ ] Улучшить email polling
  - [ ] Проверить test cleanup

#### Day 3: Retry & Timeout
- [ ] **Retry Helpers**
  - [ ] Создать `retryHelpers.ts`
  - [ ] `retryAsync()` функция
  - [ ] `retryUntil()` функция
  - [ ] Применить в нестабильных местах

- [ ] **Timeout Tuning**
  - [ ] Обновить `playwright.config.ts`
  - [ ] Увеличить global timeout (60s)
  - [ ] Увеличить expect timeout (10s)
  - [ ] Настроить per-module timeouts

#### Day 4-5: Performance
- [ ] **Profiling**
  - [ ] Создать `profile-tests.ts`
  - [ ] Запустить профилирование
  - [ ] Идентифицировать slowest 20 tests
  - [ ] Анализировать причины

- [ ] **Optimization**
  - [ ] Увеличить workers (4-6 локально)
  - [ ] Test data caching где безопасно
  - [ ] Fixture optimization (worker scope)
  - [ ] Удалить избыточные навигации
  - [ ] Группировать serial tests

- [ ] **CI/CD Optimization**
  - [ ] Docker layer caching
  - [ ] GitHub Actions caching
  - [ ] Шардирование P1 tests
  - [ ] Conditional runs

### Week 10: Documentation & Monitoring

#### Day 6-7: Documentation
- [ ] **Fixtures Documentation**
  - [ ] `e2e/fixtures/README.md` (полный)
  - [ ] Все 8 фикстур с примерами
  - [ ] Best practices

- [ ] **Module Documentation**
  - [ ] README для каждого из 11 модулей
  - [ ] Обзор, запуск, troubleshooting

- [ ] **Guides**
  - [ ] `e2e/TROUBLESHOOTING.md`
  - [ ] `e2e/CONTRIBUTING.md`
  - [ ] `e2e/FAQ.md` (опционально)

#### Day 8: Monitoring
- [ ] **Allure** (опционально)
  - [ ] Установить allure-playwright
  - [ ] Настроить reporter
  - [ ] Создать scripts
  - [ ] Протестировать

- [ ] **Slack Notifications**
  - [ ] `notify-slack.ts` script
  - [ ] Webhook URL setup
  - [ ] GitHub Actions integration
  - [ ] Test notification

- [ ] **Metrics**
  - [ ] `generate-metrics.ts` script
  - [ ] Metrics history storage
  - [ ] Latest metrics JSON

- [ ] **Badges**
  - [ ] `generate-badge.ts` script
  - [ ] Auto-update README
  - [ ] Display in GitHub

#### Day 9: CI/CD Final
- [ ] **Pipeline Optimization**
  - [ ] Review and optimize workflows
  - [ ] Add caching где возможно
  - [ ] Optimize Docker builds
  - [ ] Conditional test runs

- [ ] **Monitoring Integration**
  - [ ] Slack notifications в CI
  - [ ] Metrics collection в CI
  - [ ] Badges auto-update
  - [ ] Allure publishing (optional)

#### Day 10: Final Review
- [ ] **Testing**
  - [ ] Запустить full suite 5 раз
  - [ ] Проверить flaky rate < 2%
  - [ ] Проверить timing < 35 min
  - [ ] Проверить CI/CD success rate > 95%

- [ ] **Documentation Review**
  - [ ] Все READMEs актуальны
  - [ ] Примеры работают
  - [ ] Troubleshooting полный
  - [ ] Links корректны

- [ ] **Sign-off**
  - [ ] Team review
  - [ ] Acceptance criteria met
  - [ ] Production ready
  - [ ] Handover documentation

---

## 6. Acceptance Criteria

### 6.1 Stabilization ✅

| Критерий | Требование | Проверка |
|----------|------------|----------|
| **Flaky Rate** | < 2% | Запустить все тесты 20 раз, < 2% failures |
| **All Tests Pass** | 100% pass rate (single run) | `yarn test:e2e` без failures |
| **Retry Strategies** | Implemented | `retryHelpers.ts` создан и используется |
| **Timeout Tuning** | Optimized | No timeout failures в stable run |

### 6.2 Performance ✅

| Критерий | Требование | Проверка |
|----------|------------|----------|
| **P0+P1 Time** | < 15 минут | Замерить время выполнения |
| **Full Suite Time** | < 35 минут | Замерить время выполнения |
| **CI/CD Success Rate** | > 95% | Проверить последние 20 runs |
| **Workers Optimized** | 4-6 локально, 2 в CI | Проверить `playwright.config.ts` |

### 6.3 Documentation ✅

| Критерий | Требование | Проверка |
|----------|------------|----------|
| **Fixtures Docs** | 100% documented | `e2e/fixtures/README.md` полный |
| **Module Docs** | All 11 modules | README в каждом test модуле |
| **Troubleshooting** | Comprehensive | `TROUBLESHOOTING.md` покрывает все |
| **Contributing** | Complete | `CONTRIBUTING.md` готов |

### 6.4 Monitoring ✅

| Критерий | Требование | Проверка |
|----------|------------|----------|
| **Slack Notifications** | Working | Test notification sent |
| **Metrics Collection** | Automated | `metrics-history.jsonl` пополняется |
| **Badges** | Auto-updated | README badges актуальны |
| **Allure** (optional) | Configured | Отчет генерируется |

### 6.5 Overall Фаза 5 ✅

| Метрика | Целевое значение | Actual | Status |
|---------|------------------|--------|--------|
| **Всего тестов** | 135-165 | TBD | ⏳ |
| **Flaky Rate** | < 2% | TBD | ⏳ |
| **P0+P1 Time** | < 15 мин | TBD | ⏳ |
| **Full Suite Time** | < 35 мин | TBD | ⏳ |
| **CI Success Rate** | > 95% | TBD | ⏳ |
| **Documentation** | 100% | TBD | ⏳ |
| **Production Ready** | ✅ | TBD | ⏳ |

---

## 7. Риски и митигации

### 7.1 Технические риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| **Не удается снизить flaky rate < 2%** | Средняя | Высокая | Увеличить timeouts агрессивно, добавить больше retry logic, пометить особо flaky тесты как @flaky и skip в CI |
| **Performance optimization недостаточна** | Низкая | Средняя | Увеличить workers, использовать шардирование, оптимизировать CI инфраструктуру |
| **Documentation занимает больше времени** | Средняя | Низкая | Приоритизировать critical docs (fixtures, troubleshooting), optional docs отложить |
| **Allure integration проблемы** | Низкая | Низкая | Allure optional, можно skip если проблемы |

### 7.2 Организационные риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| **Недостаточно времени на stabilization** | Средняя | Высокая | Фокус на P0/P1 тестах в первую очередь, P2 можно оставить flaky временно |
| **Team review bottleneck** | Низкая | Средняя | Начать review раньше (Day 7-8), распараллелить |
| **Production deployment delay** | Низкая | Средняя | Подготовить handover документацию заранее |

### 7.3 Mitigation Actions

1. **Flaky Tests**:
   - Начать stabilization с Day 1
   - Aggressive timeouts (лучше медленно но стабильно)
   - Пометить особо нестабильные тесты как `@flaky` и skip в critical CI paths

2. **Performance**:
   - Профилировать рано (Day 4)
   - Low-hanging fruit first (workers, caching)
   - Если не достигнем цели - приемлемо 16-18 минут для P0+P1

3. **Documentation**:
   - Использовать templates
   - Copy-paste от похожих модулей
   - AI assistance для boilerplate

4. **Time Management**:
   - Daily standups для sync
   - Blocker escalation немедленно
   - Buffer time в Day 10

---

## 8. Следующие шаги после Фазы 5

### 8.1 Production Deployment

После завершения Фазы 5:

1. **Handover**
   - Передать документацию команде
   - Провести training session
   - Ответить на вопросы

2. **Continuous Maintenance**
   - Мониторить flaky rate еженедельно
   - Обновлять тесты при изменениях в app
   - Добавлять новые тесты для новых features

3. **Improvements**
   - Собирать feedback от команды
   - Оптимизировать медленные тесты
   - Улучшать documentation по мере необходимости

### 8.2 Success Metrics (Long-term)

| Метрика | Target | Tracking |
|---------|--------|----------|
| **CI Success Rate** | > 95% | Weekly |
| **Flaky Rate** | < 2% | Weekly |
| **New Test Addition Rate** | ~10-20 tests/month | Monthly |
| **Documentation Updates** | As needed | Continuous |
| **Team Satisfaction** | High | Quarterly survey |

---

## Приложения

### A. Scripts Summary

| Script | Location | Purpose |
|--------|----------|---------|
| `analyze-flaky-tests.ts` | `e2e/scripts/` | Flaky test analysis |
| `profile-tests.ts` | `e2e/scripts/` | Performance profiling |
| `notify-slack.ts` | `e2e/scripts/` | Slack notifications |
| `generate-metrics.ts` | `e2e/scripts/` | Metrics collection |
| `generate-badge.ts` | `e2e/scripts/` | Badge generation |

### B. package.json Scripts

```json
{
  "scripts": {
    "analyze:flaky": "ts-node e2e/scripts/analyze-flaky-tests.ts",
    "profile:tests": "ts-node e2e/scripts/profile-tests.ts",
    "notify:slack": "ts-node e2e/scripts/notify-slack.ts",
    "metrics:generate": "ts-node e2e/scripts/generate-metrics.ts",
    "badges:update": "ts-node e2e/scripts/generate-badge.ts",
    "allure:generate": "allure generate e2e/allure-results -o e2e/allure-report --clean",
    "allure:open": "allure open e2e/allure-report",
    "mailhog:start": "docker-compose -f docker-compose.test.yml up -d mailhog",
    "mailhog:stop": "docker-compose -f docker-compose.test.yml stop mailhog"
  }
}
```

### C. Useful Commands

```bash
# Stabilization
yarn analyze:flaky                    # Analyze flaky tests
yarn test:e2e --repeat-each=20        # Run each test 20 times
yarn test:e2e --grep '@flaky'         # Run only flaky tests

# Performance
yarn profile:tests                    # Profile test performance
yarn test:e2e --workers=6             # Increase workers
yarn test:e2e --shard=1/4             # Run 1st shard of 4

# Documentation
yarn docs:serve                       # Serve documentation locally
yarn docs:build                       # Build documentation

# Monitoring
yarn metrics:generate                 # Generate metrics
yarn badges:update                    # Update badges
yarn notify:slack                     # Send Slack notification
yarn allure:serve                     # Serve Allure report
```

---

## Changelog

| Дата | Версия | Изменения | Автор |
|------|--------|-----------|-------|
| 2025-11-13 | 1.0 | Первоначальный план Фазы 5 | Claude AI |

---

**Конец документа - Фаза 5: Polish & Optimization**
