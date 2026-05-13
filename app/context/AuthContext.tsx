'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
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
  login: (sessionData?: { user: UserProfile; auth: AuthData }) => Promise<void>
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
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  const checkAuthentication = useCallback(async () => {
    setIsLoading(true)
    const currentPathname = pathnameRef.current

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
      const isAuthRoute = authRoutes.some(route => currentPathname === route)
      if (isAuthRoute) {
        router.push('/main')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication check failed'

      if (message !== 'unauthenticated') {
        console.error('Auth check failed:', error)
      }

      setIsAuthenticated(false)
      setUser(null)
      setAuth(null)
      clearUserData()

      const protectedRoutes = ['/main', '/dashboard', '/profile']
      const isProtected = protectedRoutes.some(route => currentPathname?.startsWith(route))

      if (isProtected) {
        toast.error('Please log in to access this page')
        router.push(`/auth/login?redirect=${currentPathname}`)
      }
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    void checkAuthentication()
  }, [checkAuthentication])

  const login = async (sessionData?: { user: UserProfile; auth: AuthData }) => {
    if (sessionData?.user && sessionData?.auth) {
      setIsAuthenticated(true)
      setUser(sessionData.user)
      setAuth(sessionData.auth)
      saveUserData(sessionData.user)
      return
    }

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
