// Базовые типы данных для проекта VisitVostok
// Этот файл содержит централизованные типы для безопасного рефакторинга

import { Place as PrismaPlace, User as PrismaUser, Review as PrismaReview, Role } from '@prisma/client'

// === БАЗОВЫЕ ТИПЫ ===

// Основные сущности (на основе Prisma моделей)
export type Place = PrismaPlace
export type User = PrismaUser
export type Review = PrismaReview
export type UserRole = Role

// Категория (кастомный тип)
export interface Category {
	id: string
	name: string
	subcategories: string[]
	order: number
}

// === РАСШИРЕННЫЕ ТИПЫ ===

// Place с дополнительными данными для UI
export interface PlaceWithDetails extends Place {
	reviews: Review[]
	averageRating?: number
	isVisited?: boolean
}

// Упрощенный Place для списков и карт
export interface PlacePreview {
	id: string
	title: string
	lat: number
	lng: number
	categoryName: string
	city: string | null
	totalScore: number | null
	reviewsCount: number | null
	imageUrl: string | null
}

// === АКТИВНОСТИ ===

// Activity interface (пока в коде определен в ClientActivitiesPage)
export interface Activity {
	id: string
	title: string
	imageUrl: string
	excerpt: string
	category: string
	location: string
	rating?: number
	reviewsCount: number
	coordinates: { lat: number; lng: number }
	price?: string
}

// Тематическая коллекция активностей
export interface ThematicCollection {
	title: string
	activities: Activity[]
}

// === API ТИПЫ ===

// Стандартный ответ API
export interface APIResponse<T> {
	data: T
	error?: string
	meta?: {
		total: number
		page: number
		limit: number
	}
}

// Ошибка API (интерфейс, не класс для избежания конфликтов)
export interface APIErrorData {
	error: string
	code?: string
	details?: unknown
}

// === TELEGRAM ===

// Данные авторизации Telegram
export interface TelegramAuthData {
	id: number
	first_name: string
	last_name?: string
	username?: string
	photo_url?: string
	auth_date: number
	hash: string
}

// === UI ТИПЫ ===

// Пропсы для компонентов карты
export interface MapProps {
	places: Place[]
	onPlaceSelect: (place: Place | null) => void
}

// Пропсы для BottomSheet
export interface BottomSheetProps {
	place: Place | null
	onClose: () => void
}

// Пропсы для общих компонентов
export interface ComponentProps {
	className?: string
	children?: React.ReactNode
}

// === ФОРМЫ ===

// Данные для создания/редактирования места (на основе Prisma схемы)
export interface PlaceFormData {
	title: string
	lat: number
	lng: number
	categoryName: string
	city: string
	state: string
	address: string
	street?: string
	price?: string
	description?: string
}

// === МАРШРУТЫ ===

// Пользовательский маршрут (пока заглушка в PlacesList)
export interface UserRoute {
	id: string
	title: string
	description: string
	imageUrl?: string
	placesCount: number
	duration?: string
}

// === УТИЛИТАРНЫЕ ТИПЫ ===

// Состояние загрузки
export interface LoadingState {
	isLoading: boolean
	error: string | null
}

// Параметры фильтрации мест
export interface PlaceFilters {
	category?: string
	city?: string
	minRating?: number
	searchQuery?: string
}

// Параметры фильтрации активностей
export interface ActivityFilters {
	featured?: boolean
	category?: string
	limit?: number
}

// === ФИЛЬТРЫ КАРТЫ ===

// Состояние фильтров карты (убираем popularityRange)
export interface MapFilters {
	searchQuery: string
	selectedCategories: string[]
	selectedSubcategories: string[]
}

// Структура категории с подкатегориями (обновлено для работы с БД)
export interface CategoryWithSubcategories {
	id: string
	name: string
	subcategories: string[]
	count: number
	isExpanded: boolean
	order: number
}

// Пропсы для компонента фильтра
export interface MapFilterProps {
	filters: MapFilters
	onFiltersChange: (filters: MapFilters) => void
	categories: CategoryWithSubcategories[]
	totalPlaces: number
}

// Типы табов фильтра
export type FilterTab = 'catalog' | 'list' | 'favorites' | 'route' 