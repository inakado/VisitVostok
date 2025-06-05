// Хуки для работы с активностями
// Заменяет прямые fetch вызовы в ClientActivitiesPage

import { useApi } from '../common/useApi'
import { ActivitiesService } from '@/services'
import { ActivityFilters } from '@/types'
import { CACHE_CONFIG, API_CONFIG } from '@/lib/config'

// === ОСНОВНОЙ ХУК ДЛЯ ВСЕХ АКТИВНОСТЕЙ ===

export function useActivities(limit: number = API_CONFIG.LIMITS.ACTIVITIES.ALL) {
	return useApi(
		() => ActivitiesService.getAll(limit),
		[limit],
		{
			cacheKey: `activities_all_${limit}`,
			cacheTime: CACHE_CONFIG.ACTIVITIES.ALL,
			retryOnError: true,
			retryCount: API_CONFIG.RETRY.COUNT
		}
	)
}

// === ХУК ДЛЯ РЕКОМЕНДОВАННЫХ АКТИВНОСТЕЙ ===

export function useFeaturedActivities(limit: number = API_CONFIG.LIMITS.ACTIVITIES.FEATURED) {
	return useApi(
		() => ActivitiesService.getFeatured(limit),
		[limit],
		{
			cacheKey: `activities_featured_${limit}`,
			cacheTime: CACHE_CONFIG.ACTIVITIES.FEATURED,
			retryOnError: true,
			retryCount: API_CONFIG.RETRY.COUNT
		}
	)
}

// === ХУК ДЛЯ АКТИВНОСТИ ПО ID ===

export function useActivity(id: string | null) {
	return useApi(
		() => id ? ActivitiesService.getById(id) : Promise.resolve(null),
		[id],
		{
			executeOnMount: Boolean(id),
			cacheKey: id ? `activity_${id}` : undefined,
			cacheTime: CACHE_CONFIG.ACTIVITIES.DETAILS
		}
	)
}

// === ХУК ДЛЯ ФИЛЬТРОВАННЫХ АКТИВНОСТЕЙ ===

export function useFilteredActivities(filters: ActivityFilters) {
	const filterString = JSON.stringify(filters)
	
	return useApi(
		() => ActivitiesService.getFiltered(filters),
		[filterString],
		{
			executeOnMount: Object.keys(filters).length > 0,
			cacheKey: `activities_filtered_${filterString}`,
			cacheTime: CACHE_CONFIG.ACTIVITIES.FILTERED
		}
	)
}

// === ХУК ДЛЯ ТЕМАТИЧЕСКИХ КОЛЛЕКЦИЙ ===

export function useThematicCollections() {
	return useApi(
		() => ActivitiesService.createThematicCollections(),
		[],
		{
			cacheKey: 'activities_thematic_collections',
			cacheTime: CACHE_CONFIG.ACTIVITIES.COLLECTIONS
		}
	)
}

// === ХУК ДЛЯ АКТИВНОСТЕЙ ПО КАТЕГОРИИ ===

export function useActivitiesByCategory(category: string | null) {
	return useApi(
		() => category ? ActivitiesService.getByCategory(category) : Promise.resolve([]),
		[category],
		{
			executeOnMount: Boolean(category),
			cacheKey: category ? `activities_category_${category}` : undefined,
			cacheTime: CACHE_CONFIG.ACTIVITIES.ALL
		}
	)
}

// === ХУК ДЛЯ ПОИСКА АКТИВНОСТЕЙ ===

export function useSearchActivities(query: string | null) {
	return useApi(
		() => query ? ActivitiesService.search(query) : Promise.resolve([]),
		[query],
		{
			executeOnMount: Boolean(query && query.length >= API_CONFIG.SEARCH.MIN_QUERY_LENGTH),
			cacheKey: query ? `activities_search_${query}` : undefined,
			cacheTime: CACHE_CONFIG.ACTIVITIES.SEARCH
		}
	)
}

// === ХУК ДЛЯ ТОПОВЫХ АКТИВНОСТЕЙ ПО РЕЙТИНГУ ===

export function useTopRatedActivities(limit: number = API_CONFIG.LIMITS.ACTIVITIES.TOP_RATED) {
	return useApi(
		() => ActivitiesService.getTopRated(limit),
		[limit],
		{
			cacheKey: `activities_top_rated_${limit}`,
			cacheTime: CACHE_CONFIG.ACTIVITIES.TOP_RATED
		}
	)
}

// === ХУК ДЛЯ ПРИРОДНЫХ АКТИВНОСТЕЙ ===

export function useNatureActivities() {
	return useApi(
		() => ActivitiesService.getNatureActivities(),
		[],
		{
			cacheKey: 'activities_nature',
			cacheTime: CACHE_CONFIG.ACTIVITIES.NATURE
		}
	)
}

// === ХУК ДЛЯ КУЛЬТУРНЫХ АКТИВНОСТЕЙ ===

export function useCulturalActivities() {
	return useApi(
		() => ActivitiesService.getCulturalActivities(),
		[],
		{
			cacheKey: 'activities_cultural',
			cacheTime: CACHE_CONFIG.ACTIVITIES.CULTURAL
		}
	)
}

// === ХУК ДЛЯ КАТЕГОРИЙ АКТИВНОСТЕЙ ===

export function useActivityCategories() {
	return useApi(
		() => ActivitiesService.getCategories(),
		[],
		{
			cacheKey: 'activities_categories',
			cacheTime: CACHE_CONFIG.ACTIVITIES.CATEGORIES
		}
	)
}

// === ХУК ДЛЯ ЛОКАЦИЙ АКТИВНОСТЕЙ ===

export function useActivityLocations() {
	return useApi(
		() => ActivitiesService.getLocations(),
		[],
		{
			cacheKey: 'activities_locations',
			cacheTime: CACHE_CONFIG.ACTIVITIES.LOCATIONS
		}
	)
}

// === СОСТАВНОЙ ХУК ДЛЯ СТРАНИЦЫ АКТИВНОСТЕЙ ===

// Объединяет данные, необходимые для ClientActivitiesPage
export function useActivitiesPageData() {
	const featuredQuery = useFeaturedActivities()
	const allQuery = useActivities()
	const collectionsQuery = useThematicCollections()
	const categoriesQuery = useActivityCategories()

	return {
		// Основные данные
		featured: featuredQuery.data || [],
		activities: allQuery.data || [],
		collections: collectionsQuery.data || [],
		categories: categoriesQuery.data || [],
		
		// Состояния загрузки
		isLoading: featuredQuery.isLoading || allQuery.isLoading,
		isSuccess: featuredQuery.isSuccess && allQuery.isSuccess,
		
		// Ошибки
		error: featuredQuery.error || allQuery.error || collectionsQuery.error,
		
		// Функции обновления
		refetch: () => {
			featuredQuery.refetch()
			allQuery.refetch()
			collectionsQuery.refetch()
			categoriesQuery.refetch()
		},
		
		// Флаги состояния
		isEmpty: !featuredQuery.data?.length && !allQuery.data?.length,
		hasData: Boolean(featuredQuery.data?.length || allQuery.data?.length)
	}
} 