/**
 * Хук для поддержки offline режима и graceful degradation
 * Обеспечивает работу приложения при проблемах с сетью
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useToastHelpers } from './useToastHelpers'

// === ТИПЫ ===

interface OfflineData<T> {
	data: T
	timestamp: number
	version: number
}

interface OfflineConfig {
	storageKey: string
	maxAge: number // максимальный возраст данных в миллисекундах
	enableBackgroundSync: boolean // синхронизация при восстановлении сети
}

interface UseOfflineSupportOptions<T> {
	config?: Partial<OfflineConfig>
	fallbackData?: T
	onOnline?: () => void
	onOffline?: () => void
	onDataStale?: (data: T, ageMs: number) => void
}

interface OfflineSupportReturn<T> {
	isOnline: boolean
	isOffline: boolean
	storeData: (data: T) => void
	getStoredData: () => T | null
	clearStoredData: () => void
	getDataAge: () => number | null
	isDataStale: () => boolean
	connectionQuality: 'good' | 'poor' | 'offline'
}

// === ОСНОВНОЙ ХУК ===

export function useOfflineSupport<T>(
	options: UseOfflineSupportOptions<T> = {}
): OfflineSupportReturn<T> {
	const [isOnline, setIsOnline] = useState(navigator.onLine)
	const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good')
	const toastHelpers = useToastHelpers()

	// Дефолтная конфигурация
	const config: OfflineConfig = useMemo(() => ({
		storageKey: 'offline_data',
		maxAge: 24 * 60 * 60 * 1000, // 24 часа
		enableBackgroundSync: true,
		...options.config
	}), [options.config])

	// === МОНИТОРИНГ СОСТОЯНИЯ СЕТИ ===

	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true)
			setConnectionQuality('good')
			options.onOnline?.()
			
			if (config.enableBackgroundSync) {
				// Можно добавить логику фоновой синхронизации
				console.log('🌐 Соединение восстановлено. Синхронизация данных...')
			}
		}

		const handleOffline = () => {
			setIsOnline(false)
			setConnectionQuality('offline')
			options.onOffline?.()
			toastHelpers.offlineNotice()
		}

		// Слушаем события изменения состояния сети
		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)

		// === ОТКЛЮЧЕНО: Проверка качества соединения через /api/health ===
		/*
		const checkConnectionQuality = async () => {
			if (!navigator.onLine) {
				setConnectionQuality('offline')
				return
			}

			try {
				// Простая проверка скорости соединения
				const start = Date.now()
				const response = await fetch('/api/health', { 
					method: 'HEAD',
					cache: 'no-cache'
				})
				const end = Date.now()
				
				if (response.ok) {
					const latency = end - start
					setConnectionQuality(latency > 2000 ? 'poor' : 'good')
				} else {
					setConnectionQuality('poor')
				}
			} catch {
				setConnectionQuality('poor')
			}
		}

		// Проверяем качество соединения каждые 30 секунд
		const qualityInterval = setInterval(checkConnectionQuality, 30000)
		// Первоначальная проверка
		checkConnectionQuality()
		*/

		return () => {
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
			// clearInterval(qualityInterval)
		}
	}, [config.enableBackgroundSync, options, toastHelpers])

	// === РАБОТА С ЛОКАЛЬНЫМ ХРАНИЛИЩЕМ ===

	const storeData = useCallback((data: T) => {
		if (typeof window === 'undefined') return

		try {
			const offlineData: OfflineData<T> = {
				data,
				timestamp: Date.now(),
				version: 1
			}

			localStorage.setItem(config.storageKey, JSON.stringify(offlineData))
		} catch (error) {
			console.warn('Не удалось сохранить данные для offline режима:', error)
		}
	}, [config.storageKey])

	const getStoredData = useCallback((): T | null => {
		if (typeof window === 'undefined') return null

		try {
			const stored = localStorage.getItem(config.storageKey)
			if (!stored) return options.fallbackData || null

			const offlineData: OfflineData<T> = JSON.parse(stored)
			
			// Проверяем возраст данных
			const age = Date.now() - offlineData.timestamp
			if (age > config.maxAge) {
				// Данные устарели
				if (options.onDataStale) {
					options.onDataStale(offlineData.data, age)
				}
				return options.fallbackData || null
			}

			return offlineData.data
		} catch (error) {
			console.warn('Не удалось загрузить offline данные:', error)
			return options.fallbackData || null
		}
	}, [config.storageKey, config.maxAge, options])

	const clearStoredData = useCallback(() => {
		if (typeof window === 'undefined') return

		try {
			localStorage.removeItem(config.storageKey)
		} catch (error) {
			console.warn('Не удалось очистить offline данные:', error)
		}
	}, [config.storageKey])

	const getDataAge = useCallback((): number | null => {
		if (typeof window === 'undefined') return null

		try {
			const stored = localStorage.getItem(config.storageKey)
			if (!stored) return null

			const offlineData: OfflineData<T> = JSON.parse(stored)
			return Date.now() - offlineData.timestamp
		} catch {
			return null
		}
	}, [config.storageKey])

	const isDataStale = useCallback((): boolean => {
		const age = getDataAge()
		return age !== null && age > config.maxAge
	}, [getDataAge, config.maxAge])

	return useMemo(() => ({
		isOnline,
		isOffline: !isOnline,
		storeData,
		getStoredData,
		clearStoredData,
		getDataAge,
		isDataStale,
		connectionQuality
	}), [isOnline, storeData, getStoredData, clearStoredData, getDataAge, isDataStale, connectionQuality])
}

// === СПЕЦИАЛИЗИРОВАННЫЕ ХУКИ ===

/**
 * Хук для кэширования API данных с fallback на offline версию
 */
export function useOfflineApiData<T>(
	apiFunction: () => Promise<T>,
	cacheKey: string,
	options: UseOfflineSupportOptions<T> = {}
) {
	const [data, setData] = useState<T | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	
	const offline = useOfflineSupport<T>({
		...options,
		config: { storageKey: `api_cache_${cacheKey}`, ...options.config }
	})

	const loadData = useCallback(async (useCache = false) => {
		if (useCache || offline.isOffline) {
			// Используем кэшированные данные
			const cachedData = offline.getStoredData()
			if (cachedData) {
				setData(cachedData)
				setLoading(false)
				
				if (offline.isDataStale()) {
					setError('Данные могут быть устаревшими (offline режим)')
				} else {
					setError(null)
				}
				return
			}
		}

		if (offline.isOffline) {
			setError('Нет подключения к интернету и кэшированных данных')
			setLoading(false)
			return
		}

		try {
			setLoading(true)
			setError(null)
			
			const result = await apiFunction()
			setData(result)
			
			// Сохраняем в кэш для offline использования
			offline.storeData(result)
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки данных'
			setError(errorMessage)
			
			// При ошибке пытаемся использовать кэш
			const cachedData = offline.getStoredData()
			if (cachedData) {
				setData(cachedData)
				setError(`${errorMessage} (используются кэшированные данные)`)
			}
		} finally {
			setLoading(false)
		}
	}, [apiFunction, offline])

	// Загружаем данные при монтировании и изменении состояния сети
	useEffect(() => {
		loadData()
	}, [loadData])

	// Перезагружаем при восстановлении соединения
	useEffect(() => {
		if (offline.isOnline && offline.connectionQuality === 'good') {
			loadData()
		}
	}, [offline.isOnline, offline.connectionQuality, loadData])

	return {
		data,
		loading,
		error,
		refetch: () => loadData(false),
		...offline
	}
}

/**
 * Хук для offline-ready форм с локальным сохранением
 */
export function useOfflineForm<T extends Record<string, unknown>>(
	initialData: T,
	submitFunction: (data: T) => Promise<void>,
	options: { autoSave?: boolean; saveKey?: string } = {}
) {
	const [formData, setFormData] = useState<T>(initialData)
	const [pendingSubmissions, setPendingSubmissions] = useState<T[]>([])
	
	const offline = useOfflineSupport<T>({
		config: { storageKey: options.saveKey || 'form_draft' }
	})

	// Автосохранение черновика
	useEffect(() => {
		if (options.autoSave) {
			const timeoutId = setTimeout(() => {
				offline.storeData(formData)
			}, 1000) // Сохраняем через секунду после изменения

			return () => clearTimeout(timeoutId)
		}
	}, [formData, options.autoSave, offline])

	// Восстановление черновика при монтировании
	useEffect(() => {
		const savedDraft = offline.getStoredData()
		if (savedDraft) {
			setFormData({ ...initialData, ...savedDraft })
		}
	}, [initialData, offline])

	const handleSubmit = useCallback(async () => {
		if (offline.isOffline) {
			// Сохраняем для отправки при восстановлении связи
			setPendingSubmissions(prev => [...prev, formData])
			return Promise.resolve()
		}

		try {
			await submitFunction(formData)
			offline.clearStoredData() // Очищаем черновик после успешной отправки
		} catch (error) {
			// Сохраняем для повторной отправки
			setPendingSubmissions(prev => [...prev, formData])
			throw error
		}
	}, [formData, offline, submitFunction])

	// Обработка отложенных отправок при восстановлении связи
	useEffect(() => {
		if (offline.isOnline && pendingSubmissions.length > 0) {
			Promise.all(
				pendingSubmissions.map(data => submitFunction(data))
			).then(() => {
				setPendingSubmissions([])
			}).catch(error => {
				console.error('Ошибка синхронизации отложенных форм:', error)
			})
		}
	}, [offline.isOnline, pendingSubmissions, submitFunction])

	return {
		formData,
		setFormData,
		handleSubmit,
		pendingSubmissions: pendingSubmissions.length,
		...offline
	}
} 