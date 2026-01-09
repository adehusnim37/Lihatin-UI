import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware for Route Protection
 * 🔐 Checks for access_token cookie to protect routes
 * 🔗 Excludes known app routes from short_code matching
 *
 * Protected routes: /main, /dashboard, /profile
 * Public routes: /auth/*, /, /not-found, etc.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get access_token from cookies
  const accessToken = request.cookies.get("access_token")?.value;

  // Define known app routes (these should NOT be treated as short codes)
  // This prevents /main, /auth, /profile, etc. from being caught by [short_code]
  const knownAppRoutes = [
    "/main",
    "/auth",
    "/profile",
    "/dashboard",
    "/r",
    "/link-error",
    "/not-found",
    "/api",
    "/_next",
    "/favicon.ico",
  ];

  // Check if this is a known app route
  const isKnownRoute =
    pathname === "/" ||
    knownAppRoutes.some((route) => pathname.startsWith(route));

  // Define protected routes
  const protectedRoutes = ["/main", "/dashboard", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Define auth routes
  const authRoutes = ["/auth/login", "/auth/register"];
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing auth routes with valid token, redirect to main
  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL("/main", request.url));
  }

  // If this is NOT a known route and it looks like a short code (single path segment),
  // let it through to the [short_code] route
  // Otherwise, if it's not a known route and has multiple segments, return 404
  if (!isKnownRoute) {
    // Single segment like /abc123 or two segments like /abc123/passcode
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length <= 2) {
      // Valid short code pattern - let it through
      return NextResponse.next();
    }
    // Multi-segment unknown route (>2) - redirect to 404
    return NextResponse.rewrite(new URL("/not-found", request.url));
  }

  return NextResponse.next();
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)",
  ],
};
