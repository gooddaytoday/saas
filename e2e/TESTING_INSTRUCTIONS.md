# Инструкции по Тестированию E2E

## Быстрый Старт

### 1. Убедитесь, что все зависимости установлены:

```bash
# Корневые зависимости (уже установлены)
cd /home/george/git/modelsrepo
yarn install

# API зависимости
cd api && yarn install && cd ..

# APP зависимости  
cd app && yarn install && cd ..

# E2E зависимости (уже установлены)
cd e2e && yarn install && cd ..
```

### 2. Проверьте переменные окружения:

Файл `e2e/.env.test` должен содержать:
- SESSION_SECRET
- COOKIE_DOMAIN
- E2E_API_PORT (по умолчанию 8000)
- E2E_APP_PORT (по умолчанию 3000)

### 3. Запустите тесты:

```bash
cd /home/george/git/modelsrepo
yarn test:e2e
```

## Ожидаемое Поведение

1. **Global Setup** запускается один раз:
   - Создает MongoDB Memory Server
   - Запускает API сервер на порту 8000
   - Запускает APP сервер на порту 3000
   - Ждет готовности обоих серверов

2. **Тесты выполняются**:
   - Smoke тесты проверяют базовую функциональность
   - Auth тесты проверяют аутентификацию

3. **Global Teardown** запускается один раз:
   - Останавливает APP сервер
   - Останавливает API сервер
   - Останавливает MongoDB Memory Server

## Исправленные Проблемы

### ✅ Проблема: ts-node не найден (ENOENT)
**Решение**: Используем прямой путь к ts-node через node:
```typescript
const tsNodeScript = path.join(apiDir, 'node_modules', 'ts-node', 'dist', 'bin.js');
const nodeExecutable = process.execPath;
spawn(nodeExecutable, [tsNodeScript, ...args]);
```

### ✅ Проблема: Неправильная очистка коллекций
**Решение**: Используем `listCollections()` для получения списка коллекций:
```typescript
const collections = await db.listCollections().toArray();
for (const collectionInfo of collections) {
  await db.collection(collectionInfo.name).deleteMany({});
}
```

### ✅ Проблема: Неправильная проверка готовности сервера
**Решение**: Используем retry с правильной обработкой статусов:
- API: любой статус < 500 означает, что сервер работает
- APP: любой статус < 500 означает, что сервер работает

## Отладка

Если тесты не запускаются:

1. **Проверьте логи**:
   ```bash
   yarn test:e2e 2>&1 | tee test-output.log
   ```

2. **Проверьте порты**:
   ```bash
   lsof -i :8000  # API порт
   lsof -i :3000  # APP порт
   ```

3. **Запустите в debug режиме**:
   ```bash
   yarn test:e2e:debug
   ```

4. **Проверьте TypeScript компиляцию**:
   ```bash
   cd e2e && npx tsc --noEmit
   ```

## Успешный Запуск

При успешном запуске вы должны увидеть:

```
╔════════════════════════════════════════════╗
║     GLOBAL SETUP: Initializing Test Environment     ║
╚════════════════════════════════════════════╝

Configuration loaded:
  API Port: 8000
  App Port: 3000
  CI Mode: false

========================================
Starting servers for worker: global
========================================

Step 1: Setting up MongoDB Memory Server...
✓ MongoDB Memory Server ready

Step 2: Starting API server...
Starting API server on port 8000...
[API] connected to db
✓ API server is ready

Step 3: Starting App server...
Starting App server on port 3000...
[APP] > Ready on http://localhost:3000
✓ App server is ready

========================================
✓ All servers started successfully
  API:  http://localhost:8000
  App:  http://localhost:3000
========================================

Running 4 tests using 4 workers
  ✓ [chromium] › smoke.test.ts:4:5 › Smoke Tests › should load login page
  ✓ [chromium] › smoke.test.ts:11:5 › Smoke Tests › should have API server running
  ✓ [chromium] › smoke.test.ts:19:5 › Smoke Tests › should have database connection
  ✓ [chromium] › smoke.test.ts:25:5 › Smoke Tests › should display app navigation

4 passed (30s)
