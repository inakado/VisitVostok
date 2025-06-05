/**
 * Утилиты для фильтрации и сортировки данных
 * Централизует повторяющуюся логику фильтрации из компонентов и сервисов
 */

import { Place, Activity } from '@/types'

// === ФИЛЬТРЫ ДЛЯ МЕСТ ===

export const PlaceFilters = {
	/**
	 * Фильтрация по категории
	 */
	byCategory: (places: Place[], category: string): Place[] => {
		return places.filter(place => place.categoryName === category)
	},

	/**
	 * Фильтрация по рейтингу (минимальный рейтинг)
	 */
	byRating: (places: Place[], minRating: number): Place[] => {
		return places.filter(place => (place.totalScore || 0) >= minRating)
	},

	/**
	 * Получение топовых мест по рейтингу
	 */
	topRated: (places: Place[], limit: number = 10): Place[] => {
		return places
			.filter(place => place.totalScore && place.totalScore >= 4.0)
			.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
			.slice(0, limit)
	},

	/**
	 * Фильтрация достопримечательностей
	 */
	landmarks: (places: Place[]): Place[] => {
		return places.filter(place => 
			place.categoryName?.includes('достопримечательность') || 
			place.categoryName?.includes('Достопримечательность')
		)
	},

	/**
	 * Фильтрация музеев и культурных мест
	 */
	museums: (places: Place[]): Place[] => {
		return places.filter(place => 
			place.categoryName?.toLowerCase().includes('музей') || 
			place.categoryName?.toLowerCase().includes('театр') ||
			place.categoryName?.toLowerCase().includes('культур')
		)
	},

	/**
	 * Фильтрация природных мест
	 */
	nature: (places: Place[]): Place[] => {
		return places.filter(place => 
			place.categoryName?.toLowerCase().includes('парк') || 
			place.categoryName?.toLowerCase().includes('природ') ||
			place.categoryName?.toLowerCase().includes('заповедник')
		)
	},

	/**
	 * Поиск по тексту
	 */
	search: (places: Place[], query: string): Place[] => {
		const lowerQuery = query.toLowerCase()
		return places.filter(place =>
			place.title?.toLowerCase().includes(lowerQuery) ||
			place.categoryName?.toLowerCase().includes(lowerQuery) ||
			place.city?.toLowerCase().includes(lowerQuery)
		)
	},

	/**
	 * Фильтрация по городу
	 */
	byCity: (places: Place[], city: string): Place[] => {
		return places.filter(place => place.city === city)
	},

	/**
	 * Фильтрация по количеству отзывов
	 */
	byReviewsCount: (places: Place[], minReviews: number): Place[] => {
		return places.filter(place => (place.reviewsCount || 0) >= minReviews)
	},
}

// === ФИЛЬТРЫ ДЛЯ АКТИВНОСТЕЙ ===

export const ActivityFilters = {
	/**
	 * Фильтрация по категории
	 */
	byCategory: (activities: Activity[], category: string): Activity[] => {
		return activities.filter(activity => activity.category === category)
	},

	/**
	 * Фильтрация по рейтингу
	 */
	byRating: (activities: Activity[], minRating: number): Activity[] => {
		return activities.filter(activity => (activity.rating || 0) >= minRating)
	},

	/**
	 * Получение топовых активностей по рейтингу
	 */
	topRated: (activities: Activity[], limit: number = 10): Activity[] => {
		return activities
			.filter(activity => activity.rating && activity.rating >= 4.0)
			.sort((a, b) => (b.rating || 0) - (a.rating || 0))
			.slice(0, limit)
	},

	/**
	 * Поиск по тексту
	 */
	search: (activities: Activity[], query: string): Activity[] => {
		const lowerQuery = query.toLowerCase()
		return activities.filter(activity =>
			activity.title?.toLowerCase().includes(lowerQuery) ||
			activity.excerpt?.toLowerCase().includes(lowerQuery) ||
			activity.category?.toLowerCase().includes(lowerQuery) ||
			activity.location?.toLowerCase().includes(lowerQuery)
		)
	},

	/**
	 * Фильтрация природных активностей
	 */
	nature: (activities: Activity[]): Activity[] => {
		return activities.filter(activity => 
			activity.category?.toLowerCase().includes('парк') ||
			activity.category?.toLowerCase().includes('природ') ||
			activity.category?.toLowerCase().includes('заповедник') ||
			activity.category?.toLowerCase().includes('пляж')
		)
	},

	/**
	 * Фильтрация культурных активностей
	 */
	cultural: (activities: Activity[]): Activity[] => {
		return activities.filter(activity => 
			activity.category?.toLowerCase().includes('музей') ||
			activity.category?.toLowerCase().includes('театр') ||
			activity.category?.toLowerCase().includes('культур')
		)
	},

	/**
	 * Фильтрация по местоположению
	 */
	byLocation: (activities: Activity[], location: string): Activity[] => {
		return activities.filter(activity => activity.location === location)
	},
}

// === УТИЛИТЫ СОРТИРОВКИ ===

export const SortUtils = {
	/**
	 * Сортировка по рейтингу (убывание)
	 */
	byRatingDesc: <T extends { rating?: number }>(items: T[]): T[] => {
		return [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0))
	},

	/**
	 * Сортировка по названию (возрастание)
	 */
	byTitleAsc: <T extends { title?: string }>(items: T[]): T[] => {
		return [...items].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
	},

	/**
	 * Сортировка по количеству отзывов (убывание)
	 */
	byReviewsDesc: <T extends { reviewsCount?: number | null }>(items: T[]): T[] => {
		return [...items].sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0))
	},

	/**
	 * Случайная сортировка
	 */
	random: <T>(items: T[]): T[] => {
		return [...items].sort(() => Math.random() - 0.5)
	},
}

// === УТИЛИТЫ ГРУППИРОВКИ ===

export const GroupUtils = {
	/**
	 * Группировка мест по категориям
	 */
	placesByCategory: (places: Place[]): Record<string, Place[]> => {
		return places.reduce((acc, place) => {
			const category = place.categoryName || 'Без категории'
			if (!acc[category]) {
				acc[category] = []
			}
			acc[category].push(place)
			return acc
		}, {} as Record<string, Place[]>)
	},

	/**
	 * Группировка активностей по категориям
	 */
	activitiesByCategory: (activities: Activity[]): Record<string, Activity[]> => {
		return activities.reduce((acc, activity) => {
			const category = activity.category || 'Без категории'
			if (!acc[category]) {
				acc[category] = []
			}
			acc[category].push(activity)
			return acc
		}, {} as Record<string, Activity[]>)
	},

	/**
	 * Группировка мест по городам
	 */
	placesByCity: (places: Place[]): Record<string, Place[]> => {
		return places.reduce((acc, place) => {
			const city = place.city || 'Неизвестный город'
			if (!acc[city]) {
				acc[city] = []
			}
			acc[city].push(place)
			return acc
		}, {} as Record<string, Place[]>)
	},

	/**
	 * Получение уникальных категорий
	 */
	getUniqueCategories: <T extends { categoryName?: string } | { category?: string }>(items: T[]): string[] => {
		const categories = new Set<string>()
		items.forEach(item => {
			const category = 'categoryName' in item ? item.categoryName : 
			                 'category' in item ? item.category : undefined
			if (category) {
				categories.add(category)
			}
		})
		return Array.from(categories).sort()
	},

	/**
	 * Получение уникальных городов
	 */
	getUniqueCities: (places: Place[]): string[] => {
		const cities = new Set<string>()
		places.forEach(place => {
			if (place.city) {
				cities.add(place.city)
			}
		})
		return Array.from(cities).sort()
	},
} 