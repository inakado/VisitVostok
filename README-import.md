# Быстрый импорт данных из all_places.json

## TL;DR - Быстрый старт

```bash
# Простой импорт всех данных
npm run import-all-places

# Проверить результат
npm run db:studio

# Посмотреть статистику
npm run check-import-stats
```

## Что происходит

Скрипт автоматически:
- ✅ Читает `public/all_places.json` (1885 мест)
- ✅ Проверяет дубликаты по координатам + названию  
- ✅ Импортирует батчами по 500 записей
- ✅ Показывает прогресс в реальном времени
- ✅ Выводит детальную статистику

## Результаты импорта

После успешного импорта в БД будет:
- **2271 место** всего
- **1960 мест** в Приморском крае  
- **539 мест** во Владивостоке
- **304 исторических места** (самая популярная категория)
- **614 мест с изображениями** (27%)
- **244 места с описанием** (10.7%)

## Структура данных

**JSON → БД трансформация:**
```
location.lat/lng → lat/lng (Float)
categories → String[]
null → NULL в БД
```

## Проверка результатов

```sql
-- Сколько всего мест
SELECT COUNT(*) FROM "Place";

-- Топ категорий
SELECT "categoryName", COUNT(*) 
FROM "Place" 
GROUP BY "categoryName" 
ORDER BY COUNT(*) DESC LIMIT 10;

-- По городам
SELECT city, COUNT(*) 
FROM "Place" 
WHERE city IS NOT NULL 
GROUP BY city 
ORDER BY COUNT(*) DESC LIMIT 10;
```

## Если что-то пошло не так

```bash
# Проверить подключение к БД
echo $DATABASE_URL

# Проверить статус миграций
npx prisma migrate status

# Посмотреть логи
npm run import-all-places 2>&1 | tee import.log

# Очистить и начать заново
npx prisma migrate reset --force
npm run seed
npm run import-all-places
```

## Повторный импорт

Скрипт **безопасно** пропускает дубликаты, поэтому можно запускать сколько угодно раз:

```bash
# Первый раз: импортирует 1885 мест
npm run import-all-places

# Второй раз: пропустит все 1885 дубликатов  
npm run import-all-places
# ✅ Все места уже импортированы!
```

## Файлы

- `prisma/import-all-places.ts` - основной скрипт импорта
- `prisma/check-import-stats.ts` - проверка статистики  
- `docs/import-places-guide.md` - подробная документация
- `public/all_places.json` - исходные данные (1.5MB)

## Время выполнения

- **~1885 записей**: 10-30 секунд
- **~45000 записей**: 2-5 минут 

Зависит от скорости БД и размера батчей (по умолчанию 500). 