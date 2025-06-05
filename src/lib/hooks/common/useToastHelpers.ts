/**
 * Хук для удобного использования toast уведомлений
 * Возвращает готовые функции для показа разных типов уведомлений
 */

import { useToast, createToastHelpers } from '@/components/ui/toast'

export function useToastHelpers() {
	const { addToast, removeToast, removeAllToasts } = useToast()
	
	const helpers = createToastHelpers(addToast)

	return {
		...helpers,
		// Дополнительные методы
		removeToast,
		removeAllToasts,
		
		// Специальные методы для API ошибок
		apiError: (error: unknown, title?: string) => {
			const message = error instanceof Error ? error.message : 'Произошла неизвестная ошибка'
			return helpers.error(message, { 
				title: title || 'Ошибка API',
				duration: 7000 // Дольше показываем ошибки
			})
		},

		// Для успешных операций с данными
		apiSuccess: (message: string, title?: string) => {
			return helpers.success(message, { 
				title: title || 'Успешно',
				duration: 3000 // Быстро скрываем успехи
			})
		},

		// Для предупреждений о соединении
		connectionWarning: (message: string = 'Проблемы с подключением к серверу') => {
			return helpers.warning(message, {
				title: 'Соединение',
				duration: 0, // Не скрываем автоматически
				action: {
					label: 'Повторить',
					onClick: () => window.location.reload()
				}
			})
		},

		// Для offline режима
		offlineNotice: () => {
			return helpers.info('Вы работаете в автономном режиме', {
				title: 'Offline режим',
				duration: 0
			})
		}
	}
} 