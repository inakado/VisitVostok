// Основной экспорт сервисов
// Обновленная структура с разделением ответственности

// === ОСНОВНЫЕ СЕРВИСЫ ===
export { ActivitiesService } from './activities.service'
export { PlacesService } from './places.service'
export { UserService } from './user.service'
export { AdminService } from './admin.service'

// === API СЛОЙ ===
export { ActivitiesAPI } from './api/activities.api'
export { PlacesAPI } from './api/places.api'

// === БИЗНЕС-ЛОГИКА ===
export { CollectionsService } from './business/collections.service'
export { RecommendationsService } from './business/recommendations.service'

// === УТИЛИТЫ ===
export { SearchService } from './utils/search.service'

// === ЭКСПОРТ УДОБНЫХ МЕТОДОВ ===
// Для обратной совместимости

// Activities
export {
	getFeaturedActivities,
	getAllActivities,
	getActivityById,
	getActivitiesByCategory,
	getTopRatedActivities,
	createThematicCollections,
	searchActivities,
} from './activities.service'

// Places
export {
	getAllPlaces,
	getPlaceById,
	createPlace,
	updatePlace,
	deletePlace,
	getPlaceCategories,
	getPlaceCities,
	getTopRatedPlaces,
	getFeaturedPlaces,
} from './places.service'

// === ТИПЫ ДЛЯ TYPESCRIPT ===
export type {
	Place,
	Activity,
	User,
	PlaceFormData,
	ActivityFilters,
	PlaceFilters,
	ThematicCollection,
} from '@/types'

// === ЭКСПОРТ УДОБНЫХ ФУНКЦИЙ ===

// User
export {
	getCurrentUser,
	updateUserRole,
	isAuthenticated,
	logoutUser,
	userHasRole,
	isUserAdmin,
	isUserLocal,
	isUserTraveler,
} from './user.service'

// Admin
export {
	adminLogin,
	adminLogout,
	isAdminAuthenticated,
	getAdminStats,
	exportAllData,
	getSystemHealth,
} from './admin.service'

// === ЭКСПОРТ ТИПОВ ===

export type { AdminLoginData, AdminLoginResponse } from './admin.service'

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

// Функция для массовой инициализации сервисов (если понадобится)
export async function initializeServices(): Promise<void> {
	// Здесь можно добавить инициализацию кэша, предзагрузку данных и т.д.
	try {
		console.log('🔧 Инициализация сервисов...')
		// Пример: предзагрузка основных данных
		// await Promise.all([
		//   PlacesService.getCategories(),
		//   ActivitiesService.getCategories()
		// ])
		console.log('✅ Сервисы инициализированы')
	} catch (error) {
		console.error('❌ Ошибка инициализации сервисов:', error)
	}
} 