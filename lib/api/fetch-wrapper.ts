/**
 * Fetch Wrapper with Automatic Token Refresh + CSRF Protection
 * 🔐 Intercepts 401 errors and automatically refreshes tokens using HTTP-Only cookies
 * 🛡️ Automatically attaches CSRF token to mutating requests
 */

import { refreshToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

// CSRF token storage (in-memory for security)
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

/**
 * Fetch CSRF token from server
 * Uses singleton pattern to prevent multiple simultaneous requests
 */
async function fetchCSRFToken(): Promise<string> {
  // Return existing promise if already fetching
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  csrfTokenPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/csrf-token`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }

      const data = await response.json();
      csrfToken = data.data?.csrfToken || null;

      if (!csrfToken) {
        console.warn("CSRF token not found in response");
      }

      return csrfToken || "";
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      return "";
    } finally {
      // Clear promise after completion
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
}

/**
 * Get CSRF token (fetches if not available)
 */
export async function getCSRFToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }
  return fetchCSRFToken();
}

/**
 * Clear CSRF token (call on logout)
 */
export function clearCSRFToken(): void {
  csrfToken = null;
  csrfTokenPromise = null;
}

/**
 * Refresh CSRF token (call after login)
 */
export async function refreshCSRFToken(): Promise<string> {
  csrfToken = null;
  return fetchCSRFToken();
}

/**
 * Check if method requires CSRF token
 */
function requiresCSRF(method: string): boolean {
  const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  return mutatingMethods.includes(method.toUpperCase());
}

/**
 * Check if we're in production mode (where CSRF is enabled)
 * Uses API URL to determine environment since that's more reliable than NODE_ENV
 */
function isProduction(): boolean {
  // Check if API URL is a production domain (https and not localhost)
  return API_URL.startsWith("https://") && !API_URL.includes("localhost") || process.env.NODE_ENV === "production";
}

/**
 * Wrapper around fetch that handles 401 errors with automatic token refresh
 * and CSRF token attachment for mutating requests
 * @param input - URL or Request object
 * @param init - RequestInit options
 * @param retryOnRefresh - Whether to retry the request after refreshing (default: true)
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryOnRefresh: boolean = true
): Promise<Response> {
  const method = init?.method?.toUpperCase() || "GET";

  // Prepare headers
  const headers = new Headers(init?.headers);

  // Attach CSRF token for mutating requests (only in production)
  if (isProduction() && requiresCSRF(method)) {
    const token = await getCSRFToken();
    if (token) {
      headers.set("X-CSRF-Token", token);
      console.log(
        `[CSRF] Attached token to ${method} request:`,
        token.substring(0, 20) + "..."
      );
    } else {
      console.warn(`[CSRF] No token available for ${method} request`);
    }
  }

  // Ensure credentials: 'include' for cookie transmission
  const config: RequestInit = {
    ...init,
    headers,
    credentials: "include",
  };

  // Make initial request
  const response = await fetch(input, config);

  // Handle CSRF token error (403 with CSRF message)
  if (response.status === 403) {
    const clonedResponse = response.clone();
    try {
      const errorData = await clonedResponse.json();
      if (
        errorData.error?.includes("CSRF") ||
        errorData.message?.includes("CSRF")
      ) {
        console.log("CSRF token expired, refreshing...");
        await refreshCSRFToken();

        // Retry with new CSRF token
        const newToken = await getCSRFToken();
        if (newToken) {
          headers.set("X-CSRF-Token", newToken);
        }

        return fetch(input, { ...config, headers });
      }
    } catch {
      // Not JSON response, continue with original response
    }
  }

  // If 401 and retry enabled, attempt token refresh
  if (response.status === 401 && retryOnRefresh) {
    try {
      console.log("Access token expired, refreshing...");

      // Attempt to refresh token (uses refresh_token cookie)
      await refreshToken();

      // Also refresh CSRF token after auth refresh (only in production)
      if (isProduction()) {
        await refreshCSRFToken();
      }

      console.log("Token refreshed successfully, retrying request...");

      // Get new CSRF token for retry (only in production)
      if (isProduction() && requiresCSRF(method)) {
        const newToken = await getCSRFToken();
        if (newToken) {
          headers.set("X-CSRF-Token", newToken);
        }
      }

      // Retry original request with new tokens
      const retryResponse = await fetch(input, { ...config, headers });
      return retryResponse;
    } catch (refreshError) {
      console.error("Token refresh failed:", refreshError);

      // Clear CSRF token on auth failure
      clearCSRFToken();

      // Redirect to login if refresh fails
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login?error=session_expired";
      }

      // Return original 401 response
      return response;
    }
  }

  return response;
}

/**
 * Helper for GET requests with automatic auth handling
 */
export async function getWithAuth(url: string): Promise<Response> {
  return fetchWithAuth(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Helper for POST requests with automatic auth handling + CSRF
 */
export async function postWithAuth(
  url: string,
  body?: unknown
): Promise<Response> {
  return fetchWithAuth(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for PUT requests with automatic auth handling + CSRF
 */
export async function putWithAuth(
  url: string,
  body?: unknown
): Promise<Response> {
  return fetchWithAuth(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for PATCH requests with automatic auth handling + CSRF
 */
export async function patchWithAuth(
  url: string,
  body?: unknown
): Promise<Response> {
  return fetchWithAuth(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for DELETE requests with automatic auth handling + CSRF
 */
export async function deleteWithAuth(url: string): Promise<Response> {
  return fetchWithAuth(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
}
