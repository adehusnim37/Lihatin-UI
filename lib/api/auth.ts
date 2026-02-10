/**
 * Authentication API Service
 * 🔐 SECURITY: Cookie-based authentication with HTTP-Only cookies
 * - Tokens stored in HTTP-Only cookies (XSS protection)
 * - Automatic cookie transmission via credentials: 'include'
 * - No token storage in localStorage (prevents XSS token theft)
 */

import { fetchWithAuth } from "./fetch-wrapper";

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
  role: string; // "user" | "admin" | "super_admin"
  is_premium: boolean;
  created_at: string; // ISO 8601 or similar timestamp string
}

export interface LoginResponse {
  user: UserProfile;
  auth: AuthData;
}

// Response when TOTP is required (NO tokens issued yet!)
export interface PendingTOTPResponse {
  requires_totp: boolean;
  pending_auth_token: string;
  user: UserProfile;
}

// Union type for login response - can be either full login or pending TOTP
export type LoginResult = LoginResponse | PendingTOTPResponse;

// Type guard to check if response requires TOTP
export function requiresTOTP(
  response: LoginResult
): response is PendingTOTPResponse {
  return "requires_totp" in response && response.requires_totp === true;
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
  secret_code?: string;
}

export interface RegisterResponse {
  user_id: string;
  email: string;
}

export interface RedeemPremiumCodeRequest {
  secret_code: string;
}

export interface RedeemPremiumCodeResponse {
  user_id: string;
  is_premium: boolean;
}

export interface ForgotPasswordRequest {
  email?: string;
  username?: string;
}

// API Response - unified format for all responses (including validation errors)
export interface APIResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  error?: Record<string, string> | null; // All errors use this field now
}

/**
 * Extract user-friendly error message from API response
 */
export function getErrorMessage(response: APIResponse): string {
  // Check for error map
  if (response.error && Object.keys(response.error).length > 0) {
    return Object.values(response.error).join(", ");
  }

  // Fallback to message
  return response.message || "An error occurred";
}

/**
 * Login user with email/username and password
 * 🔐 If TOTP is enabled, returns pending_auth_token (NO JWT cookies yet!)
 * 🔐 If TOTP is disabled, tokens are set as HTTP-Only cookies
 */
export async function login(
  credentials: LoginRequest
): Promise<APIResponse<LoginResult>> {
  const response = await fetchWithAuth(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Send cookies with request
    body: JSON.stringify(credentials),
  }, false);

  const data: APIResponse<LoginResult> = await response.json();

  if (!response.ok) {
    // Handle validation errors (from validator.go) or standard errors
    const errorMessage = getErrorMessage(data);
    throw new Error(errorMessage);
  }

  // Refresh CSRF token after successful login (if not requiring TOTP)
  if (data.data && !requiresTOTP(data.data)) {
    const { refreshCSRFToken } = await import("./fetch-wrapper");
    await refreshCSRFToken();
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
  const response = await fetchWithAuth(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Include for consistency
    body: JSON.stringify(userData),
  }, false);

  const data: APIResponse<RegisterResponse> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

/**
 * Redeem premium code for authenticated user
 */
export async function redeemPremiumCode(
  payload: RedeemPremiumCodeRequest
): Promise<APIResponse<RedeemPremiumCodeResponse>> {
  const response = await fetchWithAuth(`${API_URL}/auth/redeem-premium-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  }, false);

  const data: APIResponse<RedeemPremiumCodeResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data));
  }

  return data;
}

/**
 * Request password reset email
 */
export async function forgotPassword(
  request: ForgotPasswordRequest
): Promise<APIResponse<null>> {
  const response = await fetchWithAuth(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  }, false);

  const data: APIResponse<null> = await response.json();

  // Note: Backend always returns 200 to prevent email enumeration
  if (!response.ok) {
    throw new Error(data.message || "Failed to send reset email");
  }

  return data;
}

/**
 * Validate password reset token
 */
export async function validateResetToken(
  token: string
): Promise<APIResponse<null>> {
  const response = await fetchWithAuth(
    `${API_URL}/auth/validate-reset?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  const data: APIResponse<null> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Invalid or expired reset token");
  }

  return data;
}

/**
 * Reset password with token
 */
export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  confirm_password: string;
}

export async function resetPassword(
  request: ResetPasswordRequest
): Promise<APIResponse<null>> {
  const response = await fetchWithAuth(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  }, false);

  const data: APIResponse<null> = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to reset password");
  }

  return data;
}

/**
 * Refresh access token using HTTP-Only refresh_token cookie
 * Backend reads refresh_token from cookie and sets new tokens as cookies
 */
export async function refreshToken(): Promise<APIResponse<null>> {
  const response = await fetchWithAuth(`${API_URL}/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Send refresh_token cookie
  }, false);

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
  // Import here to avoid circular dependency
  const { clearCSRFToken } = await import("./fetch-wrapper");

  const response = await fetchWithAuth(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Send cookies for session validation
  }, false);

  const data: APIResponse<LogoutResponse> = await response.json();

  // Clear CSRF token regardless of response
  clearCSRFToken();

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
  const response = await fetchWithAuth(`${API_URL}/auth/me`, {
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
  const response = await fetchWithAuth(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Send access_token cookie
    body: JSON.stringify(data),
  }, false);

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
  const response = await fetchWithAuth(`${API_URL}/auth/send-verification-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Send access_token cookie
  }, false);

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
    const response = await fetchWithAuth(`${API_URL}/auth/check-verification-email`, {
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
  const response = await fetchWithAuth(`${API_URL}/auth/profile`, {
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
export async function checkAuth(): Promise<{ isAuthenticated: boolean; error?: string }> {
  try {
    // Call a protected endpoint to verify cookie validity
    const response = await fetchWithAuth(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ Send access_token cookie
    });

    if (response.ok) {
      return { isAuthenticated: true };
    }

    // Try to parse error message from response
    try {
      const data = await response.json();
      return { 
        isAuthenticated: false, 
        error: data.message || data.error?.session || "Authentication failed" 
      };
    } catch {
      return { isAuthenticated: false, error: "Authentication failed" };
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    return { isAuthenticated: false, error: "Network error. Please check your connection." };
  }
}

// ==================== TOTP (2FA) FUNCTIONS ====================

export interface TOTPSetupResponse {
  secret: string;
  qr_code_url: string;
  recovery_codes: string[];
  backup_codes: string[];
}

/**
 * Verify TOTP code during LOGIN flow
 * 🔐 This is the ONLY way to get JWT tokens when TOTP is enabled
 * 🔐 Tokens are set as HTTP-Only cookies ONLY after successful verification
 */
export interface VerifyTOTPLoginRequest {
  pending_auth_token: string;
  totp_code: string;
}

export async function verifyTOTPLogin(
  request: VerifyTOTPLoginRequest
): Promise<APIResponse<LoginResponse>> {
  const response = await fetchWithAuth(`${API_URL}/auth/verify-totp-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Receive cookies after successful TOTP
    body: JSON.stringify(request),
  }, false);

  const result: APIResponse<LoginResponse> = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "TOTP verification failed");
  }

  // Refresh CSRF token after successful TOTP login
  const { refreshCSRFToken } = await import("./fetch-wrapper");
  await refreshCSRFToken();

  return result;
}

/**
 * Setup TOTP (Two-Factor Authentication)
 * 🔐 Generates QR code and recovery codes
 */
export async function setupTOTP(): Promise<APIResponse<TOTPSetupResponse>> {
  const response = await fetchWithAuth(`${API_URL}/auth/totp/setup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  }, false);

  const result: APIResponse<TOTPSetupResponse> = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to setup TOTP");
  }

  return result;
}

/**
 * Verify TOTP code during setup
 * 🔐 Enables 2FA after successful verification
 */
export async function verifyTOTP(
  totp_code: string
): Promise<APIResponse<null>> {
  const response = await fetchWithAuth(`${API_URL}/auth/totp/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ totp_code }),
  }, false);

  const result: APIResponse<null> = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to verify TOTP code");
  }

  return result;
}

/**
 * Disable TOTP (Two-Factor Authentication)
 * 🔐 Requires password or TOTP code
 */
export async function disableTOTP(
  password?: string,
  totpCode?: string
): Promise<APIResponse<{ message: string }>> {
  const response = await fetchWithAuth(`${API_URL}/auth/totp/disable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      password,
      totp_code: totpCode,
    }),
  }, false);

  const result: APIResponse<{ message: string }> = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to disable TOTP");
  }

  return result;
}
