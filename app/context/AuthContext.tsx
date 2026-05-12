'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  clearUserData,
  getUserData,
  logout as apiLogout,
  saveUserData,
  type AuthData,
  type UserProfile,
} from '@/lib/api/auth'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: UserProfile | null
  auth: AuthData | null
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [auth, setAuth] = useState<AuthData | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuthentication = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await getUserData()
      if (!response.success || !response.data?.user || !response.data?.auth) {
        throw new Error(response.message || 'Failed to fetch user data')
      }

      setIsAuthenticated(true)
      setUser(response.data.user)
      setAuth(response.data.auth)
      saveUserData(response.data.user)

      const authRoutes = ['/auth/login', '/auth/register']
      const isAuthRoute = authRoutes.some(route => pathname === route)
      if (isAuthRoute) {
        router.push('/main')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
      setUser(null)
      setAuth(null)
      clearUserData()

      const protectedRoutes = ['/main', '/dashboard', '/profile']
      const isProtected = protectedRoutes.some(route => pathname?.startsWith(route))
      const message = error instanceof Error ? error.message : 'Authentication check failed'

      toast.error(message)
      if (isProtected) {
        router.push(`/auth/login?redirect=${pathname}`)
      }
    } finally {
      setIsLoading(false)
    }
  }, [pathname, router])

  useEffect(() => {
    void checkAuthentication()
  }, [checkAuthentication])

  const login = async () => {
    await checkAuthentication()
  }

  const logout = async () => {
    try {
      await apiLogout()
      clearUserData()
      setIsAuthenticated(false)
      setUser(null)
      setAuth(null)
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Logout failed:', error)
      clearUserData()
      setIsAuthenticated(false)
      setUser(null)
      setAuth(null)
      window.location.href = '/auth/login'
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, auth, login, logout }}>
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
