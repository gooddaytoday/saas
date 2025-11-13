# Фаза 1: Foundation - Детальный план реализации

> **Период**: Week 1-2  
> **Цель**: Базовая инфраструктура + P0 критические тесты  
> **Статус**: 🟡 В процессе  
> **Прогресс**: ~40% (инфраструктура готова, нужны тесты и fixtures)

---

## 📋 Содержание

1. [Текущее состояние](#текущее-состояние)
2. [Задачи Фазы 1](#задачи-фазы-1)
3. [Детальный план](#детальный-план)
4. [Чек-лист выполнения](#чек-лист-выполнения)
5. [Acceptance Criteria](#acceptance-criteria)

---

## 1. Текущее состояние

### ✅ Что УЖЕ реализовано

#### Инфраструктура (100%)
- [x] **MongoDB Memory Server** - `global-setup.ts`, `testDbHelper.ts`
- [x] **Server lifecycle management** - `serverManager.ts`, `apiServerManager.ts`, `appServerManager.ts`
- [x] **Базовые fixtures** - `baseFixtures.ts` с `servers`, `testDb`, `page`, `context`
- [x] **Playwright конфигурация** - `playwright.config.ts` с 4 workers, timeout, retries
- [x] **CI/CD setup** - GitHub Actions, GitLab CI, Docker

#### Utilities (90%)
- [x] **Data factories** - `utils/factories.ts`
  - `generateEmail()`, `createUserData()`, `createTeamData()`, `createDiscussionData()`, `createPostData()`
- [x] **Auth helpers** - `utils/authHelpers.ts`
  - `createUserInDb()`, `createTeamInDb()`, `createSessionForUser()`, `createAndAuthenticateUser()`, `createUserWithTeamInDb()`, `cleanupTestUsers()`
- [x] **API helpers** - `utils/apiHelpers.ts`
  - `makeApiRequest()` (предполагается)
- [x] **Wait utilities** - `utils/wait.ts`
  - `waitForPort()`, `waitForServer()` (предполагается)

#### Тесты (30%)
- [x] **Smoke tests** - `tests/smoke.test.ts` (4 теста)
  - Load login page
  - API server running
  - Database connection
  - App navigation
- [x] **Login/Auth tests** - `tests/auth/login.test.ts` (40+ тестов!)
  - UI login page checks
  - Google OAuth button
  - Email login form (disabled state)
  - SEO metadata
  - Redirect logic (authenticated/unauthenticated)
  - Auth API endpoints
  - Sessions & cookies
  - Complete auth flows
  - Cross-session persistence

### ❌ Что ОТСУТСТВУЕТ для завершения Фазы 1

#### Fixtures (50%)
- [ ] **`authSession` fixture** - Расширенная версия `authFixtures.ts`
  - Автоматический логин пользователя
  - Support разных типов пользователей (с командой / без команды)
  - Настройка session cookies
- [ ] **`teamContext` fixture** - Новый файл
  - Создание команды с участниками
  - Настройка ролей (leader/member)
  - Invitation tokens
- [ ] **Интеграция fixtures** - `fixtures/index.ts`
  - Экспорт всех fixtures
  - Правильная композиция

#### Тесты P0 (40%)
- [ ] **Smoke tests** - Расширение `tests/01-smoke/`
  - `servers.test.ts` - Детальные проверки серверов (см. `docs/e2e-fixture-servers.md`)
  - `basic-pages.test.ts` - Smoke всех основных страниц
- [ ] **Auth tests** - Реорганизация `tests/02-auth/`
  - Разбить `login.test.ts` (582 строки!) на модули:
    - `passwordless.test.ts` - Passwordless flow (приоритет 1)
    - `session.test.ts` - Session management
    - `logout.test.ts` - Logout flow
    - `google-oauth.test.ts` - Google OAuth (требует credentials)
- [ ] **Onboarding tests** - Новая директория `tests/03-onboarding/`
  - `first-login.test.ts` - Первый вход пользователя
  - `create-first-team.test.ts` - Создание первой команды
  - `profile-setup.test.ts` - Настройка профиля

#### Helpers (80%)
- [ ] **waitForResponse helper** - `utils/apiHelpers.ts`
  - Ожидание определенного API response
  - Retry логика
- [ ] **getAuthCookie helper** - Улучшение существующего в `authFixtures.ts`

---

## 2. Задачи Фазы 1

### 2.1 Setup & Infrastructure (DONE ✅)

| # | Задача | Статус | Файлы | Примечания |
|---|--------|--------|-------|------------|
| 1.1 | MongoDB Memory Server | ✅ Готово | `global-setup.ts`, `testDbHelper.ts` | Работает стабильно |
| 1.2 | Server lifecycle management | ✅ Готово | `serverManager.ts`, `apiServerManager.ts`, `appServerManager.ts` | Автозапуск/остановка |
| 1.3 | Базовые fixtures | ✅ Готово | `baseFixtures.ts` | `servers`, `testDb`, `page`, `context` |
| 1.4 | Data factories | ✅ Готово | `utils/factories.ts` | User, Team, Discussion, Post |
| 1.5 | Базовые auth helpers | ✅ Готово | `utils/authHelpers.ts` | createUserInDb, createTeamInDb, sessions |

### 2.2 Advanced Fixtures (TODO 🔴)

| # | Задача | Статус | Файлы | Приоритет |
|---|--------|--------|-------|-----------|
| 2.1 | Создать `authSession` fixture | 🔴 TODO | `fixtures/authSession.fixture.ts` | **P0 - HIGH** |
| 2.2 | Создать `teamContext` fixture | 🔴 TODO | `fixtures/teamContext.fixture.ts` | **P0 - HIGH** |
| 2.3 | Обновить `fixtures/index.ts` | 🔴 TODO | `fixtures/index.ts` | **P0 - MEDIUM** |
| 2.4 | Добавить `waitForResponse` helper | 🔴 TODO | `utils/apiHelpers.ts` | **P1 - LOW** |

### 2.3 P0: Smoke Tests (TODO 🔴)

| # | Задача | Статус | Файлы | Тестов |
|---|--------|--------|-------|--------|
| 3.1 | Расширить smoke.test.ts | 🟡 Частично | `tests/01-smoke/servers.test.ts` | 5-7 |
| 3.2 | Создать basic-pages.test.ts | 🔴 TODO | `tests/01-smoke/basic-pages.test.ts` | 8-10 |

### 2.4 P0: Auth Tests (TODO 🟡)

| # | Задача | Статус | Файлы | Тестов |
|---|--------|--------|-------|--------|
| 4.1 | Выделить passwordless tests | 🔴 TODO | `tests/02-auth/passwordless.test.ts` | 8-10 |
| 4.2 | Выделить session tests | 🔴 TODO | `tests/02-auth/session.test.ts` | 6-8 |
| 4.3 | Выделить logout tests | 🔴 TODO | `tests/02-auth/logout.test.ts` | 3-5 |
| 4.4 | Google OAuth tests | 🟠 Отложено | `tests/02-auth/google-oauth.test.ts` | 4-6 |

### 2.5 P0: Onboarding Tests (TODO 🔴)

| # | Задача | Статус | Файлы | Тестов |
|---|--------|--------|-------|--------|
| 5.1 | Тесты первого входа | 🔴 TODO | `tests/03-onboarding/first-login.test.ts` | 3-5 |
| 5.2 | Тесты создания команды | 🔴 TODO | `tests/03-onboarding/create-first-team.test.ts` | 4-6 |
| 5.3 | Тесты настройки профиля | 🔴 TODO | `tests/03-onboarding/profile-setup.test.ts` | 3-5 |

---

## 3. Детальный план

### 3.1 Задача 2.1: Создать `authSession` fixture ⭐

**Файл**: `e2e/fixtures/authSession.fixture.ts`

**Цель**: Предоставить готовую аутентифицированную сессию для тестов

**Интерфейс**:

```typescript
export interface AuthSessionFixture {
  authSession: {
    user: TestUser;
    team?: TestTeam;
    cookies: Record<string, string>;
  };
}
```

**Функциональность**:
1. Создание пользователя в БД
2. Опционально создание команды
3. Создание сессии для пользователя
4. Автоматическая установка cookies в browser context
5. Cleanup после теста

**Использование**:

```typescript
test('some feature', async ({ page, authSession }) => {
  // authSession.user уже залогинен
  // cookies уже установлены в browser context
  await page.goto('/your-settings');
  // Пользователь автоматически аутентифицирован
});
```

**Параметры**:
- `withTeam: boolean` (default: false) - Создавать ли команду
- `teamRole: 'leader' | 'member'` (default: 'leader') - Роль в команде
- `userData?: Partial<UserData>` - Переопределить данные пользователя
- `teamData?: Partial<TeamData>` - Переопределить данные команды

**Реализация**:

```typescript
import { test as base } from './baseFixtures';
import { createUserInDb, createTeamInDb, createSessionForUser, cleanupTestUsers } from '../utils/authHelpers';

export interface AuthSessionOptions {
  withTeam?: boolean;
  teamRole?: 'leader' | 'member';
  userData?: any;
  teamData?: any;
}

export interface AuthSessionFixture {
  authSession: {
    user: TestUser;
    team?: TestTeam;
    cookies: Record<string, string>;
  };
}

export const test = base.extend<AuthSessionFixture>({
  authSession: async ({ page, servers }, use) => {
    // 1. Create user
    const user = await createUserInDb();
    
    // 2. Create team (optional)
    let team;
    // if withTeam...
    
    // 3. Create session
    const sessionId = await createSessionForUser(user._id);
    
    // 4. Set cookies
    await page.context().addCookies([
      {
        name: 'connect.sid',
        value: sessionId,
        url: servers.appUrl,
        httpOnly: true,
      },
    ]);
    
    const cookies = { 'connect.sid': sessionId };
    
    // 5. Provide to test
    await use({ user, team, cookies });
    
    // 6. Cleanup
    await cleanupTestUsers();
  },
});
```

**Приоритет**: 🔴 **P0 - CRITICAL**  
**Оценка**: 3-4 часа  
**Зависимости**: `baseFixtures`, `authHelpers`

---

### 3.2 Задача 2.2: Создать `teamContext` fixture ⭐

**Файл**: `e2e/fixtures/teamContext.fixture.ts`

**Цель**: Предоставить готовую команду с участниками для тестов

**Интерфейс**:

```typescript
export interface TeamContextFixture {
  teamContext: {
    team: TestTeam;
    owner: TestUser;
    members: TestUser[];
    invitations?: any[];
  };
}
```

**Функциональность**:
1. Создание owner пользователя
2. Создание команды
3. Создание member пользователей (опционально)
4. Добавление members в команду
5. Создание invitation tokens (опционально)
6. Cleanup после теста

**Использование**:

```typescript
test('invite member', async ({ page, teamContext }) => {
  const { team, owner } = teamContext;
  // team и owner уже созданы
  // можно работать с приглашениями
});
```

**Параметры**:
- `membersCount: number` (default: 0) - Количество членов команды
- `withInvitations: boolean` (default: false) - Создавать ли invitation tokens
- `teamData?: Partial<TeamData>` - Переопределить данные команды

**Приоритет**: 🔴 **P0 - HIGH**  
**Оценка**: 4-5 часов  
**Зависимости**: `baseFixtures`, `authHelpers`, `authSession` (опционально)

---

### 3.3 Задача 3.1: Расширить smoke tests

**Файл**: `e2e/tests/01-smoke/servers.test.ts`

**Цель**: Детальная проверка работоспособности серверов (см. `docs/e2e-fixture-servers.md`)

**Тесты** (5-7 шт.):

1. **S1**: Validate `getServers()` returns valid URLs
   - Проверка структуры `{ apiUrl, appUrl, mongoUri }`
   - Валидация URL format (http://)
   - Error handling при отсутствии state

2. **S2**: API health endpoint check
   - `GET ${apiUrl}/api/v1/public/get-user`
   - Статус < 400
   - JSON response `{ ok: true }` или user data
   - Latency < 1s (warning если больше)

3. **S3**: App `/login` SSR check
   - `page.goto('/login')`
   - Статус 200
   - DOM содержит `data-testid="login-page"` или heading
   - No JS errors в console

4. **S4**: Passwordless token creation via API
   - `POST /api/v1/auth/email-login-link`
   - Статус 200
   - Response содержит `{ done: 1 }`
   - (Опционально) проверка записи в БД

5. **S5**: MongoDB connection check
   - `testDb.clear()` работает
   - Создание/чтение документа
   - После `clear()` коллекция пуста

6. **S6**: Server restart handling
   - Stop API server
   - Verify request fails
   - Restart API
   - Verify recovery

7. **S7**: Cross-worker isolation
   - Параллельные тесты получают одинаковые URLs
   - Нет конфликтов портов

**Пример теста**:

```typescript
import { test, expect } from '../../fixtures';
import { getServers } from '../../helpers';

test('@P0 @smoke S2: API health endpoint check', async ({ page }) => {
  const servers = await getServers();
  
  const startTime = Date.now();
  const response = await page.request.get(`${servers.apiUrl}/api/v1/public/get-user`);
  const latency = Date.now() - startTime;
  
  // Status should be < 400 (200, 401, 403 are ok)
  expect(response.status()).toBeLessThan(400);
  
  // Should return JSON
  const data = await response.json();
  expect(data).toBeDefined();
  
  // Latency warning
  if (latency > 1000) {
    console.warn(`⚠️  API latency: ${latency}ms (expected < 1000ms)`);
  }
  expect(latency).toBeLessThan(5000); // Hard limit
});
```

**Приоритет**: 🟡 **P0 - MEDIUM**  
**Оценка**: 2-3 часа  
**Зависимости**: `baseFixtures`, `getServers`

---

### 3.4 Задача 3.2: Создать basic-pages smoke tests

**Файл**: `e2e/tests/01-smoke/basic-pages.test.ts`

**Цель**: Smoke проверка всех основных страниц приложения

**Тесты** (8-10 шт.):

1. **Login page** (`/login`)
   - Loads without errors
   - Has title
   - Has Google OAuth button
   - No console errors

2. **Create team page** (`/create-team`) - authenticated
   - Redirects to login if not authenticated
   - Loads for authenticated user
   - Has team creation form

3. **Your settings page** (`/your-settings`) - authenticated
   - Loads for authenticated user with team
   - Has profile form
   - Can toggle theme

4. **Team settings page** (`/team-settings`) - leader only
   - Loads for team leader
   - 403 for non-leader
   - Has team management UI

5. **Discussion page** (`/discussion`) - authenticated
   - Loads for team member
   - Has discussion list
   - Has post editor (if discussion selected)

6. **Billing page** (`/billing`) - leader only
   - Loads for team leader
   - 403 for non-leader
   - Has Stripe integration UI

7. **Invitation page** (`/invitation?token=...`) - public
   - Loads without auth
   - Shows invitation info
   - Handles invalid token gracefully

8. **Login cached page** (`/login-cached`) - public
   - Loads without errors
   - Shows loading state

**Пример теста**:

```typescript
test('@P0 @smoke login page loads without errors', async ({ page }) => {
  await page.goto('/login');
  
  // Check status
  await expect(page).toHaveTitle(/login|sign/i);
  
  // Check content
  const heading = page.locator('text=/Log in or Sign up/i');
  await expect(heading).toBeVisible();
  
  // Check Google OAuth button
  const googleButton = page.locator('a[href*="google"]');
  await expect(googleButton).toBeVisible();
  
  // No console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);
});

test('@P0 @smoke create-team requires authentication', async ({ page }) => {
  await page.goto('/create-team');
  
  // Should redirect to login
  await page.waitForURL('**/login');
  expect(page.url()).toContain('/login');
});

test('@P0 @smoke your-settings loads for authenticated user', async ({ page, authSession }) => {
  const { user, team } = authSession;
  
  await page.goto(`/your-settings?teamSlug=${team.slug}`);
  
  // Should not redirect
  await page.waitForLoadState('networkidle');
  expect(page.url()).toContain('/your-settings');
  
  // Should show profile form
  const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
  await expect(nameInput).toBeVisible();
});
```

**Приоритет**: 🟡 **P0 - MEDIUM**  
**Оценка**: 3-4 часа  
**Зависимости**: `authSession` fixture (для authenticated tests)

---

### 3.5 Задача 4.1: Выделить passwordless tests

**Файл**: `e2e/tests/02-auth/passwordless.test.ts`

**Цель**: Изолировать и расширить тесты passwordless аутентификации

**Тесты** (8-10 шт.):

1. **Request passwordless link**
   - POST to `/auth/email-login-link`
   - Response `{ done: 1 }`
   - Token created in DB

2. **Login with valid token**
   - GET `/auth/logged_in?token=...&uid=...`
   - Session created
   - User authenticated
   - Redirect to `/create-team` or `/your-settings`

3. **Login with invalid token**
   - GET with wrong token
   - No session created
   - Redirect to `/login` with error

4. **Login with expired token**
   - Create token with TTL in past
   - Attempt login
   - Should fail gracefully

5. **Token can only be used once**
   - Login with token (success)
   - Try to use same token again
   - Should fail

6. **Email link contains correct URL**
   - Request link
   - Verify email sent (if emailInbox available)
   - Check URL format

7. **Passwordless for existing user**
   - User already exists in DB
   - Request link
   - Login creates session, doesn't duplicate user

8. **Passwordless for new user**
   - User doesn't exist
   - Request link
   - Login creates user and session

9. **Session persists after passwordless login**
   - Login via passwordless
   - Navigate to different pages
   - Session remains active

10. **Invitation token integration**
    - Request login with invitationToken in query
    - Login
    - User added to team
    - Redirect to team page

**Пример теста**:

```typescript
import { test, expect } from '../../fixtures';
import { getServers, getTestDb } from '../../helpers';
import { generateEmail } from '../../utils/factories';
import { makeApiRequest } from '../../utils/apiHelpers';

test('@P0 @auth @passwordless request passwordless link', async ({ page }) => {
  const servers = await getServers();
  const testDb = await getTestDb();
  await testDb.clear();
  
  const email = generateEmail();
  
  // Request link
  const response = await makeApiRequest(servers.apiUrl, '/auth/email-login-link', {
    method: 'POST',
    body: { email },
  });
  
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data).toEqual({ done: 1 });
  
  // Verify token created in DB
  const MongoClient = require('mongodb').MongoClient;
  const client = new MongoClient(servers.mongoUri);
  await client.connect();
  
  try {
    const db = client.db();
    const token = await db.collection('passwordless-token').findOne({ email });
    
    expect(token).toBeTruthy();
    expect(token.email).toBe(email);
    expect(token.ttl).toBeTruthy();
    expect(new Date(token.ttl)).toBeInstanceOf(Date);
  } finally {
    await client.close();
  }
});

test('@P0 @auth @passwordless login with valid token', async ({ page }) => {
  const servers = await getServers();
  const testDb = await getTestDb();
  await testDb.clear();
  
  // 1. Create user and token manually
  const email = generateEmail();
  // ... create token in DB with uid ...
  
  // 2. Login via token
  await page.goto(`/auth/logged_in?token=${token}&uid=${uid}`);
  
  // 3. Should redirect to create-team (no team) or your-settings (with team)
  await page.waitForURL(/\/(create-team|your-settings|login)/);
  const url = page.url();
  expect(url).toMatch(/create-team|your-settings/);
  
  // 4. Session should be created
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'connect.sid');
  expect(sessionCookie).toBeTruthy();
});
```

**Приоритет**: 🔴 **P0 - CRITICAL**  
**Оценка**: 4-5 часов  
**Источник**: Извлечь из `tests/auth/login.test.ts` (строки связанные с passwordless)  
**Зависимости**: `baseFixtures`, `authHelpers`, `apiHelpers`

---

### 3.6 Задача 4.2: Выделить session tests

**Файл**: `e2e/tests/02-auth/session.test.ts`

**Цель**: Тестирование session management

**Тесты** (6-8 шт.):

1. **Session created on login**
2. **Session persists across page navigations**
3. **Session stored in MongoDB**
4. **Session cookie has correct attributes** (httpOnly, secure, maxAge)
5. **Session expires after TTL**
6. **Session can be invalidated (logout)**
7. **Session validates user existence**
8. **Cross-browser session handling** (cookies portable)

**Приоритет**: 🟡 **P0 - MEDIUM**  
**Оценка**: 2-3 часа  
**Источник**: Извлечь из `tests/auth/login.test.ts` (строки 298-369)

---

### 3.7 Задача 4.3: Выделить logout tests

**Файл**: `e2e/tests/02-auth/logout.test.ts`

**Цель**: Тестирование logout flow

**Тесты** (3-5 шт.):

1. **Logout clears session**
   - Navigate to `/logout`
   - Session deleted from DB
   - Cookie removed

2. **Logout redirects to login**
   - Logout
   - Redirected to `/login`

3. **Cannot access protected pages after logout**
   - Logout
   - Try to access `/your-settings`
   - Redirected to `/login`

4. **Logout API endpoint responds correctly**
   - GET `/logout`
   - Returns 302 (redirect)

5. **Multiple logouts handled gracefully**
   - Logout twice
   - No errors

**Приоритет**: 🟢 **P0 - LOW**  
**Оценка**: 1-2 часа  
**Источник**: Извлечь из `tests/auth/login.test.ts` (строка 285-295)

---

### 3.8 Задача 5.1: Тесты первого входа

**Файл**: `e2e/tests/03-onboarding/first-login.test.ts`

**Цель**: Проверка onboarding flow для нового пользователя

**Тесты** (3-5 шт.):

1. **New user redirected to create-team**
   - Login as new user (no team)
   - Redirected to `/create-team`

2. **Existing user with team redirected to your-settings**
   - Login as user with team
   - Redirected to `/your-settings` or team dashboard

3. **User without team sees create-team page**
   - Navigate to `/create-team`
   - Page loads
   - Has team creation form

4. **User with team can still access create-team** (to create additional team)
   - Authenticated with team
   - Navigate to `/create-team`
   - Page loads

5. **First login triggers welcome email** (if emailInbox available)
   - New user logs in
   - Welcome email sent

**Приоритет**: 🟡 **P0 - MEDIUM**  
**Оценка**: 2-3 часа  
**Зависимости**: `authSession` fixture

---

### 3.9 Задача 5.2: Тесты создания команды

**Файл**: `e2e/tests/03-onboarding/create-first-team.test.ts`

**Цель**: Проверка создания первой команды

**Тесты** (4-6 шт.):

1. **Create team with valid data**
   - Fill form (name, avatar optional)
   - Submit
   - Team created in DB
   - User redirected to team page

2. **Team slug generated correctly**
   - Create team "My Team"
   - Slug should be "my-team" or similar

3. **User becomes team leader**
   - Create team
   - User's `defaultTeamSlug` updated
   - User in team's `memberIds`
   - User is `teamLeaderId`

4. **Create team form validation**
   - Empty name → error
   - Too short name → error
   - Invalid characters → error

5. **Cannot create duplicate team slug**
   - Create team "Test Team"
   - Try to create another "Test Team"
   - Should auto-generate unique slug or show error

6. **Create team updates user's defaultTeamSlug**
   - User has no team
   - Create team
   - User's `defaultTeamSlug` set to new team slug

**Приоритет**: 🟡 **P0 - MEDIUM**  
**Оценка**: 3-4 часа  
**Зависимости**: `authSession` fixture

---

### 3.10 Задача 5.3: Тесты настройки профиля

**Файл**: `e2e/tests/03-onboarding/profile-setup.test.ts`

**Цель**: Проверка настройки профиля пользователя

**Тесты** (3-5 шт.):

1. **Update profile name**
   - Navigate to `/your-settings`
   - Change name
   - Submit
   - Name updated in DB
   - UI reflects change

2. **Upload avatar** (requires fileUpload mock)
   - Navigate to `/your-settings`
   - Upload image
   - Avatar URL updated
   - Image displayed

3. **Toggle dark theme**
   - Toggle theme switch
   - `darkTheme` updated in DB
   - Theme applied globally
   - Persists after refresh

4. **Profile slug generated correctly**
   - User created with name "John Doe"
   - Slug should be "john-doe" or similar

5. **Profile form validation**
   - Empty name → error
   - Too short name → error
   - Invalid avatar URL → error (if URL input)

**Приоритет**: 🟢 **P0 - LOW**  
**Оценка**: 2-3 часа  
**Зависимости**: `authSession` fixture, (опционально) `fileUploadContext` fixture

---

## 4. Чек-лист выполнения

### Week 1: Fixtures & Smoke Tests

- [ ] **Day 1-2**: Создать `authSession` fixture (Задача 2.1)
  - [ ] Реализовать базовый fixture
  - [ ] Добавить параметры (withTeam, teamRole)
  - [ ] Тестировать fixture отдельно
  - [ ] Документировать usage

- [ ] **Day 3**: Создать `teamContext` fixture (Задача 2.2)
  - [ ] Реализовать fixture
  - [ ] Добавить support для members
  - [ ] Тестировать fixture
  - [ ] Документировать

- [ ] **Day 4**: Обновить `fixtures/index.ts` (Задача 2.3)
  - [ ] Экспортировать новые fixtures
  - [ ] Создать composed test instance
  - [ ] Обновить документацию

- [ ] **Day 5**: Smoke tests (Задачи 3.1, 3.2)
  - [ ] Создать `01-smoke/servers.test.ts` (5-7 тестов)
  - [ ] Создать `01-smoke/basic-pages.test.ts` (8-10 тестов)
  - [ ] Запустить и отладить
  - [ ] Проверить стабильность (flaky?)

### Week 2: Auth & Onboarding Tests

- [ ] **Day 6-7**: Passwordless tests (Задача 4.1)
  - [ ] Извлечь тесты из `login.test.ts`
  - [ ] Создать `02-auth/passwordless.test.ts`
  - [ ] Добавить недостающие тесты
  - [ ] Использовать `authSession` fixture
  - [ ] Отладить и стабилизировать

- [ ] **Day 8**: Session & Logout tests (Задачи 4.2, 4.3)
  - [ ] Создать `02-auth/session.test.ts` (6-8 тестов)
  - [ ] Создать `02-auth/logout.test.ts` (3-5 тестов)
  - [ ] Отладить

- [ ] **Day 9**: Onboarding tests Part 1 (Задачи 5.1, 5.2)
  - [ ] Создать `03-onboarding/first-login.test.ts` (3-5 тестов)
  - [ ] Создать `03-onboarding/create-first-team.test.ts` (4-6 тестов)
  - [ ] Отладить

- [ ] **Day 10**: Onboarding tests Part 2 & Finalize (Задача 5.3)
  - [ ] Создать `03-onboarding/profile-setup.test.ts` (3-5 тестов)
  - [ ] Запустить все P0 тесты вместе
  - [ ] Проверить CI/CD интеграцию
  - [ ] Написать документацию

---

## 5. Acceptance Criteria

### 5.1 Deliverables

✅ **Фаза 1 считается завершенной, если:**

1. **Fixtures реализованы** (100%)
   - [x] `authSession` fixture работает
   - [x] `teamContext` fixture работает
   - [x] `fixtures/index.ts` экспортирует все
   - [x] Документация по usage

2. **P0 Smoke tests** (13-17 тестов)
   - [x] `01-smoke/servers.test.ts` (5-7 тестов) проходят
   - [x] `01-smoke/basic-pages.test.ts` (8-10 тестов) проходят
   - [x] Все тесты стабильные (не flaky)

3. **P0 Auth tests** (17-23 теста)
   - [x] `02-auth/passwordless.test.ts` (8-10 тестов) проходят
   - [x] `02-auth/session.test.ts` (6-8 тестов) проходят
   - [x] `02-auth/logout.test.ts` (3-5 тестов) проходят
   - [x] Все тесты стабильные

4. **P0 Onboarding tests** (10-16 тестов)
   - [x] `03-onboarding/first-login.test.ts` (3-5 тестов) проходят
   - [x] `03-onboarding/create-first-team.test.ts` (4-6 тестов) проходят
   - [x] `03-onboarding/profile-setup.test.ts` (3-5 тестов) проходят
   - [x] Все тесты стабильные

5. **CI/CD интеграция**
   - [x] P0 тесты запускаются на PR
   - [x] Время выполнения < 6 минут
   - [x] Artifacts загружаются при failure
   - [x] JUnit report генерируется

6. **Документация**
   - [x] README обновлен
   - [x] CONTRIBUTING guide для новых тестов
   - [x] Fixture usage examples
   - [x] Troubleshooting guide

### 5.2 Метрики

| Метрика | Целевое значение | Проверка |
|---------|------------------|----------|
| **Общее количество P0 тестов** | 40-56 | Подсчет файлов |
| **Время выполнения P0** | < 6 минут | Playwright HTML report |
| **Flaky test rate** | 0% | Запустить 10 раз, проверить failures |
| **Code coverage (fixtures)** | 80%+ | Jest coverage (если применимо) |
| **CI/CD success rate** | 100% | GitHub Actions history |

### 5.3 Quality Gates

**Перед переходом к Фазе 2:**

1. ✅ Все P0 тесты (40-56 шт.) проходят локально
2. ✅ Все P0 тесты проходят в CI/CD
3. ✅ Flaky test rate = 0% (после 10 прогонов)
4. ✅ Время выполнения < 6 минут
5. ✅ Документация завершена и reviewed
6. ✅ Code review fixtures и тестов пройден
7. ✅ Нет критических блокеров для Фазы 2

---

## 6. Дополнительные заметки

### 6.1 Текущая структура директорий

```
e2e/
├── fixtures/
│   ├── authFixtures.ts         # Существует (неполный)
│   ├── baseFixtures.ts         # ✅ Готово
│   ├── authSession.fixture.ts  # 🔴 TODO (Задача 2.1)
│   ├── teamContext.fixture.ts  # 🔴 TODO (Задача 2.2)
│   └── index.ts                # 🔴 TODO (Задача 2.3)
│
├── tests/
│   ├── smoke.test.ts           # Существует (4 теста)
│   ├── 01-smoke/               # 🔴 TODO
│   │   ├── servers.test.ts     # 🔴 TODO (Задача 3.1)
│   │   └── basic-pages.test.ts # 🔴 TODO (Задача 3.2)
│   │
│   ├── auth/
│   │   └── login.test.ts       # Существует (582 строки, 40+ тестов)
│   ├── 02-auth/                # 🔴 TODO (реорганизация)
│   │   ├── passwordless.test.ts # 🔴 TODO (Задача 4.1)
│   │   ├── session.test.ts      # 🔴 TODO (Задача 4.2)
│   │   ├── logout.test.ts       # 🔴 TODO (Задача 4.3)
│   │   └── google-oauth.test.ts # 🟠 Отложено (Задача 4.4)
│   │
│   └── 03-onboarding/          # 🔴 TODO
│       ├── first-login.test.ts        # 🔴 TODO (Задача 5.1)
│       ├── create-first-team.test.ts  # 🔴 TODO (Задача 5.2)
│       └── profile-setup.test.ts      # 🔴 TODO (Задача 5.3)
│
└── utils/
    ├── authHelpers.ts          # ✅ Готово
    ├── factories.ts            # ✅ Готово
    ├── apiHelpers.ts           # ✅ Готово (предполагается)
    └── wait.ts                 # ✅ Готово (предполагается)
```

### 6.2 Важные замечания

1. **Реорганизация `login.test.ts`**:
   - Файл очень большой (582 строки, 40+ тестов)
   - Многие тесты можно перенести в модульные файлы
   - Некоторые тесты дублируют друг друга - можно удалить дубликаты
   - После реорганизации файл можно удалить или оставить legacy тесты

2. **Google OAuth тесты** (Задача 4.4):
   - Требуют Google test credentials
   - Можно отложить до получения credentials
   - Или использовать mock OAuth flow

3. **Email notification тесты**:
   - Многие тесты упоминают email notifications
   - Сейчас нет `emailInbox` fixture
   - Можно пропустить проверки email или добавить TODO комментарии
   - Полная реализация в Фазе 4

4. **File upload тесты**:
   - `profile-setup.test.ts` требует upload avatar
   - Сейчас нет `fileUploadContext` fixture
   - Можно пропустить или сделать basic версию
   - Полная реализация в Фазе 3

5. **Приоритизация**:
   - Сначала сделать fixtures (критично для всех тестов)
   - Затем smoke tests (быстрые, важные)
   - Затем auth tests (критический путь)
   - Затем onboarding tests (user journey)

### 6.3 Риски и митигации

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| **Fixtures слишком сложные** | Средняя | Начать с простой версии, итеративно расширять |
| **Реорганизация login.test.ts займет много времени** | Средняя | Можно просто скопировать тесты, не удаляя оригинал |
| **Тесты будут flaky** | Средняя | Использовать explicit waits, retry logic, stable selectors |
| **Нехватка времени** | Низкая | Приоритизировать: fixtures → smoke → passwordless → остальное |
| **Зависимости от внешних сервисов** | Низкая | Моки для Google OAuth, S3, email |

### 6.4 Следующие шаги после Фазы 1

**Переход к Фазе 2** (Week 3-4):
- Teams module tests
- Discussions module tests
- Posts module tests

**Зависимости для Фазы 2**:
- `authSession` fixture (готов в Фазе 1)
- `teamContext` fixture (готов в Фазе 1)
- `discussionContext` fixture (создать в Фазе 2)

---

## Changelog

| Дата | Версия | Изменения | Автор |
|------|--------|-----------|-------|
| 2025-11-13 | 1.0 | Первоначальный детальный план Фазы 1 | Claude AI |

---

**Конец документа**

_Этот план будет обновляться по мере прогресса реализации._
