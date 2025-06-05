/**
 * Сервис рекомендаций
 * Бизнес-логика для создания персонализированных предложений
 */

import { Place, Activity } from '@/types'
import { PlaceFilters, ActivityFilters } from '@/lib/utils/filters'

export class RecommendationsService {
	/**
	 * Получение топ мест по рейтингу
	 */
	static getTopRatedPlaces(places: Place[], limit: number = 10): Place[] {
		return PlaceFilters.byRating(places, 4.0)
			.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
			.slice(0, limit)
	}

	/**
	 * Получение топ активностей по рейтингу
	 */
	static getTopRatedActivities(activities: Activity[], limit: number = 10): Activity[] {
		return ActivityFilters.topRated(activities, limit)
	}

	/**
	 * Получение рекомендованных мест (с отзывами)
	 */
	static getFeaturedPlaces(places: Place[], limit: number = 6): Place[] {
		return places
			.filter(place => place.reviewsCount && place.reviewsCount > 0)
			.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0))
			.slice(0, limit)
	}

	/**
	 * Получение рекомендованных активностей
	 */
	static getFeaturedActivities(activities: Activity[], limit: number = 5): Activity[] {
		return activities
			.filter(activity => activity.rating && activity.rating >= 4.0)
			.sort((a, b) => (b.rating || 0) - (a.rating || 0))
			.slice(0, limit)
	}

	/**
	 * Получение уникальных категорий для фильтров
	 */
	static getPlaceCategories(places: Place[]): string[] {
		const categories = new Set<string>()
		places.forEach(place => {
			if (place.categoryName) {
				categories.add(place.categoryName)
			}
		})
		return Array.from(categories).sort()
	}

	/**
	 * Получение уникальных городов для фильтров
	 */
	static getCities(places: Place[]): string[] {
		const cities = new Set<string>()
		places.forEach(place => {
			if (place.city) {
				cities.add(place.city)
			}
		})
		return Array.from(cities).sort()
	}

	/**
	 * Получение уникальных категорий активностей
	 */
	static getActivityCategories(activities: Activity[]): string[] {
		const categories = new Set<string>()
		activities.forEach(activity => {
			if (activity.category) {
				categories.add(activity.category)
			}
		})
		return Array.from(categories).sort()
	}

	/**
	 * Получение уникальных локаций активностей
	 */
	static getActivityLocations(activities: Activity[]): string[] {
		const locations = new Set<string>()
		activities.forEach(activity => {
			if (activity.location) {
				locations.add(activity.location)
			}
		})
		return Array.from(locations).sort()
	}

	/**
	 * Персонализированные рекомендации на основе истории просмотров
	 */
	static getPersonalizedRecommendations<T extends Place | Activity>(
		items: T[],
		userHistory: string[], // ID просмотренных элементов
		userPreferences: string[] // предпочитаемые категории
	): T[] {
		// Исключаем уже просмотренные
		const unseen = items.filter(item => !userHistory.includes(item.id))

		// Фильтруем по предпочтениям пользователя
		const preferred = unseen.filter(item => {
			const category = 'categoryName' in item ? item.categoryName : 
							 'category' in item ? item.category : ''
			return userPreferences.some(pref => 
				category?.toLowerCase().includes(pref.toLowerCase())
			)
		})

		// Если есть предпочтения, возвращаем их, иначе топ по рейтингу
		if (preferred.length > 0) {
			return this.sortByRating(preferred).slice(0, 10)
		}

		return this.sortByRating(unseen).slice(0, 10)
	}

	/**
	 * Рекомендации "Похожие места" на основе текущего места
	 */
	static getSimilarPlaces(currentPlace: Place, allPlaces: Place[], limit: number = 6): Place[] {
		const others = allPlaces.filter(place => place.id !== currentPlace.id)

		// Сначала ищем в той же категории
		const sameCategory = PlaceFilters.byCategory(others, currentPlace.categoryName || '')

		// Если мало мест в категории, ищем в том же городе
		if (sameCategory.length < limit && currentPlace.city) {
			const sameCity = PlaceFilters.byCity(others, currentPlace.city)
			return [...sameCategory, ...sameCity]
				.filter((place, index, arr) => arr.findIndex(p => p.id === place.id) === index) // убираем дубли
				.slice(0, limit)
		}

		return sameCategory.slice(0, limit)
	}

	/**
	 * Рекомендации "Похожие активности"
	 */
	static getSimilarActivities(currentActivity: Activity, allActivities: Activity[], limit: number = 6): Activity[] {
		const others = allActivities.filter(activity => activity.id !== currentActivity.id)

		// Ищем в той же категории
		const sameCategory = ActivityFilters.byCategory(others, currentActivity.category || '')

		// Если мало активностей в категории, ищем в той же локации
		if (sameCategory.length < limit && currentActivity.location) {
			const sameLocation = ActivityFilters.byLocation(others, currentActivity.location)
			return [...sameCategory, ...sameLocation]
				.filter((activity, index, arr) => arr.findIndex(a => a.id === activity.id) === index) // убираем дубли
				.slice(0, limit)
		}

		return sameCategory.slice(0, limit)
	}

	/**
	 * Рекомендации поблизости (для мест с координатами)
	 */
	static getNearbyPlaces(
		currentPlace: Place, 
		allPlaces: Place[], 
		radiusKm: number = 10, 
		limit: number = 6
	): Place[] {
		const others = allPlaces.filter(place => place.id !== currentPlace.id)

		return others.filter(place => {
			if (!place.lat || !place.lng || !currentPlace.lat || !currentPlace.lng) {
				return false
			}

			const distance = this.calculateDistance(
				currentPlace.lat, currentPlace.lng,
				place.lat, place.lng
			)

			return distance <= radiusKm
		}).slice(0, limit)
	}

	// === ПРИВАТНЫЕ УТИЛИТАРНЫЕ МЕТОДЫ ===

	/**
	 * Сортировка по рейтингу (универсальная)
	 */
	private static sortByRating<T extends { totalScore?: number | null; rating?: number | null }>(items: T[]): T[] {
		return items.sort((a, b) => {
			const aRating = (a.totalScore ?? a.rating) || 0
			const bRating = (b.totalScore ?? b.rating) || 0
			return bRating - aRating
		})
	}

	/**
	 * Расчет расстояния между двумя точками
	 */
	private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
		const R = 6371 // Радиус Земли в км
		const dLat = this.deg2rad(lat2 - lat1)
		const dLng = this.deg2rad(lng2 - lng1)
		const a = 
			Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
			Math.sin(dLng/2) * Math.sin(dLng/2)
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
		return R * c
	}

	private static deg2rad(deg: number): number {
		return deg * (Math.PI/180)
	}
} 