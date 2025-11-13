# План покрытия E2E-тестами: Полный обзор

> Верхнеуровневый план тестирования для SaaS приложения (форк async-labs/saas)
> 
> **Дата создания**: 2025-11-13  
> **Статус**: Планирование

---

## 📋 Содержание

1. [Обзор приложения](#обзор-приложения)
2. [Архитектура тестирования](#архитектура-тестирования)
3. [Карта функциональности](#карта-функциональности)
4. [Структура тестовых наборов](#структура-тестовых-наборов)
5. [Фикстуры и утилиты](#фикстуры-и-утилиты)
6. [Приоритизация тестов](#приоритизация-тестов)
7. [План реализации](#план-реализации)
8. [Метрики и отчетность](#метрики-и-отчетность)

---

## 1. Обзор приложения

### 1.1 Технологический стек

**Frontend (App)**:
- Next.js 12+ (React 18+, TypeScript)
- Material-UI v5
- MobX для управления состоянием
- Socket.IO Client для real-time

**Backend (API)**:
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO для WebSockets
- Passport (Google OAuth + Passwordless)
- Stripe API для биллинга
- AWS S3, SES, Lambda

**E2E Infrastructure**:
- Playwright 1.41+
- MongoDB Memory Server
- TypeScript 5.3+

### 1.2 Ключевые функции приложения

| Категория | Функции |
|-----------|---------|
| **Аутентификация** | Google OAuth, Passwordless email login, Session management, Invitation flow |
| **Пользователь** | Profile (name, avatar), Theme toggle (dark/light), Settings management |
| **Команды** | Create team, Team settings, Invite members, Remove members, Member roles |
| **Обсуждения** | CRUD discussions, Members management, Notifications settings |
| **Посты** | Create/Edit/Delete posts, Markdown → HTML, File attachments, Real-time updates |
| **Биллинг** | Stripe subscriptions, Payment methods, Invoices, Cancel subscription |
| **Real-time** | WebSocket connections, Live discussion updates, Live post updates |
| **Email** | Welcome emails, Login links, Invitation emails, Post notifications |

---

## 2. Архитектура тестирования

### 2.1 Текущая инфраструктура

```
┌─────────────────────────────────────────────────────┐
│          Playwright Test Runner (4 workers)          │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│  API Server    │   │   App Server    │
│  (Port 8000)   │◄──┤   (Port 3000)   │
└───────┬────────┘   └─────────────────┘
        │
┌───────▼────────────────────────┐
│  MongoDB Memory Server         │
│  (In-memory, isolated per run) │
└────────────────────────────────┘
```

**Особенности**:
- Автоматический запуск серверов в `global-setup.ts`
- Изолированная БД для каждого тестового прогона
- Параллельное выполнение с worker isolation
- Автоматическая очистка между тестами

### 2.2 Принципы покрытия

1. **User Journey First**: Тестируем критические пользовательские сценарии
2. **API + UI Combined**: Проверяем интеграцию frontend ↔ backend
3. **Real Dependencies**: Используем реальные серверы, не моки (кроме внешних API)
4. **Data Isolation**: Каждый тест начинается с чистой БД
5. **Flakiness Prevention**: Explicit waits, retry logic, stable selectors

---

## 3. Карта функциональности

### 3.1 API Endpoints

#### Public API (`/api/v1/public`)
- `GET /get-user` - Получение текущего пользователя
- `POST /get-user-by-slug` - Поиск пользователя по slug
- `GET /invitations/get-team-by-token` - Проверка invitation token

#### Team Member API (`/api/v1/team-member`)
**User**:
- `POST /user/update-profile` - Обновление профиля (name, avatar)
- `POST /user/toggle-theme` - Переключение темы

**Teams & Discussions**:
- `POST /get-initial-data` - Загрузка teams, discussions, members
- `POST /discussions/add` - Создание обсуждения
- `POST /discussions/edit` - Редактирование обсуждения
- `POST /discussions/delete` - Удаление обсуждения
- `POST /discussions/add-or-edit-members` - Управление участниками

**Posts**:
- `POST /posts/add` - Создание поста
- `POST /posts/edit` - Редактирование поста
- `POST /posts/delete` - Удаление поста

**Files**:
- `POST /aws/get-signed-request-for-upload-to-s3` - Pre-signed URL для S3

#### Team Leader API (`/api/v1/team-leader`)
**Team Management**:
- `POST /teams/add` - Создание команды
- `POST /teams/update` - Обновление команды
- `POST /teams/invite-member` - Отправка приглашения
- `POST /teams/remove-member` - Удаление участника
- `GET /teams/get-invitations-for-team` - Список приглашений

**Billing**:
- `POST /stripe/fetch-checkout-session` - Stripe Checkout Session
- `POST /cancel-subscription` - Отмена подписки
- `GET /get-list-of-invoices-for-customer` - История платежей

#### Auth Endpoints
- `GET /auth/google` - Инициация Google OAuth
- `GET /oauth2callback` - Callback Google OAuth
- `POST /auth/email-login-link` - Запрос passwordless token
- `GET /auth/logged_in` - Аутентификация по token
- `GET /logout` - Выход из системы

### 3.2 Фронтенд Страницы

| Путь | Компонент | Защита | Назначение |
|------|-----------|--------|------------|
| `/login` | `login.tsx` | Public | Вход в систему |
| `/login-cached` | `login-cached.tsx` | Public | Кэшированный логин |
| `/create-team` | `create-team.tsx` | Auth | Создание новой команды |
| `/your-settings` | `your-settings.tsx` | Auth | Настройки пользователя |
| `/team-settings` | `team-settings.tsx` | Auth + Leader | Настройки команды |
| `/discussion` | `discussion.tsx` | Auth | Список обсуждений + посты |
| `/billing` | `billing.tsx` | Auth + Leader | Управление подпиской |
| `/invitation` | `invitation.tsx` | Public | Принятие приглашения |

### 3.3 WebSocket Events

**Client → Server**:
- `joinTeamRoom(teamId)` - Подписка на события команды
- `leaveTeamRoom(teamId)` - Отписка от команды
- `joinDiscussionRoom(discussionId)` - Подписка на обсуждение
- `leaveDiscussionRoom(discussionId)` - Отписка от обсуждения

**Server → Client**:
- `discussionEvent` - События обсуждений (added/edited/deleted)
- `postEvent` - События постов (added/edited/deleted)

---

## 4. Структура тестовых наборов

### 4.1 Организация тестов

```
e2e/
├── tests/
│   ├── 01-smoke/              # Smoke tests (P0)
│   │   ├── servers.test.ts
│   │   └── basic-pages.test.ts
│   │
│   ├── 02-auth/               # Authentication (P0)
│   │   ├── google-oauth.test.ts
│   │   ├── passwordless.test.ts
│   │   ├── session.test.ts
│   │   └── logout.test.ts
│   │
│   ├── 03-onboarding/         # User onboarding (P0)
│   │   ├── first-login.test.ts
│   │   ├── create-first-team.test.ts
│   │   └── profile-setup.test.ts
│   │
│   ├── 04-teams/              # Team management (P1)
│   │   ├── create-team.test.ts
│   │   ├── team-settings.test.ts
│   │   ├── invitations.test.ts
│   │   ├── accept-invitation.test.ts
│   │   └── remove-member.test.ts
│   │
│   ├── 05-discussions/        # Discussions (P1)
│   │   ├── create-discussion.test.ts
│   │   ├── edit-discussion.test.ts
│   │   ├── delete-discussion.test.ts
│   │   ├── members-management.test.ts
│   │   └── notifications.test.ts
│   │
│   ├── 06-posts/              # Posts (P1)
│   │   ├── create-post.test.ts
│   │   ├── edit-post.test.ts
│   │   ├── delete-post.test.ts
│   │   ├── markdown-preview.test.ts
│   │   └── file-attachments.test.ts
│   │
│   ├── 07-realtime/           # Real-time features (P1)
│   │   ├── websocket-connection.test.ts
│   │   ├── live-discussion-updates.test.ts
│   │   ├── live-post-updates.test.ts
│   │   └── multi-user-sync.test.ts
│   │
│   ├── 08-billing/            # Billing & Stripe (P2)
│   │   ├── view-billing-page.test.ts
│   │   ├── checkout-flow.test.ts
│   │   ├── update-payment-method.test.ts
│   │   ├── cancel-subscription.test.ts
│   │   └── invoices-history.test.ts
│   │
│   ├── 09-notifications/      # Email notifications (P2)
│   │   ├── welcome-email.test.ts
│   │   ├── invitation-email.test.ts
│   │   ├── login-link-email.test.ts
│   │   └── post-notification-email.test.ts
│   │
│   ├── 10-user-settings/      # User settings (P2)
│   │   ├── update-profile.test.ts
│   │   ├── upload-avatar.test.ts
│   │   └── toggle-theme.test.ts
│   │
│   └── 11-edge-cases/         # Edge cases & errors (P2)
│       ├── unauthorized-access.test.ts
│       ├── invalid-tokens.test.ts
│       ├── expired-sessions.test.ts
│       ├── network-errors.test.ts
│       └── validation-errors.test.ts
│
├── fixtures/                   # Test fixtures
│   ├── index.ts               # Main fixture export
│   ├── auth.fixture.ts        # Auth helpers
│   ├── team.fixture.ts        # Team helpers
│   ├── discussion.fixture.ts  # Discussion helpers
│   ├── billing.fixture.ts     # Billing helpers
│   └── realtime.fixture.ts    # WebSocket helpers
│
└── utils/                      # Test utilities
    ├── factories/             # Data factories
    ├── helpers/               # Helper functions
    └── mocks/                 # External service mocks
```

---

## 5. Фикстуры и утилиты

### 5.1 Базовые фикстуры (уже существуют)

| Фикстура | Назначение | Источник |
|----------|------------|----------|
| `servers` | URL API/App серверов | `e2e/helpers.ts` |
| `testDb` | Управление тестовой БД | `e2e/helpers.ts` |
| `page` | Playwright page | Built-in |
| `context` | Browser context | Built-in |

### 5.2 Новые фикстуры (требуется реализация)

#### `authSession` - Аутентифицированная сессия
```typescript
// Использование:
test('feature X', async ({ page, authSession }) => {
  // authSession автоматически логинит пользователя
  await page.goto('/your-settings');
  // Пользователь уже залогинен
});
```

**Возможности**:
- Создание пользователя через API
- Получение session cookie
- Автоматическая установка cookie в browser context
- Support для разных типов пользователей (leader, member, guest)

#### `teamContext` - Команда с участниками
```typescript
// Использование:
test('invite member', async ({ page, teamContext }) => {
  const { team, owner, members } = teamContext;
  // team, owner и members уже созданы
});
```

**Возможности**:
- Создание команды через API
- Добавление owner и members
- Настройка ролей (leader/member)
- Создание invitation tokens

#### `discussionContext` - Обсуждение с постами
```typescript
// Использование:
test('add post', async ({ page, discussionContext }) => {
  const { discussion, posts } = discussionContext;
  // discussion и начальные posts уже созданы
});
```

**Возможности**:
- Создание обсуждения через API
- Добавление участников
- Создание начальных постов
- Настройка notification settings

#### `realtimeObserver` - WebSocket клиент
```typescript
// Использование:
test('live updates', async ({ page, realtimeObserver }) => {
  await realtimeObserver.connect();
  await realtimeObserver.joinTeamRoom(teamId);
  
  const eventPromise = realtimeObserver.waitForEvent('discussionEvent');
  // ... trigger action ...
  const event = await eventPromise;
  
  expect(event.actionType).toBe('added');
});
```

**Возможности**:
- Подключение Socket.IO client
- Подписка на room'ы
- Ожидание событий с timeout
- Отписка и cleanup

#### `billingContext` - Stripe sandbox
```typescript
// Использование:
test('checkout', async ({ page, billingContext }) => {
  const { stripeHelper } = billingContext;
  // Stripe test mode готов к использованию
});
```

**Возможности**:
- Создание Stripe test customers
- Генерация test payment methods
- Мокирование webhooks
- Проверка subscription status

#### `fileUploadContext` - S3 upload моки
```typescript
// Использование:
test('upload avatar', async ({ page, fileUploadContext }) => {
  const { mockS3Upload } = fileUploadContext;
  mockS3Upload.respondWith('success', 'https://s3.../avatar.jpg');
  // S3 requests будут мокироваться
});
```

**Возможности**:
- Мокирование S3 pre-signed URL requests
- Мокирование S3 PUT requests
- Локальные тестовые файлы
- Проверка upload progress

#### `emailInbox` - Захват email'ов
```typescript
// Использование:
test('invitation email', async ({ page, emailInbox }) => {
  // ... trigger invitation ...
  const emails = await emailInbox.getEmails();
  const invitationEmail = emails.find(e => e.subject.includes('invited'));
  expect(invitationEmail.to).toContain('test@example.com');
});
```

**Возможности**:
- Интеграция с Mailhog/SMTP capture
- Парсинг email content
- Извлечение ссылок и токенов
- Проверка email templates

### 5.3 Фабрики данных

```typescript
// utils/factories/user.factory.ts
export function createUserData(overrides = {}) {
  return {
    email: `user-${Date.now()}@test.com`,
    displayName: 'Test User',
    slug: `user-${Date.now()}`,
    darkTheme: false,
    ...overrides,
  };
}

// utils/factories/team.factory.ts
export function createTeamData(overrides = {}) {
  return {
    name: `Team ${Date.now()}`,
    avatarUrl: 'https://example.com/avatar.jpg',
    slug: `team-${Date.now()}`,
    ...overrides,
  };
}

// utils/factories/discussion.factory.ts
export function createDiscussionData(overrides = {}) {
  return {
    name: `Discussion ${Date.now()}`,
    slug: `discussion-${Date.now()}`,
    notificationType: 'default',
    memberIds: [],
    ...overrides,
  };
}

// utils/factories/post.factory.ts
export function createPostData(overrides = {}) {
  return {
    content: '# Test Post\n\nTest content here.',
    ...overrides,
  };
}
```

---

## 6. Приоритизация тестов

### 6.1 Критерии приоритизации

- **P0 (Critical)**: Блокирует основной user journey, запускается на каждом PR
- **P1 (High)**: Важные функции, запускается daily
- **P2 (Medium)**: Дополнительные функции, запускается weekly
- **P3 (Low)**: Edge cases, запускается before release

### 6.2 Распределение по приоритетам

| Приоритет | Наборы тестов | Примерное кол-во | Время выполнения |
|-----------|---------------|------------------|------------------|
| **P0** | Smoke, Auth, Onboarding | 20-30 тестов | 3-5 минут |
| **P1** | Teams, Discussions, Posts, Realtime | 50-70 тестов | 8-12 минут |
| **P2** | Billing, Notifications, User Settings, Edge Cases | 40-60 тестов | 10-15 минут |
| **P3** | Performance, Accessibility, Cross-browser | 20-30 тестов | 15-20 минут |

**Итого**: ~150-190 тестов, ~35-50 минут на полный прогон (с параллелизацией)

### 6.3 P0: Smoke & Critical Path

#### Smoke Tests (5-7 тестов, ~1 мин)
1. Servers availability (API health, App health, MongoDB)
2. Login page loads without errors
3. Can reach API endpoints (public)
4. Static assets load correctly
5. No console errors on main pages

#### Auth (8-12 тестов, ~2-3 мин)
1. **Google OAuth**: Initiate, callback, redirect, session creation
2. **Passwordless**: Request link, email sent, login via token, session creation
3. **Session**: Session persists after refresh, expires correctly
4. **Logout**: Clears session, redirects to login
5. **Invitation flow**: Accept invitation during signup/login

#### Onboarding (5-8 тестов, ~2 мин)
1. First login redirects to create-team
2. Create first team succeeds
3. Profile setup (name, avatar)
4. Default team selection
5. Welcome email sent

**P0 Total**: ~20-27 тестов, ~5-6 минут

---

### 6.4 P1: Core Features

#### Teams (10-15 тестов, ~3-4 мин)
1. Create team (name, avatar, slug)
2. Update team settings
3. Invite member (email, token generation)
4. Accept invitation (existing user, new user)
5. Remove member (permissions check)
6. View team members list
7. Leader permissions validation

#### Discussions (12-18 тестов, ~3-4 мин)
1. Create discussion (name, members)
2. Edit discussion (name, members, notifications)
3. Delete discussion (confirmation, cascade)
4. Add/remove members from discussion
5. Discussion list loads correctly
6. Discussion slug navigation
7. Notification settings (default, mute, all)

#### Posts (15-20 тестов, ~4-5 мин)
1. Create post (markdown content)
2. Edit post (content update)
3. Delete post (confirmation)
4. Markdown → HTML rendering
5. File attachment upload
6. File attachment download
7. Post list pagination
8. Post draft saving (if implemented)

#### Real-time (8-12 тестов, ~3-4 мин)
1. WebSocket connection established
2. Join team room
3. Join discussion room
4. Receive discussion added event
5. Receive discussion edited event
6. Receive post added event
7. Multi-user scenario (2 browsers)
8. Reconnection after disconnect

**P1 Total**: ~45-65 тестов, ~13-17 минут

---

### 6.5 P2: Extended Features

#### Billing (10-15 тестов, ~4-5 мин)
1. View billing page (leader only)
2. Initiate Stripe Checkout (subscription mode)
3. Complete checkout flow (test card)
4. Subscription webhook handling
5. Update payment method
6. Cancel subscription
7. View invoices history
8. Non-leader cannot access billing

#### Notifications (8-12 тестов, ~3-4 мин)
1. Welcome email (new user)
2. Invitation email (team invite)
3. Login link email (passwordless)
4. Post notification email (when mentioned)
5. Email content validation
6. Unsubscribe links work
7. Email retry on failure

#### User Settings (6-10 тестов, ~2-3 мин)
1. Update profile name
2. Upload avatar (S3)
3. Toggle dark theme (persists)
4. Theme applies globally
5. Avatar preview loads
6. Profile slug updates

#### Edge Cases (15-20 тестов, ~4-6 мин)
1. Unauthorized access attempts (401)
2. Forbidden actions (403)
3. Invalid invitation tokens
4. Expired sessions
5. Expired passwordless tokens
6. Invalid form submissions
7. Network error handling
8. CSRF protection
9. SQL injection attempts (N/A for Mongo, but validate inputs)
10. XSS protection (HTML escaping)

**P2 Total**: ~39-57 тестов, ~13-18 минут

---

## 7. План реализации

### 7.1 Фазы реализации

#### Фаза 1: Foundation (Week 1-2)
**Цель**: Базовая инфраструктура + P0 тесты

1. **Setup & Infrastructure**
   - [x] MongoDB Memory Server (готово)
   - [x] Server lifecycle management (готово)
   - [ ] Базовые фикстуры (`authSession`, `teamContext`)
   - [ ] Data factories (User, Team, Discussion, Post)
   - [ ] Базовые helpers (waitForResponse, getAuthCookie)

2. **P0: Smoke Tests**
   - [ ] `01-smoke/servers.test.ts`
   - [ ] `01-smoke/basic-pages.test.ts`

3. **P0: Auth Tests**
   - [ ] `02-auth/passwordless.test.ts` (приоритет 1)
   - [ ] `02-auth/session.test.ts`
   - [ ] `02-auth/logout.test.ts`
   - [ ] `02-auth/google-oauth.test.ts` (требует Google test credentials)

4. **P0: Onboarding Tests**
   - [ ] `03-onboarding/first-login.test.ts`
   - [ ] `03-onboarding/create-first-team.test.ts`
   - [ ] `03-onboarding/profile-setup.test.ts`

**Deliverables**: ~20 тестов, базовые фикстуры, CI интеграция для P0

#### Фаза 2: Core Features (Week 3-4)
**Цель**: P1 функциональность

1. **Teams Module**
   - [ ] `04-teams/create-team.test.ts`
   - [ ] `04-teams/team-settings.test.ts`
   - [ ] `04-teams/invitations.test.ts`
   - [ ] `04-teams/accept-invitation.test.ts`
   - [ ] `04-teams/remove-member.test.ts`

2. **Discussions Module**
   - [ ] `05-discussions/create-discussion.test.ts`
   - [ ] `05-discussions/edit-discussion.test.ts`
   - [ ] `05-discussions/delete-discussion.test.ts`
   - [ ] `05-discussions/members-management.test.ts`
   - [ ] `05-discussions/notifications.test.ts`

3. **Posts Module**
   - [ ] `06-posts/create-post.test.ts`
   - [ ] `06-posts/edit-post.test.ts`
   - [ ] `06-posts/delete-post.test.ts`
   - [ ] `06-posts/markdown-preview.test.ts`
   - [ ] `06-posts/file-attachments.test.ts` (с S3 mock)

**Deliverables**: ~40 тестов, расширенные фикстуры

#### Фаза 3: Real-time & Advanced (Week 5-6)
**Цель**: P1 real-time + P2 начало

1. **Real-time Module**
   - [ ] `07-realtime/websocket-connection.test.ts`
   - [ ] `07-realtime/live-discussion-updates.test.ts`
   - [ ] `07-realtime/live-post-updates.test.ts`
   - [ ] `07-realtime/multi-user-sync.test.ts`
   - [ ] Реализация `realtimeObserver` fixture

2. **Billing Module** (начало)
   - [ ] `08-billing/view-billing-page.test.ts`
   - [ ] `08-billing/checkout-flow.test.ts` (Stripe test mode)
   - [ ] Реализация `billingContext` fixture с Stripe mocks

3. **User Settings Module**
   - [ ] `10-user-settings/update-profile.test.ts`
   - [ ] `10-user-settings/upload-avatar.test.ts`
   - [ ] `10-user-settings/toggle-theme.test.ts`
   - [ ] Реализация `fileUploadContext` fixture

**Deliverables**: ~30 тестов, WebSocket + Stripe + S3 fixtures

#### Фаза 4: Notifications & Billing (Week 7-8)
**Цель**: Завершение P2

1. **Notifications Module**
   - [ ] `09-notifications/welcome-email.test.ts`
   - [ ] `09-notifications/invitation-email.test.ts`
   - [ ] `09-notifications/login-link-email.test.ts`
   - [ ] `09-notifications/post-notification-email.test.ts`
   - [ ] Реализация `emailInbox` fixture (Mailhog integration)

2. **Billing Module** (завершение)
   - [ ] `08-billing/update-payment-method.test.ts`
   - [ ] `08-billing/cancel-subscription.test.ts`
   - [ ] `08-billing/invoices-history.test.ts`

3. **Edge Cases Module**
   - [ ] `11-edge-cases/unauthorized-access.test.ts`
   - [ ] `11-edge-cases/invalid-tokens.test.ts`
   - [ ] `11-edge-cases/expired-sessions.test.ts`
   - [ ] `11-edge-cases/network-errors.test.ts`
   - [ ] `11-edge-cases/validation-errors.test.ts`

**Deliverables**: ~30 тестов, email capture, полное P2 покрытие

#### Фаза 5: Polish & Optimization (Week 9-10)
**Цель**: Стабилизация, документация, оптимизация

1. **Stabilization**
   - [ ] Flaky tests investigation & fixes
   - [ ] Retry strategies для unstable tests
   - [ ] Timeout tuning
   - [ ] Cleanup improvements

2. **Performance Optimization**
   - [ ] Параллелизация (increase workers где возможно)
   - [ ] Test data caching (где безопасно)
   - [ ] Fixture optimization
   - [ ] CI/CD pipeline optimization

3. **Documentation**
   - [ ] Comprehensive README для каждого модуля
   - [ ] Fixture usage examples
   - [ ] Troubleshooting guide
   - [ ] Contributing guide

4. **Reporting & Monitoring**
   - [ ] Allure integration (опционально)
   - [ ] Test trends dashboard
   - [ ] Slack notifications для failed runs
   - [ ] Coverage badges

**Deliverables**: Стабильные 140-160 тестов, полная документация

### 7.2 Зависимости и блокеры

| Зависимость | Тип | Влияние | Решение |
|-------------|-----|---------|---------|
| Google OAuth test credentials | External | Блокирует Google auth tests | Mock OAuth flow или получить test credentials |
| Stripe test account | External | Блокирует billing tests | Использовать Stripe test mode + webhooks mock |
| AWS credentials (S3, SES) | External | Блокирует file upload, emails | Localstack или MSW для моков |
| Mailhog/SMTP server | Infrastructure | Блокирует email tests | Docker Mailhog в CI/CD |
| Socket.IO client | Library | Блокирует realtime tests | `socket.io-client` package |

---

## 8. Метрики и отчетность

### 8.1 Метрики покрытия

| Метрика | Целевое значение | Текущее | Комментарий |
|---------|------------------|---------|-------------|
| **Функциональное покрытие** | 90%+ | TBD | Все критические user journeys |
| **API endpoint coverage** | 85%+ | TBD | Все public/team-member/team-leader endpoints |
| **Page coverage** | 100% | TBD | Все страницы хотя бы в smoke |
| **Test execution time** | < 15 мин (P0+P1) | TBD | С 4 workers параллельно |
| **Flaky test rate** | < 2% | TBD | Менее 2% от общего числа тестов |
| **Test maintainability** | High | TBD | DRY принцип, переиспользование fixtures |

### 8.2 CI/CD Интеграция

#### GitHub Actions Pipeline

```yaml
# .github/workflows/e2e-tests.yml (расширенный)

name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  e2e-p0:
    name: P0 - Critical Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install --frozen-lockfile
      - run: yarn test:e2e --grep '@P0'
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: p0-test-results
          path: e2e/test-results/

  e2e-p1:
    name: P1 - Core Features
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: e2e-p0
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: yarn install --frozen-lockfile
      - run: yarn test:e2e --grep '@P1'
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: p1-test-results
          path: e2e/test-results/

  e2e-p2:
    name: P2 - Extended Features
    runs-on: ubuntu-latest
    timeout-minutes: 25
    needs: e2e-p1
    if: github.event_name == 'schedule' || github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: yarn install --frozen-lockfile
      - run: yarn test:e2e --grep '@P2'
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: p2-test-results
          path: e2e/test-results/
```

#### Test Tags

```typescript
// Использование тегов для приоритизации
test('@P0 @auth user can login with passwordless', async ({ page }) => {
  // ...
});

test('@P1 @teams @invitations send team invitation', async ({ page, teamContext }) => {
  // ...
});

test('@P2 @billing view invoices history', async ({ page, billingContext }) => {
  // ...
});
```

### 8.3 Отчетность

#### Playwright HTML Report
- Встроенный HTML report с screenshots/videos
- Автоматическая генерация после каждого прогона
- Upload в CI artifacts

#### JUnit XML (для CI интеграции)
- GitHub Actions test summaries
- GitLab CI test reports
- Jenkins integration

#### Allure Report (опционально)
- Детальная аналитика по тестам
- Тренды по времени
- История запусков
- Categories для failed tests

#### Custom Dashboard (опционально)
- Grafana + InfluxDB
- Метрики по времени выполнения
- Flaky tests tracking
- Coverage trends

### 8.4 Уведомления

- **Slack**: Failed runs в #e2e-tests канале
- **Email**: Daily summary для команды
- **GitHub**: Check status на PR
- **PagerDuty**: Critical failures (P0) в production

---

## 9. Дополнительные соображения

### 9.1 Мобильная адаптация

**Viewport Testing**:
- iPhone 12: 390x844
- iPad: 768x1024
- Desktop: 1920x1080

**Smoke tests** для каждого viewport:
- Login page renders correctly
- Navigation menu works (hamburger на mobile)
- Forms are usable
- Responsive layout не ломается

### 9.2 Кросс-браузерность

**Browsers**:
- Chromium (основной)
- Firefox (P1 тесты)
- WebKit (P0 тесты)

**Матрица**:
| Priority | Chromium | Firefox | WebKit |
|----------|----------|---------|--------|
| P0       | ✅       | ✅      | ✅     |
| P1       | ✅       | ✅      | ❌     |
| P2       | ✅       | ❌      | ❌     |

### 9.3 Accessibility

**Axe-core Integration**:
- Smoke tests для ключевых страниц
- Automatic accessibility scanning
- WCAG 2.1 Level AA compliance

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('@P2 @a11y login page is accessible', async ({ page }) => {
  await page.goto('/login');
  await injectAxe(page);
  await checkA11y(page);
});
```

### 9.4 Performance

**Lighthouse CI** (опционально):
- Performance score > 80
- Accessibility score > 90
- Best Practices score > 85
- SEO score > 90

### 9.5 Безопасность

**Security Tests** (in `11-edge-cases/`):
- CSRF token validation
- XSS protection (input sanitization)
- SQL injection (Mongo injection patterns)
- Authentication bypass attempts
- Authorization boundary tests
- Rate limiting (if implemented)
- Session hijacking prevention

---

## 10. Риски и митигации

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| **Flaky WebSocket tests** | Высокая | Средняя | Explicit waits, retry logic, stable event assertions |
| **External API dependencies** | Средняя | Высокая | Mocks для Stripe/AWS/Google, fallback на sandbox |
| **CI/CD pipeline instability** | Низкая | Высокая | Retry failed jobs, isolated MongoDB, proper cleanup |
| **Test maintenance burden** | Средняя | Средняя | DRY fixtures, shared utilities, good documentation |
| **Slow test execution** | Средняя | Средняя | Параллелизация, data factories, избегать E2E где достаточно API |
| **Missing test credentials** | Высокая | Средняя | Mock external auth, документировать setup |
| **Breaking changes in app** | Низкая | Высокая | Run E2E на feature branches, code reviews |

---

## 11. Заключение

### 11.1 Итоговые цифры

- **Планируемое покрытие**: ~140-160 тестов
- **Время разработки**: 8-10 недель (1 разработчик)
- **Время выполнения**: 
  - P0: ~5-6 минут
  - P0+P1: ~15-20 минут
  - Полный прогон: ~35-50 минут
- **Приоритет**: Сначала P0 (критический путь), затем P1 (ядро), затем P2 (расширенное)

### 11.2 Успех проекта

Проект считается успешным, если:
1. ✅ P0 тесты (20-30) покрывают критический user journey
2. ✅ P1 тесты (50-70) покрывают все основные функции
3. ✅ Flaky rate < 2%
4. ✅ Тесты выполняются < 15 минут для P0+P1
5. ✅ CI/CD интеграция работает стабильно
6. ✅ Документация полная и актуальная

### 11.3 Следующие шаги

1. **Утвердить план** с командой
2. **Приоритизировать фазы** (начать с Фазы 1)
3. **Создать задачи** в issue tracker (GitHub Issues / Jira)
4. **Начать реализацию** Фазы 1 (Foundation)
5. **Итеративно расширять** покрытие по фазам

---

## Приложения

### A. Glossary

- **P0/P1/P2**: Уровни приоритета тестов (0 - критический, 1 - высокий, 2 - средний)
- **Fixture**: Переиспользуемая тестовая утилита в Playwright
- **Factory**: Функция для создания тестовых данных
- **Flaky test**: Тест, который иногда падает без изменений в коде
- **Smoke test**: Минимальный набор тестов для проверки работоспособности
- **User Journey**: Сценарий использования приложения реальным пользователем

### B. References

- **Playwright Docs**: https://playwright.dev/
- **MongoDB Memory Server**: https://github.com/nodkz/mongodb-memory-server
- **Stripe Test Mode**: https://stripe.com/docs/testing
- **Socket.IO Client**: https://socket.io/docs/v4/client-api/
- **Axe-core**: https://github.com/dequelabs/axe-core

### C. Changelog

| Дата | Версия | Изменения | Автор |
|------|--------|-----------|-------|
| 2025-11-13 | 1.0 | Первоначальный план | Claude AI |

---

**Конец документа**
