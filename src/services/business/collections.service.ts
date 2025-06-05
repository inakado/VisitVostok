/**
 * Сервис для создания тематических коллекций
 * Чистая бизнес-логика без API вызовов
 */

import { Place, Activity, ThematicCollection } from '@/types'
import { ActivityFilters, PlaceFilters } from '@/lib/utils/filters'

export class CollectionsService {
	/**
	 * Создание тематических коллекций активностей
	 */
	static createActivityCollections(activities: Activity[]): ThematicCollection[] {
		const collections: ThematicCollection[] = []

		// Группируем по категориям
		const categoryGroups: Record<string, Activity[]> = {}
		activities.forEach(activity => {
			if (!categoryGroups[activity.category]) {
				categoryGroups[activity.category] = []
			}
			categoryGroups[activity.category].push(activity)
		})

		// Создаем коллекции только для категорий с достаточным количеством активностей
		for (const [category, categoryActivities] of Object.entries(categoryGroups)) {
			if (categoryActivities.length >= 2) {
				collections.push({
					title: this.getCategoryTitle(category),
					activities: categoryActivities.slice(0, 6) // Ограничиваем до 6 активностей
				})
			}
		}

		return collections
	}

	/**
	 * Создание коллекции природных активностей
	 */
	static createNatureCollection(activities: Activity[]): ThematicCollection {
		const natureActivities = ActivityFilters.nature(activities)

		return {
			title: 'Природные активности',
			activities: natureActivities.slice(0, 6)
		}
	}

	/**
	 * Создание коллекции культурных активностей
	 */
	static createCulturalCollection(activities: Activity[]): ThematicCollection {
		const culturalActivities = ActivityFilters.cultural(activities)

		return {
			title: 'Культурные мероприятия',
			activities: culturalActivities.slice(0, 6)
		}
	}

	/**
	 * Создание коллекций мест по типам
	 */
	static createPlaceCollections(places: Place[], topRated: Place[]) {
		const collections = []

		// Популярные достопримечательности
		const landmarks = PlaceFilters.landmarks(places)
			.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0))
			.slice(0, 8)

		if (landmarks.length > 0) {
			collections.push({ title: "Популярные достопримечательности", places: landmarks })
		}

		// Места с высоким рейтингом
		if (topRated.length > 0) {
			collections.push({ title: "Места с высоким рейтингом", places: topRated.slice(0, 8) })
		}

		// Музеи и культурные места
		const museums = PlaceFilters.museums(places).slice(0, 8)
		if (museums.length > 0) {
			collections.push({ title: "Музеи и культурные места", places: museums })
		}

		// Природные места
		const nature = PlaceFilters.nature(places).slice(0, 8)
		if (nature.length > 0) {
			collections.push({ title: "Природные места", places: nature })
		}

		return collections
	}

	/**
	 * Создание персонализированных коллекций на основе предпочтений пользователя
	 */
	static createPersonalizedCollections(
		activities: Activity[], 
		userInterests: string[]
	): ThematicCollection[] {
		const collections: ThematicCollection[] = []

		userInterests.forEach(interest => {
			const relatedActivities = activities.filter(activity =>
				activity.category.toLowerCase().includes(interest.toLowerCase()) ||
				activity.title.toLowerCase().includes(interest.toLowerCase()) ||
				activity.location.toLowerCase().includes(interest.toLowerCase())
			)

			if (relatedActivities.length > 0) {
				collections.push({
					title: `${interest} - для вас`,
					activities: relatedActivities.slice(0, 6)
				})
			}
		})

		return collections
	}

	/**
	 * Создание коллекции "близко к вам" на основе геолокации
	 */
	static createNearbyCollection(
		activities: Activity[], 
		userLat: number, 
		userLng: number, 
		radiusKm: number = 20
	): ThematicCollection {
		const nearbyActivities = activities.filter(activity => {
			const distance = this.calculateDistance(
				userLat, userLng,
				activity.coordinates.lat, activity.coordinates.lng
			)
			return distance <= radiusKm
		})

		return {
			title: `Рядом с вами (в радиусе ${radiusKm} км)`,
			activities: nearbyActivities.slice(0, 6)
		}
	}

	// === ПРИВАТНЫЕ МЕТОДЫ ===

	/**
	 * Получение красивого названия категории для коллекции
	 */
	private static getCategoryTitle(category: string): string {
		const categoryTitles: Record<string, string> = {
			'Парк': 'Природные парки и заповедники',
			'Музей': 'Музеи и культурные объекты',
			'Пляж': 'Морские развлечения',
			'Театр': 'Театры и представления',
			'Ресторан': 'Гастрономические места',
			'Отель': 'Места для проживания',
			'Достопримечательность': 'Популярные достопримечательности'
		}

		return categoryTitles[category] || `${category} активности`
	}

	/**
	 * Расчет расстояния между двумя точками (формула гаверсинусов)
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