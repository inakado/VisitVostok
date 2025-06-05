/**
 * Конфигурация для API запросов
 */
export const API_CONFIG = {
	/**
	 * Настройки повторных попыток
	 */
	RETRY: {
		COUNT: 2,                    // Количество попыток для основных запросов
		DELAY: 1000,                 // Задержка между попытками (мс)
		BACKOFF_MULTIPLIER: 1.5,     // Множитель для экспоненциального backoff
	},
	
	/**
	 * Лимиты по умолчанию для различных типов данных
	 */
	LIMITS: {
		ACTIVITIES: {
			ALL: 50,                 // Общий список активностей
			FEATURED: 5,             // Рекомендованные активности
			TOP_RATED: 10,           // Топ по рейтингу
			SEARCH_RESULTS: 20,      // Результаты поиска
			COLLECTIONS: 6,          // Элементов в коллекции
		},
		PLACES: {
			ALL: 50,                 // Общий список мест
			FEATURED: 6,             // Рекомендованные места
			TOP_RATED: 10,           // Топ по рейтингу
			NEARBY: 20,              // Близлежащие места
			ADMIN_PAGE: 20,          // Админка - места на странице
		},
		ADMIN: {
			LOGS: 100,               // Логи в админке
			PLACES_PAGE: 20,         // Места на странице в админке
		},
		API_ROUTES: {
			DEFAULT: 20,             // Дефолтный лимит для API роутов
		},
	},
	
	/**
	 * Настройки поиска
	 */
	SEARCH: {
		MIN_QUERY_LENGTH: 2,         // Минимальная длина поискового запроса
		MAX_QUERY_LENGTH: 100,       // Максимальная длина поискового запроса
		DEBOUNCE_DELAY: 300,         // Задержка для debounce поиска (мс)
	},
	
	/**
	 * Настройки пагинации
	 */
	PAGINATION: {
		DEFAULT_PAGE: 1,             // Первая страница по умолчанию
		DEFAULT_LIMIT: 20,           // Элементов на странице по умолчанию
		MAX_LIMIT: 100,              // Максимальный лимит на странице
	},
	
	/**
	 * Таймауты
	 */
	TIMEOUTS: {
		DEFAULT: 10000,              // 10 секунд - обычные запросы
		UPLOAD: 60000,               // 60 секунд - загрузка файлов
		SLOW_OPERATIONS: 30000,      // 30 секунд - медленные операции
	},
} as const

/**
 * Утилиты для работы с API конфигурацией
 */
export const APIUtils = {
	/**
	 * Получение лимита по типу и подтипу
	 */
	getLimit: (type: keyof typeof API_CONFIG.LIMITS, subtype: string): number => {
		const typeConfig = API_CONFIG.LIMITS[type] as Record<string, number>
		return typeConfig[subtype.toUpperCase()] || API_CONFIG.PAGINATION.DEFAULT_LIMIT
	},
	
	/**
	 * Валидация поискового запроса
	 */
	isValidSearchQuery: (query: string): boolean => {
		return query.length >= API_CONFIG.SEARCH.MIN_QUERY_LENGTH && 
		       query.length <= API_CONFIG.SEARCH.MAX_QUERY_LENGTH
	},
	
	/**
	 * Валидация лимита пагинации
	 */
	isValidLimit: (limit: number): boolean => {
		return limit > 0 && limit <= API_CONFIG.PAGINATION.MAX_LIMIT
	},
	
	/**
	 * Нормализация лимита
	 */
	normalizeLimit: (limit?: number): number => {
		if (!limit || limit <= 0) {
			return API_CONFIG.PAGINATION.DEFAULT_LIMIT
		}
		return Math.min(limit, API_CONFIG.PAGINATION.MAX_LIMIT)
	},
	
	/**
	 * Расчет задержки для retry с backoff
	 */
	getRetryDelay: (attempt: number): number => {
		return API_CONFIG.RETRY.DELAY * Math.pow(API_CONFIG.RETRY.BACKOFF_MULTIPLIER, attempt - 1)
	},
} as const 