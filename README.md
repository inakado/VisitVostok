# VisitVostok

Приложение для изучения туристических мест Дальнего Востока России.

**CI/CD Status:** ✅ Active

Туристическое приложение для изучения Приморского края с интерактивной картой и местами для посещения.

## Технологии

- **Frontend**: Next.js 15, React 19, TypeScript
- **Стили**: Tailwind CSS 4
- **База данных**: PostgreSQL + Prisma ORM
- **Карты**: MapLibre GL JS
- **Деплой**: VPS + Nginx + PM2

## Быстрый старт

1. **Клонирование репозитория**
```bash
git clone https://github.com/username/visitvostok.git
cd visitvostok
```

2. **Установка зависимостей**
```bash
npm install
```

3. **Настройка переменных окружения**
Создай `.env` файл:
```bash
# Database
DATABASE_URL="your_database_url_here"

# Admin Panel
ADMIN_PASSWORD="admin123"

# Auth
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# Telegram Bot
TELEGRAM_BOT_SECRET="your_telegram_bot_secret"
```

4. **Настройка базы данных**
```bash
npx prisma generate
npx prisma migrate dev
npm run import-places
```

5. **Запуск в разработке**
```bash
npm run dev
```

## Админ панель

Доступ к админ панели: `http://localhost:3000/admin`

**Функции:**
- ✅ Просмотр всех мест
- ✅ Добавление новых мест
- ✅ Редактирование существующих
- ✅ Удаление мест
- ✅ Экспорт в JSON

**Пароль:** значение из переменной `ADMIN_PASSWORD`

## Деплой

Подробные инструкции по развертыванию смотри в [DEPLOYMENT.md](./DEPLOYMENT.md)

## Структура проекта

```
src/
├── app/                 # Next.js App Router
│   ├── admin/          # Админ панель
│   ├── api/            # API routes
│   └── ...
├── components/         # React компоненты
│   ├── ui/            # UI компоненты
│   └── ...
├── lib/               # Утилиты
└── ...
prisma/                # Схема БД и миграции
public/                # Статические файлы
deploy/                # Скрипты деплоя
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
