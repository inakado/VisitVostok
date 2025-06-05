// Сервис для работы с пользователями (User)
// Централизует всю логику API вызовов для пользователей

import { apiClient } from '@/lib/api-client'
import { User, UserRole } from '@/types'

// === ОСНОВНЫЕ ОПЕРАЦИИ ===

export class UserService {
	// Получение текущего пользователя
	static async getCurrentUser(): Promise<User | null> {
		try {
			const response = await apiClient.get<User>('/auth/me')
			return response.data
		} catch {
			// Пользователь не авторизован
			return null
		}
	}

	// Обновление роли пользователя
	static async updateRole(role: UserRole): Promise<User> {
		const response = await apiClient.post<User>('/user/role', { role })
		return response.data
	}

	// Получение профиля пользователя
	static async getProfile(): Promise<User> {
		const response = await apiClient.get<User>('/me')
		return response.data
	}

	// === МЕТОДЫ АУТЕНТИФИКАЦИИ ===

	// Проверка статуса авторизации
	static async isAuthenticated(): Promise<boolean> {
		try {
			await this.getCurrentUser()
			return true
		} catch {
			return false
		}
	}

	// Выход из системы (очистка куки)
	static async logout(): Promise<void> {
		// В данном случае logout происходит через удаление куки на сервере
		// Можно добавить специальный endpoint для этого
		try {
			await apiClient.post('/auth/logout')
		} catch (error) {
			// Игнорируем ошибки logout
			console.warn('Logout error:', error)
		}
	}

	// === УТИЛИТАРНЫЕ МЕТОДЫ ===

	// Проверка роли пользователя
	static async hasRole(requiredRole: UserRole): Promise<boolean> {
		try {
			const user = await this.getCurrentUser()
			return user?.role === requiredRole || false
		} catch {
			return false
		}
	}

	// Проверка, является ли пользователь администратором
	static async isAdmin(): Promise<boolean> {
		// Пока роли admin нет в enum, но можно добавить проверку
		try {
			const user = await this.getCurrentUser()
			// Добавим логику для admin когда будет необходимо
			return user?.role === 'local' // временно используем local как админ
		} catch {
			return false
		}
	}

	// Проверка, является ли пользователь местным жителем
	static async isLocal(): Promise<boolean> {
		return this.hasRole('local')
	}

	// Проверка, является ли пользователь путешественником
	static async isTraveler(): Promise<boolean> {
		return this.hasRole('traveler')
	}

	// === МЕТОДЫ ДЛЯ РАБОТЫ С ИЗБРАННЫМ (если понадобится) ===

	// В будущем можно добавить методы для работы с избранными местами
	// static async getFavoritePlaces(): Promise<Place[]>
	// static async addToFavorites(placeId: string): Promise<void>
	// static async removeFromFavorites(placeId: string): Promise<void>

	// === МЕТОДЫ ДЛЯ РАБОТЫ С ПОСЕЩЕННЫМИ МЕСТАМИ ===

	// Получение посещенных мест (если понадобится)
	// static async getVisitedPlaces(): Promise<Place[]>
	// static async markAsVisited(placeId: string): Promise<void>
	// static async unmarkAsVisited(placeId: string): Promise<void>
}

// === ЭКСПОРТ ДЛЯ УДОБСТВА ===

// Экспортируем основные методы для быстрого доступа
export const {
	getCurrentUser,
	updateRole: updateUserRole,
	isAuthenticated,
	logout: logoutUser,
	hasRole: userHasRole,
	isAdmin: isUserAdmin,
	isLocal: isUserLocal,
	isTraveler: isUserTraveler,
} = UserService 