/**
 * Authentication API Service
 * 🔐 SECURITY: Cookie-based authentication with HTTP-Only cookies
 * - Tokens stored in HTTP-Only cookies (XSS protection)
 * - Automatic cookie transmission via credentials: 'include'
 * - No token storage in localStorage (prevents XSS token theft)
 */

import { tr } from "zod/v4/locales";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

// Type definitions matching backend DTOs
export interface LoginRequest {
  email_or_username: string;
  password: string;
}

// 1. Interface for the 'auth' object (Authentication details)
export interface AuthData {
  id: string; // ID of the authentication session or record
  user_id: string; // Foreign key to the user profile
  is_email_verified: boolean;
  is_totp_enabled: boolean;
  device_id: string;
  last_ip: string;
  last_login_at: string; // ISO 8601 or similar timestamp string
  failed_login_attempts: number;
  password_changed_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 2. Interface for the 'user' object (Profile details)
export interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string; // Assuming an empty string if no avatar
  is_premium: boolean;
  created_at: string; // ISO 8601 or similar timestamp string
}

export interface LoginResponse {
  user: UserProfile;
  auth: AuthData;
}

export interface AuthProfileData {
  user: UserProfile;
  auth: AuthData;
}

export interface LogoutResponse {
  message: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user_id: string;
  email: string;
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
 * 🔐 Tokens are automatically set as HTTP-Only cookies by backend
 */
export async function login(
  credentials: LoginRequest
): Promise<APIResponse<LoginResponse>> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Send cookies with request
    body: JSON.stringify(credentials),
  });

  const data: APIResponse<LoginResponse> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

/**
 * Register new user account
 * Note: Registration doesn't set cookies (email verification required first)
 */
export async function register(
  userData: RegisterRequest
): Promise<APIResponse<RegisterResponse>> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Include for consistency
    body: JSON.stringify(userData),
  });

  const data: APIResponse<RegisterResponse> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

/**
 * Request password reset email
 */
export async function forgotPassword(
  request: ForgotPasswordRequest
): Promise<APIResponse<null>> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  const data: APIResponse<null> = await response.json();

  // Note: Backend always returns 200 to prevent email enumeration
  if (!response.ok) {
    throw new Error(data.message || "Failed to send reset email");
  }

  return data;
}

/**
 * Refresh access token using HTTP-Only refresh_token cookie
 * Backend reads refresh_token from cookie and sets new tokens as cookies
 */
export async function refreshToken(): Promise<APIResponse<null>> {
  const response = await fetch(`${API_URL}/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Send refresh_token cookie
  });

  const data: APIResponse<null> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Token refresh failed");
  }

  return data;
}

/**
 * Logout user - clears HTTP-Only cookies on backend
 */
export async function logout(): Promise<APIResponse<LogoutResponse>> {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Send cookies for session validation
  });

  const data: APIResponse<LogoutResponse> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Logout failed");
  }

  return data;
}

/**
 * Save user data to localStorage (user profile only, NOT tokens)
 * ⚠️ Tokens are stored in HTTP-Only cookies - NEVER in localStorage
 */
export function saveUserData(user: LoginResponse["user"]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

/**
 * Get user data from localStorage
 * Note: This only stores user profile, NOT tokens   (tokens are in HTTP-Only cookies)
 */

export async function getUserData(): Promise<APIResponse<AuthProfileData>> {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Send access_token cookie
  });
  const data: APIResponse<AuthProfileData> = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  return data;
}

/** * Clear user data from localStorage
 */
export function clearUserData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
}

/**
 * Change password - requires current password
 */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export async function changePassword(
  data: ChangePasswordRequest
): Promise<APIResponse<null>> {
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Send access_token cookie
    body: JSON.stringify(data),
  });

  const result: APIResponse<null> = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to change password");
  }

  return result;
}

/**
 * Send verification email to current user
 * 🔐 Requires authentication
 */
export async function sendVerificationEmail(): Promise<APIResponse<null>> {
  const response = await fetch(`${API_URL}/auth/send-verification-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Send access_token cookie
  });

  const result: APIResponse<null> = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to send verification email");
  }

  return result;
}

/**
 * Check email verification status
 * 🔐 Requires authentication
 */
export async function checkEmailVerificationStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/auth/check-verification-email`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ Send access_token cookie
    });

    const result: APIResponse<string> = await response.json();

    // Backend returns 200 with data="VERIFIED" and message="EMAIL_VERIFIED" when verified
    // Returns 400 with code "EMAIL_NOT_VERIFIED" when not verified
    return response.ok && result.data === "VERIFIED";
  } catch (error) {
    console.error("Failed to check verification status:", error);
    return false;
  }
}

/**
 * Get user profile with auth details
 * 🔐 Fetches complete user profile and authentication data
 */
export async function getProfile(): Promise<APIResponse<AuthProfileData>> {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Send access_token cookie
  });

  const data: APIResponse<AuthProfileData> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch profile");
  }

  return data;
}

/**
 * Check if user is authenticated by checking server-side
 * 🔐 Don't rely on localStorage - cookies are the source of truth
 */
export async function checkAuth(): Promise<boolean> {
  try {
    // Call a protected endpoint to verify cookie validity
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ Send access_token cookie
    });

    return response.ok;
  } catch (error) {
    console.error("Auth check failed:", error);
    return false;
  }
}
