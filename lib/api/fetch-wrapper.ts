/**
 * Fetch Wrapper with Automatic Token Refresh
 * 🔐 Intercepts 401 errors and automatically refreshes tokens using HTTP-Only cookies
 */

import { refreshToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';

/**
 * Wrapper around fetch that handles 401 errors with automatic token refresh
 * @param input - URL or Request object
 * @param init - RequestInit options
 * @param retryOnRefresh - Whether to retry the request after refreshing (default: true)
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryOnRefresh: boolean = true
): Promise<Response> {
  // Ensure credentials: 'include' for cookie transmission
  const config: RequestInit = {
    ...init,
    credentials: 'include',
  };

  // Make initial request
  const response = await fetch(input, config);

  // If 401 and retry enabled, attempt token refresh
  if (response.status === 401 && retryOnRefresh) {
    try {
      console.log('Access token expired, refreshing...');
      
      // Attempt to refresh token (uses refresh_token cookie)
      await refreshToken();
      
      console.log('Token refreshed successfully, retrying request...');
      
      // Retry original request with new access_token cookie
      const retryResponse = await fetch(input, config);
      return retryResponse;
      
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      
      // Redirect to login if refresh fails
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login?error=session_expired';
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
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Helper for POST requests with automatic auth handling
 */
export async function postWithAuth(url: string, body?: any): Promise<Response> {
  return fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for PUT requests with automatic auth handling
 */
export async function putWithAuth(url: string, body?: any): Promise<Response> {
  return fetchWithAuth(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper for DELETE requests with automatic auth handling
 */
export async function deleteWithAuth(url: string): Promise<Response> {
  return fetchWithAuth(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
