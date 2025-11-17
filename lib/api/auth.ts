/**
 * Authentication API Service
 * Handles all authentication-related API calls to the backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Type definitions matching backend DTOs
export interface LoginRequest {
  email_or_username: string;
  password: string;
}

export interface LoginResponse {
  token: {
    access_token: string;
    refresh_token: string;
  };
  user: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar: string;
    is_premium: boolean;
    created_at: string;
  };
  auth: {
    id: string;
    user_id: string;
    is_email_verified: boolean;
    is_totp_enabled: boolean;
    last_login_at: string;
  };
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    is_premium: boolean;
    created_at: string;
  };
  message: string;
}

export interface ForgotPasswordRequest {
  email?: string;
  username?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data: T | null;
  message: string;
  error: Record<string, string> | null;
}

/**
 * Login user with email/username and password
 */
export async function login(credentials: LoginRequest): Promise<APIResponse<LoginResponse>> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data: APIResponse<LoginResponse> = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  return data;
}

/**
 * Register new user account
 */
export async function register(userData: RegisterRequest): Promise<APIResponse<RegisterResponse>> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const data: APIResponse<RegisterResponse> = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  return data;
}

/**
 * Request password reset email
 */
export async function forgotPassword(request: ForgotPasswordRequest): Promise<APIResponse<null>> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const data: APIResponse<null> = await response.json();
  
  // Note: Backend always returns 200 to prevent email enumeration
  // But we still check the response structure
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send reset email');
  }

  return data;
}

/**
 * Store authentication tokens in localStorage
 */
export function saveTokens(accessToken: string, refreshToken: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token');
  }
  return null;
}

/**
 * Clear authentication tokens from localStorage
 */
export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}

/**
 * Save user data to localStorage
 */
export function saveUserData(user: LoginResponse['user']): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

/**
 * Get user data from localStorage
 */
export function getUserData(): LoginResponse['user'] | null {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }
  return null;
}

/**
 * Clear user data from localStorage
 */
export function clearUserData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}
