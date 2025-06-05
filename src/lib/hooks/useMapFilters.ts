import { useState, useMemo, useEffect, useCallback } from 'react'
import { Place, MapFilters, CategoryWithSubcategories, Category } from '@/types'
import { apiClient } from '@/lib/api-client'

const DEFAULT_FILTERS: MapFilters = {
	searchQuery: '',
	selectedCategories: [],
	selectedSubcategories: [],
}

export function useMapFilters(places: Place[]) {
	const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS)
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
	const [categoriesFromDB, setCategoriesFromDB] = useState<Category[]>([])
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

	// Debounce только для поиска (устраняет мерцание при вводе)
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchQuery(filters.searchQuery)
		}, 150)

		return () => clearTimeout(timer)
	}, [filters.searchQuery])

	// Загрузка категорий из БД
	useEffect(() => {
		async function loadCategories() {
			try {
				const response = await apiClient.get<Category[]>('/categories')
				setCategoriesFromDB(response.data)
			} catch (error) {
				console.error('Ошибка загрузки категорий:', error)
			}
		}
		loadCategories()
	}, [])

	// Создание структуры категорий с подсчетом мест
	const categories = useMemo((): CategoryWithSubcategories[] => {
		const categoryCounts = new Map<string, number>()

		// Подсчитываем места в каждой категории
		places.forEach((place) => {
			const categoryName = place.categoryName
			categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + 1)
		})

		// Преобразуем категории из БД в UI структуру
		return categoriesFromDB.map((category) => ({
			id: category.id,
			name: category.name,
			subcategories: category.subcategories,
			count: categoryCounts.get(category.name) || 0,
			isExpanded: expandedCategories.has(category.id),
			order: category.order
		})).sort((a, b) => a.order - b.order)
	}, [places, categoriesFromDB, expandedCategories])

	// Мемоизированная фильтрация мест (мгновенная для категорий, debounced для поиска)
	const filteredPlaces = useMemo(() => {
		console.log('🔍 Применяем фильтры:', {
			search: debouncedSearchQuery,
			categories: filters.selectedCategories.length,
			subcategories: filters.selectedSubcategories.length,
			totalPlaces: places.length
		});

		return places.filter((place) => {
			// Фильтр по поисковому запросу (с debounce)
			if (debouncedSearchQuery) {
				const query = debouncedSearchQuery.toLowerCase()
				const matchesTitle = place.title.toLowerCase().includes(query)
				const matchesAddress = place.address?.toLowerCase().includes(query)
				const matchesCity = place.city?.toLowerCase().includes(query)
				
				if (!matchesTitle && !matchesAddress && !matchesCity) {
					return false
				}
			}

			// Фильтр по выбранным категориям (мгновенный)
			if (filters.selectedCategories.length > 0) {
				if (!filters.selectedCategories.includes(place.categoryName)) {
					return false
				}
			}

			// Фильтр по выбранным подкатегориям (мгновенный)
			if (filters.selectedSubcategories.length > 0) {
				const hasSelectedSubcategory = filters.selectedSubcategories.some(subcategory =>
					place.categories?.includes(subcategory)
				)
				if (!hasSelectedSubcategory) {
					return false
				}
			}

			return true
		})
	}, [places, debouncedSearchQuery, filters.selectedCategories, filters.selectedSubcategories])

	// Логгируем результат фильтрации
	useEffect(() => {
		console.log('✅ Результат фильтрации:', {
			отфильтровано: filteredPlaces.length,
			всего: places.length,
			процент: places.length > 0 ? Math.round((filteredPlaces.length / places.length) * 100) : 0
		});
	}, [filteredPlaces.length, places.length]);

	// Функция для переключения раскрытия категории
	const toggleCategoryExpansion = useCallback((categoryId: string) => {
		setExpandedCategories(prev => {
			const newSet = new Set(prev)
			if (newSet.has(categoryId)) {
				newSet.delete(categoryId)
			} else {
				newSet.add(categoryId)
			}
			return newSet
		})
	}, [])

	// Оптимизированная функция обновления фильтров
	const updateFilters = useCallback((newFilters: MapFilters) => {
		setFilters(newFilters)
	}, [])

	return {
		filters,
		setFilters: updateFilters,
		categories,
		filteredPlaces,
		totalFilteredPlaces: filteredPlaces.length,
		toggleCategoryExpansion,
		resetFilters: () => setFilters(DEFAULT_FILTERS),
	}
} 