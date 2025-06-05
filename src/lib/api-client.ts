// Централизованный API клиент для проекта VisitVostok
// Этот файл обеспечивает единообразный интерфейс для всех API вызовов
// Версия 2.0 с продвинутой обработкой ошибок и отказоустойчивостью

import { APIResponse, APIErrorData } from '@/types'

// === ТИПЫ ДЛЯ RETRY ЛОГИКИ ===

interface RetryConfig {
	maxAttempts: number
	baseDelay: number
	maxDelay: number
	backoffFactor: number
	retryableStatusCodes: number[]
}

interface CircuitBreakerConfig {
	failureThreshold: number
	resetTimeout: number
	monitoringWindow: number
}

type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface RequestMetrics {
	failures: number
	lastFailureTime: number
	state: CircuitBreakerState
}

// === БАЗОВЫЙ API КЛИЕНТ С РАСШИРЕННЫМИ ВОЗМОЖНОСТЯМИ ===

export class APIClient {
	private baseURL: string
	private retryConfig: RetryConfig
	private circuitBreakerConfig: CircuitBreakerConfig
	private metrics: Map<string, RequestMetrics> = new Map()

	constructor(
		baseURL: string = '/api',
		retryConfig?: Partial<RetryConfig>,
		circuitBreakerConfig?: Partial<CircuitBreakerConfig>
	) {
		this.baseURL = baseURL
		
		// Дефолтные настройки retry
		this.retryConfig = {
			maxAttempts: 3,
			baseDelay: 1000,
			maxDelay: 10000,
			backoffFactor: 2,
			retryableStatusCodes: [408, 429, 500, 502, 503, 504],
			...retryConfig
		}

		// Дефолтные настройки circuit breaker
		this.circuitBreakerConfig = {
			failureThreshold: 5,
			resetTimeout: 60000, // 1 минута
			monitoringWindow: 120000, // 2 минуты
			...circuitBreakerConfig
		}
	}

	// === CIRCUIT BREAKER ЛОГИКА ===

	private getEndpointKey(endpoint: string, method: string): string {
		return `${method}:${endpoint}`
	}

	private updateMetrics(key: string, success: boolean): void {
		const now = Date.now()
		const current = this.metrics.get(key) || {
			failures: 0,
			lastFailureTime: 0,
			state: 'CLOSED' as CircuitBreakerState
		}

		if (success) {
			// Успех - сбрасываем счетчик
			current.failures = 0
			current.state = 'CLOSED'
		} else {
			// Неудача - увеличиваем счетчик
			current.failures++
			current.lastFailureTime = now

			// Проверяем нужно ли открыть circuit breaker
			if (current.failures >= this.circuitBreakerConfig.failureThreshold) {
				current.state = 'OPEN'
			}
		}

		this.metrics.set(key, current)
	}

	private canMakeRequest(key: string): boolean {
		const metrics = this.metrics.get(key)
		if (!metrics || metrics.state === 'CLOSED') return true

		const now = Date.now()
		const timeSinceLastFailure = now - metrics.lastFailureTime

		if (metrics.state === 'OPEN') {
			if (timeSinceLastFailure >= this.circuitBreakerConfig.resetTimeout) {
				// Переходим в HALF_OPEN для тестирования
				metrics.state = 'HALF_OPEN'
				this.metrics.set(key, metrics)
				return true
			}
			return false
		}

		// HALF_OPEN состояние - разрешаем запрос
		return true
	}

	// === УЛУЧШЕННЫЙ RETRY МЕХАНИЗМ ===

	private async executeWithRetry<T>(
		requestFn: () => Promise<Response>,
		endpoint: string,
		method: string
	): Promise<APIResponse<T>> {
		const key = this.getEndpointKey(endpoint, method)
		let lastError: Error | null = null

		// Проверяем circuit breaker
		if (!this.canMakeRequest(key)) {
			throw new APIRequestError(
				'Сервис временно недоступен. Повторите попытку позже.',
				503,
				{ circuitBreakerOpen: true }
			)
		}

		for (let attempt = 0; attempt < this.retryConfig.maxAttempts; attempt++) {
			try {
				const response = await requestFn()
				
				// Проверяем ответ
				if (response.ok) {
					this.updateMetrics(key, true)
					const data = await response.json()
					
					return {
						data,
						meta: this.extractMetaFromHeaders(response.headers)
					}
				}

				// Обрабатываем HTTP ошибки
				const errorData: APIErrorData = await response.json().catch(() => ({
					error: `HTTP Error: ${response.status} ${response.statusText}`,
				}))

				const error = new APIRequestError(errorData.error, response.status, errorData)

				// Проверяем нужен ли retry
				if (this.shouldRetry(response.status, attempt)) {
					lastError = error
					await this.delay(this.calculateDelay(attempt))
					continue
				}

				// Не retryable ошибка
				this.updateMetrics(key, false)
				throw error

			} catch (error) {
				if (error instanceof APIRequestError) {
					// Уже обработанная ошибка
					throw error
				}

				// Сетевая ошибка
				const networkError = new APIRequestError(
					error instanceof Error ? error.message : 'Network error occurred',
					0,
					{ originalError: error, attempt: attempt + 1 }
				)

				if (attempt < this.retryConfig.maxAttempts - 1) {
					lastError = networkError
					await this.delay(this.calculateDelay(attempt))
					continue
				}

				this.updateMetrics(key, false)
				throw networkError
			}
		}

		// Все попытки исчерпаны
		this.updateMetrics(key, false)
		throw lastError || new APIRequestError('All retry attempts failed', 0)
	}

	private shouldRetry(statusCode: number, attempt: number): boolean {
		if (attempt >= this.retryConfig.maxAttempts - 1) return false
		return this.retryConfig.retryableStatusCodes.includes(statusCode)
	}

	private calculateDelay(attempt: number): number {
		const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt)
		// Добавляем jitter для избежания thundering herd
		const jitter = Math.random() * 0.1 * delay
		return Math.min(delay + jitter, this.retryConfig.maxDelay)
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	private extractMetaFromHeaders(headers: Headers) {
		const totalCount = headers.get('X-Total-Count')
		const page = headers.get('X-Page')
		const limit = headers.get('X-Limit')

		if (totalCount) {
			return {
				total: parseInt(totalCount),
				page: parseInt(page || '1'),
				limit: parseInt(limit || '50'),
			}
		}

		return undefined
	}

	// === БАЗОВЫЙ МЕТОД ДЛЯ HTTP ЗАПРОСОВ ===

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<APIResponse<T>> {
		const url = `${this.baseURL}${endpoint}`
		
		const config: RequestInit = {
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
			...options,
		}

		const requestFn = () => fetch(url, config)
		const method = options.method || 'GET'

		return this.executeWithRetry<T>(requestFn, endpoint, method)
	}

	// === ПУБЛИЧНЫЕ МЕТОДЫ ===

	async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<APIResponse<T>> {
		const url = params ? `${endpoint}?${new URLSearchParams(
			Object.entries(params).map(([key, value]) => [key, String(value)])
		)}` : endpoint

		return this.request<T>(url, { method: 'GET' })
	}

	async post<T>(endpoint: string, data?: unknown): Promise<APIResponse<T>> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined,
		})
	}

	async put<T>(endpoint: string, data?: unknown): Promise<APIResponse<T>> {
		return this.request<T>(endpoint, {
			method: 'PUT',
			body: data ? JSON.stringify(data) : undefined,
		})
	}

	async delete<T>(endpoint: string): Promise<APIResponse<T>> {
		return this.request<T>(endpoint, { method: 'DELETE' })
	}

	// === UTILITY МЕТОДЫ ===

	// Получение статистики circuit breaker
	getCircuitBreakerStats(): Record<string, RequestMetrics> {
		return Object.fromEntries(this.metrics.entries())
	}

	// Ручной сброс circuit breaker для конкретного endpoint
	resetCircuitBreaker(endpoint: string, method: string = 'GET'): void {
		const key = this.getEndpointKey(endpoint, method)
		this.metrics.delete(key)
	}

	// Ручной сброс всех circuit breaker
	resetAllCircuitBreakers(): void {
		this.metrics.clear()
	}
}

// === КАСТОМНАЯ ОШИБКА API (РАСШИРЕННАЯ) ===

export class APIRequestError extends Error {
	public status: number
	public details?: unknown
	public retryable: boolean

	constructor(message: string, status: number = 0, details?: unknown) {
		super(message)
		this.name = 'APIRequestError'
		this.status = status
		this.details = details
		this.retryable = this.isRetryableError(status)
	}

	// Проверка типа ошибки
	isNetworkError(): boolean {
		return this.status === 0
	}

	isClientError(): boolean {
		return this.status >= 400 && this.status < 500
	}

	isServerError(): boolean {
		return this.status >= 500
	}

	isRetryableError(status: number): boolean {
		return [408, 429, 500, 502, 503, 504].includes(status) || status === 0
	}

	// Получение человекочитаемого сообщения
	getUserFriendlyMessage(): string {
		switch (this.status) {
			case 0:
				return 'Проблемы с подключением к интернету'
			case 401:
				return 'Необходимо войти в систему'
			case 403:
				return 'Недостаточно прав для выполнения операции'
			case 404:
				return 'Запрашиваемые данные не найдены'
			case 429:
				return 'Слишком много запросов. Повторите попытку позже'
			case 500:
			case 502:
			case 503:
			case 504:
				return 'Временные проблемы на сервере. Повторите попытку позже'
			default:
				return this.message
		}
	}
}

// === ЭКЗЕМПЛЯР КЛИЕНТА ===

export const apiClient = new APIClient()

// Экземпляр с более агрессивными retry для критичных операций
export const criticalApiClient = new APIClient('/api', {
	maxAttempts: 5,
	baseDelay: 500,
	maxDelay: 30000
})

// === УТИЛИТАРНЫЕ ФУНКЦИИ ===

export function handleAPIError(error: unknown): string {
	if (error instanceof APIRequestError) {
		return error.getUserFriendlyMessage()
	}
	
	if (error instanceof Error) {
		return error.message
	}
	
	return 'Произошла неизвестная ошибка'
}

export function isSuccessResponse<T>(response: APIResponse<T> | { error: string }): response is APIResponse<T> {
	return !('error' in response)
}

// Хелпер для определения серьезности ошибки
export function getErrorSeverity(error: unknown): 'low' | 'medium' | 'high' | 'critical' {
	if (error instanceof APIRequestError) {
		if (error.isNetworkError()) return 'high'
		if (error.isServerError()) return 'medium'
		if (error.status === 401 || error.status === 403) return 'medium'
		return 'low'
	}
	return 'medium'
}

export type { APIResponse, APIErrorData } from '@/types' 