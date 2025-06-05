/**
 * API слой для активностей
 * Только HTTP запросы, без бизнес-логики
 */

import { apiClient } from '@/lib/api-client'
import { Activity, ActivityFilters } from '@/types'

export class ActivitiesAPI {
	/**
	 * Получение всех активностей
	 */
	static async getAll(limit?: number): Promise<Activity[]> {
		const params: Record<string, string | number> = {}
		if (limit !== undefined) {
			params.limit = limit
		}
		const response = await apiClient.get<Activity[]>('/activities', params)
		return response.data
	}

	/**
	 * Получение рекомендованных активностей
	 */
	static async getFeatured(limit?: number): Promise<Activity[]> {
		const params: Record<string, string | number> = { featured: 'true' }
		if (limit) params.limit = limit
		
		const response = await apiClient.get<Activity[]>('/activities', params)
		return response.data
	}

	/**
	 * Получение активности по ID
	 */
	static async getById(id: string): Promise<Activity> {
		const response = await apiClient.get<Activity>(`/activities/${id}`)
		return response.data
	}

	/**
	 * Получение активностей с фильтрами
	 */
	static async getFiltered(filters: ActivityFilters): Promise<Activity[]> {
		const params: Record<string, string | number> = {}
		
		if (filters.featured) params.featured = 'true'
		if (filters.category) params.category = filters.category
		if (filters.limit) params.limit = filters.limit
		
		const response = await apiClient.get<Activity[]>('/activities', params)
		return response.data
	}

	/**
	 * Получение активностей по категории
	 */
	static async getByCategory(category: string): Promise<Activity[]> {
		const response = await apiClient.get<Activity[]>('/activities', { category })
		return response.data
	}

	/**
	 * Получение активностей по местоположению
	 */
	static async getByLocation(location: string): Promise<Activity[]> {
		const response = await apiClient.get<Activity[]>('/activities', { location })
		return response.data
	}

	/**
	 * Создание новой активности (для админки)
	 */
	static async create(data: Partial<Activity>): Promise<Activity> {
		const response = await apiClient.post<Activity>('/activities', data)
		return response.data
	}

	/**
	 * Обновление активности (для админки)
	 */
	static async update(id: string, data: Partial<Activity>): Promise<Activity> {
		const response = await apiClient.put<Activity>(`/activities/${id}`, data)
		return response.data
	}

	/**
	 * Удаление активности (для админки)
	 */
	static async delete(id: string): Promise<{ success: boolean }> {
		const response = await apiClient.delete<{ success: boolean }>(`/activities/${id}`)
		return response.data
	}
} 