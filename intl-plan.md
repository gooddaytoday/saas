# План внедрения мультиязычности с Intlayer

## Обзор

Внедрение системы мультиязычности на основе intlayer для SaaS приложения с поддержкой 5 языков: английский (по умолчанию), русский, французский, немецкий, испанский. Язык пользователя сохраняется в MongoDB, переключается через UI селектор в Layout, не влияет на URL структуру.

## Этапы реализации

### 1. Установка зависимостей

**Frontend (app/):**

- Установить `intlayer` и `react-intlayer`
- Обновить `package.json`

**Backend (api/):**

- Установить `express-intlayer`  
- Обновить `package.json`

### 2. Конфигурация Intlayer

**Создать файл конфигурации:**

- `/intlayer.config.ts` в корне проекта
- Определить локали: `en`, `ru`, `fr`, `de`, `es`
- Установить `en` как defaultLocale

**Обновить конфигурации:**

- `app/next.config.js` - добавить плагин intlayer для Next.js
- `app/tsconfig.json` - добавить типы intlayer если требуется

### 3. Backend изменения (API)

**Обновить User модель (`api/server/models/User.ts`):**

- Добавить поле `locale` в mongoSchema (тип String, default: 'en')
- Добавить `locale: string` в UserDocument interface
- Добавить `'locale'` в массив publicFields()
- Создать статический метод `changeLocale({ userId, locale })`
- Добавить тип в UserModel interface

**Создать API endpoint (`api/server/api/team-member.ts`):**

- Новый роут `POST /user/change-locale`
- Вызов `User.changeLocale({ userId: req.user.id, locale })`
- Возврат `{ done: 1 }`

**Обновить методы создания пользователя:**

- `signInOrSignUpViaGoogle` - добавить `locale: 'en'` при создании
- `signInOrSignUpByPasswordless` - добавить `locale: 'en'` при создании

### 4. Frontend API методы (app/)

**Обновить `app/lib/api/team-member.ts`:**

- Создать `changeLocaleApiMethod(data)` аналогично `toggleThemeApiMethod`
- Использовать endpoint `/user/change-locale`

### 5. MobX Store обновления

**Обновить `app/lib/store/user.ts`:**

- Добавить свойство `public locale: string = 'en'`
- Добавить `locale: observable` в makeObservable
- Инициализировать `this.locale = params.locale || 'en'` в constructor
- Создать метод `changeLocale(locale: string)` аналогично `toggleTheme`
- Метод вызывает `changeLocaleApiMethod`, обновляет store, перезагружает страницу

### 6. Интеграция IntlayerProvider

**Обновить `app/pages/_app.tsx`:**

- Импортировать `IntlayerProvider, IntlayerServerProvider` из `react-intlayer`
- Обернуть приложение в `IntlayerServerProvider` (для SSR)
- Обернуть в `IntlayerProvider` с текущей локалью из `store.currentUser?.locale || 'en'`
- Обеспечить правильный порядок провайдеров: CacheProvider > ThemeProvider > IntlayerProviders > MobX Provider

**Обновить `app/pages/_document.tsx`:**

- Установить атрибут `lang` в `<Html>` тег динамически на основе локали пользователя
- Использовать `__NEXT_DATA__.props.initialState.user?.locale || 'en'`

### 7. Создание content declarations для перевода

**Создать `app/components/common/LoginButton.content.ts`:**

- Определить content declaration с переводами:
- `loginWithGoogle` - "Log in with Google" (en, ru, fr, de, es)
- `orSeparator` - "OR" (en, ru, fr, de, es)
- `emailLabel` - "Email address" (en, ru, fr, de, es)
- `loginWithEmail` - "Log in with email" (en, ru, fr, de, es)
- `disabledMessage` - сообщение о деактивации (en, ru, fr, de, es)
- `notificationMessage` - "SaaS boilerplate emailed..." (en, ru, fr, de, es)
- Экспортировать как content declaration

### 8. Обновление LoginButton компонента

**Обновить `app/components/common/LoginButton.tsx`:**

- Импортировать `useIntlayer` из `react-intlayer`
- Использовать хук `const { loginWithGoogle, orSeparator, ... } = useIntlayer('login-button')`
- Заменить все хардкодные строки на переменные из content declaration
- Сохранить всю логику и стилизацию

### 9. Добавление селектора языка в Layout

**Обновить `app/components/layout/index.tsx`:**

- Импортировать `Select, MenuItem` из `@mui/material`
- Добавить селектор языка рядом с LensIcon (toggle theme)
- Создать `Select` компонент со списком языков: EN, RU, FR, DE, ES
- При изменении вызывать `store.currentUser.changeLocale(newLocale)`
- Отображать текущий язык из `store.currentUser.locale`
- Позиционировать в том же блоке что и theme toggle

**Стилизация селектора:**

- Компактный размер (fontSize: '14px')
- Темный/светлый режим совместимость
- Минимальная ширина для удобства

### 10. Типы TypeScript

**Создать или обновить типы:**

- Создать `app/types/intlayer.d.ts` для расширения типов если нужно
- Убедиться что TypeScript распознает `.content.ts` файлы

### 11. Build конфигурация

**Обновить `app/next.config.js`:**

- Добавить withIntlayer wrapper если требуется
- Настроить transpilation для intlayer модулей

## Ключевые файлы для изменения

### Backend

- `api/server/models/User.ts` - модель пользователя
- `api/server/api/team-member.ts` - API роуты
- `api/package.json` - зависимости

### Frontend  

- `app/package.json` - зависимости
- `app/pages/_app.tsx` - IntlayerProvider integration
- `app/pages/_document.tsx` - lang attribute
- `app/lib/store/user.ts` - MobX store
- `app/lib/api/team-member.ts` - API методы
- `app/components/common/LoginButton.tsx` - пример компонента
- `app/components/common/LoginButton.content.ts` - **новый файл** с переводами
- `app/components/layout/index.tsx` - селектор языка
- `app/next.config.js` - конфигурация Next.js

### Root

- `/intlayer.config.ts` - **новый файл** конфигурации intlayer

## Паттерн реализации

Реализация следует паттерну существующей функции `toggleTheme`:

1. User model method (MongoDB)
2. Express API route  
3. Frontend API method
4. MobX store method
5. UI component для изменения

## Примечания

- Переведен только LoginButton в качестве демонстрации
- Остальные компоненты будут переведены в будущем
- Язык хранится в MongoDB, синхронизируется между сессиями
- При изменении языка страница перезагружается (аналогично toggleTheme)
- URL структура не меняется (без /en/, /ru/ префиксов)