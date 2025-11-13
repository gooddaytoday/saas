# Фаза 2: Core Features - Детальный план реализации

> **Период**: Week 3-4 (10 рабочих дней)  
> **Цель**: Реализация P1 тестов для основной функциональности (Teams, Discussions, Posts)  
> **Статус**: 🔴 Не начата  
> **Прогресс**: 0%  
> **Зависимости**: ✅ Фаза 1 должна быть завершена (fixtures, factories, P0 tests)

---

## 📋 Содержание

1. [Обзор фазы](#обзор-фазы)
2. [Предварительные требования](#предварительные-требования)
3. [Задачи фазы 2](#задачи-фазы-2)
4. [Детальный план по модулям](#детальный-план-по-модулям)
5. [Чек-лист выполнения](#чек-лист-выполнения)
6. [Acceptance Criteria](#acceptance-criteria)
7. [Риски и митигации](#риски-и-митигации)

---

## 1. Обзор фазы

### 1.1 Цели

Реализовать **P1 (High Priority)** тесты для трех основных модулей приложения:
- **Teams**: Управление командами и участниками
- **Discussions**: CRUD операции с обсуждениями
- **Posts**: Создание, редактирование, удаление постов + Markdown

### 1.2 Ожидаемые результаты

| Метрика | Целевое значение |
|---------|------------------|
| Количество тестов | 50-70 |
| Новые фикстуры | `discussionContext` |
| Время выполнения P1 | 8-12 минут |
| Code coverage (modules) | 85%+ |
| Документация | README для каждого модуля |

### 1.3 Связь с общим планом

- **Предыдущая фаза**: [Фаза 1 - Foundation](./phase-1-foundation.md) (P0 tests, базовые fixtures)
- **Следующая фаза**: Фаза 3 - Real-time & Advanced (WebSockets, Billing)
- **Общий план**: [E2E Test Coverage Plan](../../docs/e2e-test-coverage-plan.md)

---

## 2. Предварительные требования

### 2.1 ✅ Должно быть готово из Фазы 1

| Компонент | Статус | Комментарий |
|-----------|--------|-------------|
| MongoDB Memory Server | ✅ Обязательно | Инфраструктура |
| API/App Server Managers | ✅ Обязательно | Инфраструктура |
| `authSession` fixture | ✅ Обязательно | Для аутентификации в тестах |
| `teamContext` fixture | ✅ Обязательно | Для создания команд |
| Data factories | ✅ Обязательно | `createUserData`, `createTeamData` |
| Базовые helpers | ✅ Обязательно | `waitForResponse`, API helpers |
| P0 Smoke tests | ✅ Желательно | Для smoke регрессии |
| P0 Auth tests | ✅ Желательно | Для auth регрессии |

### 2.2 ❌ Новые требования для Фазы 2

| Компонент | Необходимость | Описание |
|-----------|---------------|----------|
| `discussionContext` fixture | 🔴 Критично | Создание discussions через API |
| Discussion factories | 🔴 Критично | `createDiscussionData`, `createPostData` |
| Расширенные API helpers | 🟡 Желательно | CRUD для discussions/posts |
| S3 upload mocks | 🟢 Опционально | Для file attachments (может быть в Фазе 3) |
| Markdown helpers | 🟢 Опционально | Проверка MD → HTML конвертации |

---

## 3. Задачи фазы 2

### 3.1 Общая таблица задач

| # | Задача | Приоритет | Оценка | Зависимости | Ответственный |
|---|--------|-----------|--------|-------------|---------------|
| **2.1** | Реализация `discussionContext` fixture | P0 | 1 день | `teamContext`, factories | Dev |
| **2.2** | Teams Module - 5 тестов | P1 | 2 дня | `teamContext` | QA |
| **2.3** | Discussions Module - 5 тестов | P1 | 2 дня | `discussionContext` | QA |
| **2.4** | Posts Module - 5 тестов (без S3) | P1 | 2 дня | `discussionContext` | QA |
| **2.5** | Markdown Preview тест | P2 | 0.5 дня | Posts Module | QA |
| **2.6** | Документация модулей | P2 | 1 день | Все тесты | Tech Writer |
| **2.7** | Code review + рефакторинг | P1 | 1 день | Все выше | Team |
| **2.8** | CI/CD integration для P1 | P1 | 0.5 дня | Все тесты | DevOps |

**Итого**: ~10 дней (2 недели)

### 3.2 Детализация по модулям

#### 🏢 Teams Module (15 тестов, 2 дня)
- `04-teams/create-team.test.ts` - 3-4 теста
- `04-teams/team-settings.test.ts` - 3-4 теста
- `04-teams/invitations.test.ts` - 3-4 теста
- `04-teams/accept-invitation.test.ts` - 3-4 теста
- `04-teams/remove-member.test.ts` - 3-4 теста

#### 💬 Discussions Module (18 тестов, 2 дня)
- `05-discussions/create-discussion.test.ts` - 4-5 тестов
- `05-discussions/edit-discussion.test.ts` - 3-4 теста
- `05-discussions/delete-discussion.test.ts` - 3-4 теста
- `05-discussions/members-management.test.ts` - 4-5 тестов
- `05-discussions/notifications.test.ts` - 4-5 тестов

#### 📝 Posts Module (17 тестов, 2.5 дня)
- `06-posts/create-post.test.ts` - 3-4 теста
- `06-posts/edit-post.test.ts` - 3-4 теста
- `06-posts/delete-post.test.ts` - 3-4 теста
- `06-posts/markdown-preview.test.ts` - 4-5 тестов
- `06-posts/file-attachments.test.ts` - 4-5 тестов (может быть перенесено в Фазу 3)

**Итого модулей**: 50 тестов

---

## 4. Детальный план по модулям

### 4.1 Задача 2.1: `discussionContext` Fixture (1 день)

#### Описание
Создать Playwright fixture для автоматического создания discussion с участниками через API.

#### Требования
```typescript
// e2e/fixtures/discussionFixtures.ts

interface DiscussionContextOptions {
  teamId?: string;
  name?: string;
  memberIds?: string[];
  notificationType?: 'default' | 'all' | 'mute';
  postsCount?: number; // Создать N начальных постов
}

interface DiscussionContext {
  discussion: {
    _id: string;
    teamId: string;
    slug: string;
    name: string;
    memberIds: string[];
  };
  team: TeamContext['team'];
  owner: TeamContext['owner'];
  posts?: Post[]; // Опционально
}
```

#### Implementation Plan
1. **Создать файл** `e2e/fixtures/discussionFixtures.ts`
2. **Зависимости**: `teamContext`, `authSession`
3. **API calls**:
   - `POST /api/v1/team-member/discussions/add`
   - `POST /api/v1/team-member/posts/add` (если `postsCount > 0`)
4. **Cleanup**: Автоматическое удаление через `testDb.clear()`

#### Acceptance Criteria
- ✅ Fixture создает discussion через API
- ✅ Поддерживает создание начальных постов
- ✅ Возвращает полный контекст (team, discussion, posts)
- ✅ Работает с `authSession` автоматически
- ✅ Документация с примерами использования

#### Пример использования
```typescript
test('user can reply to post', async ({ page, discussionContext }) => {
  const { discussion, posts } = discussionContext;
  
  await page.goto(`/discussion?discussionSlug=${discussion.slug}`);
  await expect(page.locator('h1')).toContainText(discussion.name);
});
```

---

### 4.2 Teams Module (2 дня, 15 тестов)

#### 4.2.1 `04-teams/create-team.test.ts` (3-4 теста)

**Тесты**:
1. **T2.2.1**: User can create team with valid name
   - **Given**: Authenticated user without teams
   - **When**: Fill form, submit
   - **Then**: Team created, redirect to `/team-settings`, team appears in dropdown

2. **T2.2.2**: Team slug is auto-generated from name
   - **Given**: User creates team "My Awesome Team"
   - **When**: Submit form
   - **Then**: Slug = `my-awesome-team`, accessible via `/discussion?teamSlug=my-awesome-team`

3. **T2.2.3**: Cannot create team with duplicate slug
   - **Given**: Team "Team A" exists
   - **When**: Create team "Team A" again
   - **Then**: Error message "Team with this name already exists"

4. **T2.2.4**: Can upload team avatar during creation (опционально)
   - **Given**: User selects image file
   - **When**: Submit form
   - **Then**: Avatar uploaded to S3, displayed in UI

**API Endpoints**:
- `POST /api/v1/team-leader/teams/add`

**Fixtures**: `authSession`

**Estimated**: 0.5 дня

---

#### 4.2.2 `04-teams/team-settings.test.ts` (3-4 теста)

**Тесты**:
1. **T2.2.5**: Team leader can update team name
   - **Given**: Team leader on `/team-settings`
   - **When**: Update name, save
   - **Then**: Name updated, visible in UI

2. **T2.2.6**: Team leader can update team avatar
   - **Given**: Team exists
   - **When**: Upload new avatar
   - **Then**: Avatar updated, displayed everywhere

3. **T2.2.7**: Regular member cannot access team settings
   - **Given**: Non-leader user
   - **When**: Navigate to `/team-settings`
   - **Then**: 403 Forbidden or redirected

4. **T2.2.8**: Team settings page loads all data correctly
   - **Given**: Team with 5 members
   - **When**: Load `/team-settings`
   - **Then**: All members listed, leader badge visible

**API Endpoints**:
- `POST /api/v1/team-leader/teams/update`
- `GET /api/v1/team-member/get-initial-data`

**Fixtures**: `teamContext` (with leader and members)

**Estimated**: 0.5 дня

---

#### 4.2.3 `04-teams/invitations.test.ts` (3-4 теста)

**Тесты**:
1. **T2.2.9**: Team leader can invite member by email
   - **Given**: Team leader on `/team-settings`
   - **When**: Enter email, click "Invite"
   - **Then**: Invitation created, email sent (mock check)

2. **T2.2.10**: Invitation token is generated and valid
   - **Given**: Invitation sent
   - **When**: Extract token from API response
   - **Then**: Token exists, can be used on `/invitation?token=...`

3. **T2.2.11**: Cannot invite existing team member
   - **Given**: User "alice@test.com" already in team
   - **When**: Invite "alice@test.com" again
   - **Then**: Error "User already in team"

4. **T2.2.12**: Invitation list displays pending invitations
   - **Given**: 3 pending invitations
   - **When**: Load `/team-settings`
   - **Then**: 3 invitations listed with status

**API Endpoints**:
- `POST /api/v1/team-leader/teams/invite-member`
- `GET /api/v1/team-leader/teams/get-invitations-for-team`

**Fixtures**: `teamContext` (leader)

**Estimated**: 0.5 дня

---

#### 4.2.4 `04-teams/accept-invitation.test.ts` (3-4 теста)

**Тесты**:
1. **T2.2.13**: New user can accept invitation and join team
   - **Given**: Valid invitation token
   - **When**: Navigate to `/invitation?token=...`, login/signup
   - **Then**: User added to team, redirected to `/your-settings`

2. **T2.2.14**: Existing user can accept invitation
   - **Given**: Logged-in user, valid token
   - **When**: Visit `/invitation?token=...`
   - **Then**: User added to team immediately

3. **T2.2.15**: Cannot accept expired invitation
   - **Given**: Invitation token from 30 days ago
   - **When**: Try to accept
   - **Then**: Error "Invitation expired or invalid"

4. **T2.2.16**: Cannot accept invitation twice
   - **Given**: User already accepted invitation
   - **When**: Try token again
   - **Then**: Error "Invitation already used"

**API Endpoints**:
- `GET /api/v1/public/invitations/get-team-by-token`
- Internal: `Invitation.addUserToTeam()`

**Fixtures**: `authSession`, manual token creation

**Estimated**: 0.5 дня

---

#### 4.2.5 `04-teams/remove-member.test.ts` (3 теста)

**Тесты**:
1. **T2.2.17**: Team leader can remove member
   - **Given**: Team with 3 members
   - **When**: Leader clicks "Remove" on member
   - **Then**: Member removed, no longer in list

2. **T2.2.18**: Cannot remove team leader
   - **Given**: Team with leader
   - **When**: Try to remove leader
   - **Then**: Error or button disabled

3. **T2.2.19**: Regular member cannot remove others
   - **Given**: Non-leader user
   - **When**: Try to remove member
   - **Then**: 403 Forbidden

**API Endpoints**:
- `POST /api/v1/team-leader/teams/remove-member`

**Fixtures**: `teamContext` (with multiple members)

**Estimated**: 0.5 дня

---

### 4.3 Discussions Module (2 дня, 18 тестов)

#### 4.3.1 `05-discussions/create-discussion.test.ts` (4-5 тестов)

**Тесты**:
1. **T2.3.1**: User can create discussion with name and members
   - **Given**: User on `/discussion?teamSlug=...`
   - **When**: Click "New Discussion", fill form, select members, submit
   - **Then**: Discussion created, appears in list, user redirected

2. **T2.3.2**: Discussion slug is auto-generated
   - **Given**: Create discussion "Project Alpha"
   - **When**: Submit
   - **Then**: Slug = `project-alpha`

3. **T2.3.3**: Can create discussion without additional members
   - **Given**: User creates discussion alone
   - **When**: Submit without selecting members
   - **Then**: Discussion created, only creator is member

4. **T2.3.4**: Discussion inherits team context
   - **Given**: Team "Team A"
   - **When**: Create discussion
   - **Then**: Discussion.teamId = Team A's ID

5. **T2.3.5**: Cannot create discussion with duplicate slug in same team
   - **Given**: Discussion "Weekly Sync" exists
   - **When**: Create "Weekly Sync" again
   - **Then**: Error or slug auto-incremented (e.g., `weekly-sync-2`)

**API Endpoints**:
- `POST /api/v1/team-member/discussions/add`

**Fixtures**: `teamContext` (with members)

**Estimated**: 0.5 дня

---

#### 4.3.2 `05-discussions/edit-discussion.test.ts` (3-4 теста)

**Тесты**:
1. **T2.3.6**: Discussion creator can edit name
   - **Given**: User created discussion
   - **When**: Edit name, save
   - **Then**: Name updated, slug remains same (or updated if policy allows)

2. **T2.3.7**: Can edit notification settings
   - **Given**: Discussion exists
   - **When**: Change notificationType to "mute"
   - **Then**: Settings saved, applied to user

3. **T2.3.8**: Non-creator cannot edit discussion (if policy)
   - **Given**: Regular member (not creator)
   - **When**: Try to edit
   - **Then**: 403 Forbidden or button disabled

4. **T2.3.9**: Editing discussion doesn't affect posts
   - **Given**: Discussion with 5 posts
   - **When**: Edit discussion name
   - **Then**: Posts remain unchanged

**API Endpoints**:
- `POST /api/v1/team-member/discussions/edit`

**Fixtures**: `discussionContext`

**Estimated**: 0.5 дня

---

#### 4.3.3 `05-discussions/delete-discussion.test.ts` (3-4 теста)

**Тесты**:
1. **T2.3.10**: Discussion creator can delete discussion
   - **Given**: Discussion exists
   - **When**: Click delete, confirm
   - **Then**: Discussion deleted, posts cascade deleted

2. **T2.3.11**: Delete confirmation dialog appears
   - **Given**: User clicks delete
   - **When**: Confirmation shown
   - **Then**: Can cancel or proceed

3. **T2.3.12**: Deleted discussion no longer accessible
   - **Given**: Discussion deleted
   - **When**: Try to access via URL
   - **Then**: 404 Not Found

4. **T2.3.13**: Cannot delete discussion with active members (optional policy)
   - **Given**: Discussion with 3 members
   - **When**: Try to delete
   - **Then**: Warning or prevented

**API Endpoints**:
- `POST /api/v1/team-member/discussions/delete`

**Fixtures**: `discussionContext`

**Estimated**: 0.5 дня

---

#### 4.3.4 `05-discussions/members-management.test.ts` (4-5 тестов)

**Тесты**:
1. **T2.3.14**: Can add member to discussion
   - **Given**: Discussion with 2 members
   - **When**: Add 3rd member
   - **Then**: Member added, sees discussion in list

2. **T2.3.15**: Can remove member from discussion
   - **Given**: Discussion with 3 members
   - **When**: Remove member
   - **Then**: Member removed, no longer sees discussion

3. **T2.3.16**: Cannot remove last member (discussion creator)
   - **Given**: Discussion with only creator
   - **When**: Try to remove creator
   - **Then**: Error or prevented

4. **T2.3.17**: Only team members can be added to discussion
   - **Given**: Team A, Discussion
   - **When**: Try to add user from Team B
   - **Then**: Error "User not in team"

5. **T2.3.18**: Member list updates in real-time (UI check)
   - **Given**: Discussion page open
   - **When**: Add member via API
   - **Then**: Member appears in list (may require refresh or WebSocket)

**API Endpoints**:
- `POST /api/v1/team-member/discussions/add-or-edit-members`

**Fixtures**: `discussionContext`, `teamContext`

**Estimated**: 0.5 дня

---

#### 4.3.5 `05-discussions/notifications.test.ts` (4-5 тестов)

**Тесты**:
1. **T2.3.19**: User can set notification preference to "default"
   - **Given**: Discussion exists
   - **When**: Set notificationType = "default"
   - **Then**: Setting saved, applied

2. **T2.3.20**: User can set notification preference to "all"
   - **Given**: Discussion exists
   - **When**: Set notificationType = "all"
   - **Then**: User receives all notifications

3. **T2.3.21**: User can set notification preference to "mute"
   - **Given**: Discussion exists
   - **When**: Set notificationType = "mute"
   - **Then**: User receives no notifications

4. **T2.3.22**: Notification settings persist after refresh
   - **Given**: Settings changed to "mute"
   - **When**: Refresh page
   - **Then**: Settings still "mute"

5. **T2.3.23**: Each member has independent notification settings
   - **Given**: User A sets "mute", User B sets "all"
   - **When**: Check settings
   - **Then**: Each user has their own setting

**API Endpoints**:
- `POST /api/v1/team-member/discussions/edit` (notificationType field)

**Fixtures**: `discussionContext` (with multiple members)

**Estimated**: 0.5 дня

---

### 4.4 Posts Module (2.5 дня, 17 тестов)

#### 4.4.1 `06-posts/create-post.test.ts` (3-4 теста)

**Тесты**:
1. **T2.4.1**: User can create post with markdown content
   - **Given**: User on discussion page
   - **When**: Enter markdown, submit
   - **Then**: Post created, visible in list

2. **T2.4.2**: Markdown is rendered as HTML
   - **Given**: Post with `# Heading\n\n**bold**`
   - **When**: View post
   - **Then**: Rendered as `<h1>Heading</h1><p><strong>bold</strong></p>`

3. **T2.4.3**: Post appears at top of list (newest first)
   - **Given**: Discussion with 5 posts
   - **When**: Create new post
   - **Then**: New post at index 0

4. **T2.4.4**: Empty post cannot be submitted
   - **Given**: User on post form
   - **When**: Submit without content
   - **Then**: Validation error

**API Endpoints**:
- `POST /api/v1/team-member/posts/add`

**Fixtures**: `discussionContext`

**Estimated**: 0.5 дня

---

#### 4.4.2 `06-posts/edit-post.test.ts` (3-4 теста)

**Тесты**:
1. **T2.4.5**: Post author can edit post
   - **Given**: User created post
   - **When**: Click edit, change content, save
   - **Then**: Post updated, "edited" label shown

2. **T2.4.6**: Non-author cannot edit post
   - **Given**: Post by User A
   - **When**: User B tries to edit
   - **Then**: Button disabled or 403

3. **T2.4.7**: Edit preserves post ID and timestamp
   - **Given**: Post created at T1
   - **When**: Edit at T2
   - **Then**: createdAt = T1, updatedAt = T2

4. **T2.4.8**: Can edit markdown formatting
   - **Given**: Post with plain text
   - **When**: Add markdown formatting
   - **Then**: Rendered correctly

**API Endpoints**:
- `POST /api/v1/team-member/posts/edit`

**Fixtures**: `discussionContext` (with posts)

**Estimated**: 0.5 дня

---

#### 4.4.3 `06-posts/delete-post.test.ts` (3-4 теста)

**Тесты**:
1. **T2.4.9**: Post author can delete post
   - **Given**: User's post exists
   - **When**: Click delete, confirm
   - **Then**: Post removed from list

2. **T2.4.10**: Non-author cannot delete post
   - **Given**: Post by User A
   - **When**: User B tries to delete
   - **Then**: 403 or button hidden

3. **T2.4.11**: Delete confirmation required
   - **Given**: User clicks delete
   - **When**: Dialog appears
   - **Then**: Can cancel or confirm

4. **T2.4.12**: Deleted post is not recoverable
   - **Given**: Post deleted
   - **When**: Refresh page
   - **Then**: Post not in list

**API Endpoints**:
- `POST /api/v1/team-member/posts/delete`

**Fixtures**: `discussionContext` (with posts)

**Estimated**: 0.5 дня

---

#### 4.4.4 `06-posts/markdown-preview.test.ts` (4-5 тестов)

**Тесты**:
1. **T2.4.13**: Headings are rendered correctly
   - **Given**: Post with `# H1\n## H2\n### H3`
   - **When**: View post
   - **Then**: `<h1>`, `<h2>`, `<h3>` tags present

2. **T2.4.14**: Bold and italic are rendered
   - **Given**: `**bold** and *italic*`
   - **When**: View
   - **Then**: `<strong>bold</strong>` and `<em>italic</em>`

3. **T2.4.15**: Links are clickable
   - **Given**: `[Google](https://google.com)`
   - **When**: View
   - **Then**: `<a href="https://google.com">Google</a>`

4. **T2.4.16**: Code blocks are syntax highlighted
   - **Given**: \`\`\`javascript\nconst x = 1;\n\`\`\`
   - **When**: View
   - **Then**: Syntax highlighting applied

5. **T2.4.17**: Lists are rendered correctly
   - **Given**: `- Item 1\n- Item 2`
   - **When**: View
   - **Then**: `<ul><li>Item 1</li><li>Item 2</li></ul>`

**Implementation Note**: May use `marked` or similar library for MD → HTML

**Fixtures**: `discussionContext`

**Estimated**: 0.5 дня

---

#### 4.4.5 `06-posts/file-attachments.test.ts` (4-5 тестов) **[OPTIONAL - может быть Фаза 3]**

**Тесты**:
1. **T2.4.18**: User can upload file to post
   - **Given**: User creating post
   - **When**: Attach file, submit
   - **Then**: File uploaded to S3, link in post

2. **T2.4.19**: File appears as downloadable link
   - **Given**: Post with file
   - **When**: View post
   - **Then**: Download link visible, clickable

3. **T2.4.20**: Can upload multiple files
   - **Given**: User attaches 3 files
   - **When**: Submit
   - **Then**: All 3 files uploaded

4. **T2.4.21**: File size validation
   - **Given**: User tries to upload 100MB file
   - **When**: Submit
   - **Then**: Error "File too large"

5. **T2.4.22**: File type validation
   - **Given**: User tries to upload .exe
   - **When**: Submit
   - **Then**: Error "File type not allowed"

**API Endpoints**:
- `POST /api/v1/team-member/aws/get-signed-request-for-upload-to-s3`

**Fixtures**: `discussionContext`, `fileUploadContext` (new, may defer to Phase 3)

**Estimated**: 1 день (если реализуется в Фазе 2)

**Recommendation**: 🟡 Defer to Phase 3 если нет времени

---

## 5. Чек-лист выполнения

### Week 3 (Дни 1-5)

#### День 1 (Monday) - Setup
- [ ] ✅ Проверить готовность Фазы 1 (все P0 тесты проходят)
- [ ] 📦 Создать ветку `phase-2-core-features`
- [ ] 🔧 Реализовать `discussionContext` fixture (задача 2.1)
- [ ] 📝 Создать factories: `createDiscussionData`, `createPostData`
- [ ] ✅ Unit tests для новых fixtures/factories

**Deliverables**: `discussionContext` готов, протестирован

---

#### День 2 (Tuesday) - Teams Module (часть 1)
- [ ] 📝 `04-teams/create-team.test.ts` (4 теста)
- [ ] 📝 `04-teams/team-settings.test.ts` (4 теста)
- [ ] ✅ Тесты проходят локально
- [ ] 📄 Создать README для Teams module

**Deliverables**: 8 тестов Teams

---

#### День 3 (Wednesday) - Teams Module (часть 2)
- [ ] 📝 `04-teams/invitations.test.ts` (4 теста)
- [ ] 📝 `04-teams/accept-invitation.test.ts` (4 теста)
- [ ] 📝 `04-teams/remove-member.test.ts` (3 теста)
- [ ] ✅ Все Teams тесты проходят (15 total)
- [ ] 🔍 Code review Teams module

**Deliverables**: 15 тестов Teams, code review

---

#### День 4 (Thursday) - Discussions Module (часть 1)
- [ ] 📝 `05-discussions/create-discussion.test.ts` (5 тестов)
- [ ] 📝 `05-discussions/edit-discussion.test.ts` (4 теста)
- [ ] 📝 `05-discussions/delete-discussion.test.ts` (4 тестов)
- [ ] ✅ Тесты проходят локально

**Deliverables**: 13 тестов Discussions

---

#### День 5 (Friday) - Discussions Module (часть 2)
- [ ] 📝 `05-discussions/members-management.test.ts` (5 тестов)
- [ ] 📝 `05-discussions/notifications.test.ts` (5 тестов)
- [ ] ✅ Все Discussions тесты проходят (18 total)
- [ ] 📄 Создать README для Discussions module
- [ ] 🔍 Code review Discussions module

**Deliverables**: 18 тестов Discussions, code review

---

### Week 4 (Дни 6-10)

#### День 6 (Monday) - Posts Module (часть 1)
- [ ] 📝 `06-posts/create-post.test.ts` (4 теста)
- [ ] 📝 `06-posts/edit-post.test.ts` (4 теста)
- [ ] 📝 `06-posts/delete-post.test.ts` (4 теста)
- [ ] ✅ Тесты проходят локально

**Deliverables**: 12 тестов Posts

---

#### День 7 (Tuesday) - Posts Module (часть 2)
- [ ] 📝 `06-posts/markdown-preview.test.ts` (5 тестов)
- [ ] 📝 Начать `06-posts/file-attachments.test.ts` (или defer)
- [ ] ✅ Тесты проходят
- [ ] 📄 Создать README для Posts module

**Deliverables**: 17+ тестов Posts (или 12-13 если file-attachments в Фазе 3)

---

#### День 8 (Wednesday) - Integration & Refactoring
- [ ] 🔄 Рефакторинг общего кода (DRY)
- [ ] 🔧 Оптимизация fixtures (performance)
- [ ] ✅ Прогон всех тестов P1 (Teams + Discussions + Posts)
- [ ] 📊 Измерение времени выполнения (target: < 12 минут)
- [ ] 🐛 Исправление flaky tests

**Deliverables**: Стабильные тесты, время выполнения оптимизировано

---

#### День 9 (Thursday) - CI/CD & Documentation
- [ ] 🔧 Настроить GitHub Actions для P1 тестов
- [ ] 📝 Обновить `.github/workflows/e2e-tests.yml`
- [ ] 📄 Документация всех модулей (READMEs)
- [ ] 📊 Создать coverage report
- [ ] ✅ P1 тесты проходят в CI

**Deliverables**: CI/CD для P1, полная документация

---

#### День 10 (Friday) - Final Review & Release
- [ ] 🔍 Финальный code review всей Фазы 2
- [ ] ✅ Все acceptance criteria выполнены
- [ ] 📊 Финальный отчет по метрикам
- [ ] 🎉 Merge `phase-2-core-features` → `main`
- [ ] 📢 Team demo / презентация результатов

**Deliverables**: Фаза 2 завершена, merged to main

---

## 6. Acceptance Criteria

### 6.1 Количественные метрики

| Метрика | Целевое значение | Как измерить |
|---------|------------------|--------------|
| **Количество тестов** | 50-70 | `grep -r "test(" e2e/tests/04-teams/ e2e/tests/05-discussions/ e2e/tests/06-posts/ \| wc -l` |
| **Время выполнения P1** | < 12 минут | `yarn test:e2e --grep @P1` |
| **Flaky test rate** | < 2% | Запустить 10 раз, считать failures |
| **Code coverage (modules)** | 85%+ | `yarn test:e2e --coverage` (если настроен) |
| **API endpoint coverage** | 100% P1 endpoints | Чек-лист endpoints |

### 6.2 Качественные критерии

#### Must Have (обязательно)
- ✅ Все тесты проходят локально и в CI
- ✅ `discussionContext` fixture реализован и документирован
- ✅ Teams module: 15 тестов, покрывают CRUD + invitations
- ✅ Discussions module: 18 тестов, покрывают CRUD + members + notifications
- ✅ Posts module: 12-13 тестов (без file attachments), покрывают CRUD + markdown
- ✅ CI/CD настроен для P1 тестов
- ✅ Документация (README для каждого модуля)

#### Should Have (желательно)
- ✅ Posts file attachments: 5 тестов (или defer to Phase 3)
- ✅ Оптимизация времени выполнения (parallelization)
- ✅ Markdown helpers для проверки HTML output
- ✅ Расширенные API helpers (CRUD shortcuts)

#### Nice to Have (опционально)
- 🟢 Visual regression tests для UI компонентов
- 🟢 Accessibility tests (axe-core) для новых страниц
- 🟢 Performance tests (load times)

### 6.3 Definition of Done (DoD)

**Тест считается готовым, если**:
1. ✅ Проходит локально 10/10 раз
2. ✅ Проходит в CI 10/10 раз
3. ✅ Имеет четкое название (test name)
4. ✅ Следует AAA pattern (Arrange, Act, Assert)
5. ✅ Использует fixtures вместо дублирования setup
6. ✅ Имеет комментарии для сложной логики
7. ✅ Code review одобрен минимум 1 человеком

**Модуль считается готовым, если**:
1. ✅ Все тесты модуля готовы (по DoD выше)
2. ✅ README.md для модуля создан
3. ✅ Coverage по модулю >= 85%
4. ✅ Время выполнения модуля < 4 минут
5. ✅ Нет flaky tests (< 2% failure rate)

---

## 7. Риски и митигации

### 7.1 Таблица рисков

| Риск | Вероятность | Влияние | Митигация | Ответственный |
|------|-------------|---------|-----------|---------------|
| **Фаза 1 не завершена вовремя** | Высокая | Критическая | Buffer 2-3 дня перед началом Фазы 2 | PM |
| **`discussionContext` сложнее ожидаемого** | Средняя | Высокая | Упростить (без posts), добавить posts позже | Dev |
| **File attachments требуют S3 mocks** | Высокая | Средняя | Defer to Phase 3, focus на markdown | Dev |
| **Flaky tests из-за timing** | Средняя | Средняя | Explicit waits, retry logic, stable selectors | QA |
| **Время выполнения > 12 минут** | Средняя | Средняя | Оптимизация fixtures, parallelization | DevOps |
| **Breaking changes в API** | Низкая | Высокая | Freeze API contract, coordinate с backend | PM |
| **Недостаток test data factories** | Средняя | Средняя | Реализовать в Day 1, приоритет | Dev |

### 7.2 Блокеры

**Критические зависимости**:
- ❌ Фаза 1 не завершена → **БЛОКЕР**, нельзя начинать
- ❌ `teamContext` не работает → **БЛОКЕР** для Teams/Discussions
- ❌ API endpoints не готовы → **БЛОКЕР** для соответствующих тестов

**Решения**:
1. Daily standup для отслеживания прогресса Фазы 1
2. Ранний smoke test `discussionContext` (Day 1)
3. Backend coordination meeting (перед Week 3)

---

## 8. Ресурсы и инструменты

### 8.1 Команда

| Роль | Человек | Ответственность |
|------|---------|-----------------|
| **QA Engineer** | TBD | Написание тестов, code review |
| **Backend Dev** | TBD | Support API endpoints, fix bugs |
| **DevOps** | TBD | CI/CD integration, performance |
| **Tech Writer** | TBD | Документация (READMEs) |
| **PM** | TBD | Coordination, timeline tracking |

### 8.2 Инструменты

- **Playwright** 1.41+ - тестовый фреймворк
- **TypeScript** 5.3+ - язык
- **MongoDB Memory Server** - in-memory DB
- **GitHub Actions** - CI/CD
- **VS Code** + Playwright extension - IDE
- **Jira / GitHub Issues** - task tracking

### 8.3 Документация

- [Playwright Docs](https://playwright.dev/)
- [API Documentation](../../api/README.md)
- [App Documentation](../../app/README.md)
- [Фаза 1 Plan](./phase-1-foundation.md)
- [Основной план](../../docs/e2e-test-coverage-plan.md)

---

## 9. Приложения

### 9.1 API Endpoints Reference

#### Teams
- `POST /api/v1/team-leader/teams/add` - Создание команды
- `POST /api/v1/team-leader/teams/update` - Обновление команды
- `POST /api/v1/team-leader/teams/invite-member` - Приглашение участника
- `POST /api/v1/team-leader/teams/remove-member` - Удаление участника
- `GET /api/v1/team-leader/teams/get-invitations-for-team` - Список приглашений

#### Discussions
- `POST /api/v1/team-member/discussions/add` - Создание обсуждения
- `POST /api/v1/team-member/discussions/edit` - Редактирование обсуждения
- `POST /api/v1/team-member/discussions/delete` - Удаление обсуждения
- `POST /api/v1/team-member/discussions/add-or-edit-members` - Управление участниками

#### Posts
- `POST /api/v1/team-member/posts/add` - Создание поста
- `POST /api/v1/team-member/posts/edit` - Редактирование поста
- `POST /api/v1/team-member/posts/delete` - Удаление поста

#### Files (опционально)
- `POST /api/v1/team-member/aws/get-signed-request-for-upload-to-s3` - S3 upload

### 9.2 Test Data Examples

```typescript
// Team Data
const teamData = {
  name: 'Engineering Team',
  avatarUrl: 'https://example.com/avatar.jpg',
  slug: 'engineering-team',
};

// Discussion Data
const discussionData = {
  name: 'Sprint Planning',
  teamId: '507f1f77bcf86cd799439011',
  memberIds: ['user1', 'user2'],
  notificationType: 'default',
};

// Post Data
const postData = {
  content: '# Sprint Goals\n\n- Feature A\n- Feature B',
  discussionId: '507f1f77bcf86cd799439012',
};
```

### 9.3 Changelog

| Дата | Версия | Изменения | Автор |
|------|--------|-----------|-------|
| 2025-11-13 | 1.0 | Первоначальный план Фазы 2 | Claude AI |

---

**Конец документа**

**Следующие шаги**: После утверждения плана, создать GitHub Issues для каждой задачи (2.1 - 2.8)
