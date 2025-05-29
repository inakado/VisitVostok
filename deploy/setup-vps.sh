#!/bin/bash

# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Устанавливаем PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Настраиваем PostgreSQL
sudo -u postgres psql -c "CREATE USER visitvostok WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE visitvostok OWNER visitvostok;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE visitvostok TO visitvostok;"

# Устанавливаем PM2 для управления процессами
sudo npm install -g pm2

# Устанавливаем Nginx
sudo apt install nginx -y

# Создаем директорию для приложения
sudo mkdir -p /var/www/visitvostok
sudo chown $USER:$USER /var/www/visitvostok

# Клонируем репозиторий
cd /var/www
git clone https://github.com/username/visitvostok.git
cd visitvostok

# Устанавливаем зависимости
npm ci --production

# Создаем .env файл
cat > .env << EOF
DATABASE_URL="postgresql://visitvostok:your_secure_password@localhost:5432/visitvostok"
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="https://yourdomain.com"
TELEGRAM_BOT_SECRET="your_telegram_bot_secret"
EOF

# Генерируем Prisma клиент и применяем миграции
npx prisma generate
npx prisma migrate deploy

# Импортируем данные
npm run import-places

# Собираем приложение
npm run build

# Запускаем с PM2
pm2 start npm --name "visitvostok" -- start
pm2 startup
pm2 save

echo "✅ VPS настроен! Теперь настрой Nginx." 