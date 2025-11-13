# Фаза 3: Real-time & Advanced - Детальный план реализации

> **Период**: Week 5-6 (10 рабочих дней)  
> **Цель**: Реализация P1 real-time тестов + P2 биллинг и настройки (30+ тестов)  
> **Статус**: 🔴 Не начата  
> **Прогресс**: 0%  
> **Зависимости**: ✅ Фаза 1 (P0) и Фаза 2 (Teams, Discussions, Posts) должны быть завершены

---

## 📋 Содержание

1. [Обзор фазы](#обзор-фазы)
2. [Предварительные требования](#предварительные-требования)
3. [Задачи фазы 3](#задачи-фазы-3)
4. [Детальный план по модулям](#детальный-план-по-модулям)
5. [Чек-лист выполнения](#чек-лист-выполнения)
6. [Acceptance Criteria](#acceptance-criteria)
7. [Риски и митигации](#риски-и-митигации)

---

## 1. Обзор фазы

### 1.1 Цели

Реализовать **P1 real-time** и **P2 (Medium Priority)** тесты для продвинутых функций:
- **Real-time Communication**: WebSocket соединения, live обновления discussions/posts
- **Billing & Stripe**: Просмотр биллинга, checkout flow, подписки (начало)
- **User Settings**: Профиль, аватар, тема

### 1.2 Ожидаемые результаты

| Метрика | Целевое значение |
|---------|------------------|
| Количество тестов | 28-35 |
| Новые фикстуры | `realtimeObserver`, `billingContext`, `fileUploadContext` |
| Время выполнения Real-time | 3-4 минуты |
| Время выполнения Billing | 4-5 минут |
| Время выполнения Settings | 2-3 минуты |
| Flaky rate (Real-time) | < 5% (acceptable для WebSocket) |
| Documentation | README + примеры для каждого fixture |

### 1.3 Связь с общим планом

- **Предыдущая фаза**: [Фаза 2 - Core Features](./phase-2-core-features.md) (Teams, Discussions, Posts)
- **Следующая фаза**: Фаза 4 - Notifications & Billing Complete (Email capture, завершение billing)
- **Общий план**: [E2E Test Coverage Plan](../../docs/e2e-test-coverage-plan.md#фаза-3-real-time--advanced-week-5-6)

---

## 2. Предварительные требования

### 2.1 ✅ Должно быть готово из Фаз 1-2

| Компонент | Статус | Комментарий |
|-----------|--------|-------------|
| MongoDB Memory Server | ✅ Обязательно | Инфраструктура |
| API/App Server Managers | ✅ Обязательно | Инфраструктура |
| `authSession` fixture | ✅ Обязательно | Для аутентификации |
| `teamContext` fixture | ✅ Обязательно | Для создания команд |
| `discussionContext` fixture | ✅ Обязательно | Для real-time тестов discussions |
| Data factories | ✅ Обязательно | User, Team, Discussion, Post |
| P0 Tests | ✅ Желательно | Smoke, Auth, Onboarding |
| P1 Core Tests | ✅ Обязательно | Teams, Discussions, Posts |

### 2.2 ❌ Новые требования для Фазы 3

| Компонент | Необходимость | Описание |
|-----------|---------------|----------|
| `realtimeObserver` fixture | 🔴 Критично | WebSocket client для тестирования real-time |
| `billingContext` fixture | 🔴 Критично | Stripe test mode setup |
| `fileUploadContext` fixture | 🟡 Желательно | S3 pre-signed URLs mock |
| Socket.IO Client | 🔴 Критично | Package: `socket.io-client` |
| Stripe Test Credentials | 🔴 Критично | Test API keys в `.env.test` |
| AWS S3 Mock | 🟡 Желательно | MSW или Localstack для S3 |
| Второй browser context | 🟡 Желательно | Для multi-user real-time тестов |

### 2.3 📦 Новые зависимости

```bash
# В e2e/package.json добавить:
yarn add -D socket.io-client@^4.5.0
yarn add -D msw@^1.3.0  # Для S3/API mocking (опционально)
```

---

## 3. Задачи фазы 3

### 3.1 Общая таблица задач

| # | Задача | Приоритет | Оценка | Зависимости | Ответственный |
|---|--------|-----------|--------|-------------|---------------|
| **3.1** | Реализация `realtimeObserver` fixture | P0 | 1.5 дня | Socket.IO client | Dev |
| **3.2** | Real-time Module - WebSocket тесты (8-12) | P1 | 2 дня | `realtimeObserver` | QA |
| **3.3** | Реализация `billingContext` fixture | P1 | 1 день | Stripe test keys | Dev |
| **3.4** | Billing Module - View & Checkout (5-7) | P2 | 1.5 дня | `billingContext` | QA |
| **3.5** | Реализация `fileUploadContext` fixture | P2 | 1 день | MSW или mock setup | Dev |
| **3.6** | User Settings Module - Profile & Theme (6-10) | P2 | 1.5 дня | `fileUploadContext` | QA |
| **3.7** | Multi-user real-time scenario | P1 | 1 день | 2 browser contexts | QA |
| **3.8** | Документация + примеры | P2 | 1 день | Все тесты | Tech Writer |
| **3.9** | Flaky tests stabilization (Real-time) | P1 | 0.5 дня | Real-time тесты | QA |

**Итого**: ~10 дней (2 недели)

### 3.2 Детализация по модулям

#### 🌐 Real-time Module (8-12 тестов, 2 дня)
- `07-realtime/websocket-connection.test.ts` - 2-3 теста
- `07-realtime/live-discussion-updates.test.ts` - 2-3 теста
- `07-realtime/live-post-updates.test.ts` - 2-3 теста
- `07-realtime/multi-user-sync.test.ts` - 2-3 теста

#### 💳 Billing Module (5-7 тестов, 1.5 дня)
- `08-billing/view-billing-page.test.ts` - 2-3 теста
- `08-billing/checkout-flow.test.ts` - 3-4 теста

#### ⚙️ User Settings Module (6-10 тестов, 1.5 дня)
- `10-user-settings/update-profile.test.ts` - 2-3 теста
- `10-user-settings/upload-avatar.test.ts` - 2-3 теста
- `10-user-settings/toggle-theme.test.ts` - 2-4 теста

**Итого модулей**: 19-29 тестов + multi-user scenarios

---

## 4. Детальный план по модулям

### 4.1 Задача 3.1: `realtimeObserver` Fixture (1.5 дня) ⭐

#### Описание
Создать Playwright fixture для подключения Socket.IO клиента и тестирования real-time обновлений.

#### Требования

**Интерфейс**:
```typescript
// e2e/fixtures/realtimeFixtures.ts

interface RealtimeObserverOptions {
  autoConnect?: boolean; // Default: true
  rooms?: string[]; // Автоматически join эти rooms
}

interface RealtimeObserver {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Room management
  joinTeamRoom(teamId: string): Promise<void>;
  leaveTeamRoom(teamId: string): Promise<void>;
  joinDiscussionRoom(discussionId: string): Promise<void>;
  leaveDiscussionRoom(discussionId: string): Promise<void>;
  
  // Event listeners
  waitForEvent<T = any>(
    eventName: string, 
    timeout?: number
  ): Promise<T>;
  
  onEvent<T = any>(
    eventName: string, 
    callback: (data: T) => void
  ): void;
  
  // Assertions
  expectEvent(
    eventName: string, 
    matcher: (data: any) => boolean, 
    timeout?: number
  ): Promise<void>;
  
  // Event history
  getEvents(eventName?: string): any[];
  clearEvents(): void;
}
```

#### Implementation Plan

1. **Создать файл** `e2e/fixtures/realtimeFixtures.ts`

2. **Зависимости**:
   ```typescript
   import { io, Socket } from 'socket.io-client';
   import { test as base } from './baseFixtures';
   import { getServers } from '../helpers';
   ```

3. **Основная логика**:
   ```typescript
   class RealtimeObserverImpl implements RealtimeObserver {
     private socket: Socket | null = null;
     private eventHistory: Map<string, any[]> = new Map();
     private servers: any;
     
     constructor(servers: any) {
       this.servers = servers;
     }
     
     async connect() {
       if (this.socket?.connected) return;
       
       this.socket = io(this.servers.appUrl, {
         transports: ['websocket', 'polling'],
         withCredentials: true,
         reconnection: true,
         reconnectionAttempts: 3,
         reconnectionDelay: 1000,
       });
       
       // Wait for connection
       await new Promise((resolve, reject) => {
         const timeout = setTimeout(() => {
           reject(new Error('WebSocket connection timeout'));
         }, 5000);
         
         this.socket!.on('connect', () => {
           clearTimeout(timeout);
           resolve(undefined);
         });
         
         this.socket!.on('connect_error', (err) => {
           clearTimeout(timeout);
           reject(err);
         });
       });
       
       // Record all events
       this.socket.onAny((eventName, ...args) => {
         if (!this.eventHistory.has(eventName)) {
           this.eventHistory.set(eventName, []);
         }
         this.eventHistory.get(eventName)!.push(args[0]);
       });
     }
     
     async disconnect() {
       if (this.socket) {
         this.socket.disconnect();
         this.socket = null;
       }
     }
     
     async joinTeamRoom(teamId: string) {
       if (!this.socket?.connected) {
         throw new Error('Socket not connected');
       }
       this.socket.emit('joinTeamRoom', teamId);
       // Wait a bit for room join to process
       await new Promise(resolve => setTimeout(resolve, 100));
     }
     
     async waitForEvent<T = any>(
       eventName: string, 
       timeout = 5000
     ): Promise<T> {
       return new Promise((resolve, reject) => {
         const timer = setTimeout(() => {
           reject(new Error(`Timeout waiting for event: ${eventName}`));
         }, timeout);
         
         this.socket!.once(eventName, (data: T) => {
           clearTimeout(timer);
           resolve(data);
         });
       });
     }
     
     // ... другие методы
   }
   ```

4. **Fixture export**:
   ```typescript
   export const test = base.extend<{ realtimeObserver: RealtimeObserver }>({
     realtimeObserver: async ({ servers, context }, use) => {
       // Убедимся, что cookies установлены (нужна аутентификация)
       const observer = new RealtimeObserverImpl(servers);
       
       await observer.connect();
       
       await use(observer);
       
       // Cleanup
       await observer.disconnect();
     },
   });
   ```

#### Acceptance Criteria
- ✅ Fixture успешно подключается к Socket.IO серверу
- ✅ Поддерживает join/leave для team и discussion rooms
- ✅ `waitForEvent()` корректно ожидает события с timeout
- ✅ История событий записывается и доступна
- ✅ Автоматический disconnect при teardown
- ✅ Retry логика для unstable connections
- ✅ Документация с примерами использования

#### Пример использования
```typescript
test('receives live discussion update', async ({ 
  page, 
  authSession, 
  teamContext, 
  realtimeObserver 
}) => {
  const { team } = teamContext;
  
  // Join team room для получения events
  await realtimeObserver.joinTeamRoom(team._id);
  
  // Открыть страницу
  await page.goto(`/discussion?teamSlug=${team.slug}`);
  
  // В другом контексте создать discussion
  const eventPromise = realtimeObserver.waitForEvent('discussionEvent');
  
  // Trigger action (например, через API или второй browser)
  await makeApiRequest(servers.apiUrl, 'POST', '/api/v1/team-member/discussions/add', {
    teamId: team._id,
    name: 'New Discussion',
  });
  
  // Проверить событие
  const event = await eventPromise;
  expect(event.actionType).toBe('added');
  expect(event.discussion.name).toBe('New Discussion');
  
  // Проверить UI обновился
  await expect(page.locator('text=New Discussion')).toBeVisible();
});
```

---

### 4.2 Real-time Module (2 дня, 8-12 тестов)

#### 4.2.1 `07-realtime/websocket-connection.test.ts` (2-3 теста)

**T3.2.1**: WebSocket connection establishes successfully
- **Given**: Authenticated user
- **When**: Observer connects
- **Then**: Connection established, `isConnected()` returns true
- **Tags**: `@P1 @realtime @smoke`

**T3.2.2**: Can join and leave team room
- **Given**: Connected observer, team exists
- **When**: `joinTeamRoom(teamId)` → `leaveTeamRoom(teamId)`
- **Then**: No errors, events received only when in room
- **Tags**: `@P1 @realtime`

**T3.2.3**: Connection survives server reconnection
- **Given**: Connected observer
- **When**: Simulate disconnect → wait → reconnect
- **Then**: Auto-reconnects, events still received
- **Tags**: `@P2 @realtime @resilience`

---

#### 4.2.2 `07-realtime/live-discussion-updates.test.ts` (2-3 теста)

**T3.2.4**: Receives 'discussionAdded' event
- **Given**: User in team room
- **When**: New discussion created via API
- **Then**: `discussionEvent` with `actionType: 'added'` received
- **Tags**: `@P1 @realtime @discussions`

**T3.2.5**: Receives 'discussionEdited' event
- **Given**: User in team room, discussion exists
- **When**: Discussion edited via API
- **Then**: `discussionEvent` with `actionType: 'edited'` received
- **Tags**: `@P1 @realtime @discussions`

**T3.2.6**: Receives 'discussionDeleted' event
- **Given**: User in team room, discussion exists
- **When**: Discussion deleted via API
- **Then**: `discussionEvent` with `actionType: 'deleted'` received
- **Tags**: `@P1 @realtime @discussions`

**T3.2.7**: UI auto-updates when discussion added
- **Given**: User viewing `/discussion` page, WebSocket connected
- **When**: Another user creates discussion
- **Then**: New discussion appears in list without refresh
- **Tags**: `@P1 @realtime @ui`

---

#### 4.2.3 `07-realtime/live-post-updates.test.ts` (2-3 теста)

**T3.2.8**: Receives 'postAdded' event
- **Given**: User in discussion room
- **When**: New post created via API
- **Then**: `postEvent` with `actionType: 'added'` received
- **Tags**: `@P1 @realtime @posts`

**T3.2.9**: Receives 'postEdited' event
- **Given**: User in discussion room, post exists
- **When**: Post edited via API
- **Then**: `postEvent` with `actionType: 'edited'`, updated content
- **Tags**: `@P1 @realtime @posts`

**T3.2.10**: UI updates post list in real-time
- **Given**: User viewing discussion page with posts
- **When**: Another user adds a post
- **Then**: Post appears instantly without refresh
- **Tags**: `@P1 @realtime @ui`

---

#### 4.2.4 `07-realtime/multi-user-sync.test.ts` (2-3 теста)

**T3.2.11**: Two users see each other's discussion updates
- **Given**: 2 browser contexts, both authenticated, same team
- **When**: User A creates discussion
- **Then**: User B sees it in real-time
- **Tags**: `@P1 @realtime @multi-user`

**Implementation**:
```typescript
test('two users see discussion updates', async ({ browser, servers, testDb }) => {
  // Setup user A
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const userA = await createAndAuthenticateUser(servers, contextA);
  const team = await createTeamInDb(servers, userA._id, { name: 'Team A' });
  
  // Setup user B (add to same team)
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  const userB = await createAndAuthenticateUser(servers, contextB);
  // Add user B to team A via API
  
  // User A opens discussion page
  await pageA.goto(`/discussion?teamSlug=${team.slug}`);
  
  // User B opens discussion page
  await pageB.goto(`/discussion?teamSlug=${team.slug}`);
  
  // User A creates discussion
  await pageA.click('button:has-text("New Discussion")');
  await pageA.fill('input[name="name"]', 'Sync Test Discussion');
  await pageA.click('button:has-text("Create")');
  
  // User B sees it without refresh
  await expect(pageB.locator('text=Sync Test Discussion')).toBeVisible({ timeout: 3000 });
  
  // Cleanup
  await contextA.close();
  await contextB.close();
});
```

**T3.2.12**: Two users see each other's posts in real-time
- **Given**: 2 users in same discussion
- **When**: User A adds post
- **Then**: User B sees it immediately
- **Tags**: `@P1 @realtime @multi-user @posts`

---

### 4.3 Задача 3.3: `billingContext` Fixture (1 день)

#### Описание
Создать fixture для Stripe test mode setup и биллинг-тестов.

#### Требования

**Интерфейс**:
```typescript
// e2e/fixtures/billingFixtures.ts

interface BillingContextOptions {
  createCustomer?: boolean; // Default: true
  createSubscription?: boolean; // Default: false
}

interface BillingContext {
  // Stripe test helpers
  stripeTestCard: {
    number: string; // '4242424242424242'
    exp_month: number;
    exp_year: number;
    cvc: string;
  };
  
  // Customer management
  customerId?: string;
  subscriptionId?: string;
  
  // Helper methods
  createCheckoutSession(mode: 'subscription' | 'setup'): Promise<string>; // Returns sessionId
  mockWebhook(event: string, data: any): Promise<void>;
  
  // Verification
  getSubscriptionStatus(): Promise<'active' | 'past_due' | 'canceled' | 'incomplete'>;
  getInvoices(): Promise<any[]>;
}
```

#### Implementation Plan

1. **Environment variables** в `.env.test`:
   ```bash
   STRIPE_TEST_SECRET_KEY=sk_test_...
   STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
   STRIPE_PRICE_ID_TEST=price_test_...  # Тестовый price для подписки
   ```

2. **Создать файл** `e2e/fixtures/billingFixtures.ts`

3. **Mock vs Real Stripe**:
   - **Option A**: Использовать реальный Stripe test mode (рекомендуется для начала)
   - **Option B**: Mock Stripe API через MSW (если нужна изоляция)

4. **Основная логика** (Real Stripe approach):
   ```typescript
   import Stripe from 'stripe';
   
   const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!, {
     apiVersion: '2023-10-16',
   });
   
   export const test = base.extend<{ billingContext: BillingContext }>({
     billingContext: async ({ authSession, servers }, use) => {
       const { user } = authSession;
       
       let customerId: string | undefined;
       let subscriptionId: string | undefined;
       
       // Create Stripe test customer
       const customer = await stripe.customers.create({
         email: user.email,
         metadata: { userId: user._id, test: 'true' },
       });
       customerId = customer.id;
       
       // Attach to user in DB
       await fetch(`${servers.apiUrl}/api/v1/test/attach-stripe-customer`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ userId: user._id, customerId }),
       });
       
       const context: BillingContext = {
         stripeTestCard: {
           number: '4242424242424242',
           exp_month: 12,
           exp_year: 2030,
           cvc: '123',
         },
         customerId,
         subscriptionId,
         
         async createCheckoutSession(mode) {
           const response = await fetch(
             `${servers.apiUrl}/api/v1/team-leader/stripe/fetch-checkout-session`,
             {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ mode, teamId: authSession.team!._id }),
               credentials: 'include',
             }
           );
           const data = await response.json();
           return data.sessionId;
         },
         
         // ... другие методы
       };
       
       await use(context);
       
       // Cleanup: delete Stripe customer
       if (customerId) {
         await stripe.customers.del(customerId);
       }
     },
   });
   ```

#### Acceptance Criteria
- ✅ Fixture создает Stripe test customer
- ✅ Предоставляет test card данные
- ✅ Поддерживает создание checkout sessions
- ✅ Cleanup удаляет Stripe resources
- ✅ Документация с примерами
- ✅ Работает с real Stripe test mode

#### Пример использования
```typescript
test('user can initiate checkout', async ({ page, authSession, billingContext }) => {
  const { team } = authSession;
  
  await page.goto(`/billing?teamSlug=${team.slug}`);
  await page.click('button:has-text("Subscribe")');
  
  // Playwright intercepts redirect to Stripe Checkout
  // В реальном тесте используем Stripe test card
  await page.fill('[name="cardNumber"]', billingContext.stripeTestCard.number);
  // ... fill other fields
  await page.click('button:has-text("Subscribe")');
  
  // Verify subscription created
  const status = await billingContext.getSubscriptionStatus();
  expect(status).toBe('active');
});
```

---

### 4.4 Billing Module (1.5 дня, 5-7 тестов)

#### 4.4.1 `08-billing/view-billing-page.test.ts` (2-3 теста)

**T3.4.1**: Team leader can access billing page
- **Given**: Team leader authenticated
- **When**: Navigate to `/billing?teamSlug=...`
- **Then**: Page loads, shows subscription status
- **Tags**: `@P2 @billing @access`

**T3.4.2**: Non-leader cannot access billing page
- **Given**: Regular team member authenticated
- **When**: Navigate to `/billing?teamSlug=...`
- **Then**: Redirect to `/your-settings` or show error
- **Tags**: `@P2 @billing @access @security`

**T3.4.3**: Billing page shows current subscription
- **Given**: Team has active subscription (from `billingContext`)
- **When**: Leader views billing page
- **Then**: Shows "Active" status, plan details, next billing date
- **Tags**: `@P2 @billing @ui`

---

#### 4.4.2 `08-billing/checkout-flow.test.ts` (3-4 теста)

**T3.4.4**: Can initiate Stripe Checkout
- **Given**: Team leader, no active subscription
- **When**: Click "Subscribe", redirect to Stripe
- **Then**: Stripe Checkout page opens with correct amount
- **Tags**: `@P2 @billing @stripe`

**T3.4.5**: Successful subscription creation
- **Given**: Team leader at Stripe Checkout
- **When**: Fill Stripe test card, submit
- **Then**: Redirect back, subscription active in DB
- **Tags**: `@P2 @billing @stripe @e2e`

**Notes**: 
- Может требовать реальный Stripe test mode
- Альтернатива: mock redirect и webhook

**T3.4.6**: Failed payment shows error
- **Given**: Team leader at Stripe Checkout
- **When**: Use Stripe declined card (`4000000000000002`)
- **Then**: Error message, no subscription created
- **Tags**: `@P2 @billing @stripe @error`

**T3.4.7**: Webhook updates subscription status
- **Given**: Subscription created via Checkout
- **When**: Stripe webhook `customer.subscription.created` sent
- **Then**: Database updated, user sees "Active"
- **Tags**: `@P2 @billing @stripe @webhooks`

**Implementation**:
```typescript
test('webhook updates subscription status', async ({ 
  servers, 
  testDb, 
  billingContext 
}) => {
  const { customerId } = billingContext;
  
  // Create subscription via Stripe API directly
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: process.env.STRIPE_PRICE_ID_TEST }],
  });
  
  // Trigger webhook manually (or use Stripe CLI)
  await billingContext.mockWebhook('customer.subscription.created', {
    object: subscription,
  });
  
  // Verify DB updated
  const team = await testDb.teams.findOne({ 'stripeSubscription.id': subscription.id });
  expect(team).toBeTruthy();
  expect(team.stripeSubscription.status).toBe('active');
});
```

---

### 4.5 Задача 3.5: `fileUploadContext` Fixture (1 день)

#### Описание
Создать fixture для моков S3 file uploads (аватары, attachments).

#### Требования

**Интерфейс**:
```typescript
// e2e/fixtures/fileUploadFixtures.ts

interface FileUploadMock {
  // Mock S3 pre-signed URL generation
  mockSignedUrl(fileName: string, bucket: string): string;
  
  // Mock S3 PUT request
  mockS3Upload(success: boolean, url?: string): void;
  
  // Test files
  testFiles: {
    avatar: string; // Path to test avatar image
    document: string; // Path to test document
  };
  
  // Verification
  getUploadedFiles(): { fileName: string; bucket: string; url: string }[];
}

interface FileUploadContext {
  fileUpload: FileUploadMock;
}
```

#### Implementation Plan

1. **Подготовить test files** в `e2e/fixtures/files/`:
   - `avatar.jpg` (128x128 test image)
   - `document.pdf` (небольшой PDF)

2. **Создать файл** `e2e/fixtures/fileUploadFixtures.ts`

3. **Mock подходы**:
   - **Option A**: Mock через `page.route()` (перехват fetch/XHR)
   - **Option B**: MSW (Mock Service Worker)
   - **Option C**: Localstack S3 (реальный S3-compatible сервис локально)

4. **Реализация** (Option A - Playwright route):
   ```typescript
   export const test = base.extend<{ fileUploadContext: FileUploadContext }>({
     fileUploadContext: async ({ page }, use) => {
       const uploadedFiles: any[] = [];
       
       // Mock API: get-signed-request-for-upload-to-s3
       await page.route('**/api/v1/team-member/aws/get-signed-request-for-upload-to-s3', 
         async (route) => {
           const postData = route.request().postDataJSON();
           const mockUrl = `https://s3.amazonaws.com/test-bucket/${postData.fileName}`;
           
           await route.fulfill({
             status: 200,
             contentType: 'application/json',
             body: JSON.stringify({
               signedRequest: mockUrl,
               url: mockUrl,
             }),
           });
         }
       );
       
       // Mock S3 PUT request
       await page.route('https://s3.amazonaws.com/**', async (route) => {
         uploadedFiles.push({
           url: route.request().url(),
           method: route.request().method(),
         });
         
         await route.fulfill({
           status: 200,
           body: 'OK',
         });
       });
       
       const context: FileUploadContext = {
         fileUpload: {
           mockSignedUrl(fileName, bucket) {
             return `https://s3.amazonaws.com/${bucket}/${fileName}`;
           },
           
           mockS3Upload(success, url) {
             // Already mocked via page.route()
           },
           
           testFiles: {
             avatar: path.join(__dirname, 'files', 'avatar.jpg'),
             document: path.join(__dirname, 'files', 'document.pdf'),
           },
           
           getUploadedFiles() {
             return uploadedFiles;
           },
         },
       };
       
       await use(context);
       
       // Cleanup routes
       await page.unroute('**/api/v1/team-member/aws/get-signed-request-for-upload-to-s3');
       await page.unroute('https://s3.amazonaws.com/**');
     },
   });
   ```

#### Acceptance Criteria
- ✅ Моки S3 pre-signed URL API
- ✅ Моки S3 PUT requests
- ✅ Предоставляет test files (avatar, document)
- ✅ Записывает историю uploads для assertions
- ✅ Cleanup убирает моки
- ✅ Документация с примерами

#### Пример использования
```typescript
test('user can upload avatar', async ({ page, authSession, fileUploadContext }) => {
  const { fileUpload } = fileUploadContext;
  
  await page.goto('/your-settings');
  
  // Upload avatar
  const fileInput = page.locator('input[type="file"][accept*="image"]');
  await fileInput.setInputFiles(fileUpload.testFiles.avatar);
  
  // Wait for upload to complete
  await page.waitForSelector('.avatar-preview img[src*="s3.amazonaws.com"]');
  
  // Verify mock captured upload
  const uploads = fileUpload.getUploadedFiles();
  expect(uploads).toHaveLength(1);
  expect(uploads[0].url).toContain('avatar.jpg');
});
```

---

### 4.6 User Settings Module (1.5 дня, 6-10 тестов)

#### 4.6.1 `10-user-settings/update-profile.test.ts` (2-3 теста)

**T3.6.1**: User can update display name
- **Given**: Authenticated user at `/your-settings`
- **When**: Change name to "New Name", save
- **Then**: Success message, name updated in DB and UI
- **Tags**: `@P2 @user-settings @profile`

**T3.6.2**: Name validation - min length
- **Given**: User at `/your-settings`
- **When**: Enter name < 3 characters, submit
- **Then**: Validation error "Name too short"
- **Tags**: `@P2 @user-settings @validation`

**T3.6.3**: Profile persists after logout/login
- **Given**: User updated name to "Persistent Name"
- **When**: Logout, login again
- **Then**: Name still "Persistent Name"
- **Tags**: `@P2 @user-settings @persistence`

---

#### 4.6.2 `10-user-settings/upload-avatar.test.ts` (2-3 теста)

**T3.6.4**: User can upload avatar image
- **Given**: User at `/your-settings`, `fileUploadContext`
- **When**: Select test avatar, upload
- **Then**: Avatar preview shows, URL saved to DB
- **Tags**: `@P2 @user-settings @avatar @s3`

**T3.6.5**: Avatar appears in header after upload
- **Given**: User uploaded avatar
- **When**: Navigate to any page
- **Then**: Header shows avatar image
- **Tags**: `@P2 @user-settings @avatar @ui`

**T3.6.6**: Invalid file type rejected
- **Given**: User at avatar upload
- **When**: Select .txt file (not image)
- **Then**: Error "Invalid file type"
- **Tags**: `@P2 @user-settings @avatar @validation`

---

#### 4.6.3 `10-user-settings/toggle-theme.test.ts` (2-4 теста)

**T3.6.7**: User can toggle to dark theme
- **Given**: User at `/your-settings`, light theme
- **When**: Click "Dark theme" toggle
- **Then**: Theme switches to dark, persists in DB
- **Tags**: `@P2 @user-settings @theme`

**T3.6.8**: Dark theme persists across sessions
- **Given**: User enabled dark theme
- **When**: Logout, login again
- **Then**: Theme is still dark
- **Tags**: `@P2 @user-settings @theme @persistence`

**T3.6.9**: Theme applies globally to all pages
- **Given**: User toggled to dark theme
- **When**: Navigate to `/discussion`, `/team-settings`, `/billing`
- **Then**: All pages use dark theme
- **Tags**: `@P2 @user-settings @theme @ui`

**T3.6.10**: Theme toggle animation works
- **Given**: User at settings
- **When**: Toggle theme
- **Then**: Smooth transition animation (visual check)
- **Tags**: `@P3 @user-settings @theme @visual`

---

## 5. Чек-лист выполнения

### Week 5 (Days 1-5)

#### День 1: Real-time Infrastructure
- [ ] 🔴 **AM**: Установить `socket.io-client` package
- [ ] 🔴 **AM**: Создать `realtimeFixtures.ts` - базовая структура
- [ ] 🔴 **PM**: Реализовать `connect()`, `disconnect()`, `joinTeamRoom()`
- [ ] 🟡 **PM**: Написать unit тесты для fixture (опционально)
- [ ] ✅ **EOD**: `realtimeObserver` fixture готова, документирована

#### День 2: Real-time Tests - Part 1
- [ ] 🔴 **AM**: Создать `07-realtime/websocket-connection.test.ts` (3 теста)
- [ ] 🔴 **PM**: Создать `07-realtime/live-discussion-updates.test.ts` (4 теста)
- [ ] ✅ **EOD**: 7 real-time тестов работают стабильно

#### День 3: Real-time Tests - Part 2 + Stabilization
- [ ] 🔴 **AM**: Создать `07-realtime/live-post-updates.test.ts` (3 теста)
- [ ] 🔴 **PM**: Создать `07-realtime/multi-user-sync.test.ts` (2 теста)
- [ ] 🟡 **PM**: Flaky tests stabilization (retry, waits)
- [ ] ✅ **EOD**: 12 real-time тестов, flaky rate < 5%

#### День 4: Billing Infrastructure
- [ ] 🔴 **AM**: Setup Stripe test credentials в `.env.test`
- [ ] 🔴 **AM**: Создать `billingFixtures.ts` - базовая структура
- [ ] 🔴 **PM**: Реализовать Stripe customer creation, cleanup
- [ ] 🔴 **PM**: Реализовать `createCheckoutSession()` helper
- [ ] ✅ **EOD**: `billingContext` fixture готова

#### День 5: Billing Tests
- [ ] 🔴 **AM**: Создать `08-billing/view-billing-page.test.ts` (3 теста)
- [ ] 🔴 **PM**: Создать `08-billing/checkout-flow.test.ts` - Part 1 (2 теста)
- [ ] ✅ **EOD**: 5 billing тестов (без webhooks пока)

---

### Week 6 (Days 6-10)

#### День 6: File Upload Infrastructure + Tests
- [ ] 🔴 **AM**: Создать test files (avatar.jpg, document.pdf)
- [ ] 🔴 **AM**: Создать `fileUploadFixtures.ts` с page.route() mocks
- [ ] 🔴 **PM**: Тестировать S3 mocks работают корректно
- [ ] 🔴 **PM**: Документация для `fileUploadContext`
- [ ] ✅ **EOD**: `fileUploadContext` fixture готова

#### День 7: User Settings Tests
- [ ] 🔴 **AM**: Создать `10-user-settings/update-profile.test.ts` (3 теста)
- [ ] 🔴 **PM**: Создать `10-user-settings/upload-avatar.test.ts` (3 теста)
- [ ] ✅ **EOD**: 6 user settings тестов

#### День 8: Theme Tests + Billing Completion
- [ ] 🔴 **AM**: Создать `10-user-settings/toggle-theme.test.ts` (4 теста)
- [ ] 🔴 **PM**: Доделать `08-billing/checkout-flow.test.ts` - webhooks (2 теста)
- [ ] ✅ **EOD**: 10 user settings тестов, 7 billing тестов

#### День 9: Документация + Code Review
- [ ] 🟡 **AM**: README для каждого модуля (Real-time, Billing, Settings)
- [ ] 🟡 **AM**: Примеры использования fixtures
- [ ] 🟡 **PM**: Code review всех тестов Фазы 3
- [ ] 🟡 **PM**: Рефакторинг дубликатов, улучшение читаемости
- [ ] ✅ **EOD**: Документация готова, код отрефакторен

#### День 10: Final Testing + Stabilization
- [ ] 🟡 **AM**: Запустить все P1 тесты (Фазы 2+3) параллельно
- [ ] 🟡 **AM**: Исправить flaky tests (target < 5%)
- [ ] 🟡 **PM**: Оптимизировать slow tests (target < 12 мин для P1)
- [ ] 🟡 **PM**: Update CI/CD для запуска P1 тестов
- [ ] ✅ **EOD**: Фаза 3 завершена, готова к merge

---

## 6. Acceptance Criteria

### 6.1 Функциональные требования

| Критерий | Цель | Проверка |
|----------|------|----------|
| **Real-time tests** | 8-12 тестов | `yarn test:e2e --grep "@realtime"` → все green |
| **Billing tests** | 5-7 тестов | `yarn test:e2e --grep "@billing"` → все green |
| **User Settings tests** | 6-10 тестов | `yarn test:e2e --grep "@user-settings"` → все green |
| **Fixtures работают** | 3 новых fixture | Используются в тестах без ошибок |

### 6.2 Качественные требования

| Метрика | Целевое значение | Как измерить |
|---------|------------------|--------------|
| **Flaky rate (Real-time)** | < 5% | Запустить 20 раз, < 1 failure |
| **Flaky rate (Billing/Settings)** | < 2% | Запустить 20 раз, 0 failures |
| **Время выполнения Real-time** | 3-4 минуты | `yarn test:e2e 07-realtime/` |
| **Время выполнения Billing** | 4-5 минут | `yarn test:e2e 08-billing/` (с Stripe) |
| **Время выполнения Settings** | 2-3 минуты | `yarn test:e2e 10-user-settings/` |
| **Читаемость кода** | 8/10 | Code review checklist |
| **Документация** | README + примеры | Все fixtures документированы |

### 6.3 Технические требования

- ✅ Все тесты используют TypeScript strict mode
- ✅ Все fixtures имеют type definitions
- ✅ Cleanup корректно работает (no DB/Stripe leaks)
- ✅ Retry логика для unstable operations (WebSocket)
- ✅ Explicit waits вместо hard timeouts
- ✅ Test tags (@P1, @P2, @realtime, @billing, etc.)

### 6.4 CI/CD Requirements

- ✅ GitHub Actions job для P1 тесты (включая real-time)
- ✅ Artifacts сохраняются при failures
- ✅ Slack notifications для failed runs (опционально)
- ✅ Test reports в HTML format

---

## 7. Риски и митигации

### 7.1 Высокие риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| **WebSocket flaky tests** | Высокая (70%) | Высокое | • Retry логика<br>• Explicit waits<br>• Stable event assertions<br>• Increase timeouts (5s → 10s)<br>• Debug logging |
| **Stripe API rate limits** | Средняя (40%) | Среднее | • Use test mode<br>• Cleanup Stripe resources<br>• Cache checkout sessions где возможно |
| **S3 mock complexity** | Средняя (50%) | Среднее | • Start с simple page.route() mocks<br>• Upgrade to MSW если нужно<br>• Документировать ограничения |
| **Multi-user test complexity** | Высокая (60%) | Среднее | • Start с simple scenarios<br>• Use helper functions<br>• Good cleanup between contexts |

### 7.2 Средние риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| **Socket.IO version mismatch** | Низкая (20%) | Высокое | • Match server version exactly<br>• Test connection в smoke test |
| **Stripe webhook testing** | Средняя (40%) | Среднее | • Mock webhooks initially<br>• Use Stripe CLI для real webhooks (опционально) |
| **Test data cleanup issues** | Средняя (30%) | Среднее | • Use testDb.clear() consistently<br>• Separate Stripe cleanup |

### 7.3 План contingency

**Если WebSocket тесты слишком flaky (> 10%)**:
1. Снизить приоритет до P2
2. Увеличить timeouts до 15s
3. Добавить exponential backoff retry
4. Рассмотреть mock WebSocket events вместо real connection

**Если Stripe интеграция сложная**:
1. Начать с view billing page тестов (без checkout)
2. Mock checkout flow через API intercept
3. Real Stripe checkout перенести в Фазу 4

**Если S3 mock не работает**:
1. Skip file upload тесты временно
2. Использовать localstack S3 (Docker)
3. Перенести в Фазу 4

---

## 8. Дополнительные материалы

### 8.1 Полезные ссылки

- **Socket.IO Client Docs**: https://socket.io/docs/v4/client-api/
- **Stripe Testing**: https://stripe.com/docs/testing
- **Playwright Network Mocking**: https://playwright.dev/docs/network
- **MSW (Mock Service Worker)**: https://mswjs.io/

### 8.2 Примеры кода

#### Real-time test example
```typescript
// Complete example
test('@P1 @realtime user sees live discussion updates', async ({ 
  page, 
  authSession, 
  teamContext, 
  realtimeObserver 
}) => {
  const { team } = teamContext;
  
  await realtimeObserver.joinTeamRoom(team._id);
  await page.goto(`/discussion?teamSlug=${team.slug}`);
  
  const eventPromise = realtimeObserver.waitForEvent('discussionEvent');
  
  // Trigger via API
  await makeApiRequest(servers.apiUrl, 'POST', '/api/v1/team-member/discussions/add', {
    teamId: team._id,
    name: 'Live Update Test',
  });
  
  const event = await eventPromise;
  expect(event.actionType).toBe('added');
  
  await expect(page.locator('text=Live Update Test')).toBeVisible({ timeout: 3000 });
});
```

#### Billing test example
```typescript
test('@P2 @billing leader can view billing page', async ({ 
  page, 
  authSession, 
  billingContext 
}) => {
  const { team } = authSession;
  
  await page.goto(`/billing?teamSlug=${team.slug}`);
  await expect(page).toHaveTitle(/Billing/);
  
  // Check subscription status section exists
  await expect(page.locator('[data-testid="subscription-status"]')).toBeVisible();
});
```

---

## 9. Итоги

### 9.1 Deliverables Фазы 3

- ✅ **3 новых fixture**: `realtimeObserver`, `billingContext`, `fileUploadContext`
- ✅ **28-35 тестов**: 12 real-time, 7 billing, 10 user settings
- ✅ **Документация**: README для каждого модуля + fixture examples
- ✅ **CI/CD**: P1 тесты в GitHub Actions

### 9.2 Готовность к Фазе 4

После завершения Фазы 3, готовы к:
- **Email notifications testing** (Фаза 4)
- **Billing completion** (cancel subscription, invoices)
- **Edge cases** (unauthorized access, expired tokens)

### 9.3 Следующие шаги

1. ✅ Review этого плана с командой
2. 🔴 Создать GitHub Issues для всех задач
3. 🔴 Setup Stripe test account + credentials
4. 🔴 Начать реализацию `realtimeObserver` fixture (День 1)

---

**Последнее обновление**: 2025-11-13  
**Автор**: QA Team  
**Статус**: 🔴 Готов к началу (ожидает завершения Фазы 2)
