"use client"

/**
 * Минимальная версия AppProvider для диагностики проблем с циклами перерендеринга
 */

import React from 'react'
import { ToastProvider } from '@/components/ui/toast'
// import { ErrorBoundary } from '@/components/error/ErrorBoundary'
// import { logger, logPageView } from '@/lib/utils/errorLogger'

interface AppProviderProps {
	children: React.ReactNode
}

// === МИНИМАЛЬНЫЙ ПРОВАЙДЕР БЕЗ СЛОЖНОЙ ЛОГИКИ ===

export function AppProvider({ children }: AppProviderProps) {
	return (
		<ToastProvider>
			{children}
		</ToastProvider>
	)
}

// === ЭКСПОРТ УДОБНЫХ ХУКОВ ===

// Реэкспорт основных хуков для удобства
export { useToastHelpers } from '@/lib/hooks/common/useToastHelpers'
export { useOfflineSupport, useOfflineApiData } from '@/lib/hooks/common/useOfflineSupport'
export { useApi, useMutation } from '@/lib/hooks/common/useApi'
// export { useErrorHandler } from '@/components/error/ErrorBoundary'

// Экспорт системы логирования
export { 
	logger, 
	logPageView, 
	logUserAction, 
	logPerformance, 
	logFeatureUsage 
} from '@/lib/utils/errorLogger' 