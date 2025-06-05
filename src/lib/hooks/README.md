# 🎯 Custom Hooks для VisitVostok

Централизованные React хуки для работы с API и состоянием приложения.

## 📋 Структура

```
src/lib/hooks/
├── common/
│   └── useApi.ts           # Базовый хук для API вызовов
├── places/
│   └── usePlaces.ts        # Хуки для работы с местами
├── activities/
│   └── useActivities.ts    # Хуки для работы с активностями
├── user/
│   └── useUser.ts          # Хуки для работы с пользователями
├── admin/
│   └── useAdmin.ts         # Хуки для админ-функций
├── index.ts                # Центральный экспорт
└── README.md               # Документация
```

## 🚀 Основные возможности

### ✨ Базовый хук useApi
- Автоматическое управление состояниями loading/error/success
- Кэширование в localStorage с TTL
- Повторные попытки при ошибках
- Предотвращение дублирования запросов

### 📍 Places хуки
- `usePlaces()` - все места
- `useFeaturedPlaces()` - рекомендованные места
- `useHomePageData()` - данные для главной страницы
- `usePlacesListData()` - данные для списка мест
- `useNearbyPlaces()` - места поблизости

### 🎯 Activities хуки
- `useActivities()` - все активности
- `useFeaturedActivities()` - рекомендованные активности
- `useActivitiesPageData()` - данные для страницы активностей
- `useThematicCollections()` - тематические коллекции

### 👤 User хуки
- `useUser()` - текущий пользователь
- `useAuth()` - проверка авторизации
- `useAuthGuard()` - защита маршрутов
- `useUpdateUserRole()` - обновление роли

### 🔧 Admin хуки
- `useAdminAuth()` - админская авторизация
- `useAdminDashboard()` - данные дашборда
- `useAdminStats()` - статистика системы
- `useDataExport()` - экспорт данных

## 📖 Примеры использования

### Главная страница
```tsx
import { useHomePageData } from '@/lib/hooks'

export function HomePage() {
  const { places, featured, categories, isLoading, error, refetch } = useHomePageData()
  
  if (isLoading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка: {error}</div>
  
  return (
    <div>
      <MapComponent places={places} />
      <FeaturedSection places={featured} />
      <CategoriesFilter categories={categories} />
    </div>
  )
}
```

### Страница активностей
```tsx
import { useActivitiesPageData } from '@/lib/hooks'

export function ActivitiesPage() {
  const { featured, activities, collections, isLoading } = useActivitiesPageData()
  
  return (
    <div>
      <FeaturedSlider activities={featured} />
      <ThematicCollections collections={collections} />
      <AllActivities activities={activities} />
    </div>
  )
}
```

### Защищенный маршрут
```tsx
import { useAuthGuard } from '@/lib/hooks'

export function ProtectedPage() {
  const { showContent, showLogin, user } = useAuthGuard('local')
  
  if (showLogin) return <LoginForm />
  if (showContent) return <EditContent user={user} />
  
  return <div>Загрузка...</div>
}
```

### Админ дашборд
```tsx
import { useAdminDashboard } from '@/lib/hooks'

export function AdminDashboard() {
  const { 
    isAuthenticated, 
    stats, 
    health, 
    refetchData 
  } = useAdminDashboard()
  
  if (!isAuthenticated) return <AdminLogin />
  
  return (
    <div>
      <StatsCards stats={stats} />
      <HealthStatus health={health} />
      <button onClick={refetchData}>Обновить</button>
    </div>
  )
}
```

## 🔄 Кэширование

Все хуки используют умное кэширование:

- **Places**: 10-15 минут
- **Activities**: 10-15 минут  
- **User**: 15 минут
- **Admin stats**: 5 минут
- **Categories/Cities**: 30 минут

### Управление кэшем
```tsx
import { clearAllCache, clearCacheByPrefix, getCacheInfo } from '@/lib/hooks'

// Очистка всего кэша
clearAllCache()

// Очистка кэша мест
clearCacheByPrefix('places_')

// Информация о кэше
const cacheInfo = getCacheInfo()
console.log(cacheInfo)
```

## 🛡️ Обработка ошибок

Все хуки автоматически обрабатывают ошибки:

```tsx
const { data, isLoading, error, canRetry, refetch } = usePlaces()

if (error) {
  return (
    <div>
      <p>Ошибка: {error}</p>
      {canRetry && (
        <button onClick={refetch}>Попробовать снова</button>
      )}
    </div>
  )
}
```

## 🎨 Паттерны использования

### 1. Составные хуки для страниц
Используйте готовые составные хуки:
- `useHomePageData()` - для главной страницы
- `usePlacesListData()` - для списка мест
- `useActivitiesPageData()` - для активностей
- `useAdminDashboard()` - для админки

### 2. Условная загрузка
```tsx
const { data } = usePlace(placeId, { immediate: Boolean(placeId) })
```

### 3. Фильтрация
```tsx
const filters = { category: 'museum', city: 'Vladivostok' }
const { data: filteredPlaces } = useFilteredPlaces(filters)
```

### 4. Мутации
```tsx
const { updateRole, isLoading } = useUpdateUserRole()

const handleRoleUpdate = async (role) => {
  try {
    await updateRole(role)
    // Успех
  } catch (error) {
    // Ошибка
  }
}
```

## ⚡ Производительность

- **Автоматическое кэширование** данных в localStorage
- **Предотвращение дублирования** запросов
- **Ленивая загрузка** данных
- **Повторные попытки** при сетевых ошибках
- **Умная инвалидация** кэша

## 🔧 Интеграция с компонентами

Хуки заменяют прямые `fetch()` вызовы в:

- ✅ `ClientHomePage.tsx`
- ✅ `PlacesList.tsx`
- ✅ `ClientActivitiesPage.tsx`
- ✅ `RoleSelector.tsx`
- ✅ `Admin` компоненты

## 📝 Следующие шаги

После интеграции хуков в компоненты:

1. **Удалить** прямые `fetch()` вызовы
2. **Обновить** обработку состояний
3. **Протестировать** кэширование
4. **Удалить** дублированную логику

## 🎯 Готовые интеграции

Все хуки готовы для замены существующих API вызовов:

- `src/app/ClientHomePage.tsx` → `useHomePageData()`
- `src/components/PlacesList.tsx` → `usePlacesListData()`
- `src/app/activities/ClientActivitiesPage.tsx` → `useActivitiesPageData()`
- `src/components/RoleSelector.tsx` → `useUpdateUserRole()`
- `src/lib/hooks/useUser.ts` → обновленный хук

Хуки обеспечивают 100% совместимость с существующими компонентами и улучшают производительность через кэширование и умную обработку состояний. 