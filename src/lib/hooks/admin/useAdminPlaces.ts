import { useState, useEffect, useCallback } from 'react'
import { Place } from '@/types'

interface PlacesResponse {
  places: Place[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: {
    categories: Array<{ name: string; count: number }>
    subcategories: string[]
  }
}

interface UseAdminPlacesOptions {
  page?: number
  limit?: number
  search?: string
  category?: string
  subcategory?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  infiniteScroll?: boolean
}

export function useAdminPlaces(options: UseAdminPlacesOptions = {}) {
  const [state, setState] = useState<{
    places: Place[]
    pagination: PlacesResponse['pagination'] | null
    filters: PlacesResponse['filters'] | null
    isLoading: boolean
    isLoadingMore: boolean
    error: string | null
    hasNextPage: boolean
    currentPage: number
  }>({
    places: [],
    pagination: null,
    filters: null,
    isLoading: true,
    isLoadingMore: false,
    error: null,
    hasNextPage: false,
    currentPage: 1
  })

  const { 
    limit = 20, 
    search = '', 
    category = '',
    subcategory = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    infiniteScroll = false
  } = options

  const deduplicatePlaces = useCallback((places: Place[]): Place[] => {
    const seen = new Set<string>()
    return places.filter(place => {
      if (seen.has(place.id)) {
        return false
      }
      seen.add(place.id)
      return true
    })
  }, [])

  const fetchPlaces = useCallback(async (isLoadMore = false, targetPage = 1) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isLoading: !isLoadMore, 
        isLoadingMore: isLoadMore,
        error: null 
      }))
      
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(category && { category }),
        ...(subcategory && { subcategory })
      })

      const response = await fetch(`/api/admin/places?${params}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json()

      if (response.ok) {
        setState(prev => {
          let newPlaces: Place[]
          
          if (isLoadMore && infiniteScroll) {
            newPlaces = deduplicatePlaces([...prev.places, ...data.places])
          } else {
            newPlaces = data.places
          }

          return {
            ...prev,
            places: newPlaces,
            pagination: data.pagination,
            filters: data.filters,
            isLoading: false,
            isLoadingMore: false,
            error: null,
            hasNextPage: data.pagination.page < data.pagination.pages,
            currentPage: data.pagination.page
          }
        })
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isLoadingMore: false,
          error: data.error || 'Ошибка загрузки мест'
        }))
      }
    } catch {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoadingMore: false,
        error: 'Ошибка соединения'
      }))
    }
  }, [limit, search, category, subcategory, sortBy, sortOrder, infiniteScroll, deduplicatePlaces])

  const loadMore = useCallback(async () => {
    if (state.isLoadingMore || !state.hasNextPage) return
    
    const nextPage = state.currentPage + 1
    await fetchPlaces(true, nextPage)
  }, [state.isLoadingMore, state.hasNextPage, state.currentPage, fetchPlaces])

  const createPlace = async (placeData: Omit<Place, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/admin/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placeData)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchPlaces(false, 1) // Обновляем список
        return { success: true, place: data }
      } else {
        return { success: false, error: data.error }
      }
    } catch {
      return { success: false, error: 'Ошибка при создании места' }
    }
  }

  const updatePlace = async (id: string, placeData: Partial<Place>) => {
    try {
      const response = await fetch(`/api/admin/places/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placeData)
      })

      const data = await response.json()

      if (response.ok) {
        await fetchPlaces(false, 1) // Обновляем список
        return { success: true, place: data }
      } else {
        return { success: false, error: data.error }
      }
    } catch {
      return { success: false, error: 'Ошибка при обновлении места' }
    }
  }

  const deletePlace = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/places/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        await fetchPlaces(false, 1) // Обновляем список
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch {
      return { success: false, error: 'Ошибка при удалении места' }
    }
  }

  // Эффект для загрузки и сброса при изменении фильтров
  useEffect(() => {
    // Сбрасываем состояние и загружаем первую страницу
    setState(prev => ({
      ...prev,
      places: [],
      currentPage: 1,
      hasNextPage: false
    }))
    fetchPlaces(false, 1)
  }, [search, category, subcategory, sortBy, sortOrder, fetchPlaces])

  return {
    places: state.places,
    pagination: state.pagination,
    filters: state.filters,
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    error: state.error,
    hasNextPage: state.hasNextPage,
    refetch: fetchPlaces,
    loadMore,
    createPlace,
    updatePlace,
    deletePlace
  }
} 