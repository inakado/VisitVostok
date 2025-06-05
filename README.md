# VisitVostok 🌏

Современное туристическое приложение для изучения Дальнего Востока России с интерактивной картой, офлайн-поддержкой и телеграм-авторизацией.

**CI/CD Status:** ✅ Active

[![Next.js](https://img.shields.io/badge/Next.js-15.3.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.8.2-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![MapLibre](https://img.shields.io/badge/MapLibre-5.5.0-orange?style=flat-square)](https://maplibre.org/)

## 🚀 Особенности

### 🎯 Ключевой функционал
- **📍 Интерактивная карта** с POI данными (MapLibre GL JS + PMTiles)
- **🔍 Умный поиск** мест и активностей с фильтрацией
- **📱 Прогрессивное веб-приложение** с офлайн-поддержкой
- **⚡ Telegram авторизация** с криптографической верификацией
- **🎨 Современный UI** с Tailwind CSS 4 и Radix UI
- **🏠 Рекомендательная система** с персонализацией

### 🛠 Технические преимущества
- **🔄 Real-time кэширование** с автоматической инвалидацией
- **⚡ Server-side рендеринг** с Next.js 15 App Router
- **🌐 Офлайн-первая архитектура** с background sync
- **📊 Продвинутая система логирования** и error handling
- **🔐 Enterprise-grade безопасность** с middleware защитой
- **🎯 Type-safe API** с полным TypeScript покрытием

## 🛠 Технологический стек

### Frontend
- **Framework:** Next.js 15 (App Router) + React 19
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 4 + Radix UI компоненты
- **State Management:** Zustand + Custom React hooks
- **Maps:** MapLibre GL JS с PMTiles оптимизацией
- **Icons:** Lucide React + React Icons

### Backend & Database
- **Runtime:** Node.js с modern ES modules
- **Database:** PostgreSQL + Prisma ORM 6.8.2
- **API:** RESTful API с Next.js Route Handlers
- **Auth:** Telegram Web Apps + JWT tokens
- **Caching:** Redis-like in-memory + LocalStorage

### DevOps & Tools
- **Package Manager:** npm с lock файлом
- **Linting:** ESLint 9 + TypeScript strict mode
- **Build:** Next.js compiler + Turbopack
- **Deploy:** PM2 + Nginx на VPS
- **Database Tools:** Prisma Studio + миграции

## 📁 Архитектура проекта

```
src/
├── app/                     # Next.js 15 App Router
│   ├── admin/              # 🔐 Админ панель (password protected)
│   │   ├── places/         # CRUD операции для мест
│   │   └── login/          # Авторизация админа
│   ├── api/                # 🔌 API routes
│   │   ├── auth/           # Авторизация + Telegram
│   │   ├── places/         # Места и POI данные
│   │   └── activities/     # Активности и события
│   ├── places/[id]/        # 📍 Детальные страницы мест
│   ├── activities/         # 🎯 Каталог активностей
│   └── about/              # ℹ️ О проекте
├── components/             # 🧱 React компоненты
│   ├── ui/                 # Базовые UI компоненты (Radix UI)
│   ├── MapLibreMap.tsx     # 🗺️ Интерактивная карта
│   ├── PlacesList.tsx      # 📋 Список мест с фильтрацией
│   └── TelegramLogin.tsx   # 🔐 Telegram авторизация
├── lib/                    # 🔧 Утилиты и конфигурация
│   ├── hooks/              # Custom React hooks
│   │   ├── common/         # Общие хуки (useApi, useOffline)
│   │   ├── places/         # Хуки для мест
│   │   └── activities/     # Хуки для активностей
│   ├── config/             # Конфигурация приложения
│   └── utils/              # Утилитарные функции
├── services/               # 🔄 Бизнес-логика и API клиенты
│   ├── api/                # HTTP клиенты для внешних API
│   ├── business/           # Рекомендации и коллекции
│   └── *.service.ts        # Service layer для каждой сущности
├── types/                  # 🏷️ TypeScript типы и интерфейсы
└── prisma/                 # 🗄️ База данных
    ├── schema.prisma       # Схема БД
    ├── migrations/         # Миграции
    └── seed.ts             # Начальные данные
```

## 🗄️ Модель данных

### Основные сущности
```typescript
// Места для посещения
interface Place {
  id: string
  title: string
  lat: number
  lng: number
  categoryName: string
  city: string
  description?: string
  imageUrl?: string
  totalScore?: number
  reviewsCount?: number
}

// Пользователи (Telegram auth)
interface User {
  id: string
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  photoUrl?: string
  role: 'LOCAL' | 'TRAVELER' | 'ADMIN'
}

// Отзывы и рейтинги
interface Review {
  id: string
  placeId: string
  userId: string
  rating: number
  comment?: string
  createdAt: Date
}
```

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
git clone https://github.com/username/visitvostok.git
cd visitvostok
npm install
```

### 2. Настройка переменных окружения
```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/visitvostok"
ADMIN_PASSWORD="secure_admin_password_123"
NEXTAUTH_SECRET="your_super_secret_jwt_key_here"
NEXTAUTH_URL="http://localhost:3000"
TELEGRAM_BOT_SECRET="your_telegram_bot_secret_from_botfather"
```

### 3. Настройка базы данных
```bash
# Генерация Prisma клиента
npx prisma generate

# Применение миграций
npx prisma migrate dev

# Импорт POI данных
npm run import-places
```

### 4. Запуск в разработке
```bash
npm run dev
# Откройте http://localhost:3000
```

## 🔐 Админ панель

**URL:** `http://localhost:3000/admin`  
**Пароль:** значение переменной `ADMIN_PASSWORD`

### Функциональность:
- ✅ **CRUD операции** для всех мест
- ✅ **Пакетные операции** (массовое удаление/обновление)
- ✅ **Экспорт данных** в JSON формат
- ✅ **Статистика** по местам и категориям
- ✅ **Валидация данных** с real-time проверкой
- ✅ **Поиск и фильтрация** по всем полям

## 🎯 API Endpoints

### Публичные маршруты
```
GET    /api/places           # Все места с пагинацией
GET    /api/places/[id]      # Детали места
GET    /api/activities       # Список активностей
GET    /api/auth/me          # Информация о пользователе
POST   /api/auth/telegram    # Telegram авторизация
```

### Админские маршруты (защищены)
```
POST   /api/admin/places     # Создание места
PUT    /api/admin/places/[id] # Обновление места
DELETE /api/admin/places/[id] # Удаление места
GET    /api/admin/status     # Статистика системы
```

## 🔌 Продвинутые возможности

### 🌐 Офлайн поддержка
- **Service Worker** для кэширования ресурсов
- **IndexedDB** для хранения данных
- **Background Sync** для синхронизации при восстановлении сети
- **Progressive Enhancement** с graceful degradation

### ⚡ Система кэширования
```typescript
// Многоуровневое кэширование
const places = useApi(() => PlacesService.getAll(), [], {
  cacheKey: 'places:all',
  cacheTime: 5 * 60 * 1000, // 5 минут
  enableOffline: true,
  retryOnError: true
})
```

### 🎨 UI/UX особенности
- **Responsive Design** для всех устройств
- **Dark/Light режимы** (автоматическое переключение)
- **Skeleton Loading** для плавной загрузки
- **Toast уведомления** с контекстной информацией
- **Infinite Scroll** для больших списков

## 🚀 Деплой

### Простой деплой
```bash
npm run deploy:quick    # Быстрый деплой (только build + restart)
npm run deploy:full     # Полный деплой (dependencies + build + restart)
```

### Продакшн настройки
- **PM2** для управления процессами
- **Nginx** для reverse proxy и static файлов
- **PostgreSQL** с connection pooling
- **SSL сертификаты** (Let's Encrypt)

Подробные инструкции: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🧪 Скрипты разработки

```bash
npm run dev                  # Разработка с hot reload
npm run build               # Production build
npm run start               # Production server
npm run lint                # ESLint проверка

# База данных
npm run db:migrate:deploy   # Применить миграции
npm run db:generate         # Обновить Prisma клиент
npm run db:studio          # Открыть Prisma Studio

# Данные
npm run import-places       # Импорт POI данных
npm run check-duplicates    # Проверка дубликатов
npm run clean-duplicates    # Очистка дубликатов
npm run check-db-stats     # Статистика БД
```

## 🤝 Вклад в проект

1. **Fork** репозитория
2. Создайте **feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** изменения (`git commit -m 'Add some AmazingFeature'`)
4. **Push** в branch (`git push origin feature/AmazingFeature`)
5. Откройте **Pull Request**

### Правила разработки
- ✅ TypeScript strict mode
- ✅ ESLint без предупреждений
- ✅ Тесты для новой функциональности
- ✅ Документация в комментариях
- ✅ Семантические коммиты

## 📊 Производительность

- **Lighthouse Score:** 95+ (Performance, Accessibility, SEO)
- **Core Web Vitals:** Все метрики в зеленой зоне
- **Bundle Size:** < 300KB gzipped
- **Time to Interactive:** < 2s на 3G
- **Database Queries:** Оптимизированы с индексами

## 📝 Лицензия

Этот проект лицензирован под MIT License - см. [LICENSE](LICENSE) файл для деталей.

## 🙏 Благодарности

- **OpenStreetMap** за географические данные
- **Telegram** за Web Apps платформу  
- **Vercel** за Next.js framework
- **Prisma** за TypeScript ORM
- **MapLibre** за открытые карты

---

**Сделано с ❤️ для путешественников по Дальнему Востоку**
