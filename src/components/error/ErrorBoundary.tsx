"use client"

import React from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// === ТИПЫ ===

interface ErrorInfo {
	error: Error
	errorInfo: React.ErrorInfo
	timestamp: Date
	userAgent: string
	url: string
}

interface ErrorBoundaryState {
	hasError: boolean
	errorInfo: ErrorInfo | null
	errorId: string | null
}

interface ErrorBoundaryProps {
	children: React.ReactNode
	fallback?: React.ComponentType<{ error: ErrorInfo; resetError: () => void }>
	onError?: (error: ErrorInfo, errorId: string) => void
	showErrorDetails?: boolean
	isolate?: boolean // Изолировать ошибку только для этого компонента
}

// === ДЕФОЛТНЫЙ FALLBACK КОМПОНЕНТ ===

function DefaultErrorFallback({ 
	error, 
	resetError, 
	showDetails = false 
}: { 
	error: ErrorInfo
	resetError: () => void
	showDetails?: boolean
}) {
	const [showDetailsState, setShowDetailsState] = React.useState(false)

	const goBack = () => {
		if (window.history.length > 1) {
			window.history.back()
		} else {
			window.location.href = '/'
		}
	}

	const reportError = () => {
		// В будущем можно добавить отправку ошибки в систему мониторинга
		const errorReport = {
			message: error.error.message,
			stack: error.error.stack,
			timestamp: error.timestamp.toISOString(),
			url: error.url,
			userAgent: error.userAgent
		}
		
		console.error('Error Report:', errorReport)
		
		// Копируем в буфер обмена
		navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2))
		alert('Информация об ошибке скопирована в буфер обмена')
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
			<Card className="w-full max-w-2xl">
				<CardContent className="pt-6">
					<div className="text-center space-y-6">
						{/* Иконка и заголовок */}
						<div className="space-y-4">
							<div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
								<AlertTriangle className="w-8 h-8 text-red-600" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-gray-900 mb-2">
									Что-то пошло не так
								</h1>
								<p className="text-gray-600">
									Произошла неожиданная ошибка. Мы уже работаем над её исправлением.
								</p>
							</div>
						</div>

						{/* Краткая информация об ошибке */}
						<div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
							<div className="flex items-start gap-3">
								<Bug className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
								<div>
									<h3 className="font-semibold text-red-800 mb-1">Ошибка:</h3>
									<p className="text-red-700 text-sm font-mono break-all">
										{error.error.message}
									</p>
									<p className="text-red-600 text-xs mt-1">
										{error.timestamp.toLocaleString()}
									</p>
								</div>
							</div>
						</div>

						{/* Детали ошибки (сворачиваемые) */}
						{showDetails && (
							<div className="space-y-3">
								<button
									onClick={() => setShowDetailsState(!showDetailsState)}
									className="text-sm text-gray-500 hover:text-gray-700 underline"
								>
									{showDetailsState ? 'Скрыть' : 'Показать'} технические детали
								</button>

								{showDetailsState && (
									<div className="bg-gray-50 border rounded-lg p-4 text-left">
										<div className="space-y-3 text-xs font-mono text-gray-700">
											<div>
												<strong>Стек ошибки:</strong>
												<pre className="mt-1 whitespace-pre-wrap break-all">
													{error.error.stack}
												</pre>
											</div>
											<div>
												<strong>URL:</strong> {error.url}
											</div>
											<div>
												<strong>User Agent:</strong> {error.userAgent}
											</div>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Действия */}
						<div className="flex flex-col sm:flex-row gap-3 justify-center">
							<Button onClick={resetError} className="flex items-center gap-2">
								<RefreshCw className="w-4 h-4" />
								Попробовать снова
							</Button>
							
							<Button 
								variant="outline" 
								onClick={goBack}
								className="flex items-center gap-2"
							>
								<ArrowLeft className="w-4 h-4" />
								Вернуться назад
							</Button>

							{showDetails && (
								<Button 
									variant="outline" 
									size="sm"
									onClick={reportError}
									className="flex items-center gap-2"
								>
									<Bug className="w-4 h-4" />
									Сообщить об ошибке
								</Button>
							)}
						</div>

						{/* Контактная информация */}
						<div className="text-sm text-gray-500">
							<p>
								Если проблема повторяется, свяжитесь с нами: 
								<a 
									href="mailto:support@visitvostok.ru" 
									className="text-blue-600 hover:underline ml-1"
								>
									support@visitvostok.ru
								</a>
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

// === ГЛАВНЫЙ ERROR BOUNDARY ===

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = {
			hasError: false,
			errorInfo: null,
			errorId: null
		}
	}

	static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
		return {
			hasError: true,
		}
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
		
		const fullErrorInfo: ErrorInfo = {
			error,
			errorInfo,
			timestamp: new Date(),
			userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
			url: typeof window !== 'undefined' ? window.location.href : 'server'
		}

		this.setState({
			errorInfo: fullErrorInfo,
			errorId
		})

		// Логируем ошибку
		console.error('ErrorBoundary caught an error:', error, errorInfo)

		// Вызываем callback если передан
		if (this.props.onError) {
			this.props.onError(fullErrorInfo, errorId)
		}

		// Отправляем в систему мониторинга (если настроена)
		this.reportToMonitoring(fullErrorInfo, errorId)
	}

	private reportToMonitoring = (errorInfo: ErrorInfo, errorId: string) => {
		// Здесь можно добавить интеграцию с Sentry, LogRocket и т.д.
		// Пока только логируем
		if (process.env.NODE_ENV === 'production') {
			// В продакшене можно отправлять на сервер
			console.error('Production Error:', {
				errorId,
				message: errorInfo.error.message,
				stack: errorInfo.error.stack,
				timestamp: errorInfo.timestamp,
				url: errorInfo.url
			})
		}
	}

	private resetError = () => {
		this.setState({
			hasError: false,
			errorInfo: null,
			errorId: null
		})
	}

	render() {
		if (this.state.hasError && this.state.errorInfo) {
			// Если передан кастомный fallback, используем его
			const FallbackComponent = this.props.fallback || DefaultErrorFallback

			return (
				<FallbackComponent 
					error={this.state.errorInfo}
					resetError={this.resetError}
				/>
			)
		}

		return this.props.children
	}
}

// === ХУКИ ДЛЯ УДОБНОГО ИСПОЛЬЗОВАНИЯ ===

/**
 * Хук для программного вызова ошибки в компоненте
 * Полезно для async операций, которые Error Boundary не может поймать
 */
export function useErrorHandler() {
	return React.useCallback((error: Error) => {
		// Создаем синтетическую ошибку, которую поймает ближайший ErrorBoundary
		setTimeout(() => {
			throw error
		}, 0)
	}, [])
}

// === ТИПИЗИРОВАННЫЕ ОБЁРТКИ ===

interface AsyncErrorBoundaryProps extends ErrorBoundaryProps {
	onAsyncError?: (error: Error) => void
}

/**
 * Error Boundary специально для async операций
 */
export function AsyncErrorBoundary({ children, onAsyncError, ...props }: AsyncErrorBoundaryProps) {
	const handleAsyncError = React.useCallback((error: Error) => {
		if (onAsyncError) {
			onAsyncError(error)
		}
		// Пересоздаем Error для ErrorBoundary
		setTimeout(() => {
			throw error
		}, 0)
	}, [onAsyncError])

	// Можно расширить функциональность для async ошибок
	React.useEffect(() => {
		if (typeof window === 'undefined') return

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
			handleAsyncError(error)
			event.preventDefault()
		}

		window.addEventListener('unhandledrejection', handleUnhandledRejection)
		return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
	}, [handleAsyncError])

	return (
		<ErrorBoundary {...props}>
			{children}
		</ErrorBoundary>
	)
} 