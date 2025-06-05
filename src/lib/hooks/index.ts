// Центральный экспорт всех хуков
// Обеспечивает удобный импорт хуков из одного места

// === БАЗОВЫЕ ХУКИ ===
export { useApi, useMutation } from './common/useApi'

// === PLACES ХУКИ ===
export {
	usePlaces,
	useFilteredPlaces,
	usePlace,
	useFeaturedPlaces,
	usePlaceCategories,
	usePlaceCities,
	useTopRatedPlaces,
	useNearbyPlaces,
	useHomePageData,
	usePlacesListData,
} from './places/usePlaces'

// === ACTIVITIES ХУКИ ===
export {
	useActivities,
	useFeaturedActivities,
	useActivity,
	useFilteredActivities,
	useThematicCollections,
	useActivitiesByCategory,
	useSearchActivities,
	useTopRatedActivities,
	useNatureActivities,
	useCulturalActivities,
	useActivityCategories,
	useActivityLocations,
	useActivitiesPageData,
} from './activities/useActivities'

// === USER ХУКИ ===
export {
	useUser,
	useAuth,
	useUpdateUserRole,
	useLogout,
	useUserRole,
	useAuthGuard,
	useUserProfile,
} from './user/useUser'

// === ADMIN ХУКИ ===
export { useAdminSimple } from './admin/useAdminSimple'
export { useAdminPlaces } from './admin/useAdminPlaces'
export { useAdminStats } from './admin/useAdminStats'

// === ФИЛЬТРАЦИЯ ===
export { useMapFilters } from './useMapFilters'

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

// Функция для очистки всего кэша
export function clearAllCache(): void {
	if (typeof window !== 'undefined') {
		// Очищаем localStorage полностью
		localStorage.clear()
		console.log('🧹 Весь кэш очищен')
	}
}

// Функция для очистки кэша конкретной области
export function clearCacheByPrefix(prefix: string): void {
	if (typeof window !== 'undefined') {
		Object.keys(localStorage).forEach(key => {
			if (key.startsWith(prefix)) {
				localStorage.removeItem(key)
			}
		})
		console.log(`🧹 Кэш '${prefix}*' очищен`)
	}
}

// Функция для получения информации о кэше
export function getCacheInfo(): {
	totalItems: number
	totalSize: number
	itemsByPrefix: Record<string, number>
} {
	if (typeof window === 'undefined') {
		return { totalItems: 0, totalSize: 0, itemsByPrefix: {} }
	}

	const itemsByPrefix: Record<string, number> = {}
	let totalSize = 0

	Object.keys(localStorage).forEach(key => {
		const value = localStorage.getItem(key) || ''
		totalSize += key.length + value.length

		// Группируем по префиксам
		const prefix = key.split('_')[0] + '_'
		itemsByPrefix[prefix] = (itemsByPrefix[prefix] || 0) + 1
	})

	return {
		totalItems: Object.keys(localStorage).length,
		totalSize,
		itemsByPrefix
	}
}

// === ТИПЫ ДЛЯ РЕЭКСПОРТА ===

// Реэкспортируем часто используемые типы
export type { 
	Place, 
	Activity, 
	User, 
	UserRole,
	PlaceFilters,
	ActivityFilters,
	ThematicCollection,
	LoadingState,
	MapFilters,
	CategoryWithSubcategories,
	FilterTab
} from '@/types' 