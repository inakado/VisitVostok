/**
 * Центральный экспорт всех конфигураций
 */
export { CACHE_CONFIG, CacheUtils } from './cache'
export { API_CONFIG, APIUtils } from './api'

import { CACHE_CONFIG, CacheUtils } from './cache'
import { API_CONFIG, APIUtils } from './api'

/**
 * Переэкспорт для удобства использования
 */
export const Config = {
	Cache: CACHE_CONFIG,
	Api: API_CONFIG,
} as const

export const Utils = {
	Cache: CacheUtils,
	Api: APIUtils,
} as const 