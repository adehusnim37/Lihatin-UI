'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { checkAuth, logout as apiLogout, clearUserData } from '@/lib/api/auth'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check authentication on mount and path change
  useEffect(() => {
    checkAuthentication()
  }, [pathname])

  const checkAuthentication = async () => {
    setIsLoading(true)
    
    try {
      // Call backend to check if access_token cookie is valid
      const { isAuthenticated: isAuth, error } = await checkAuth()
      setIsAuthenticated(isAuth)

      // Protected routes
      const protectedRoutes = ['/main', '/dashboard', '/profile']
      const isProtected = protectedRoutes.some(route => pathname?.startsWith(route))

      // Redirect to login if accessing protected route without valid auth
      if (!isAuth && isProtected) {
        // Show error toast if there's an error message
        if (error) {
          toast.error(error)
        }
        
        // Clear user data when session is invalid
        clearUserData()
        
        router.push(`/auth/login?redirect=${pathname}`)
      }

      // Redirect to main if accessing auth pages with valid auth
      const authRoutes = ['/auth/login', '/auth/register']
      const isAuthRoute = authRoutes.some(route => pathname === route)
      if (isAuth && isAuthRoute) {
        router.push('/main')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
      toast.error('Authentication check failed')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async () => {
    // After successful login, recheck authentication
    await checkAuthentication()
  }

  const logout = async () => {
    try {
      // Call backend logout to clear HTTP-Only cookies
      await apiLogout()
      
      // Clear user data from localStorage
      clearUserData()
      
      setIsAuthenticated(false)
      
      // Force page reload to ensure cookies are cleared and state is reset
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Logout failed:', error)
      
      // Clear local state even if API call fails
      clearUserData()
      setIsAuthenticated(false)
      
      // Force page reload as fallback
      window.location.href = '/auth/login'
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}