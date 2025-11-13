# Фаза 4: Notifications & Billing Complete - Детальный план реализации

> **Период**: Week 7-8 (10 рабочих дней)  
> **Цель**: Завершение P2 тестов - Email notifications, Billing полное покрытие, Edge Cases  
> **Статус**: 🔴 Не начата  
> **Прогресс**: 0%  
> **Зависимости**: ✅ Фазы 1-3 должны быть завершены

---

## 📋 Содержание

1. [Обзор фазы](#обзор-фазы)
2. [Предварительные требования](#предварительные-требования)
3. [Задачи фазы 4](#задачи-фазы-4)
4. [Детальный план по модулям](#детальный-план-по-модулям)
5. [Чек-лист выполнения](#чек-лист-выполнения)
6. [Acceptance Criteria](#acceptance-criteria)
7. [Риски и митигации](#риски-и-митигации)

---

## 1. Обзор фазы

### 1.1 Цели

Завершить **P2 (Medium Priority)** покрытие критичных, но не блокирующих функций:
- **Email Notifications**: Захват и проверка всех типов email'ов (welcome, invitation, login-link, post notifications)
- **Billing Complete**: Полное покрытие Stripe integration (update payment, cancel, invoices)
- **Edge Cases & Security**: Проверка error handling, unauthorized access, validation

### 1.2 Ожидаемые результаты

| Метрика | Целевое значение |
|---------|------------------|
| **Количество тестов** | 35-45 |
| **Новые фикстуры** | `emailInbox` (Mailhog integration) |
| **Время выполнения Notifications** | 3-4 минуты |
| **Время выполнения Billing** | 3-4 минуты |
| **Время выполнения Edge Cases** | 4-6 минут |
| **Flaky rate** | < 2% |
| **Email capture rate** | 100% (все email отправки перехватываются) |
| **Stripe test coverage** | 95%+ (все основные flows) |

### 1.3 Связь с общим планом

- **Предыдущая фаза**: [Фаза 3 - Real-time & Advanced](./phase-3-realtime-advanced.md) (WebSockets, Billing начало, Settings)
- **Следующая фаза**: Фаза 5 - Polish & Optimization (Стабилизация, документация, performance)
- **Общий план**: [E2E Test Coverage Plan](../../docs/e2e-test-coverage-plan.md#фаза-4-notifications--billing-week-7-8)

---

## 2. Предварительные требования

### 2.1 ✅ Должно быть готово из Фаз 1-3

| Компонент | Статус | Комментарий |
|-----------|--------|-------------|
| MongoDB Memory Server | ✅ Обязательно | Инфраструктура |
| API/App Server Managers | ✅ Обязательно | Инфраструктура |
| `authSession` fixture | ✅ Обязательно | Для аутентификации |
| `teamContext` fixture | ✅ Обязательно | Для team-based email tests |
| `discussionContext` fixture | ✅ Обязательно | Для post notification tests |
| `billingContext` fixture | ✅ Обязательно | Stripe integration (из Фазы 3) |
| `realtimeObserver` fixture | 🟡 Желательно | Для real-time notification tests |
| Data factories | ✅ Обязательно | User, Team, Discussion, Post |
| P0 + P1 Tests | ✅ Обязательно | Базовая функциональность покрыта |
| Billing tests (начало) | ✅ Обязательно | View billing page, checkout flow (из Фазы 3) |

### 2.2 ❌ Новые требования для Фазы 4

| Компонент | Необходимость | Описание |
|-----------|---------------|----------|
| **`emailInbox` fixture** | 🔴 Критично | Захват и проверка email'ов |
| **Mailhog/SMTP Mock** | 🔴 Критично | Email capture service в Docker |
| **Mailhog Client** | 🔴 Критично | API client для чтения email'ов |
| **Stripe Webhooks Mock** | 🔴 Критично | Для тестирования subscription events |
| **Error simulation helpers** | 🟡 Желательно | Network errors, API errors |
| **Validation error factories** | 🟡 Желательно | Invalid data generators |

### 2.3 📦 Новые зависимости

```bash
# В e2e/package.json добавить:
yarn add -D mailhog@^4.16.0           # Mailhog API client
yarn add -D smtp-tester@^1.0.0        # Альтернатива Mailhog (опционально)
yarn add -D nock@^13.3.0              # HTTP mocking для webhooks/external APIs
```

### 2.4 🐳 Docker Infrastructure

**docker-compose.test.yml** (добавить Mailhog):
```yaml
version: '3.8'
services:
  mailhog:
    image: mailhog/mailhog:v1.0.1
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    environment:
      MH_STORAGE: memory
      MH_UI_WEB_PATH: mailhog
```

**Environment Variables** (`.env.test`):
```bash
# Email testing
SMTP_HOST=localhost
SMTP_PORT=1025
MAILHOG_API_URL=http://localhost:8025
EMAIL_SUPPORT_FROM_ADDRESS=test@saas-app.test

# Stripe (from Phase 3, confirm setup)
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
STRIPE_TEST_WEBHOOK_SECRET=whsec_test_...
```

---

## 3. Задачи фазы 4

### 3.1 Общая таблица задач

| # | Задача | Приоритет | Оценка | Зависимости | Ответственный |
|---|--------|-----------|--------|-------------|---------------|
| **4.1** | Реализация `emailInbox` fixture + Mailhog setup | P0 | 1.5 дня | Docker, Mailhog | Dev |
| **4.2** | Notifications Module - Email tests (8-12) | P2 | 2 дня | `emailInbox` | QA |
| **4.3** | Billing Module - Complete (6-8 тестов) | P2 | 1.5 дня | `billingContext`, webhooks mock | QA |
| **4.4** | Edge Cases Module - Security & Errors (15-20) | P2 | 2.5 дня | Error simulation helpers | QA |
| **4.5** | Webhook handling tests | P2 | 1 день | Nock, Stripe webhook mock | Dev |
| **4.6** | Documentation & Examples | P1 | 1 день | Все fixtures/tests готовы | Dev/QA |
| **4.7** | CI/CD Integration для P2 | P1 | 0.5 дня | Mailhog в Docker, GitHub Actions | DevOps |

**Общее время**: 9-10 дней (укладываемся в 2 недели с buffer)

### 3.2 Распределение по неделям

#### Week 7 (Days 1-5): Notifications & Billing Complete
- **Day 1-2**: Реализация `emailInbox` fixture + Mailhog setup + базовые email tests
- **Day 3**: Notifications Module - все типы email tests (welcome, invitation, login-link)
- **Day 4**: Billing Module Complete - update payment, cancel subscription
- **Day 5**: Billing Module Complete - invoices history, webhook tests

#### Week 8 (Days 6-10): Edge Cases & Polish
- **Day 6-7**: Edge Cases Module - unauthorized, invalid tokens, expired sessions
- **Day 8**: Edge Cases Module - network errors, validation errors
- **Day 9**: Documentation, примеры, code review
- **Day 10**: CI/CD интеграция, cleanup, final testing

---

## 4. Детальный план по модулям

### 4.1 Реализация `emailInbox` Fixture

**Файл**: `e2e/fixtures/emailFixtures.ts`

#### 4.1.1 Архитектура

```typescript
/**
 * Email Inbox Fixture для захвата и проверки email'ов через Mailhog
 */

import { test as base } from '@playwright/test';
import axios from 'axios';

interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  html: string;
  headers: Record<string, string>;
  created: string;
}

interface EmailInbox {
  /**
   * Получить все email'ы из inbox
   */
  getEmails(): Promise<Email[]>;
  
  /**
   * Получить последний email
   */
  getLatestEmail(): Promise<Email | null>;
  
  /**
   * Найти email по subject
   */
  findEmailBySubject(subject: string): Promise<Email | null>;
  
  /**
   * Найти email по получателю
   */
  findEmailByRecipient(email: string): Promise<Email[]>;
  
  /**
   * Ожидать email с заданным subject (с timeout)
   */
  waitForEmail(options: {
    subject?: string;
    to?: string;
    timeout?: number;
  }): Promise<Email>;
  
  /**
   * Извлечь ссылку из email body
   */
  extractLinkFromEmail(email: Email, pattern: RegExp): string | null;
  
  /**
   * Очистить все email'ы
   */
  clear(): Promise<void>;
  
  /**
   * Получить количество email'ов
   */
  count(): Promise<number>;
}

class MailhogClient implements EmailInbox {
  private readonly apiUrl: string;
  
  constructor(apiUrl: string = 'http://localhost:8025') {
    this.apiUrl = apiUrl;
  }
  
  async getEmails(): Promise<Email[]> {
    const response = await axios.get(`${this.apiUrl}/api/v2/messages`);
    return response.data.items.map(this.parseMailhogMessage);
  }
  
  async getLatestEmail(): Promise<Email | null> {
    const emails = await this.getEmails();
    return emails.length > 0 ? emails[0] : null;
  }
  
  async findEmailBySubject(subject: string): Promise<Email | null> {
    const emails = await this.getEmails();
    return emails.find(e => e.subject.includes(subject)) || null;
  }
  
  async findEmailByRecipient(email: string): Promise<Email[]> {
    const emails = await this.getEmails();
    return emails.filter(e => e.to.includes(email));
  }
  
  async waitForEmail(options: {
    subject?: string;
    to?: string;
    timeout?: number;
  }): Promise<Email> {
    const { subject, to, timeout = 10000 } = options;
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const emails = await this.getEmails();
      
      const found = emails.find(email => {
        if (subject && !email.subject.includes(subject)) return false;
        if (to && !email.to.includes(to)) return false;
        return true;
      });
      
      if (found) return found;
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error(
      `Email not found after ${timeout}ms. ` +
      `Criteria: ${JSON.stringify({ subject, to })}`
    );
  }
  
  extractLinkFromEmail(email: Email, pattern: RegExp): string | null {
    const body = email.html || email.body;
    const match = body.match(pattern);
    return match ? match[0] : null;
  }
  
  async clear(): Promise<void> {
    await axios.delete(`${this.apiUrl}/api/v1/messages`);
  }
  
  async count(): Promise<number> {
    const emails = await this.getEmails();
    return emails.length;
  }
  
  private parseMailhogMessage(msg: any): Email {
    return {
      id: msg.ID,
      from: msg.From.Mailbox + '@' + msg.From.Domain,
      to: msg.To.map((t: any) => t.Mailbox + '@' + t.Domain),
      subject: msg.Content.Headers.Subject[0],
      body: msg.Content.Body,
      html: msg.MIME?.Parts?.[0]?.Body || msg.Content.Body,
      headers: msg.Content.Headers,
      created: msg.Created,
    };
  }
}

// Fixture
export const emailFixtures = base.extend<{ emailInbox: EmailInbox }>({
  emailInbox: async ({}, use) => {
    const mailhogUrl = process.env.MAILHOG_API_URL || 'http://localhost:8025';
    const inbox = new MailhogClient(mailhogUrl);
    
    // Очистить inbox перед тестом
    await inbox.clear();
    
    await use(inbox);
    
    // Очистить inbox после теста (опционально)
    // await inbox.clear();
  },
});

export { EmailInbox, Email };
```

#### 4.1.2 Интеграция в fixtures/index.ts

```typescript
import { mergeTests } from '@playwright/test';
import { baseFixtures } from './baseFixtures';
import { authFixtures } from './authFixtures';
import { teamFixtures } from './teamFixtures';
import { discussionFixtures } from './discussionFixtures';
import { realtimeFixtures } from './realtimeFixtures';
import { billingFixtures } from './billingFixtures';
import { emailFixtures } from './emailFixtures'; // NEW

export const test = mergeTests(
  baseFixtures,
  authFixtures,
  teamFixtures,
  discussionFixtures,
  realtimeFixtures,
  billingFixtures,
  emailFixtures, // NEW
);

export { expect } from '@playwright/test';
```

#### 4.1.3 Чек-лист реализации `emailInbox`

- [ ] Создать `e2e/fixtures/emailFixtures.ts`
- [ ] Реализовать `MailhogClient` класс
- [ ] Реализовать все методы интерфейса `EmailInbox`
- [ ] Добавить Mailhog в `docker-compose.test.yml`
- [ ] Настроить переменные окружения `.env.test`
- [ ] Интегрировать в `fixtures/index.ts`
- [ ] Написать unit tests для `MailhogClient` (опционально)
- [ ] Создать примеры использования в README

---

### 4.2 Notifications Module (8-12 тестов)

**Директория**: `e2e/tests/09-notifications/`

#### 4.2.1 Welcome Email Tests

**Файл**: `e2e/tests/09-notifications/welcome-email.test.ts`

```typescript
import { test, expect } from '../../fixtures';

test.describe('@P2 @notifications Welcome Email', () => {
  test('should send welcome email on Google OAuth signup', async ({
    page,
    servers,
    emailInbox,
  }) => {
    // Arrange
    const testEmail = 'newuser@test.com';
    
    // Act: Simulate Google OAuth signup
    // (Это может потребовать mock Google OAuth или использование API напрямую)
    await page.goto(`${servers.apiUrl}/test-helpers/create-user-via-google`, {
      waitUntil: 'networkidle',
    });
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.click('[data-testid="signup-button"]');
    
    // Assert: Проверить, что welcome email отправлен
    const welcomeEmail = await emailInbox.waitForEmail({
      subject: 'Welcome',
      to: testEmail,
      timeout: 5000,
    });
    
    expect(welcomeEmail).toBeTruthy();
    expect(welcomeEmail.subject).toContain('Welcome to SaaS App');
    expect(welcomeEmail.to).toContain(testEmail);
    expect(welcomeEmail.body).toContain('Thank you for signing up');
    
    // Проверить, что email содержит правильные ссылки
    const loginLink = emailInbox.extractLinkFromEmail(
      welcomeEmail,
      /https?:\/\/[^\\s]+\/login/
    );
    expect(loginLink).toBeTruthy();
  });
  
  test('should send welcome email on passwordless signup', async ({
    page,
    servers,
    emailInbox,
    testDb,
  }) => {
    // Arrange
    const testEmail = 'passwordless-user@test.com';
    await testDb.clear();
    
    // Act: Request passwordless login (first time = signup)
    await page.goto(`${servers.appUrl}/login`);
    await page.fill('[data-testid="email-login-input"]', testEmail);
    await page.click('[data-testid="email-login-button"]');
    
    // Wait for login link email
    const loginEmail = await emailInbox.waitForEmail({
      subject: 'Login',
      to: testEmail,
      timeout: 5000,
    });
    
    // Extract and visit login link
    const loginLink = emailInbox.extractLinkFromEmail(
      loginEmail,
      /https?:\/\/[^\\s]+\/auth\/logged_in\\?token=[^\\s&]+/
    );
    await page.goto(loginLink);
    await page.waitForURL(/\/(your-settings|create-team)/);
    
    // Assert: Welcome email should be sent after first login
    const welcomeEmail = await emailInbox.findEmailBySubject('Welcome');
    expect(welcomeEmail).toBeTruthy();
    expect(welcomeEmail.to).toContain(testEmail);
  });
  
  test('welcome email should contain user name', async ({
    emailInbox,
    authSession,
  }) => {
    // Arrange: Create user with specific name
    const userName = 'John Doe';
    const user = await authSession.createUser({
      displayName: userName,
      email: 'john@test.com',
    });
    
    // Act: Welcome email should have been sent
    const welcomeEmail = await emailInbox.findEmailByRecipient(user.email);
    
    // Assert
    expect(welcomeEmail.length).toBeGreaterThan(0);
    expect(welcomeEmail[0].body).toContain(userName);
  });
  
  test('should not send duplicate welcome emails', async ({
    page,
    servers,
    emailInbox,
    authSession,
  }) => {
    // Arrange: Create and login user
    const user = await authSession.createAndAuthenticate();
    
    // Act: Logout and login again
    await page.goto(`${servers.apiUrl}/logout`);
    await authSession.authenticate(user);
    
    // Assert: Only one welcome email
    const welcomeEmails = await emailInbox.findEmailByRecipient(user.email);
    const welcomeCount = welcomeEmails.filter(e =>
      e.subject.includes('Welcome')
    ).length;
    expect(welcomeCount).toBe(1);
  });
});
```

#### 4.2.2 Invitation Email Tests

**Файл**: `e2e/tests/09-notifications/invitation-email.test.ts`

```typescript
import { test, expect } from '../../fixtures';

test.describe('@P2 @notifications Invitation Email', () => {
  test('should send invitation email when leader invites member', async ({
    page,
    servers,
    teamContext,
    emailInbox,
  }) => {
    // Arrange
    const { team, owner } = teamContext;
    const inviteeEmail = 'invitee@test.com';
    
    // Act: Leader invites member
    await page.goto(`${servers.appUrl}/team-settings?teamSlug=${team.slug}`);
    await page.fill('[data-testid="invite-email-input"]', inviteeEmail);
    await page.click('[data-testid="send-invitation-button"]');
    
    // Assert: Invitation email sent
    const invitationEmail = await emailInbox.waitForEmail({
      subject: 'You are invited',
      to: inviteeEmail,
      timeout: 5000,
    });
    
    expect(invitationEmail).toBeTruthy();
    expect(invitationEmail.subject).toContain(`invited to join ${team.name}`);
    expect(invitationEmail.body).toContain(owner.displayName);
    expect(invitationEmail.body).toContain(team.name);
    
    // Проверить наличие invitation link
    const invitationLink = emailInbox.extractLinkFromEmail(
      invitationEmail,
      /https?:\/\/[^\\s]+\/invitation\\?token=[^\\s&]+/
    );
    expect(invitationLink).toBeTruthy();
  });
  
  test('invitation email link should be valid and working', async ({
    page,
    servers,
    teamContext,
    emailInbox,
  }) => {
    // Arrange
    const { team } = teamContext;
    const inviteeEmail = 'valid-invitee@test.com';
    
    // Act: Send invitation
    await page.goto(`${servers.appUrl}/team-settings?teamSlug=${team.slug}`);
    await page.fill('[data-testid="invite-email-input"]', inviteeEmail);
    await page.click('[data-testid="send-invitation-button"]');
    
    const invitationEmail = await emailInbox.waitForEmail({
      to: inviteeEmail,
      timeout: 5000,
    });
    
    const invitationLink = emailInbox.extractLinkFromEmail(
      invitationEmail,
      /https?:\/\/[^\\s]+\/invitation\\?token=[^\\s&]+/
    );
    
    // Act: Visit invitation link
    await page.goto(invitationLink);
    
    // Assert: Should redirect to invitation page with team info
    await expect(page.locator('[data-testid="team-name"]')).toContainText(
      team.name
    );
    await expect(page.locator('[data-testid="accept-invitation-button"]')).toBeVisible();
  });
  
  test('should include team avatar in invitation email', async ({
    teamContext,
    emailInbox,
    page,
    servers,
  }) => {
    // Arrange
    const { team } = teamContext;
    const inviteeEmail = 'avatar-test@test.com';
    
    // Act
    await page.goto(`${servers.appUrl}/team-settings?teamSlug=${team.slug}`);
    await page.fill('[data-testid="invite-email-input"]', inviteeEmail);
    await page.click('[data-testid="send-invitation-button"]');
    
    const invitationEmail = await emailInbox.waitForEmail({
      to: inviteeEmail,
      timeout: 5000,
    });
    
    // Assert: Email HTML contains avatar image
    expect(invitationEmail.html).toContain('<img');
    if (team.avatarUrl) {
      expect(invitationEmail.html).toContain(team.avatarUrl);
    }
  });
  
  test('should not send invitation email for invalid email', async ({
    page,
    servers,
    teamContext,
    emailInbox,
  }) => {
    // Arrange
    const { team } = teamContext;
    const invalidEmail = 'not-an-email';
    const initialCount = await emailInbox.count();
    
    // Act: Try to invite with invalid email
    await page.goto(`${servers.appUrl}/team-settings?teamSlug=${team.slug}`);
    await page.fill('[data-testid="invite-email-input"]', invalidEmail);
    await page.click('[data-testid="send-invitation-button"]');
    
    // Assert: Error message shown, no email sent
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Invalid email'
    );
    
    // Wait a bit and check email count unchanged
    await page.waitForTimeout(2000);
    const finalCount = await emailInbox.count();
    expect(finalCount).toBe(initialCount);
  });
});
```

#### 4.2.3 Login Link Email Tests

**Файл**: `e2e/tests/09-notifications/login-link-email.test.ts`

```typescript
import { test, expect } from '../../fixtures';

test.describe('@P2 @notifications Login Link Email', () => {
  test('should send login link email on passwordless request', async ({
    page,
    servers,
    emailInbox,
    testDb,
  }) => {
    // Arrange
    await testDb.clear();
    const testEmail = 'login-test@test.com';
    
    // Act: Request login link
    await page.goto(`${servers.appUrl}/login`);
    await page.fill('[data-testid="email-login-input"]', testEmail);
    await page.click('[data-testid="email-login-button"]');
    
    // Assert: Login link email sent
    const loginEmail = await emailInbox.waitForEmail({
      subject: 'Login',
      to: testEmail,
      timeout: 5000,
    });
    
    expect(loginEmail).toBeTruthy();
    expect(loginEmail.subject).toContain('Login link');
    expect(loginEmail.body).toContain('Click here to log in');
    
    // Verify login link format
    const loginLink = emailInbox.extractLinkFromEmail(
      loginEmail,
      /https?:\/\/[^\\s]+\/auth\/logged_in\\?token=[^\\s&]+&uid=[^\\s&]+/
    );
    expect(loginLink).toBeTruthy();
    expect(loginLink).toContain('token=');
    expect(loginLink).toContain('uid=');
  });
  
  test('login link should successfully authenticate user', async ({
    page,
    servers,
    emailInbox,
    testDb,
  }) => {
    // Arrange
    await testDb.clear();
    const testEmail = 'auth-test@test.com';
    
    // Act: Request and use login link
    await page.goto(`${servers.appUrl}/login`);
    await page.fill('[data-testid="email-login-input"]', testEmail);
    await page.click('[data-testid="email-login-button"]');
    
    const loginEmail = await emailInbox.waitForEmail({
      to: testEmail,
      timeout: 5000,
    });
    
    const loginLink = emailInbox.extractLinkFromEmail(
      loginEmail,
      /https?:\/\/[^\\s]+\/auth\/logged_in\\?[^\\s]+/
    );
    
    await page.goto(loginLink);
    
    // Assert: User is authenticated and redirected
    await page.waitForURL(/\/(your-settings|create-team|discussion)/, {
      timeout: 10000,
    });
    
    // Verify user menu is visible (logged in state)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
  
  test('login link should expire after use', async ({
    page,
    servers,
    emailInbox,
    testDb,
  }) => {
    // Arrange
    await testDb.clear();
    const testEmail = 'expire-test@test.com';
    
    // Act: Get login link and use it twice
    await page.goto(`${servers.appUrl}/login`);
    await page.fill('[data-testid="email-login-input"]', testEmail);
    await page.click('[data-testid="email-login-button"]');
    
    const loginEmail = await emailInbox.waitForEmail({
      to: testEmail,
      timeout: 5000,
    });
    
    const loginLink = emailInbox.extractLinkFromEmail(
      loginEmail,
      /https?:\/\/[^\\s]+\/auth\/logged_in\\?[^\\s]+/
    );
    
    // First use - should work
    await page.goto(loginLink);
    await page.waitForURL(/\/(your-settings|create-team)/);
    
    // Logout
    await page.goto(`${servers.apiUrl}/logout`);
    
    // Second use - should fail
    await page.goto(loginLink);
    
    // Assert: Error or redirect to login
    await page.waitForURL(/\/login/);
    await expect(
      page.locator('text=/Invalid.*token|Token expired/')
    ).toBeVisible();
  });
  
  test('should send new login link for existing users', async ({
    page,
    servers,
    emailInbox,
    authSession,
  }) => {
    // Arrange: Create existing user
    const user = await authSession.createUser({
      email: 'existing@test.com',
      displayName: 'Existing User',
    });
    
    // Act: Request login link for existing user
    await page.goto(`${servers.appUrl}/login`);
    await page.fill('[data-testid="email-login-input"]', user.email);
    await page.click('[data-testid="email-login-button"]');
    
    // Assert: Login email sent (not welcome email)
    const loginEmail = await emailInbox.waitForEmail({
      to: user.email,
      timeout: 5000,
    });
    
    expect(loginEmail.subject).not.toContain('Welcome');
    expect(loginEmail.subject).toContain('Login');
  });
});
```

#### 4.2.4 Post Notification Email Tests

**Файл**: `e2e/tests/09-notifications/post-notification-email.test.ts`

```typescript
import { test, expect } from '../../fixtures';

test.describe('@P2 @notifications Post Notification Email', () => {
  test('should send email when user mentioned in post', async ({
    page,
    servers,
    discussionContext,
    emailInbox,
  }) => {
    // Arrange
    const { discussion, members } = discussionContext;
    const [author, mentionedUser] = members;
    
    // Act: Create post with mention
    await page.goto(
      `${servers.appUrl}/discussion?teamSlug=${discussion.teamId}&discussionSlug=${discussion.slug}`
    );
    
    await page.fill(
      '[data-testid="post-editor"]',
      `Hey @${mentionedUser.displayName}, check this out!`
    );
    await page.click('[data-testid="submit-post-button"]');
    
    // Assert: Notification email sent to mentioned user
    const notificationEmail = await emailInbox.waitForEmail({
      to: mentionedUser.email,
      subject: 'mentioned you',
      timeout: 5000,
    });
    
    expect(notificationEmail).toBeTruthy();
    expect(notificationEmail.body).toContain(author.displayName);
    expect(notificationEmail.body).toContain(discussion.name);
    
    // Verify link to discussion
    const discussionLink = emailInbox.extractLinkFromEmail(
      notificationEmail,
      /https?:\/\/[^\\s]+\/discussion\\?[^\\s]+/
    );
    expect(discussionLink).toBeTruthy();
  });
  
  test('should not send email if notification disabled', async ({
    page,
    servers,
    discussionContext,
    emailInbox,
  }) => {
    // Arrange
    const { discussion, members } = discussionContext;
    const [_, mutedUser] = members;
    
    // Disable notifications for mutedUser
    await page.goto(`${servers.appUrl}/discussion-settings?id=${discussion._id}`);
    await page.selectOption(
      '[data-testid="notification-settings"]',
      'muted'
    );
    await page.click('[data-testid="save-settings"]');
    
    const initialCount = await emailInbox.count();
    
    // Act: Create post mentioning muted user
    await page.goto(
      `${servers.appUrl}/discussion?teamSlug=${discussion.teamId}&discussionSlug=${discussion.slug}`
    );
    
    await page.fill(
      '[data-testid="post-editor"]',
      `Hey @${mutedUser.displayName}, this is a test!`
    );
    await page.click('[data-testid="submit-post-button"]');
    
    // Assert: No email sent
    await page.waitForTimeout(2000);
    const finalCount = await emailInbox.count();
    expect(finalCount).toBe(initialCount);
  });
  
  test('should send email for new post in default notification mode', async ({
    page,
    servers,
    discussionContext,
    emailInbox,
  }) => {
    // Arrange: Discussion with default notifications
    const { discussion, members } = discussionContext;
    const [author, subscriber] = members;
    
    // Act: Author creates new post
    await page.goto(
      `${servers.appUrl}/discussion?teamSlug=${discussion.teamId}&discussionSlug=${discussion.slug}`
    );
    
    await page.fill('[data-testid="post-editor"]', 'New update everyone!');
    await page.click('[data-testid="submit-post-button"]');
    
    // Assert: Subscriber receives email
    const notificationEmail = await emailInbox.waitForEmail({
      to: subscriber.email,
      timeout: 5000,
    });
    
    expect(notificationEmail).toBeTruthy();
    expect(notificationEmail.subject).toContain('New post');
    expect(notificationEmail.body).toContain(discussion.name);
  });
  
  test('notification email should include post preview', async ({
    discussionContext,
    emailInbox,
    page,
    servers,
  }) => {
    // Arrange
    const { discussion, members } = discussionContext;
    const postContent = 'This is a test post with **markdown** formatting.';
    
    // Act: Create post
    await page.goto(
      `${servers.appUrl}/discussion?teamSlug=${discussion.teamId}&discussionSlug=${discussion.slug}`
    );
    await page.fill('[data-testid="post-editor"]', postContent);
    await page.click('[data-testid="submit-post-button"]');
    
    // Get notification email
    const notificationEmail = await emailInbox.waitForEmail({
      to: members[1].email,
      timeout: 5000,
    });
    
    // Assert: Email includes post preview (possibly truncated)
    expect(notificationEmail.body).toContain('This is a test post');
  });
});
```

#### 4.2.5 Чек-лист Notifications Module

- [ ] **Welcome Email Tests** (4 теста)
  - [ ] Google OAuth signup sends welcome email
  - [ ] Passwordless signup sends welcome email
  - [ ] Welcome email contains user name
  - [ ] No duplicate welcome emails
  
- [ ] **Invitation Email Tests** (4 теста)
  - [ ] Team invitation sends email
  - [ ] Invitation link is valid
  - [ ] Email includes team avatar
  - [ ] Invalid email shows error, no email sent
  
- [ ] **Login Link Email Tests** (4 теста)
  - [ ] Passwordless request sends login link
  - [ ] Login link authenticates user
  - [ ] Login link expires after use
  - [ ] Existing users receive login link (not welcome)
  
- [ ] **Post Notification Email Tests** (4 теста)
  - [ ] Mention in post sends notification
  - [ ] Muted notifications don't send email
  - [ ] Default notification mode sends email
  - [ ] Email includes post preview

**Итого Notifications**: 16 тестов (~3-4 минуты выполнения)

---

### 4.3 Billing Module Complete (6-8 тестов)

**Директория**: `e2e/tests/08-billing/` (дополнение к Фазе 3)

#### 4.3.1 Update Payment Method Tests

**Файл**: `e2e/tests/08-billing/update-payment-method.test.ts`

```typescript
import { test, expect } from '../../fixtures';

test.describe('@P2 @billing Update Payment Method', () => {
  test('should allow updating payment method', async ({
    page,
    servers,
    teamContext,
    billingContext,
  }) => {
    // Arrange: Team with existing subscription
    const { team, owner } = teamContext;
    await billingContext.createSubscriptionForTeam(team._id, owner._id);
    
    // Act: Navigate to billing
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    
    // Click "Update Payment Method"
    await page.click('[data-testid="update-payment-method-button"]');
    
    // Stripe Checkout should open
    await page.waitForURL(/checkout\.stripe\.com/);
    
    // Fill in test card (Stripe test mode)
    await billingContext.fillStripeCheckoutForm(page, {
      cardNumber: '4242424242424242',
      expiry: '12/34',
      cvc: '123',
    });
    
    await page.click('[data-testid="stripe-submit-button"]');
    
    // Assert: Redirected back to billing page
    await page.waitForURL(/\/billing/);
    await expect(
      page.locator('[data-testid="success-message"]')
    ).toContainText('Payment method updated');
  });
  
  test('should show new card last 4 digits after update', async ({
    page,
    servers,
    teamContext,
    billingContext,
  }) => {
    // Arrange
    const { team, owner } = teamContext;
    await billingContext.createSubscriptionForTeam(team._id, owner._id, {
      cardLast4: '1234',
    });
    
    // Act: Update to new card
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    await page.click('[data-testid="update-payment-method-button"]');
    
    // Use different test card
    await billingContext.fillStripeCheckoutForm(page, {
      cardNumber: '5555555555554444', // Mastercard
      expiry: '12/34',
      cvc: '123',
    });
    await page.click('[data-testid="stripe-submit-button"]');
    
    await page.waitForURL(/\/billing/);
    
    // Assert: New card last 4 digits shown
    await expect(page.locator('[data-testid="card-info"]')).toContainText(
      '4444'
    );
  });
  
  test('should handle declined card gracefully', async ({
    page,
    servers,
    teamContext,
    billingContext,
  }) => {
    // Arrange
    const { team } = teamContext;
    
    // Act: Try to update with declined card
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    await page.click('[data-testid="update-payment-method-button"]');
    
    // Use Stripe test card that always declines
    await billingContext.fillStripeCheckoutForm(page, {
      cardNumber: '4000000000000002', // Declined card
      expiry: '12/34',
      cvc: '123',
    });
    await page.click('[data-testid="stripe-submit-button"]');
    
    // Assert: Error message shown
    await expect(page.locator('[data-testid="stripe-error"]')).toContainText(
      /declined|failed/i
    );
  });
});
```

#### 4.3.2 Cancel Subscription Tests

**Файл**: `e2e/tests/08-billing/cancel-subscription.test.ts`

```typescript
import { test, expect } from '../../fixtures';

test.describe('@P2 @billing Cancel Subscription', () => {
  test('should allow team leader to cancel subscription', async ({
    page,
    servers,
    teamContext,
    billingContext,
  }) => {
    // Arrange: Active subscription
    const { team, owner } = teamContext;
    await billingContext.createSubscriptionForTeam(team._id, owner._id);
    
    // Act: Navigate to billing and cancel
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    
    await page.click('[data-testid="cancel-subscription-button"]');
    
    // Confirmation dialog
    await expect(page.locator('[data-testid="confirm-dialog"]')).toBeVisible();
    await page.click('[data-testid="confirm-cancel-button"]');
    
    // Assert: Subscription cancelled
    await expect(
      page.locator('[data-testid="subscription-status"]')
    ).toContainText(/cancelled|inactive/i);
    
    await expect(
      page.locator('[data-testid="success-message"]')
    ).toContainText('Subscription cancelled');
  });
  
  test('cancelled subscription should show end date', async ({
    page,
    servers,
    teamContext,
    billingContext,
  }) => {
    // Arrange & Act: Cancel subscription
    const { team, owner } = teamContext;
    await billingContext.createSubscriptionForTeam(team._id, owner._id);
    
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    await page.click('[data-testid="cancel-subscription-button"]');
    await page.click('[data-testid="confirm-cancel-button"]');
    
    // Assert: End date shown
    await expect(
      page.locator('[data-testid="subscription-end-date"]')
    ).toBeVisible();
    
    // Should show "Active until [date]"
    await expect(page.locator('[data-testid="billing-info"]')).toContainText(
      /active until|ends on/i
    );
  });
  
  test('should require confirmation before cancelling', async ({
    page,
    servers,
    teamContext,
    billingContext,
  }) => {
    // Arrange
    const { team, owner } = teamContext;
    await billingContext.createSubscriptionForTeam(team._id, owner._id);
    
    // Act: Click cancel but dismiss confirmation
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    await page.click('[data-testid="cancel-subscription-button"]');
    
    // Dismiss confirmation
    await page.click('[data-testid="cancel-dialog-dismiss"]');
    
    // Assert: Subscription still active
    await expect(
      page.locator('[data-testid="subscription-status"]')
    ).toContainText(/active/i);
  });
  
  test('non-leader cannot cancel subscription', async ({
    page,
    servers,
    teamContext,
    billingContext,
    authSession,
  }) => {
    // Arrange: Team member (not leader) logged in
    const { team, members } = teamContext;
    const nonLeader = members[0];
    
    await authSession.authenticate(nonLeader);
    await billingContext.createSubscriptionForTeam(team._id, team.teamLeaderId);
    
    // Act: Try to access billing
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    
    // Assert: Either redirected or cancel button disabled
    if (await page.url().includes('/billing')) {
      await expect(
        page.locator('[data-testid="cancel-subscription-button"]')
      ).toBeDisabled();
    } else {
      // Redirected away (403)
      expect(page.url()).not.toContain('/billing');
    }
  });
});
```

#### 4.3.3 Invoices History Tests

**Файл**: `e2e/tests/08-billing/invoices-history.test.ts`

```typescript
import { test, expect } from '../../fixtures';

test.describe('@P2 @billing Invoices History', () => {
  test('should display list of invoices', async ({
    page,
    servers,
    teamContext,
    billingContext,
  }) => {
    // Arrange: Create subscription with invoices
    const { team, owner } = teamContext;
    await billingContext.createSubscriptionForTeam(team._id, owner._id);
    await billingContext.createInvoicesForTeam(team._id, 3);
    
    // Act: Navigate to billing
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    
    // Assert: Invoices list visible
    await expect(
      page.locator('[data-testid="invoices-section"]')
    ).toBeVisible();
    
    const invoiceRows = page.locator('[data-testid="invoice-row"]');
    await expect(invoiceRows).toHaveCount(3);
  });
  
  test('invoice should show date, amount, and status', async ({
    page,
    servers,
    teamContext,
    billingContext,
  }) => {
    // Arrange
    const { team, owner } = teamContext;
    await billingContext.createSubscriptionForTeam(team._id, owner._id);
    const invoice = await billingContext.createInvoicesForTeam(team._id, 1);
    
    // Act
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    
    // Assert: Invoice details shown
    const invoiceRow = page.locator('[data-testid="invoice-row"]').first();
    
    await expect(invoiceRow.locator('[data-testid="invoice-date"]')).toBeVisible();
    await expect(invoiceRow.locator('[data-testid="invoice-amount"]')).toContainText(
      invoice.amount.toString()
    );
    await expect(invoiceRow.locator('[data-testid="invoice-status"]')).toContainText(
      invoice.status
    );
  });
  
  test('should allow downloading invoice PDF', async ({
    page,
    servers,
    teamContext,
    billingContext,
  }) => {
    // Arrange
    const { team, owner } = teamContext;
    await billingContext.createSubscriptionForTeam(team._id, owner._id);
    await billingContext.createInvoicesForTeam(team._id, 1);
    
    // Act: Click download button
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-invoice-button"]');
    const download = await downloadPromise;
    
    // Assert: PDF downloaded
    expect(download.suggestedFilename()).toMatch(/invoice.*\.pdf/i);
  });
  
  test('should show message when no invoices exist', async ({
    page,
    servers,
    teamContext,
  }) => {
    // Arrange: Team without subscription
    const { team } = teamContext;
    
    // Act
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    
    // Assert: Empty state message
    await expect(
      page.locator('[data-testid="no-invoices-message"]')
    ).toContainText(/no invoices|no billing history/i);
  });
  
  test('should paginate invoices if more than 10', async ({
    page,
    servers,
    teamContext,
    billingContext,
  }) => {
    // Arrange: Create 15 invoices
    const { team, owner } = teamContext;
    await billingContext.createSubscriptionForTeam(team._id, owner._id);
    await billingContext.createInvoicesForTeam(team._id, 15);
    
    // Act
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    
    // Assert: First page shows 10 invoices
    const invoiceRows = page.locator('[data-testid="invoice-row"]');
    await expect(invoiceRows).toHaveCount(10);
    
    // Pagination controls visible
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    
    // Navigate to page 2
    await page.click('[data-testid="next-page-button"]');
    
    // Page 2 shows remaining 5 invoices
    await expect(invoiceRows).toHaveCount(5);
  });
});
```

#### 4.3.4 Webhook Tests

**Файл**: `e2e/tests/08-billing/webhook-handling.test.ts`

```typescript
import { test, expect } from '../../fixtures';
import nock from 'nock';

test.describe('@P2 @billing Stripe Webhook Handling', () => {
  test('should update subscription status on webhook', async ({
    page,
    servers,
    teamContext,
    billingContext,
  }) => {
    // Arrange: Create subscription
    const { team, owner } = teamContext;
    const subscription = await billingContext.createSubscriptionForTeam(
      team._id,
      owner._id
    );
    
    // Act: Simulate Stripe webhook (subscription updated)
    await billingContext.triggerStripeWebhook({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: subscription.id,
          status: 'past_due',
        },
      },
    });
    
    // Navigate to billing page
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    
    // Assert: Status updated
    await expect(
      page.locator('[data-testid="subscription-status"]')
    ).toContainText('Past Due');
  });
  
  test('should handle payment_failed webhook', async ({
    servers,
    teamContext,
    billingContext,
    emailInbox,
  }) => {
    // Arrange
    const { team, owner } = teamContext;
    const subscription = await billingContext.createSubscriptionForTeam(
      team._id,
      owner._id
    );
    
    // Act: Trigger payment failed webhook
    await billingContext.triggerStripeWebhook({
      type: 'invoice.payment_failed',
      data: {
        object: {
          customer: owner.stripeCustomer.id,
          subscription: subscription.id,
          amount_due: 2000,
        },
      },
    });
    
    // Assert: Email sent to team leader
    const paymentFailedEmail = await emailInbox.waitForEmail({
      to: owner.email,
      subject: 'Payment failed',
      timeout: 5000,
    });
    
    expect(paymentFailedEmail).toBeTruthy();
    expect(paymentFailedEmail.body).toContain('payment failed');
    expect(paymentFailedEmail.body).toContain('update your payment method');
  });
  
  test('should create invoice record on webhook', async ({
    servers,
    teamContext,
    billingContext,
    testDb,
  }) => {
    // Arrange
    const { team, owner } = teamContext;
    const subscription = await billingContext.createSubscriptionForTeam(
      team._id,
      owner._id
    );
    
    // Act: Trigger invoice created webhook
    await billingContext.triggerStripeWebhook({
      type: 'invoice.created',
      data: {
        object: {
          id: 'in_test123',
          customer: owner.stripeCustomer.id,
          subscription: subscription.id,
          amount_due: 2000,
          status: 'open',
        },
      },
    });
    
    // Assert: Invoice saved in DB
    const invoices = await testDb.getCollection('invoices').find({
      teamId: team._id,
    }).toArray();
    
    expect(invoices.length).toBeGreaterThan(0);
    expect(invoices[0].stripeInvoiceId).toBe('in_test123');
  });
});
```

#### 4.3.5 Чек-лист Billing Module Complete

- [ ] **Update Payment Method** (3 теста)
  - [ ] Update payment method flow
  - [ ] Show new card last 4 digits
  - [ ] Handle declined card
  
- [ ] **Cancel Subscription** (4 теста)
  - [ ] Leader can cancel subscription
  - [ ] Show end date after cancellation
  - [ ] Require confirmation before cancel
  - [ ] Non-leader cannot cancel
  
- [ ] **Invoices History** (5 тестов)
  - [ ] Display list of invoices
  - [ ] Show invoice date, amount, status
  - [ ] Download invoice PDF
  - [ ] Empty state message
  - [ ] Paginate invoices (>10)
  
- [ ] **Webhook Handling** (3 теста)
  - [ ] Update subscription status on webhook
  - [ ] Payment failed email notification
  - [ ] Create invoice record

**Итого Billing Complete**: 15 тестов (~3-4 минуты выполнения)

---

### 4.4 Edge Cases Module (15-20 тестов)

**Директория**: `e2e/tests/11-edge-cases/`

#### 4.4.1 Unauthorized Access Tests

**Файл**: `e2e/tests/11-edge-cases/unauthorized-access.test.ts`

```typescript
import { test, expect } from '../../fixtures';

test.describe('@P2 @edge-cases Unauthorized Access', () => {
  test('unauthenticated user redirected to login', async ({
    page,
    servers,
  }) => {
    // Act: Try to access protected page without authentication
    await page.goto(`${servers.appUrl}/your-settings`);
    
    // Assert: Redirected to login
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });
  
  test('authenticated user cannot access other teams', async ({
    page,
    servers,
    teamContext,
    authSession,
  }) => {
    // Arrange: Two separate teams
    const { team: team1 } = teamContext;
    
    // Create second team with different owner
    const user2 = await authSession.createUser({ email: 'user2@test.com' });
    const team2 = await teamContext.createTeam({
      teamLeaderId: user2._id,
      name: 'Team 2',
    });
    
    // Login as team1 owner
    await authSession.authenticate(teamContext.owner);
    
    // Act: Try to access team2 settings
    await page.goto(`${servers.appUrl}/team-settings?teamSlug=${team2.slug}`);
    
    // Assert: Access denied (403) or redirected
    await expect(page.locator('text=/Access denied|Not found/i')).toBeVisible({
      timeout: 5000,
    });
  });
  
  test('team member cannot access leader-only endpoints', async ({
    page,
    servers,
    teamContext,
    authSession,
  }) => {
    // Arrange: Login as member (not leader)
    const { team, members } = teamContext;
    const member = members[0];
    await authSession.authenticate(member);
    
    // Act: Try to access billing (leader-only)
    await page.goto(`${servers.appUrl}/billing?teamSlug=${team.slug}`);
    
    // Assert: Access denied
    await expect(
      page.locator('text=/Access denied|Permission denied/i')
    ).toBeVisible();
  });
  
  test('API returns 401 for unauthenticated requests', async ({ servers }) => {
    // Act: Call protected API without auth
    const response = await fetch(
      `${servers.apiUrl}/api/v1/team-member/get-initial-data`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }
    );
    
    // Assert: 401 Unauthorized
    expect(response.status).toBe(401);
  });
  
  test('session cookie prevents unauthorized API access', async ({
    page,
    servers,
  }) => {
    // Arrange: No authentication
    await page.context().clearCookies();
    
    // Act: Make API request
    const response = await page.request.post(
      `${servers.apiUrl}/api/v1/team-member/user/update-profile`,
      {
        data: { name: 'Hacker' },
      }
    );
    
    // Assert: Unauthorized
    expect(response.status()).toBe(401);
  });
});
```

#### 4.4.2 Invalid Tokens Tests

**Файл**: `e2e/tests/11-edge-cases/invalid-tokens.test.ts`

```typescript
import { test, expect } from '../../fixtures';

test.describe('@P2 @edge-cases Invalid Tokens', () => {
  test('invalid invitation token shows error', async ({ page, servers }) => {
    // Act: Navigate with invalid token
    await page.goto(`${servers.appUrl}/invitation?token=invalid-token-123`);
    
    // Assert: Error message
    await expect(
      page.locator('text=/Invalid.*invitation|Token not found/i')
    ).toBeVisible();
  });
  
  test('expired invitation token cannot be used', async ({
    page,
    servers,
    teamContext,
    testDb,
  }) => {
    // Arrange: Create invitation and manually expire it
    const { team } = teamContext;
    const invitation = await testDb.getCollection('invitations').insertOne({
      teamId: team._id,
      email: 'expired@test.com',
      token: 'expired-token',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    });
    
    // Act: Try to use expired token
    await page.goto(`${servers.appUrl}/invitation?token=expired-token`);
    
    // Assert: Expired message
    await expect(page.locator('text=/expired|no longer valid/i')).toBeVisible();
  });
  
  test('invalid passwordless token shows error', async ({
    page,
    servers,
  }) => {
    // Act: Navigate with invalid token
    await page.goto(
      `${servers.apiUrl}/auth/logged_in?token=invalid&uid=fakeid`
    );
    
    // Assert: Redirected to login with error
    await page.waitForURL(/\/login/);
    await expect(page.locator('text=/invalid.*token/i')).toBeVisible();
  });
  
  test('tampered passwordless token fails authentication', async ({
    page,
    servers,
    emailInbox,
  }) => {
    // Arrange: Request legitimate login link
    await page.goto(`${servers.appUrl}/login`);
    await page.fill('[data-testid="email-login-input"]', 'test@test.com');
    await page.click('[data-testid="email-login-button"]');
    
    const loginEmail = await emailInbox.waitForEmail({
      to: 'test@test.com',
      timeout: 5000,
    });
    
    const loginLink = emailInbox.extractLinkFromEmail(
      loginEmail,
      /https?:\/\/[^\\s]+\/auth\/logged_in\\?[^\\s]+/
    );
    
    // Tamper with token
    const tamperedLink = loginLink.replace(/token=([^&]+)/, 'token=tampered123');
    
    // Act: Use tampered token
    await page.goto(tamperedLink);
    
    // Assert: Authentication fails
    await page.waitForURL(/\/login/);
    await expect(page.locator('text=/invalid|failed/i')).toBeVisible();
  });
});
```

#### 4.4.3 Expired Sessions Tests

**Файл**: `e2e/tests/11-edge-cases/expired-sessions.test.ts`

```typescript
import { test, expect } from '../../fixtures';

test.describe('@P2 @edge-cases Expired Sessions', () => {
  test('expired session redirects to login', async ({
    page,
    servers,
    authSession,
    testDb,
  }) => {
    // Arrange: Create user and session
    const user = await authSession.createAndAuthenticate();
    
    // Manually expire session in DB
    await testDb.getCollection('sessions').updateMany(
      { 'session.passport.user': user._id.toString() },
      { $set: { expires: new Date(Date.now() - 1000) } }
    );
    
    // Act: Try to access protected page
    await page.goto(`${servers.appUrl}/your-settings`);
    
    // Assert: Redirected to login
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });
  
  test('API call with expired session returns 401', async ({
    page,
    servers,
    authSession,
    testDb,
  }) => {
    // Arrange: Authenticated user with expired session
    const user = await authSession.createAndAuthenticate();
    
    await testDb.getCollection('sessions').updateMany(
      { 'session.passport.user': user._id.toString() },
      { $set: { expires: new Date(Date.now() - 1000) } }
    );
    
    // Act: Make API request
    const response = await page.request.post(
      `${servers.apiUrl}/api/v1/team-member/user/update-profile`,
      {
        data: { name: 'New Name' },
      }
    );
    
    // Assert: 401
    expect(response.status()).toBe(401);
  });
  
  test('session refresh extends expiration', async ({
    page,
    servers,
    authSession,
    testDb,
  }) => {
    // Arrange: Create session
    const user = await authSession.createAndAuthenticate();
    
    // Get initial session expiration
    const initialSession = await testDb
      .getCollection('sessions')
      .findOne({ 'session.passport.user': user._id.toString() });
    const initialExpiry = initialSession.expires.getTime();
    
    // Wait a bit
    await page.waitForTimeout(2000);
    
    // Act: Make authenticated request (should refresh session)
    await page.goto(`${servers.appUrl}/your-settings`);
    
    // Assert: Session expiration extended
    const updatedSession = await testDb
      .getCollection('sessions')
      .findOne({ 'session.passport.user': user._id.toString() });
    const updatedExpiry = updatedSession.expires.getTime();
    
    expect(updatedExpiry).toBeGreaterThan(initialExpiry);
  });
});
```

#### 4.4.4 Network Errors Tests

**Файл**: `e2e/tests/11-edge-cases/network-errors.test.ts`

```typescript
import { test, expect } from '../../fixtures';

test.describe('@P2 @edge-cases Network Errors', () => {
  test('API timeout shows error message', async ({
    page,
    servers,
    authSession,
  }) => {
    // Arrange
    await authSession.createAndAuthenticate();
    
    // Simulate slow network
    await page.route('**/api/v1/team-member/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 60000)); // Never resolves
      await route.continue();
    });
    
    // Act: Try to load data
    await page.goto(`${servers.appUrl}/your-settings`);
    
    // Assert: Timeout error shown
    await expect(
      page.locator('text=/timeout|taking too long/i')
    ).toBeVisible({ timeout: 35000 });
  });
  
  test('API 500 error shows user-friendly message', async ({
    page,
    servers,
    authSession,
  }) => {
    // Arrange
    await authSession.createAndAuthenticate();
    
    // Mock API 500 error
    await page.route('**/api/v1/team-member/get-initial-data', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    // Act
    await page.goto(`${servers.appUrl}/discussion`);
    
    // Assert: User-friendly error
    await expect(
      page.locator('text=/something went wrong|try again/i')
    ).toBeVisible();
  });
  
  test('offline mode shows appropriate message', async ({
    page,
    servers,
    authSession,
  }) => {
    // Arrange
    await authSession.createAndAuthenticate();
    await page.goto(`${servers.appUrl}/discussion`);
    
    // Act: Simulate offline
    await page.context().setOffline(true);
    
    // Try to perform action
    await page.click('[data-testid="create-discussion-button"]');
    
    // Assert: Offline message
    await expect(
      page.locator('text=/offline|no connection/i')
    ).toBeVisible();
  });
  
  test('retry mechanism works after temporary failure', async ({
    page,
    servers,
    authSession,
  }) => {
    // Arrange
    await authSession.createAndAuthenticate();
    
    let requestCount = 0;
    await page.route('**/api/v1/team-member/get-initial-data', (route) => {
      requestCount++;
      if (requestCount <= 2) {
        // Fail first 2 requests
        route.fulfill({ status: 500 });
      } else {
        // Succeed on 3rd request
        route.continue();
      }
    });
    
    // Act: Navigate (should auto-retry)
    await page.goto(`${servers.appUrl}/discussion`);
    
    // Assert: Eventually succeeds
    await expect(page.locator('[data-testid="discussion-list"]')).toBeVisible({
      timeout: 15000,
    });
    expect(requestCount).toBeGreaterThanOrEqual(3);
  });
});
```

#### 4.4.5 Validation Errors Tests

**Файл**: `e2e/tests/11-edge-cases/validation-errors.test.ts`

```typescript
import { test, expect } from '../../fixtures';

test.describe('@P2 @edge-cases Validation Errors', () => {
  test('empty team name shows validation error', async ({
    page,
    servers,
    authSession,
  }) => {
    // Arrange
    await authSession.createAndAuthenticate();
    
    // Act: Try to create team with empty name
    await page.goto(`${servers.appUrl}/create-team`);
    await page.fill('[data-testid="team-name-input"]', '');
    await page.click('[data-testid="create-team-button"]');
    
    // Assert: Validation error
    await expect(
      page.locator('[data-testid="team-name-error"]')
    ).toContainText(/required|cannot be empty/i);
  });
  
  test('invalid email format shows error', async ({ page, servers }) => {
    // Act: Enter invalid email on login page
    await page.goto(`${servers.appUrl}/login`);
    await page.fill('[data-testid="email-login-input"]', 'not-an-email');
    await page.click('[data-testid="email-login-button"]');
    
    // Assert: Validation error
    await expect(
      page.locator('[data-testid="email-error"]')
    ).toContainText(/invalid email/i);
  });
  
  test('discussion name too long shows error', async ({
    page,
    servers,
    teamContext,
  }) => {
    // Arrange
    const { team } = teamContext;
    
    // Act: Create discussion with very long name
    await page.goto(`${servers.appUrl}/discussion?teamSlug=${team.slug}`);
    await page.click('[data-testid="create-discussion-button"]');
    
    const longName = 'x'.repeat(300); // 300 characters
    await page.fill('[data-testid="discussion-name-input"]', longName);
    await page.click('[data-testid="submit-discussion-button"]');
    
    // Assert: Validation error
    await expect(
      page.locator('[data-testid="discussion-name-error"]')
    ).toContainText(/too long|maximum.*characters/i);
  });
  
  test('duplicate team slug shows error', async ({
    page,
    servers,
    teamContext,
    authSession,
  }) => {
    // Arrange: Create first team
    const { team } = teamContext;
    
    // Create new user
    const user2 = await authSession.createUser({ email: 'user2@test.com' });
    await authSession.authenticate(user2);
    
    // Act: Try to create team with same name (slug collision)
    await page.goto(`${servers.appUrl}/create-team`);
    await page.fill('[data-testid="team-name-input"]', team.name);
    await page.click('[data-testid="create-team-button"]');
    
    // Assert: Error about duplicate slug
    await expect(
      page.locator('[data-testid="error-message"]')
    ).toContainText(/already exists|taken/i);
  });
  
  test('XSS attempt in post content is sanitized', async ({
    page,
    servers,
    discussionContext,
  }) => {
    // Arrange
    const { discussion } = discussionContext;
    
    // Act: Try to inject XSS script
    const xssPayload = '<script>alert("XSS")</script>';
    await page.goto(
      `${servers.appUrl}/discussion?teamSlug=${discussion.teamId}&discussionSlug=${discussion.slug}`
    );
    await page.fill('[data-testid="post-editor"]', xssPayload);
    await page.click('[data-testid="submit-post-button"]');
    
    // Assert: Script tag is escaped/sanitized
    const postContent = page.locator('[data-testid="post-content"]').first();
    const htmlContent = await postContent.innerHTML();
    
    // Should NOT contain executable script
    expect(htmlContent).not.toContain('<script>');
    // Should be escaped
    expect(htmlContent).toContain('&lt;script&gt;');
  });
  
  test('SQL injection attempt in search is handled', async ({
    page,
    servers,
    teamContext,
  }) => {
    // Arrange
    const { team } = teamContext;
    
    // Act: Try SQL injection (though app uses MongoDB, test validation)
    const sqlInjection = "'; DROP TABLE users; --";
    await page.goto(`${servers.appUrl}/discussion?teamSlug=${team.slug}`);
    await page.fill('[data-testid="search-input"]', sqlInjection);
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // Assert: No error, search handled safely
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    // App should still be functional
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
```

#### 4.4.6 Чек-лист Edge Cases Module

- [ ] **Unauthorized Access** (5 тестов)
  - [ ] Unauthenticated redirect to login
  - [ ] Cannot access other teams
  - [ ] Member cannot access leader-only
  - [ ] API returns 401 for unauthenticated
  - [ ] Session cookie prevents unauthorized
  
- [ ] **Invalid Tokens** (4 теста)
  - [ ] Invalid invitation token error
  - [ ] Expired invitation token
  - [ ] Invalid passwordless token
  - [ ] Tampered token fails
  
- [ ] **Expired Sessions** (3 теста)
  - [ ] Expired session redirects to login
  - [ ] API call with expired session returns 401
  - [ ] Session refresh extends expiration
  
- [ ] **Network Errors** (4 теста)
  - [ ] API timeout shows error
  - [ ] 500 error shows user-friendly message
  - [ ] Offline mode message
  - [ ] Retry mechanism works
  
- [ ] **Validation Errors** (6 тестов)
  - [ ] Empty team name validation
  - [ ] Invalid email format
  - [ ] Discussion name too long
  - [ ] Duplicate team slug
  - [ ] XSS sanitization
  - [ ] SQL injection handling

**Итого Edge Cases**: 22 теста (~4-6 минут выполнения)

---

## 5. Чек-лист выполнения

### Week 7: Notifications & Billing Complete

#### Day 1-2: Email Infrastructure
- [ ] **`emailInbox` Fixture**
  - [ ] Создать `e2e/fixtures/emailFixtures.ts`
  - [ ] Реализовать `MailhogClient` класс
  - [ ] Все методы интерфейса `EmailInbox`
  - [ ] Интегрировать в `fixtures/index.ts`
  - [ ] Unit tests для `MailhogClient` (опционально)
  
- [ ] **Mailhog Setup**
  - [ ] Добавить Mailhog в `docker-compose.test.yml`
  - [ ] Настроить `.env.test` (SMTP, Mailhog API)
  - [ ] Запустить и протестировать Mailhog локально
  - [ ] README с примерами использования

#### Day 3: Notifications Module
- [ ] **Welcome Email Tests** (4 теста)
- [ ] **Invitation Email Tests** (4 теста)
- [ ] **Login Link Email Tests** (4 теста)
- [ ] **Post Notification Email Tests** (4 теста)

#### Day 4-5: Billing Module Complete
- [ ] **Update Payment Method Tests** (3 теста)
- [ ] **Cancel Subscription Tests** (4 теста)
- [ ] **Invoices History Tests** (5 тестов)
- [ ] **Webhook Handling Tests** (3 теста)

### Week 8: Edge Cases & Polish

#### Day 6-7: Edge Cases Module (Part 1)
- [ ] **Unauthorized Access Tests** (5 тестов)
- [ ] **Invalid Tokens Tests** (4 теста)
- [ ] **Expired Sessions Tests** (3 теста)

#### Day 8: Edge Cases Module (Part 2)
- [ ] **Network Errors Tests** (4 теста)
- [ ] **Validation Errors Tests** (6 тестов)

#### Day 9: Documentation
- [ ] **Fixture Documentation**
  - [ ] `emailInbox` fixture README + примеры
  - [ ] Billing fixtures (update documentation)
  - [ ] Error simulation helpers documentation
  
- [ ] **Test Documentation**
  - [ ] Notifications module README
  - [ ] Edge Cases module README
  - [ ] Troubleshooting guide updates

#### Day 10: CI/CD & Final Testing
- [ ] **CI/CD Integration**
  - [ ] Mailhog в Docker Compose для CI
  - [ ] GitHub Actions - добавить P2 job
  - [ ] Проверить все артефакты (screenshots, videos, reports)
  
- [ ] **Cleanup & Review**
  - [ ] Удалить временные файлы/комментарии
  - [ ] Code review всех новых тестов
  - [ ] Flaky tests investigation & fixes
  - [ ] Final test run всех P2 тестов

---

## 6. Acceptance Criteria

### 6.1 Notifications Module ✅

| Критерий | Требование |
|----------|------------|
| **Email Capture** | 100% email'ов перехватываются Mailhog |
| **Test Coverage** | 16 тестов (4 типа email × 4 теста) |
| **Pass Rate** | ≥ 98% (допустимы редкие flaky из-за timing) |
| **Execution Time** | < 4 минуты |
| **Email Verification** | Subject, body, links проверяются |

### 6.2 Billing Module Complete ✅

| Критерий | Требование |
|----------|------------|
| **Stripe Coverage** | Update payment, cancel, invoices, webhooks |
| **Test Coverage** | 15 тестов |
| **Pass Rate** | ≥ 98% |
| **Execution Time** | < 4 минуты |
| **Webhook Handling** | All critical Stripe events tested |

### 6.3 Edge Cases Module ✅

| Критерий | Требование |
|----------|------------|
| **Security Coverage** | Unauthorized, XSS, SQL injection |
| **Error Handling** | Network, validation, expired sessions |
| **Test Coverage** | 22 теста |
| **Pass Rate** | ≥ 95% (некоторые edge cases могут быть flaky) |
| **Execution Time** | < 6 минут |

### 6.4 Overall Фаза 4 ✅

| Метрика | Целевое значение | Комментарий |
|---------|------------------|-------------|
| **Всего тестов** | 53 теста (16+15+22) | Notifications + Billing + Edge Cases |
| **Новые фикстуры** | 1 (`emailInbox`) | + Stripe webhook helpers |
| **CI/CD Ready** | P2 job в GitHub Actions | Docker + Mailhog |
| **Documentation** | Complete | Fixtures, tests, troubleshooting |
| **Flaky Rate** | < 2% | Acceptable для email/webhook tests |
| **Total Time** | ~10-15 минут | Параллельно на 4 workers |

---

## 7. Риски и митигации

### 7.1 Технические риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| **Mailhog flaky в CI** | Средняя | Средняя | Retry logic, увеличить timeout, использовать Docker healthcheck |
| **Email timing issues** | Высокая | Низкая | `waitForEmail()` с generous timeout (5-10s), poll mechanism |
| **Stripe webhooks в test mode** | Низкая | Высокая | Mock webhooks через Nock, документировать test keys setup |
| **XSS/Security tests false positives** | Средняя | Низкая | Точные assertions, использовать known-good payloads |
| **Network error simulation нестабильна** | Средняя | Средняя | Page.route() может быть flaky, использовать MSW как альтернативу |

### 7.2 Организационные риски

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| **Недостаточное время на Edge Cases** | Средняя | Средняя | Приоритизировать P0 edge cases (unauthorized, validation) |
| **Сложность документации** | Низкая | Средняя | Использовать примеры из кода, inline комментарии |
| **Code review bottleneck** | Средняя | Низкая | Разбить на несколько PR: fixtures → notifications → billing → edge cases |

### 7.3 Mitigation Actions

1. **Email Infrastructure**:
   - Запустить Mailhog локально до начала тестов
   - Проверить Mailhog API доступность в `global-setup.ts`
   - Fallback на SMTP mock если Mailhog недоступен

2. **Stripe Integration**:
   - Использовать Stripe test mode везде
   - Mock webhooks через API вместо ожидания реальных
   - Документировать test card numbers

3. **Edge Cases**:
   - Начать с простых (unauthorized, validation)
   - Оставить сложные (network simulation) на конец
   - Пометить flaky tests как `@flaky` tag

4. **CI/CD**:
   - Отдельный Docker Compose для CI (с Mailhog)
   - Increase timeout для email tests в CI
   - Retry failed tests 1 раз автоматически

---

## 8. Следующие шаги после Фазы 4

### 8.1 Фаза 5: Polish & Optimization (Week 9-10)

После завершения Фазы 4 переходим к финальной стадии:

1. **Stabilization**
   - Flaky tests analysis & fixes
   - Timeout tuning
   - Retry strategies

2. **Performance Optimization**
   - Параллелизация (workers optimization)
   - Test data caching
   - CI/CD pipeline speed

3. **Documentation Complete**
   - Comprehensive README для каждого модуля
   - Troubleshooting guide
   - Contributing guide

4. **Reporting & Monitoring**
   - Allure integration (опционально)
   - Test trends dashboard
   - Slack notifications

### 8.2 Метрики успеха всего проекта

К концу Фазы 5 (после 10 недель):

| Метрика | Целевое значение |
|---------|------------------|
| **Всего тестов** | 140-160 |
| **Functional Coverage** | ≥ 90% |
| **API Endpoint Coverage** | ≥ 85% |
| **Page Coverage** | 100% |
| **Flaky Rate** | < 2% |
| **P0+P1 Execution Time** | < 15 минут |
| **Full Suite Time** | < 35-50 минут |

---

## Приложения

### A. Примеры использования `emailInbox` fixture

```typescript
// 1. Простой пример - ждем email
test('example: wait for email', async ({ emailInbox }) => {
  // ... trigger action that sends email ...
  
  const email = await emailInbox.waitForEmail({
    subject: 'Welcome',
    timeout: 5000,
  });
  
  expect(email.subject).toContain('Welcome');
});

// 2. Извлечение ссылки
test('example: extract link', async ({ emailInbox }) => {
  const email = await emailInbox.getLatestEmail();
  const link = emailInbox.extractLinkFromEmail(
    email,
    /https?:\/\/[^\\s]+\/invitation\\?token=[^\\s]+/
  );
  
  expect(link).toBeTruthy();
});

// 3. Проверка содержимого
test('example: verify content', async ({ emailInbox }) => {
  const emails = await emailInbox.findEmailByRecipient('test@test.com');
  expect(emails.length).toBeGreaterThan(0);
  expect(emails[0].body).toContain('Expected text');
});
```

### B. Stripe Webhook Example

```typescript
// billingContext helper для webhook'ов
async triggerStripeWebhook(event: {
  type: string;
  data: any;
}) {
  const response = await fetch(
    `${this.servers.apiUrl}/stripe-webhook`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(event),
    }
  );
  
  return response;
}
```

### C. Error Simulation Example

```typescript
// Network error simulation
await page.route('**/api/**', (route) => {
  route.abort('failed'); // Simulate network failure
});

// Timeout simulation
await page.route('**/api/**', async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 60000));
  await route.continue();
});

// 500 error simulation
await page.route('**/api/**', (route) => {
  route.fulfill({
    status: 500,
    body: JSON.stringify({ error: 'Internal Server Error' }),
  });
});
```

---

## Changelog

| Дата | Версия | Изменения | Автор |
|------|--------|-----------|-------|
| 2025-11-13 | 1.0 | Первоначальный план Фазы 4 | Claude AI |

---

**Конец документа - Фаза 4: Notifications & Billing Complete**
