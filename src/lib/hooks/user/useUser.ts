// Обновленный хук для работы с пользователями
// Заменяет старый useUser.ts и использует UserService

import { useApi, useMutation } from '../common/useApi'
import { UserService } from '@/services'
import { User, UserRole } from '@/types'
import { CACHE_CONFIG } from '@/lib/config'

// === ОСНОВНОЙ ХУК ДЛЯ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ===

export function useUser() {
	const userQuery = useApi(
		() => UserService.getCurrentUser(),
		[],
		{
			cacheKey: 'current_user',
			cacheTime: CACHE_CONFIG.USER.PROFILE,
			retryOnError: false // не повторяем если пользователь не авторизован
		}
	)

	return {
		user: userQuery.data,
		isLoading: userQuery.isLoading,
		error: userQuery.error,
		isAuthenticated: userQuery.data !== null,
		refetch: userQuery.refetch,
		reset: userQuery.reset
	}
}

// === ХУК ДЛЯ ПРОВЕРКИ АВТОРИЗАЦИИ ===

export function useAuth() {
	const { user, isLoading, refetch } = useUser()

	return {
		user,
		isLoading,
		isAuthenticated: user !== null,
		isLocal: user?.role === 'local',
		isTraveler: user?.role === 'traveler',
		refetch
	}
}

// === ХУК ДЛЯ ОБНОВЛЕНИЯ РОЛИ ПОЛЬЗОВАТЕЛЯ ===

export function useUpdateUserRole() {
	const { refetch: refetchUser } = useUser()
	
	const mutation = useMutation<User, UserRole>(
		(role: UserRole) => UserService.updateRole(role)
	)

	const updateRole = async (role: UserRole) => {
		try {
			const updatedUser = await mutation.mutate(role)
			// Обновляем кэш пользователя
			refetchUser()
			return updatedUser
		} catch (error) {
			throw error
		}
	}

	return {
		updateRole,
		isLoading: mutation.isLoading,
		error: mutation.error,
		isSuccess: mutation.isSuccess,
		reset: mutation.reset
	}
}

// === ХУК ДЛЯ ВЫХОДА ИЗ СИСТЕМЫ ===

export function useLogout() {
	const { reset: resetUser } = useUser()
	
	const mutation = useMutation<void, void>(
		() => UserService.logout()
	)

	const logout = async () => {
		try {
			await mutation.mutate()
			// Очищаем кэш пользователя
			resetUser()
			// Очищаем весь localStorage
			if (typeof window !== 'undefined') {
				localStorage.clear()
			}
		} catch {
			// Даже если logout на сервере не сработал, очищаем локально
			resetUser()
			if (typeof window !== 'undefined') {
				localStorage.clear()
			}
		}
	}

	return {
		logout,
		isLoading: mutation.isLoading,
		error: mutation.error
	}
}

// === ХУК ДЛЯ ПРОВЕРКИ РОЛЕЙ ===

export function useUserRole(requiredRole?: UserRole) {
	const { user, isLoading } = useUser()

	const hasRole = (role: UserRole) => user?.role === role
	const hasRequiredRole = requiredRole ? hasRole(requiredRole) : true

	return {
		user,
		isLoading,
		currentRole: user?.role || null,
		hasRole,
		hasRequiredRole,
		isLocal: hasRole('local'),
		isTraveler: hasRole('traveler'),
		// Вспомогательные проверки
		canEdit: hasRole('local'), // местные жители могут редактировать
		canView: true // все могут просматривать
	}
}

// === ХУК ДЛЯ ЗАЩИЩЕННЫХ МАРШРУТОВ ===

export function useAuthGuard(requiredRole?: UserRole) {
	const { user, isLoading } = useUser()
	const { hasRequiredRole } = useUserRole(requiredRole)

	const isAuthorized = user !== null && hasRequiredRole
	const needsAuth = !user && !isLoading
	const insufficientRole = user && !hasRequiredRole

	return {
		user,
		isLoading,
		isAuthorized,
		needsAuth,
		insufficientRole,
		// Функции для UI
		showLogin: needsAuth,
		showAccessDenied: insufficientRole,
		showContent: isAuthorized
	}
}

// === СОСТАВНОЙ ХУК ДЛЯ PROFILE КОМПОНЕНТА ===

export function useUserProfile() {
	const { user, isLoading, error, refetch } = useUser()
	const { updateRole, isLoading: isUpdating } = useUpdateUserRole()
	const { logout, isLoading: isLoggingOut } = useLogout()

	return {
		// Данные пользователя
		user,
		isLoading,
		error,
		
		// Функции
		updateRole,
		logout,
		refetch,
		
		// Состояния операций
		isUpdating,
		isLoggingOut,
		
		// Вспомогательные флаги
		canUpdateRole: user !== null,
		hasProfile: user !== null
	}
} 