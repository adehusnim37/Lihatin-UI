'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user has valid token
    const token = localStorage.getItem('accessToken')
    setIsAuthenticated(!!token)
    setIsLoading(false)

    // Protected routes
    const protectedRoutes = ['/main', '/dashboard', '/profile']
    const isProtected = protectedRoutes.some(route => pathname?.startsWith(route))

    // Redirect to login if accessing protected route without token
    if (!token && isProtected) {
      router.push(`/auth/login?redirect=${pathname}`)
    }

    // Redirect to main if accessing auth pages with token
    const authRoutes = ['/auth/login', '/auth/register']
    const isAuthRoute = authRoutes.some(route => pathname === route)
    if (token && isAuthRoute) {
      router.push('/main')
    }
  }, [pathname, router])

  const login = (token: string) => {
    localStorage.setItem('accessToken', token)
    setIsAuthenticated(true)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setIsAuthenticated(false)
    router.push('/auth/login')
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