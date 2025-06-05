/**
 * Универсальный хук для API запросов
 * Версия 2.0 с интегрированной обработкой ошибок, уведомлениями и логированием
 * 
 * Обеспечивает:
 * - Автоматический retry при ошибках
 * - Кэширование данных
 * - Предотвращение дублирования запросов
 * - Toast уведомления
 * - Централизованное логирование
 * - Offline поддержка
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { handleAPIError } from '@/lib/api-client'
import { useToastHelpers } from './useToastHelpers'
import { logger } from '@/lib/utils/errorLogger'
import { useOfflineSupport } from './useOfflineSupport'

// === ТИПЫ ===

interface UseApiOptions {
	// Кэширование
	cacheKey?: string
	cacheTime?: number
	
	// Retry логика  
	retryOnError?: boolean
	retryCount?: number
	
	// Toast уведомления
	showSuccessToast?: boolean
	showErrorToast?: boolean
	successMessage?: string
	
	// Логирование
	enableLogging?: boolean
	logContext?: Record<string, unknown>
	
	// Offline поддержка
	enableOffline?: boolean
	offlineFallback?: unknown
	
	// Дополнительные опции
	executeOnMount?: boolean
	onSuccess?: (data: unknown) => void
	onError?: (error: string) => void
	debounceMs?: number
}

interface UseApiState<T> {
	data: T | null
	isLoading: boolean
	error: string | null
	isSuccess: boolean
}

interface UseApiReturn<T> extends UseApiState<T> {
	execute: (force?: boolean) => void
	refetch: () => void
	reset: () => void
	clearCache: () => void
	isOnline: boolean
	connectionQuality: 'good' | 'poor' | 'offline'
}

// === ОСНОВНОЙ ХУК ===

export function useApi<T>(
	apiFunction: () => Promise<T>,
	deps: React.DependencyList = [],
	options: UseApiOptions & { offlineFallback?: T | null } = {}
): UseApiReturn<T> {
	// Дефолтные опции
	const {
		cacheKey,
		cacheTime = 5 * 60 * 1000, // 5 минут
		retryOnError = true,
		retryCount = 3,
		showSuccessToast = false,
		showErrorToast = true,
		successMessage,
		enableLogging = true,
		logContext = {},
		enableOffline = false,
		offlineFallback,
		executeOnMount = true,
		onSuccess,
		onError,
		debounceMs = 0
	} = options

	// Состояние
	const [state, setState] = useState<UseApiState<T>>({
		data: null,
		isLoading: false,
		error: null,
		isSuccess: false
	})

	// Refs для предотвращения Race Conditions
	const isLoadingRef = useRef(false)
	const retryAttempts = useRef(0)
	const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

	// Хуки для дополнительной функциональности
	const toastHelpers = useToastHelpers()
	const offline = useOfflineSupport<T>({
		config: { 
			storageKey: cacheKey ? `api_cache_${cacheKey}` : undefined,
			maxAge: cacheTime 
		},
		fallbackData: offlineFallback || undefined
	})

	// === КЭШИРОВАНИЕ ===

	const getCachedData = useCallback((): T | null => {
		if (!cacheKey) return null

		if (enableOffline) {
			return offline.getStoredData()
		}

		try {
			const cached = localStorage.getItem(cacheKey)
			if (!cached) return null

			const { data, timestamp, maxAge } = JSON.parse(cached)
			if (Date.now() - timestamp > maxAge) {
				localStorage.removeItem(cacheKey)
				return null
			}

			return data
		} catch {
			return null
		}
	}, [cacheKey, enableOffline, offline])

	const setCachedData = useCallback((data: T) => {
		if (!cacheKey) return

		if (enableOffline) {
			offline.storeData(data)
			return
		}

		try {
			localStorage.setItem(cacheKey, JSON.stringify({
				data,
				timestamp: Date.now(),
				maxAge: cacheTime
			}))
		} catch (error) {
			if (enableLogging) {
				logger.warn('Не удалось сохранить данные в кэш', { error, cacheKey })
			}
		}
	}, [cacheKey, cacheTime, enableOffline, offline, enableLogging])

	// === ОСНОВНАЯ ФУНКЦИЯ ЗАГРУЗКИ ===

	const executeRequest = useCallback(async (force = false) => {
		// Предотвращаем множественные одновременные запросы
		if (isLoadingRef.current && !force) {
			return
		}

		isLoadingRef.current = true
		
		setState({
			data: null,
			isLoading: true,
			error: null,
			isSuccess: false
		})

		// Проверяем кэш если не принудительное обновление
		if (!force) {
			const cachedData = getCachedData()
			if (cachedData) {
				setState({
					data: cachedData,
					isLoading: false,
					error: null,
					isSuccess: true
				})

				isLoadingRef.current = false
				return
			}
		}

		// Offline fallback
		if (enableOffline && !navigator.onLine && offlineFallback) {
			setState({
				data: offlineFallback as T,
				isLoading: false,
				error: 'Режим offline - отображаются локальные данные',
				isSuccess: true
			})

			isLoadingRef.current = false
			return
		}

		if (enableLogging) {
			logger.debug('Начало API запроса', {
				attempt: retryAttempts.current + 1,
				maxAttempts: retryCount + 1,
				...logContext
			})
		}

		try {
			const result = await apiFunction()
			
			// Сохраняем в кэш
			setCachedData(result)
			
			setState({
				data: result,
				isLoading: false,
				error: null,
				isSuccess: true
			})

			// Успешные уведомления и логи
			if (showSuccessToast && successMessage) {
				toastHelpers.apiSuccess(successMessage)
			}

			if (enableLogging) {
				logger.info('API запрос выполнен успешно', {
					...logContext
				})
			}

			retryAttempts.current = 0
			onSuccess?.(result)

		} catch (error) {
			const errorMessage = handleAPIError(error)
			
			// Логируем ошибку
			if (enableLogging) {
				const endpoint = (logContext as Record<string, unknown>).endpoint as string || 'unknown'
				const method = (logContext as Record<string, unknown>).method as string || 'GET'
				logger.apiError(error, endpoint, method)
			}
			
			// Повторяем запрос при ошибке если включено
			if (retryOnError && retryAttempts.current < retryCount) {
				retryAttempts.current++
				
				if (enableLogging) {
					logger.warn(`Повтор API запроса (${retryAttempts.current}/${retryCount})`, {
						error: errorMessage,
						...logContext
					})
				}
				
				// Задержка перед повтором (экспоненциальная)
				setTimeout(() => {
					executeRequest(true)
				}, Math.pow(2, retryAttempts.current) * 1000)
				
				return
			}

			// Все попытки исчерпаны или retry отключен
			setState({
				data: null,
				isLoading: false,
				error: errorMessage,
				isSuccess: false
			})

			// Уведомления об ошибке
			if (showErrorToast) {
				toastHelpers.apiError(error)
			}

			onError?.(errorMessage)

		} finally {
			isLoadingRef.current = false
		}
	}, [
		apiFunction, getCachedData, setCachedData, retryOnError, retryCount,
		showSuccessToast, showErrorToast, successMessage, enableLogging,
		logContext, enableOffline, offlineFallback, onSuccess, onError, toastHelpers
	])

	// === ДЕБАУНСИНГ ===

	const execute = useCallback((force = false) => {
		if (debounceMs > 0) {
			if (debounceTimeout.current) {
				clearTimeout(debounceTimeout.current)
			}

			debounceTimeout.current = setTimeout(() => {
				executeRequest(force)
			}, debounceMs)
		} else {
			executeRequest(force)
		}
	}, [executeRequest, debounceMs])

	// === ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ===

	const refetch = useCallback(() => execute(true), [execute])

	const reset = useCallback(() => {
		setState({
			data: null,
			isLoading: false,
			error: null,
			isSuccess: false
		})
		retryAttempts.current = 0
		
		if (debounceTimeout.current) {
			clearTimeout(debounceTimeout.current)
		}
	}, [])

	const clearCache = useCallback(() => {
		if (cacheKey) {
			if (enableOffline) {
				offline.clearStoredData()
			} else {
				localStorage.removeItem(cacheKey)
			}
		}
	}, [cacheKey, enableOffline, offline])

	// === ЭФФЕКТЫ ===

	// Отслеживание изменений deps через ref
	const depsRef = useRef(deps)
	const mountedRef = useRef(false)
	
	// Выполнение при монтировании и изменении deps
	useEffect(() => {
		// Проверяем изменились ли deps
		const depsChanged = !mountedRef.current || 
			deps.length !== depsRef.current.length ||
			deps.some((dep, index) => dep !== depsRef.current[index])
		
		if (executeOnMount && (!mountedRef.current || depsChanged)) {
			executeRequest()
			depsRef.current = deps
			mountedRef.current = true
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [executeOnMount, executeRequest, deps.length])

	// Очистка timeout при размонтировании
	useEffect(() => {
		return () => {
			if (debounceTimeout.current) {
				clearTimeout(debounceTimeout.current)
			}
		}
	}, [])

	return {
		...state,
		execute,
		refetch,
		reset,
		clearCache,
		// Добавляем информацию о подключении
		isOnline: enableOffline ? offline.isOnline : navigator.onLine,
		connectionQuality: enableOffline ? offline.connectionQuality : 'good'
	}
}

// === СПЕЦИАЛИЗИРОВАННЫЕ ХУКИ ===

/**
 * Хук для мутирующих операций (POST, PUT, DELETE)
 */
export function useMutation<T, TVariables = void>(
	mutationFn: (variables: TVariables) => Promise<T>,
	options: Omit<UseApiOptions & { offlineFallback?: T | null }, 'executeOnMount' | 'cacheKey'> & {
		invalidateKeys?: string[] // Ключи кэша для инвалидации после успешной мутации
	} = {}
) {
	const [state, setState] = useState<UseApiState<T>>({
		data: null,
		isLoading: false,
		error: null,
		isSuccess: false
	})

	const toastHelpers = useToastHelpers()
	const { enableLogging = true, logContext = {}, invalidateKeys = [] } = options

	const mutate = useCallback(async (variables: TVariables): Promise<T | undefined> => {
		setState({
			data: null,
			isLoading: true,
			error: null,
			isSuccess: false
		})

		try {
			const result = await mutationFn(variables)
			
			setState({
				data: result,
				isLoading: false,
				error: null,
				isSuccess: true
			})

			// Инвалидируем связанные кэши
			invalidateKeys.forEach(key => {
				localStorage.removeItem(key)
			})

			if (options.showSuccessToast && options.successMessage) {
				toastHelpers.apiSuccess(options.successMessage)
			}

			if (enableLogging) {
				logger.info('Мутация выполнена успешно', {
					...logContext,
					invalidatedKeys: invalidateKeys
				})
			}

			options.onSuccess?.(result)
			return result

		} catch (error) {
			const errorMessage = handleAPIError(error)
			
			setState({
				data: null,
				isLoading: false,
				error: errorMessage,
				isSuccess: false
			})

			if (enableLogging) {
				const endpoint = (logContext as Record<string, unknown>).endpoint as string || 'mutation'
				const method = (logContext as Record<string, unknown>).method as string || 'POST'
				logger.apiError(error, endpoint, method)
			}

			if (options.showErrorToast) {
				toastHelpers.apiError(error)
			}

			options.onError?.(errorMessage)
			throw error
		}
	}, [mutationFn, toastHelpers, enableLogging, logContext, invalidateKeys, options])

	return {
		...state,
		mutate,
		reset: () => setState({
			data: null,
			isLoading: false,
			error: null,
			isSuccess: false
		})
	}
} 