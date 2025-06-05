// Обновленный сервис для работы с местами
// Делегирует обязанности API слою, бизнес-логике и утилитам

import { Place, PlaceFormData, PlaceFilters } from '@/types'
import { PlacesAPI } from './api/places.api'
import { RecommendationsService } from './business/recommendations.service'
import { SearchService } from './utils/search.service'

// === ОСНОВНЫЕ ОПЕРАЦИИ CRUD ===

export class PlacesService {
	// Получение всех мест
	static async getAll(): Promise<Place[]> {
		return PlacesAPI.getAll()
	}

	// Получение места по ID
	static async getById(id: string): Promise<Place> {
		return PlacesAPI.getById(id)
	}

	// Создание нового места
	static async create(data: PlaceFormData): Promise<Place> {
		return PlacesAPI.create(data)
	}

	// Обновление места
	static async update(id: string, data: PlaceFormData): Promise<Place> {
		return PlacesAPI.update(id, data)
	}

	// Удаление места
	static async delete(id: string): Promise<{ success: boolean }> {
		return PlacesAPI.delete(id)
	}

	// === МЕТОДЫ ФИЛЬТРАЦИИ И ПОИСКА ===

	// Получение мест с фильтрацией
	static async getFiltered(filters: PlaceFilters): Promise<Place[]> {
		return PlacesAPI.getFiltered(filters)
	}

	// Получение мест по категории
	static async getByCategory(category: string): Promise<Place[]> {
		return PlacesAPI.getByCategory(category)
	}

	// Получение мест по городу
	static async getByCity(city: string): Promise<Place[]> {
		return PlacesAPI.getByCity(city)
	}

	// === БИЗНЕС-ЛОГИКА (используем новые сервисы) ===

	// Получение уникальных категорий
	static async getCategories(): Promise<string[]> {
		const places = await this.getAll()
		return RecommendationsService.getPlaceCategories(places)
	}

	// Получение уникальных городов
	static async getCities(): Promise<string[]> {
		const places = await this.getAll()
		return RecommendationsService.getCities(places)
	}

	// Получение топ мест по рейтингу
	static async getTopRated(limit: number = 10): Promise<Place[]> {
		const places = await this.getAll()
		return RecommendationsService.getTopRatedPlaces(places, limit)
	}

	// Получение рекомендованных мест (с отзывами)
	static async getFeatured(limit: number = 6): Promise<Place[]> {
		const places = await this.getAll()
		return RecommendationsService.getFeaturedPlaces(places, limit)
	}

	// === ПОИСК (используем SearchService) ===

	// Базовый поиск мест
	static async search(query: string): Promise<Place[]> {
		const places = await this.getAll()
		return SearchService.searchPlaces(places, query)
	}

	// Продвинутый поиск
	static async advancedSearch(criteria: {
		query?: string
		category?: string
		city?: string
		minRating?: number
		maxDistance?: number
		userLat?: number
		userLng?: number
	}): Promise<Place[]> {
		const places = await this.getAll()
		return SearchService.advancedSearchPlaces(places, criteria)
	}

	// === РЕКОМЕНДАЦИИ ===

	// Похожие места
	static async getSimilar(placeId: string, limit: number = 6): Promise<Place[]> {
		const [currentPlace, allPlaces] = await Promise.all([
			this.getById(placeId),
			this.getAll()
		])
		
		return RecommendationsService.getSimilarPlaces(currentPlace, allPlaces, limit)
	}

	// Места поблизости
	static async getNearby(
		placeId: string, 
		radiusKm: number = 10, 
		limit: number = 6
	): Promise<Place[]> {
		const [currentPlace, allPlaces] = await Promise.all([
			this.getById(placeId),
			this.getAll()
		])
		
		return RecommendationsService.getNearbyPlaces(currentPlace, allPlaces, radiusKm, limit)
	}

	// Персонализированные рекомендации
	static async getPersonalized(
		userHistory: string[], 
		userPreferences: string[], 
		limit: number = 10
	): Promise<Place[]> {
		const places = await this.getAll()
		return RecommendationsService.getPersonalizedRecommendations(
			places, 
			userHistory, 
			userPreferences
		).slice(0, limit)
	}

	// === УТИЛИТАРНЫЕ МЕТОДЫ ===

	// Экспорт мест в JSON
	static async exportToJSON(): Promise<string> {
		const places = await this.getAll()
		return JSON.stringify(places, null, 2)
	}

	// Поиск мест поблизости по координатам
	static async getNearbyByCoordinates(
		lat: number, 
		lng: number, 
		radiusKm: number = 10
	): Promise<Place[]> {
		const places = await this.getAll()
		
		return places.filter(place => {
			if (!place.lat || !place.lng) return false
			const distance = this.calculateDistance(lat, lng, place.lat, place.lng)
			return distance <= radiusKm
		})
	}

	// === АДМИНСКИЕ МЕТОДЫ ===

	// Пакетные операции
	static async bulkUpdate(updates: Array<{ id: string; data: Partial<PlaceFormData> }>): Promise<Place[]> {
		return PlacesAPI.bulkUpdate(updates)
	}

	static async bulkDelete(ids: string[]): Promise<{ deleted: number }> {
		return PlacesAPI.bulkDelete(ids)
	}

	// === ПРИВАТНЫЕ УТИЛИТАРНЫЕ МЕТОДЫ ===

	// Расчет расстояния между двумя точками (формула гаверсинусов)
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

// === ЭКСПОРТ ДЛЯ УДОБСТВА ===

// Экспортируем основные методы для быстрого доступа
export const {
	getAll: getAllPlaces,
	getById: getPlaceById,
	create: createPlace,
	update: updatePlace,
	delete: deletePlace,
	getCategories: getPlaceCategories,
	getCities: getPlaceCities,
	getTopRated: getTopRatedPlaces,
	getFeatured: getFeaturedPlaces,
} = PlacesService 