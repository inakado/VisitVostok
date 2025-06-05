import { useState, useEffect } from 'react'

interface AdminStats {
  totalPlaces: number
  totalCategories: number
  placesWithReviews: number
  recentPlaces: number
  topCategories: Array<{
    name: string
    count: number
  }>
}

interface UseAdminStatsResult {
  stats: AdminStats | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useAdminStats(): UseAdminStatsResult {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/admin/stats')
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки статистики')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      console.error('Ошибка загрузки статистики:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats
  }
} 