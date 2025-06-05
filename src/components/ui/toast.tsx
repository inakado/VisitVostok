"use client"

import * as React from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// === ТИПЫ ===

export interface Toast {
	id: string
	title?: string
	message: string
	type: 'success' | 'error' | 'warning' | 'info'
	duration?: number
	action?: {
		label: string
		onClick: () => void
	}
}

interface ToastProps {
	toast: Toast
	onDismiss: (id: string) => void
}

// === ИКОНКИ ПО ТИПАМ ===

const toastIcons = {
	success: CheckCircle,
	error: AlertCircle,
	warning: AlertTriangle,
	info: Info,
}

const toastStyles = {
	success: "bg-green-50 border-green-200 text-green-800",
	error: "bg-red-50 border-red-200 text-red-800",
	warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
	info: "bg-blue-50 border-blue-200 text-blue-800",
}

const iconStyles = {
	success: "text-green-500",
	error: "text-red-500",
	warning: "text-yellow-500",
	info: "text-blue-500",
}

// === TOAST КОМПОНЕНТ ===

export function ToastComponent({ toast, onDismiss }: ToastProps) {
	const [isVisible, setIsVisible] = React.useState(false)
	const [isLeaving, setIsLeaving] = React.useState(false)
	const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

	const Icon = toastIcons[toast.type]

	const handleDismiss = React.useCallback(() => {
		setIsLeaving(true)
		setTimeout(() => {
			onDismiss(toast.id)
		}, 300) // Время анимации исчезновения
	}, [onDismiss, toast.id])

	React.useEffect(() => {
		// Анимация появления
		setIsVisible(true)

		// Автоматическое исчезновение
		if (toast.duration !== 0) {
			timeoutRef.current = setTimeout(() => {
				handleDismiss()
			}, toast.duration || 5000)
		}

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
			}
		}
	}, [toast.duration, handleDismiss])

	return (
		<div
			className={cn(
				"flex items-start gap-3 w-full max-w-sm p-4 border rounded-lg shadow-lg transition-all duration-300 ease-in-out",
				toastStyles[toast.type],
				isVisible && !isLeaving && "translate-x-0 opacity-100",
				!isVisible && "translate-x-full opacity-0",
				isLeaving && "translate-x-full opacity-0"
			)}
			style={{
				transform: isVisible && !isLeaving ? 'translateX(0)' : 'translateX(100%)',
			}}
		>
			{/* Иконка */}
			<Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", iconStyles[toast.type])} />

			{/* Контент */}
			<div className="flex-1 min-w-0">
				{toast.title && (
					<h4 className="font-semibold text-sm mb-1">{toast.title}</h4>
				)}
				<p className="text-sm">{toast.message}</p>
				
				{toast.action && (
					<button
						onClick={toast.action.onClick}
						className="mt-2 text-sm font-medium underline hover:no-underline transition-all"
					>
						{toast.action.label}
					</button>
				)}
			</div>

			{/* Кнопка закрытия */}
			<button
				onClick={handleDismiss}
				className="p-1 rounded-md hover:bg-black/10 transition-colors"
				aria-label="Закрыть уведомление"
			>
				<X className="w-4 h-4" />
			</button>
		</div>
	)
}

// === TOAST CONTAINER ===

export function ToastContainer() {
	const { toasts, removeToast } = useToast()

	if (toasts.length === 0) return null

	return (
		<div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
			{toasts.map(toast => (
				<ToastComponent
					key={toast.id}
					toast={toast}
					onDismiss={removeToast}
				/>
			))}
		</div>
	)
}

// === TOAST CONTEXT ===

interface ToastContextType {
	toasts: Toast[]
	addToast: (toast: Omit<Toast, 'id'>) => string
	removeToast: (id: string) => void
	removeAllToasts: () => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = React.useState<Toast[]>([])

	const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
		const id = Math.random().toString(36).substr(2, 9)
		const newToast: Toast = { ...toast, id }
		
		setToasts(prev => [...prev, newToast])
		return id
	}, [])

	const removeToast = React.useCallback((id: string) => {
		setToasts(prev => prev.filter(toast => toast.id !== id))
	}, [])

	const removeAllToasts = React.useCallback(() => {
		setToasts([])
	}, [])

	return (
		<ToastContext.Provider 
			value={{ toasts, addToast, removeToast, removeAllToasts }}
		>
			{children}
			<ToastContainer />
		</ToastContext.Provider>
	)
}

// === TOAST HOOK ===

export function useToast() {
	const context = React.useContext(ToastContext)
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider')
	}
	return context
}

// === ХЕЛПЕРЫ ДЛЯ БЫСТРОГО ИСПОЛЬЗОВАНИЯ ===

export function createToastHelpers(addToast: ToastContextType['addToast']) {
	return {
		success: (message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => {
			return addToast({ ...options, message, type: 'success' })
		},

		error: (message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => {
			return addToast({ ...options, message, type: 'error' })
		},

		warning: (message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => {
			return addToast({ ...options, message, type: 'warning' })
		},

		info: (message: string, options?: Partial<Omit<Toast, 'id' | 'type'>>) => {
			return addToast({ ...options, message, type: 'info' })
		},
	}
} 