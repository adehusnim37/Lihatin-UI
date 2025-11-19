import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware for Route Protection
 * 🔐 Checks for access_token cookie to protect routes
 * 
 * Protected routes: /main, /dashboard, /profile
 * Public routes: /auth/*, /, /not-found, etc.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get access_token from cookies
  const accessToken = request.cookies.get('access_token')?.value

  // Define protected routes
  const protectedRoutes = ['/main', '/dashboard', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Define auth routes
  const authRoutes = ['/auth/login', '/auth/register']
  const isAuthRoute = authRoutes.some(route => pathname === route)

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If accessing auth routes with valid token, redirect to main
  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL('/main', request.url))
  }

  return NextResponse.next()
}

/**
 * Middleware configuration
 * Runs on all routes except static files, images, and API routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
}
