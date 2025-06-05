/**
 * Сервис поиска
 * Переиспользует утилиты фильтрации, добавляет продвинутый поиск
 */

import { Place, Activity } from '@/types'
import { PlaceFilters, ActivityFilters } from '@/lib/utils/filters'

export class SearchService {
	/**
	 * Базовый поиск мест по тексту
	 */
	static searchPlaces(places: Place[], query: string): Place[] {
		return PlaceFilters.search(places, query)
	}

	/**
	 * Базовый поиск активностей по тексту
	 */
	static searchActivities(activities: Activity[], query: string): Activity[] {
		return ActivityFilters.search(activities, query)
	}

	/**
	 * Продвинутый поиск мест с множественными критериями
	 */
	static advancedSearchPlaces(places: Place[], criteria: {
		query?: string
		category?: string
		city?: string
		minRating?: number
		maxDistance?: number
		userLat?: number
		userLng?: number
	}): Place[] {
		let results = [...places]

		// Поиск по тексту
		if (criteria.query) {
			results = PlaceFilters.search(results, criteria.query)
		}

		// Фильтр по категории
		if (criteria.category) {
			results = PlaceFilters.byCategory(results, criteria.category)
		}

		// Фильтр по городу
		if (criteria.city) {
			results = PlaceFilters.byCity(results, criteria.city)
		}

		// Фильтр по рейтингу
		if (criteria.minRating) {
			results = PlaceFilters.byRating(results, criteria.minRating)
		}

		// Фильтр по расстоянию
		if (criteria.maxDistance && criteria.userLat && criteria.userLng) {
			results = results.filter(place => {
				if (!place.lat || !place.lng) return false
				const distance = this.calculateDistance(
					criteria.userLat!, criteria.userLng!,
					place.lat, place.lng
				)
				return distance <= criteria.maxDistance!
			})
		}

		return results
	}

	/**
	 * Продвинутый поиск активностей
	 */
	static advancedSearchActivities(activities: Activity[], criteria: {
		query?: string
		category?: string
		location?: string
		minRating?: number
	}): Activity[] {
		let results = [...activities]

		// Поиск по тексту
		if (criteria.query) {
			results = ActivityFilters.search(results, criteria.query)
		}

		// Фильтр по категории
		if (criteria.category) {
			results = ActivityFilters.byCategory(results, criteria.category)
		}

		// Фильтр по локации
		if (criteria.location) {
			results = ActivityFilters.byLocation(results, criteria.location)
		}

		// Фильтр по рейтингу
		if (criteria.minRating) {
			results = ActivityFilters.byRating(results, criteria.minRating)
		}

		return results
	}

	/**
	 * Глобальный поиск по всем типам данных
	 */
	static globalSearch(
		places: Place[], 
		activities: Activity[], 
		query: string
	) {
		const foundPlaces = this.searchPlaces(places, query)
		const foundActivities = this.searchActivities(activities, query)

		return {
			places: foundPlaces,
			activities: foundActivities,
			total: foundPlaces.length + foundActivities.length
		}
	}

	/**
	 * Автодополнение для поиска
	 */
	static getSearchSuggestions(
		places: Place[], 
		activities: Activity[], 
		query: string, 
		limit: number = 10
	): string[] {
		const suggestions = new Set<string>()
		const lowerQuery = query.toLowerCase()

		// Предложения из названий мест
		places.forEach(place => {
			if (place.title?.toLowerCase().includes(lowerQuery)) {
				suggestions.add(place.title)
			}
			if (place.categoryName?.toLowerCase().includes(lowerQuery)) {
				suggestions.add(place.categoryName)
			}
			if (place.city?.toLowerCase().includes(lowerQuery)) {
				suggestions.add(place.city)
			}
		})

		// Предложения из активностей
		activities.forEach(activity => {
			if (activity.title?.toLowerCase().includes(lowerQuery)) {
				suggestions.add(activity.title)
			}
			if (activity.category?.toLowerCase().includes(lowerQuery)) {
				suggestions.add(activity.category)
			}
			if (activity.location?.toLowerCase().includes(lowerQuery)) {
				suggestions.add(activity.location)
			}
		})

		return Array.from(suggestions)
			.sort((a, b) => a.length - b.length) // сначала короткие
			.slice(0, limit)
	}

	/**
	 * Поиск по популярности (частота поиска)
	 */
	static getPopularSearchTerms(searchHistory: string[], limit: number = 10): string[] {
		const frequency: Record<string, number> = {}

		searchHistory.forEach(term => {
			frequency[term] = (frequency[term] || 0) + 1
		})

		return Object.entries(frequency)
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([term]) => term)
	}

	/**
	 * Поиск с учетом опечаток (простая реализация)
	 */
	static fuzzySearch<T extends Place | Activity>(
		items: T[], 
		query: string, 
		threshold: number = 0.7
	): T[] {
		const lowerQuery = query.toLowerCase()
		
		return items.filter(item => {
			const title = item.title?.toLowerCase() || ''
			const category = 'categoryName' in item ? 
				item.categoryName?.toLowerCase() : 
				'category' in item ? item.category?.toLowerCase() : ''

			// Простая проверка на частичное совпадение
			const titleMatch = this.getMatchScore(title, lowerQuery)
			const categoryMatch = this.getMatchScore(category || '', lowerQuery)

			return Math.max(titleMatch, categoryMatch) >= threshold
		})
	}

	// === ПРИВАТНЫЕ МЕТОДЫ ===

	/**
	 * Расчет расстояния между координатами
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

	/**
	 * Простой алгоритм оценки совпадения строк
	 */
	private static getMatchScore(text: string, query: string): number {
		if (!text || !query) return 0
		if (text.includes(query)) return 1

		// Проверяем на частичные совпадения
		const words = query.split(' ')
		const matchedWords = words.filter(word => text.includes(word))
		
		return matchedWords.length / words.length
	}
} 