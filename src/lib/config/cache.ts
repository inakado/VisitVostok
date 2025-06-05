/**
 * Конфигурация времени кэширования для различных типов данных
 * Все значения в миллисекундах
 */
export const CACHE_CONFIG = {
	ACTIVITIES: {
		ALL: 10 * 60 * 1000,           // 10 минут - основные данные
		FEATURED: 15 * 60 * 1000,      // 15 минут - рекомендованные
		DETAILS: 15 * 60 * 1000,       // 15 минут - детали активности
		FILTERED: 5 * 60 * 1000,       // 5 минут - фильтрованные данные
		COLLECTIONS: 20 * 60 * 1000,   // 20 минут - тематические коллекции
		SEARCH: 5 * 60 * 1000,         // 5 минут - результаты поиска
		TOP_RATED: 20 * 60 * 1000,     // 20 минут - топ по рейтингу
		CATEGORIES: 30 * 60 * 1000,    // 30 минут - категории (редко меняются)
		LOCATIONS: 30 * 60 * 1000,     // 30 минут - локации (редко меняются)
		NATURE: 20 * 60 * 1000,        // 20 минут - природные активности
		CULTURAL: 20 * 60 * 1000,      // 20 минут - культурные активности
	},
	
	PLACES: {
		ALL: 10 * 60 * 1000,           // 10 минут - основные данные
		FEATURED: 15 * 60 * 1000,      // 15 минут - рекомендованные места
		DETAILS: 15 * 60 * 1000,       // 15 минут - детали места
		FILTERED: 5 * 60 * 1000,       // 5 минут - фильтрованные данные
		CATEGORIES: 30 * 60 * 1000,    // 30 минут - категории
		CITIES: 30 * 60 * 1000,        // 30 минут - города
		TOP_RATED: 20 * 60 * 1000,     // 20 минут - топ по рейтингу
		NEARBY: 10 * 60 * 1000,        // 10 минут - близлежащие места
	},
	
	USER: {
		PROFILE: 15 * 60 * 1000,       // 15 минут - профиль пользователя
		ROLE: 30 * 60 * 1000,          // 30 минут - роль пользователя
	},
	
	ADMIN: {
		PLACES: 5 * 60 * 1000,         // 5 минут - админские данные обновляются чаще
		STATS: 10 * 60 * 1000,         // 10 минут - статистика
		LOGS: 2 * 60 * 1000,           // 2 минуты - логи обновляются часто
	},
} as const

/**
 * Утилиты для работы с кэшем
 */
export const CacheUtils = {
	/**
	 * Получение времени кэширования по типу и подтипу
	 */
	getTime: (type: keyof typeof CACHE_CONFIG, subtype: string): number => {
		const typeConfig = CACHE_CONFIG[type] as Record<string, number>
		return typeConfig[subtype.toUpperCase()] || typeConfig.ALL || 10 * 60 * 1000
	},
	
	/**
	 * Генерация ключа кэша
	 */
	generateKey: (prefix: string, ...parts: (string | number)[]): string => {
		return [prefix, ...parts.filter(Boolean)].join('_')
	},
	
	/**
	 * Проверка валидности кэша
	 */
	isExpired: (timestamp: number, cacheTime: number): boolean => {
		return Date.now() - timestamp > cacheTime
	},
} as const 