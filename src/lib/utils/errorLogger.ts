/**
 * Централизованная система логирования ошибок
 * Обеспечивает унифицированный подход к сбору и отправке ошибок
 */

import { getErrorSeverity } from '@/lib/api-client'

// === ТИПЫ ===

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export interface LogEntry {
	id: string
	level: LogLevel
	message: string
	timestamp: Date
	context?: Record<string, unknown>
	error?: Error
	stackTrace?: string
	userAgent?: string
	url?: string
	userId?: string
	sessionId?: string
	buildVersion?: string
}

export interface LoggerConfig {
	enableConsoleLogging: boolean
	enableRemoteLogging: boolean
	enableLocalStorage: boolean
	maxLocalEntries: number
	remoteEndpoint?: string
	batchSize: number
	batchTimeout: number
	minLevelForRemote: LogLevel
}

interface StoredLogData {
	sessionId: string
	entries: Array<{
		id: string
		level: LogLevel
		message: string
		timestamp: string
		context?: Record<string, unknown>
		error?: {
			name: string
			message: string
			stack?: string
		}
		stackTrace?: string
		userAgent?: string
		url?: string
		userId?: string
		sessionId?: string
		buildVersion?: string
	}>
}

// === УРОВНИ ЛОГОВ ===

const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
	critical: 4
}

// === ГЛАВНЫЙ ЛОГГЕР ===

class ErrorLogger {
	private config: LoggerConfig
	private sessionId: string
	private localEntries: LogEntry[] = []
	private batchQueue: LogEntry[] = []
	private batchTimer: NodeJS.Timeout | null = null
	private isBrowser: boolean

	constructor(config: Partial<LoggerConfig> = {}) {
		this.isBrowser = typeof window !== 'undefined'
		
		this.config = {
			enableConsoleLogging: process.env.NODE_ENV !== 'production',
			enableRemoteLogging: process.env.NODE_ENV === 'production',
			enableLocalStorage: true,
			maxLocalEntries: 100,
			batchSize: 10,
			batchTimeout: 30000, // 30 секунд
			minLevelForRemote: 'warn',
			...config
		}

		this.sessionId = this.generateSessionId()
		
		if (this.isBrowser) {
			this.loadFromLocalStorage()
			this.setupGlobalErrorHandlers()
		}
	}

	// === ПУБЛИЧНЫЕ МЕТОДЫ ЛОГИРОВАНИЯ ===

	debug(message: string, context?: Record<string, unknown>) {
		this.log('debug', message, context)
	}

	info(message: string, context?: Record<string, unknown>) {
		this.log('info', message, context)
	}

	warn(message: string, context?: Record<string, unknown>) {
		this.log('warn', message, context)
	}

	error(message: string, error?: Error, context?: Record<string, unknown>) {
		this.log('error', message, context, error)
	}

	critical(message: string, error?: Error, context?: Record<string, unknown>) {
		this.log('critical', message, context, error)
	}

	// Специальный метод для API ошибок
	apiError(error: unknown, endpoint: string, method: string = 'GET') {
		const severity = getErrorSeverity(error)
		const level: LogLevel = severity === 'critical' ? 'critical' : 
						   severity === 'high' ? 'error' : 
						   severity === 'medium' ? 'warn' : 'info'

		this.log(level, `API Error: ${endpoint}`, {
			endpoint,
			method,
			severity,
			errorType: error?.constructor?.name || 'Unknown'
		}, error instanceof Error ? error : undefined)
	}

	// Метод для компонентных ошибок
	componentError(componentName: string, error: Error, props?: Record<string, unknown>) {
		this.log('error', `Component Error: ${componentName}`, {
			component: componentName,
			props: props || {},
			errorBoundary: true
		}, error)
	}

	// === ОСНОВНОЙ МЕТОД ЛОГИРОВАНИЯ ===

	private log(
		level: LogLevel, 
		message: string, 
		context?: Record<string, unknown>, 
		error?: Error
	) {
		const entry: LogEntry = {
			id: this.generateId(),
			level,
			message,
			timestamp: new Date(),
			context,
			error,
			stackTrace: error?.stack,
			userAgent: this.isBrowser && typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
			url: this.isBrowser && typeof window !== 'undefined' ? window.location?.href : undefined,
			sessionId: this.sessionId,
			buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown'
		}

		// Консольное логирование
		if (this.config.enableConsoleLogging) {
			this.logToConsole(entry)
		}

		// Локальное хранение (только в браузере)
		if (this.config.enableLocalStorage && this.isBrowser) {
			this.addToLocalStorage(entry)
		}

		// Удаленное логирование
		if (this.config.enableRemoteLogging && 
			LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevelForRemote]) {
			this.addToBatch(entry)
		}
	}

	// === КОНСОЛЬНОЕ ЛОГИРОВАНИЕ ===

	private logToConsole(entry: LogEntry) {
		const timestamp = entry.timestamp.toISOString()
		const sessionSlice = entry.sessionId?.slice(-8) || 'unknown'
		const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${sessionSlice}]`
		
		switch (entry.level) {
			case 'debug':
				console.debug(prefix, entry.message, entry.context)
				break
			case 'info':
				console.info(prefix, entry.message, entry.context)
				break
			case 'warn':
				console.warn(prefix, entry.message, entry.context, entry.error)
				break
			case 'error':
			case 'critical':
				console.error(prefix, entry.message, entry.context, entry.error)
				break
		}
	}

	// === ЛОКАЛЬНОЕ ХРАНЕНИЕ ===

	private addToLocalStorage(entry: LogEntry) {
		this.localEntries.unshift(entry)
		
		// Ограничиваем размер массива
		if (this.localEntries.length > this.config.maxLocalEntries) {
			this.localEntries = this.localEntries.slice(0, this.config.maxLocalEntries)
		}

		this.saveToLocalStorage()
	}

	private saveToLocalStorage() {
		if (!this.isBrowser) return

		try {
			const data: StoredLogData = {
				sessionId: this.sessionId,
				entries: this.localEntries.map(entry => ({
					...entry,
					timestamp: entry.timestamp.toISOString(),
					error: entry.error ? {
						name: entry.error.name,
						message: entry.error.message,
						stack: entry.error.stack
					} : undefined
				}))
			}

			localStorage.setItem('error_logs', JSON.stringify(data))
		} catch (error) {
			console.warn('Не удалось сохранить логи в localStorage:', error)
		}
	}

	private loadFromLocalStorage() {
		if (!this.isBrowser) return

		try {
			const stored = localStorage.getItem('error_logs')
			if (!stored) return

			const data: StoredLogData = JSON.parse(stored)
			
			// Восстанавливаем логи только из текущей сессии
			if (data.sessionId === this.sessionId) {
				this.localEntries = data.entries.map((entry) => ({
					...entry,
					timestamp: new Date(entry.timestamp),
					error: entry.error ? Object.assign(new Error(entry.error.message), entry.error) : undefined
				}))
			}
		} catch (error) {
			console.warn('Не удалось загрузить логи из localStorage:', error)
		}
	}

	// === БАТЧЕВАЯ ОТПРАВКА НА СЕРВЕР ===

	private addToBatch(entry: LogEntry) {
		this.batchQueue.push(entry)

		if (this.batchQueue.length >= this.config.batchSize) {
			this.flushBatch()
		} else if (!this.batchTimer) {
			this.batchTimer = setTimeout(() => {
				this.flushBatch()
			}, this.config.batchTimeout)
		}
	}

	private async flushBatch() {
		if (this.batchQueue.length === 0) return

		const batch = [...this.batchQueue]
		this.batchQueue = []

		if (this.batchTimer) {
			clearTimeout(this.batchTimer)
			this.batchTimer = null
		}

		if (!this.config.remoteEndpoint) {
			return // Нет endpoint для отправки
		}

		try {
			await fetch(this.config.remoteEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					sessionId: this.sessionId,
					entries: batch.map(entry => ({
						...entry,
						timestamp: entry.timestamp.toISOString(),
						error: entry.error ? {
							name: entry.error.name,
							message: entry.error.message,
							stack: entry.error.stack
						} : undefined
					}))
				})
			})
		} catch (error) {
			console.warn('Не удалось отправить логи на сервер:', error)
			
			// Возвращаем в очередь для повторной попытки
			this.batchQueue.unshift(...batch)
		}
	}

	// === ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ ===

	private setupGlobalErrorHandlers() {
		if (!this.isBrowser) return

		// JavaScript ошибки
		window.addEventListener('error', (event) => {
			this.error(
				`Global Error: ${event.message}`,
				event.error,
				{
					filename: event.filename,
					lineno: event.lineno,
					colno: event.colno,
					type: 'javascript_error'
				}
			)
		})

		// Promise rejections
		window.addEventListener('unhandledrejection', (event) => {
			let error: Error
			let message = 'Unhandled Promise Rejection'
			
			try {
				if (event.reason instanceof Error) {
					error = event.reason
					message = `Unhandled Promise Rejection: ${event.reason.message}`
				} else if (typeof event.reason === 'string') {
					error = new Error(event.reason)
					message = `Unhandled Promise Rejection: ${event.reason}`
				} else if (event.reason && typeof event.reason === 'object') {
					const reasonStr = JSON.stringify(event.reason)
					error = new Error(reasonStr)
					message = `Unhandled Promise Rejection: ${reasonStr}`
				} else {
					error = new Error(String(event.reason))
					message = `Unhandled Promise Rejection: ${String(event.reason)}`
				}
			} catch {
				error = new Error('Unknown promise rejection')
				message = 'Unhandled Promise Rejection: Unable to parse reason'
			}
			
			this.error(message, error, {
				type: 'promise_rejection',
				originalReason: event.reason
			})
		})

		// Перед закрытием страницы отправляем оставшиеся логи
		window.addEventListener('beforeunload', () => {
			this.flushBatch()
		})
	}

	// === УТИЛИТАРНЫЕ МЕТОДЫ ===

	private generateSessionId(): string {
		return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	private generateId(): string {
		return `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
	}

	// === ПУБЛИЧНЫЕ УТИЛИТАРНЫЕ МЕТОДЫ ===

	// Получение всех локальных логов
	getLogs(level?: LogLevel): LogEntry[] {
		if (!level) return [...this.localEntries]
		return this.localEntries.filter(entry => entry.level === level)
	}

	// Очистка локальных логов
	clearLogs() {
		this.localEntries = []
		if (this.isBrowser) {
			this.saveToLocalStorage()
		}
	}

	// Экспорт логов для отладки
	exportLogs(): string {
		return JSON.stringify({
			sessionId: this.sessionId,
			exportedAt: new Date().toISOString(),
			config: this.config,
			entries: this.localEntries
		}, null, 2)
	}

	// Статистика логов
	getLogStats(): Record<LogLevel, number> {
		const stats: Record<LogLevel, number> = {
			debug: 0,
			info: 0,
			warn: 0,
			error: 0,
			critical: 0
		}

		this.localEntries.forEach(entry => {
			stats[entry.level]++
		})

		return stats
	}

	// Форсированная отправка батча
	async flush(): Promise<void> {
		await this.flushBatch()
	}
}

// === ЭКЗЕМПЛЯР ЛОГГЕРА ===

export const logger = new ErrorLogger({
	remoteEndpoint: process.env.NEXT_PUBLIC_LOGGING_ENDPOINT
})

// === ХЕЛПЕРЫ ДЛЯ СПЕЦИФИЧНЫХ СЛУЧАЕВ ===

export function logPageView(path: string, referrer?: string) {
	logger.info('Page View', {
		path,
		referrer,
		type: 'navigation'
	})
}

export function logUserAction(action: string, context?: Record<string, unknown>) {
	logger.info(`User Action: ${action}`, {
		...context,
		type: 'user_interaction'
	})
}

export function logPerformance(metric: string, value: number, context?: Record<string, unknown>) {
	logger.info(`Performance: ${metric}`, {
		...context,
		metric,
		value,
		type: 'performance'
	})
}

export function logFeatureUsage(feature: string, context?: Record<string, unknown>) {
	logger.info(`Feature Used: ${feature}`, {
		...context,
		feature,
		type: 'feature_usage'
	})
} 