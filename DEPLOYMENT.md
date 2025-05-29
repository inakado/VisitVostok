# Инструкции по развертыванию VisitVostok

## 1. Подготовка к GitHub

### Создание репозитория
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/visitvostok.git
git push -u origin main
```

### Настройка GitHub Secrets
В Settings > Secrets and variables > Actions добавь:
- `VPS_HOST` - IP адрес VPS
- `VPS_USER` - пользователь (root/ubuntu)
- `VPS_SSH_KEY` - приватный SSH ключ

## 2. Настройка VPS сервера

### Запуск скрипта установки
```bash
chmod +x deploy/setup-vps.sh
./deploy/setup-vps.sh
```

### Ручная настройка (если нужно)
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo -u postgres psql -c "CREATE USER visitvostok WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "CREATE DATABASE visitvostok OWNER visitvostok;"

# PM2 и Nginx
sudo npm install -g pm2
sudo apt install nginx -y

# SSL сертификат
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

### Настройка Nginx
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/visitvostok
sudo ln -s /etc/nginx/sites-available/visitvostok /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 3. Переменные окружения

Создай `.env` файл на сервере:
```bash
DATABASE_URL="postgresql://visitvostok:password@localhost:5432/visitvostok"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://yourdomain.com"
TELEGRAM_BOT_SECRET="your-telegram-bot-secret"
ADMIN_PASSWORD="your-admin-password"
```

## 4. Развертывание приложения

### Первоначальная настройка
```bash
cd /var/www/visitvostok
npm ci --production
npx prisma generate
npx prisma migrate deploy
npm run import-places
npm run build
pm2 start npm --name "visitvostok" -- start
pm2 startup
pm2 save
```

### Обновления (автоматически через GitHub Actions)
При пуше в main ветку автоматически:
1. Тестируется код
2. Деплоится на VPS
3. Перезапускается PM2

## 5. Админ панель

### Доступ
- URL: `https://yourdomain.com/admin`
- Пароль: значение из `ADMIN_PASSWORD`

### Функции
- ✅ Просмотр всех мест
- ✅ Добавление новых мест
- ✅ Редактирование существующих
- ✅ Удаление мест
- ✅ Экспорт в JSON

### Обновление карты
1. Зайди в админку
2. Отредактируй места
3. Нажми "Экспорт JSON"
4. Замени `public/primorsky_krai.json`
5. Коммит и пуш в GitHub

## 6. Мониторинг

### PM2 команды
```bash
pm2 status          # статус процессов
pm2 logs visitvostok # логи приложения
pm2 restart visitvostok # перезапуск
pm2 monit           # мониторинг в реальном времени
```

### Логи Nginx
```bash
sudo tail -f /var/log/nginx/visitvostok_access.log
sudo tail -f /var/log/nginx/visitvostok_error.log
```

### База данных
```bash
# Подключение к БД
sudo -u postgres psql visitvostok

# Бэкап
pg_dump -U visitvostok -h localhost visitvostok > backup.sql

# Восстановление
psql -U visitvostok -h localhost visitvostok < backup.sql
```

## 7. Альтернативные CMS решения

### TinaCMS (рекомендуется)
- Визуальный редактор
- Git-based
- Интеграция с Next.js

### Strapi
- Headless CMS
- REST/GraphQL API
- Админ панель

### Sanity
- Структурированный контент
- Реальное время
- CDN

### Forestry (устарел, но есть аналоги)
- Git-based
- Markdown/JSON
- Простой интерфейс

## 8. Безопасность

### Рекомендации
- Используй сильные пароли
- Настрой firewall (ufw)
- Регулярно обновляй систему
- Мониторь логи на подозрительную активность
- Делай регулярные бэкапы БД

### Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
``` 