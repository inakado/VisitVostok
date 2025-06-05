/**
 * API слой для мест
 * Только HTTP запросы, без бизнес-логики
 */

import { apiClient } from '@/lib/api-client'
import { Place, PlaceFormData, PlaceFilters } from '@/types'

export class PlacesAPI {
	/**
	 * Получение всех мест
	 */
	static async getAll(): Promise<Place[]> {
		const response = await apiClient.get<Place[]>('/places')
		return response.data
	}

	/**
	 * Получение места по ID
	 */
	static async getById(id: string): Promise<Place> {
		const response = await apiClient.get<Place>(`/places/${id}`)
		return response.data
	}

	/**
	 * Создание нового места
	 */
	static async create(data: PlaceFormData): Promise<Place> {
		const response = await apiClient.post<Place>('/places', data)
		return response.data
	}

	/**
	 * Обновление места
	 */
	static async update(id: string, data: PlaceFormData): Promise<Place> {
		const response = await apiClient.put<Place>(`/places/${id}`, data)
		return response.data
	}

	/**
	 * Удаление места
	 */
	static async delete(id: string): Promise<{ success: boolean }> {
		const response = await apiClient.delete<{ success: boolean }>(`/places/${id}`)
		return response.data
	}

	/**
	 * Получение мест с фильтрами
	 */
	static async getFiltered(filters: PlaceFilters): Promise<Place[]> {
		const params: Record<string, string | number> = {}
		
		if (filters.category) params.category = filters.category
		if (filters.city) params.city = filters.city
		if (filters.minRating) params.minRating = filters.minRating
		if (filters.searchQuery) params.q = filters.searchQuery
		
		const response = await apiClient.get<Place[]>('/places', params)
		return response.data
	}

	/**
	 * Получение мест по категории
	 */
	static async getByCategory(category: string): Promise<Place[]> {
		const response = await apiClient.get<Place[]>('/places', { category })
		return response.data
	}

	/**
	 * Получение мест по городу
	 */
	static async getByCity(city: string): Promise<Place[]> {
		const response = await apiClient.get<Place[]>('/places', { city })
		return response.data
	}

	/**
	 * Пакетные операции для админки
	 */
	static async bulkUpdate(updates: Array<{ id: string; data: Partial<PlaceFormData> }>): Promise<Place[]> {
		const response = await apiClient.post<Place[]>('/places/bulk-update', { updates })
		return response.data
	}

	/**
	 * Пакетное удаление
	 */
	static async bulkDelete(ids: string[]): Promise<{ deleted: number }> {
		const response = await apiClient.post<{ deleted: number }>('/places/bulk-delete', { ids })
		return response.data
	}
} 