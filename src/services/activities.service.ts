// Обновленный сервис для работы с активностями
// Делегирует обязанности API слою, бизнес-логике и утилитам

import { Activity, ActivityFilters, ThematicCollection } from '@/types'
import { ActivitiesAPI } from './api/activities.api'
import { CollectionsService } from './business/collections.service'
import { RecommendationsService } from './business/recommendations.service'
import { SearchService } from './utils/search.service'

// === ОСНОВНЫЕ ОПЕРАЦИИ ===

export class ActivitiesService {
	// Получение рекомендованных активностей
	static async getFeatured(limit: number = 5): Promise<Activity[]> {
		return ActivitiesAPI.getFeatured(limit)
	}

	// Получение всех активностей
	static async getAll(limit: number = 50): Promise<Activity[]> {
		return ActivitiesAPI.getAll(limit)
	}

	// Получение активности по ID
	static async getById(id: string): Promise<Activity> {
		return ActivitiesAPI.getById(id)
	}

	// === МЕТОДЫ ФИЛЬТРАЦИИ ===

	// Получение активностей с фильтрацией
	static async getFiltered(filters: ActivityFilters): Promise<Activity[]> {
		return ActivitiesAPI.getFiltered(filters)
	}

	// Получение активностей по категории
	static async getByCategory(category: string): Promise<Activity[]> {
		return ActivitiesAPI.getByCategory(category)
	}

	// Получение активностей по местоположению
	static async getByLocation(location: string): Promise<Activity[]> {
		return ActivitiesAPI.getByLocation(location)
	}

	// === БИЗНЕС-ЛОГИКА (используем новые сервисы) ===

	// Получение уникальных категорий активностей
	static async getCategories(): Promise<string[]> {
		const activities = await this.getAll()
		return RecommendationsService.getActivityCategories(activities)
	}

	// Получение уникальных локаций
	static async getLocations(): Promise<string[]> {
		const activities = await this.getAll()
		return RecommendationsService.getActivityLocations(activities)
	}

	// Получение топ активностей по рейтингу
	static async getTopRated(limit: number = 10): Promise<Activity[]> {
		const activities = await this.getAll()
		return RecommendationsService.getTopRatedActivities(activities, limit)
	}

	// === ТЕМАТИЧЕСКИЕ КОЛЛЕКЦИИ (используем CollectionsService) ===

	// Создание тематических коллекций на основе категорий
	static async createThematicCollections(): Promise<ThematicCollection[]> {
		const activities = await this.getAll()
		return CollectionsService.createActivityCollections(activities)
	}

	// Получение природных активностей
	static async getNatureActivities(): Promise<ThematicCollection> {
		const activities = await this.getAll()
		return CollectionsService.createNatureCollection(activities)
	}

	// Получение культурных активностей
	static async getCulturalActivities(): Promise<ThematicCollection> {
		const activities = await this.getAll()
		return CollectionsService.createCulturalCollection(activities)
	}

	// === ПОИСК (используем SearchService) ===

	// Поиск активностей по тексту
	static async search(query: string): Promise<Activity[]> {
		const activities = await this.getAll()
		return SearchService.searchActivities(activities, query)
	}

	// Продвинутый поиск
	static async advancedSearch(criteria: {
		query?: string
		category?: string
		location?: string
		minRating?: number
	}): Promise<Activity[]> {
		const activities = await this.getAll()
		return SearchService.advancedSearchActivities(activities, criteria)
	}

	// === РЕКОМЕНДАЦИИ ===

	// Похожие активности
	static async getSimilar(activityId: string, limit: number = 6): Promise<Activity[]> {
		const [currentActivity, allActivities] = await Promise.all([
			this.getById(activityId),
			this.getAll()
		])
		
		return RecommendationsService.getSimilarActivities(currentActivity, allActivities, limit)
	}

	// Персонализированные рекомендации
	static async getPersonalized(
		userHistory: string[], 
		userPreferences: string[], 
		limit: number = 10
	): Promise<Activity[]> {
		const activities = await this.getAll()
		return RecommendationsService.getPersonalizedRecommendations(
			activities, 
			userHistory, 
			userPreferences
		).slice(0, limit)
	}

	// === АДМИНСКИЕ МЕТОДЫ ===

	// Создание новой активности
	static async create(data: Partial<Activity>): Promise<Activity> {
		return ActivitiesAPI.create(data)
	}

	// Обновление активности
	static async update(id: string, data: Partial<Activity>): Promise<Activity> {
		return ActivitiesAPI.update(id, data)
	}

	// Удаление активности
	static async delete(id: string): Promise<{ success: boolean }> {
		return ActivitiesAPI.delete(id)
	}
}

// === ЭКСПОРТ ДЛЯ УДОБСТВА ===

// Экспортируем основные методы для быстрого доступа
export const {
	getFeatured: getFeaturedActivities,
	getAll: getAllActivities,
	getById: getActivityById,
	getByCategory: getActivitiesByCategory,
	getTopRated: getTopRatedActivities,
	createThematicCollections,
	search: searchActivities,
} = ActivitiesService 