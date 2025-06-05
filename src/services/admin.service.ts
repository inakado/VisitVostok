// Сервис для работы с админ-функциями (Admin)
// Централизует всю логику API вызовов для администрирования

import { apiClient } from '@/lib/api-client'

// === ТИПЫ ДЛЯ АДМИНКИ ===

interface AdminLoginData {
	username: string
	password: string
}

interface AdminLoginResponse {
	success: boolean
	message?: string
}

// === ОСНОВНЫЕ ОПЕРАЦИИ ===

export class AdminService {
	// Авторизация администратора
	static async login(credentials: AdminLoginData): Promise<AdminLoginResponse> {
		try {
			const response = await apiClient.post<{ success: boolean }>('/admin/login', credentials)
			return {
				success: response.data.success,
				message: response.data.success ? 'Успешный вход' : 'Ошибка входа'
			}
		} catch (error: unknown) {
			const typedError = error as { response?: { data?: { error?: string } } }
			return {
				success: false,
				message: typedError.response?.data?.error || 'Ошибка сети'
			}
		}
	}

	// Выход из админки
	static async logout(): Promise<void> {
		await apiClient.post('/admin/logout')
	}

	// Проверка статуса авторизации админа
	static async isAuthenticated(): Promise<boolean> {
		try {
			const response = await apiClient.get<{ authenticated: boolean }>('/admin/status')
			return response.data.authenticated
		} catch {
			return false
		}
	}

	// === СТАТИСТИЧЕСКИЕ МЕТОДЫ ===

	// Получение общей статистики
	static async getStats(): Promise<{
		totalPlaces: number
		totalActivities: number
		totalUsers: number
		topCategories: { category: string; count: number }[]
	}> {
		// Пока нет специального endpoint, собираем статистику из доступных данных
		try {
			const [placesResponse, activitiesResponse] = await Promise.all([
				apiClient.get<Array<{ categoryName: string }>>('/places'),
				apiClient.get<Array<unknown>>('/activities')
			])

			const places = placesResponse.data
			const activities = activitiesResponse.data

			// Подсчет категорий
			const categoryCount: Record<string, number> = {}
			places.forEach(place => {
				const category = place.categoryName
				categoryCount[category] = (categoryCount[category] || 0) + 1
			})

			const topCategories = Object.entries(categoryCount)
				.map(([category, count]) => ({ category, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 5)

			return {
				totalPlaces: places.length,
				totalActivities: activities.length,
				totalUsers: 0, // Пока нет endpoint для пользователей
				topCategories
			}
		} catch {
			return {
				totalPlaces: 0,
				totalActivities: 0,
				totalUsers: 0,
				topCategories: []
			}
		}
	}

	// === МЕТОДЫ УПРАВЛЕНИЯ ДАННЫМИ ===

	// Экспорт всех данных
	static async exportAllData(): Promise<{
		places: Array<unknown>
		activities: Array<unknown>
		timestamp: string
	}> {
		const [placesResponse, activitiesResponse] = await Promise.all([
			apiClient.get<Array<unknown>>('/places'),
			apiClient.get<Array<unknown>>('/activities')
		])

		return {
			places: placesResponse.data,
			activities: activitiesResponse.data,
			timestamp: new Date().toISOString()
		}
	}

	// Очистка кэша (если будет реализовано)
	static async clearCache(): Promise<void> {
		try {
			await apiClient.post('/admin/clear-cache')
		} catch (error: unknown) {
			console.warn('Cache clearing not implemented:', error)
		}
	}

	// === МЕТОДЫ МОНИТОРИНГА ===

	// Получение логов системы (если будет реализовано)
	static async getLogs(limit: number = 100): Promise<Array<unknown>> {
		try {
			const response = await apiClient.get<Array<unknown>>('/admin/logs', { limit })
			return response.data
		} catch {
			return []
		}
	}

	// Проверка состояния системы
	static async getSystemHealth(): Promise<{
		status: 'healthy' | 'warning' | 'error'
		checks: {
			database: boolean
			api: boolean
			cache?: boolean
		}
	}> {
		try {
			// Простая проверка доступности основных endpoints
			const [placesCheck, activitiesCheck] = await Promise.allSettled([
				apiClient.get('/places'),
				apiClient.get('/activities')
			])

			const databaseOk = placesCheck.status === 'fulfilled'
			const apiOk = activitiesCheck.status === 'fulfilled'

			const allOk = databaseOk && apiOk
			const status = allOk ? 'healthy' : 'warning'

			return {
				status,
				checks: {
					database: databaseOk,
					api: apiOk
				}
			}
		} catch {
			return {
				status: 'error',
				checks: {
					database: false,
					api: false
				}
			}
		}
	}

	// === УТИЛИТАРНЫЕ МЕТОДЫ ===

	// Валидация админских прав перед выполнением операций
	static async validateAdminAccess(): Promise<void> {
		const isAuth = await this.isAuthenticated()
		if (!isAuth) {
			throw new Error('Необходима авторизация администратора')
		}
	}
}

// === ЭКСПОРТ ДЛЯ УДОБСТВА ===

// Экспортируем основные методы для быстрого доступа
export const {
	login: adminLogin,
	logout: adminLogout,
	isAuthenticated: isAdminAuthenticated,
	getStats: getAdminStats,
	exportAllData,
	getSystemHealth,
} = AdminService

// Экспортируем типы
export type { AdminLoginData, AdminLoginResponse } 