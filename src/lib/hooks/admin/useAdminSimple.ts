// Упрощенный хук для админ авторизации
// Без сложных редиректов и кэширования

import { useState, useEffect } from 'react'

interface AdminState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export function useAdminSimple() {
  const [state, setState] = useState<AdminState>({
    isAuthenticated: false,
    isLoading: true,
    error: null
  })

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/admin/status')
      const data = await response.json()
      
      const isAuth = response.ok && data.authenticated;
      
      setState({
        isAuthenticated: isAuth,
        isLoading: false,
        error: null
      })
    } catch {
      setState({
        isAuthenticated: false,
        isLoading: false,
        error: 'Ошибка проверки авторизации'
      })
    }
  }

  const login = async (password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
        return { success: true }
      } else {
        const errorMsg = data.error || 'Неверный пароль';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMsg
        }))
        return { success: false, error: errorMsg }
      }
    } catch {
      const errorMessage = 'Ошибка входа в систему'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
    } catch (error) {
      console.warn('useAdminSimple: Ошибка при выходе:', error)
    } finally {
      setState({
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    }
  }

  return {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    checkAuth
  }
} 