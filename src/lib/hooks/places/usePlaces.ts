// Основной хук для работы с местами
// Заменяет прямые fetch вызовы в ClientHomePage и PlacesList

import { useApi } from '../common/useApi'
import { PlacesService } from '@/services'
import { PlaceFilters } from '@/types'
import { CACHE_CONFIG, API_CONFIG } from '@/lib/config'

// === ОСНОВНОЙ ХУК ДЛЯ ВСЕХ МЕСТ ===

export function usePlaces() {
	return useApi(
		() => PlacesService.getAll(),
		[], // deps
		{
			cacheKey: 'places_all',
			cacheTime: CACHE_CONFIG.PLACES.ALL,
			retryOnError: true,
			retryCount: API_CONFIG.RETRY.COUNT
		}
	)
}

// === ХУК ДЛЯ ФИЛЬТРОВАННЫХ МЕСТ ===

export function useFilteredPlaces(filters: PlaceFilters) {
	const filterString = JSON.stringify(filters)
	
	return useApi(
		() => PlacesService.getFiltered(filters),
		[filterString], // пересоздаем при изменении фильтров
		{
			executeOnMount: Object.keys(filters).length > 0, // загружаем только если есть фильтры
			cacheKey: `places_filtered_${filterString}`,
			cacheTime: CACHE_CONFIG.PLACES.FILTERED
		}
	)
}

// === ХУК ДЛЯ МЕСТА ПО ID ===

export function usePlace(id: string | null) {
	return useApi(
		() => id ? PlacesService.getById(id) : Promise.resolve(null),
		[id],
		{
			executeOnMount: Boolean(id),
			cacheKey: id ? `place_${id}` : undefined,
			cacheTime: CACHE_CONFIG.PLACES.DETAILS
		}
	)
}

// === ХУК ДЛЯ РЕКОМЕНДОВАННЫХ МЕСТ ===

export function useFeaturedPlaces(limit: number = API_CONFIG.LIMITS.PLACES.FEATURED) {
	return useApi(
		() => PlacesService.getFeatured(limit),
		[limit],
		{
			cacheKey: `places_featured_${limit}`,
			cacheTime: CACHE_CONFIG.PLACES.FEATURED,
			retryOnError: true
		}
	)
}

// === ХУК ДЛЯ КАТЕГОРИЙ МЕСТ ===

export function usePlaceCategories() {
	return useApi(
		() => PlacesService.getCategories(),
		[],
		{
			cacheKey: 'places_categories',
			cacheTime: CACHE_CONFIG.PLACES.CATEGORIES
		}
	)
}

// === ХУК ДЛЯ ГОРОДОВ ===

export function usePlaceCities() {
	return useApi(
		() => PlacesService.getCities(),
		[],
		{
			cacheKey: 'places_cities',
			cacheTime: CACHE_CONFIG.PLACES.CITIES
		}
	)
}

// === ХУК ДЛЯ ТОПОВЫХ МЕСТ ПО РЕЙТИНГУ ===

export function useTopRatedPlaces(limit: number = API_CONFIG.LIMITS.PLACES.TOP_RATED) {
	return useApi(
		() => PlacesService.getTopRated(limit),
		[limit],
		{
			cacheKey: `places_top_rated_${limit}`,
			cacheTime: CACHE_CONFIG.PLACES.TOP_RATED
		}
	)
}

// === ХУК ДЛЯ МЕСТ ПОБЛИЗОСТИ ===

export function useNearbyPlaces(
	lat: number | null, 
	lng: number | null, 
	radiusKm: number = 10
) {
	return useApi(
		() => {
			if (lat === null || lng === null) {
				return Promise.resolve([])
			}
			return PlacesService.getNearbyByCoordinates(lat, lng, radiusKm)
		},
		[lat, lng, radiusKm],
		{
			executeOnMount: lat !== null && lng !== null,
			cacheKey: lat !== null && lng !== null ? `places_nearby_${lat}_${lng}_${radiusKm}` : undefined,
			cacheTime: CACHE_CONFIG.PLACES.NEARBY
		}
	)
}

// === СОСТАВНОЙ ХУК ДЛЯ ГЛАВНОЙ СТРАНИЦЫ ===

// Объединяет данные, необходимые для ClientHomePage
export function useHomePageData() {
	const placesQuery = usePlaces()
	const categoriesQuery = usePlaceCategories()
	const featuredQuery = useFeaturedPlaces()

	return {
		// Основные данные
		places: placesQuery.data || [],
		categories: categoriesQuery.data || [],
		featured: featuredQuery.data || [],
		
		// Состояния загрузки
		isLoading: placesQuery.isLoading || categoriesQuery.isLoading || featuredQuery.isLoading,
		isSuccess: placesQuery.isSuccess && categoriesQuery.isSuccess && featuredQuery.isSuccess,
		
		// Ошибки
		error: placesQuery.error || categoriesQuery.error || featuredQuery.error,
		
		// Функции обновления
		refetch: () => {
			placesQuery.refetch()
			categoriesQuery.refetch()
			featuredQuery.refetch()
		},
		
		// Флаги состояния
		isEmpty: !placesQuery.data?.length && !categoriesQuery.data?.length && !featuredQuery.data?.length,
		hasData: Boolean(placesQuery.data?.length || categoriesQuery.data?.length || featuredQuery.data?.length)
	}
}

// === СОСТАВНОЙ ХУК ДЛЯ СПИСКА МЕСТ ===

// Объединяет данные, необходимые для PlacesList компонента
export function usePlacesListData() {
	const placesQuery = usePlaces()
	const categoriesQuery = usePlaceCategories()
	const featuredQuery = useFeaturedPlaces()
	const topRatedQuery = useTopRatedPlaces()

	return {
		// Основные данные
		places: placesQuery.data || [],
		categories: categoriesQuery.data || [],
		featured: featuredQuery.data || [],
		topRated: topRatedQuery.data || [],
		
		// Состояния загрузки
		isLoading: placesQuery.isLoading,
		isSuccess: placesQuery.isSuccess,
		
		// Ошибки
		error: placesQuery.error || categoriesQuery.error,
		
		// Функции обновления
		refetch: () => {
			placesQuery.refetch()
			categoriesQuery.refetch()
			featuredQuery.refetch()
			topRatedQuery.refetch()
		}
	}
} 