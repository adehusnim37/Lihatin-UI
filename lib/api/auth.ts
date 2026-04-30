/**
 * Authentication API Service
 * 🔐 SECURITY: Cookie-based authentication with HTTP-Only cookies
 * - Tokens stored in HTTP-Only cookies (XSS protection)
 * - Automatic cookie transmission via credentials: 'include'
 * - No token storage in localStorage (prevents XSS token theft)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";
const USER_STORAGE_UPDATED_EVENT = "user-storage-updated";

// Type definitions matching backend DTOs
export interface LoginRequest {
  email_or_username: string;
  password: string;
}

export interface GoogleOAuthStartResponse {
  authorization_url: string;
  state: string;
}

export interface GoogleOAuthStartRequest {
  intent?: "login" | "signup";
}

export interface GoogleOAuthCallbackRequest {
  code: string;
  state: string;
}

export interface SignupStartRequest {
  email: string;
}

export interface SignupStartResponse {
  challenge_token?: string;
  cooldown_seconds?: number;
  signup_token?: string;
  requires_profile_completion?: boolean;
}

export interface SignupVerifyOTPRequest {
  challenge_token: string;
  otp_code: string;
}

export interface SignupVerifyOTPResponse {
  signup_token: string;
}

export interface SignupResendOTPRequest {
  challenge_token: string;
}

export interface SignupCompleteRequest {
  signup_token: string;
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  secret_code?: string;
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

export interface PendingEmailOTPResponse {
  requires_email_otp: boolean;
  challenge_token: string;
  cooldown_seconds?: number;
  email: string;
  user: UserProfile;
}

// Union type for login response - can be either full login or pending TOTP
export type LoginResult =
  | LoginResponse
  | PendingTOTPResponse
  | PendingEmailOTPResponse;

// Type guard to check if response requires TOTP
export function requiresTOTP(
  response: LoginResult
): response is PendingTOTPResponse {
  return "requires_totp" in response && response.requires_totp === true;
}

export function requiresEmailOTP(
  response: LoginResult
): response is PendingEmailOTPResponse {
  return (
    "requires_email_otp" in response && response.requires_email_otp === true
  );
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

export interface SignupCompleteResponse {
  user_id: string;
  email: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  avatar?: string;
}

export interface UploadAvatarResponse {
  avatar_url: string;
  object_key: string;
}

export interface ChangeEmailRequest {
  new_email: string;
}

export interface ChangeUsernameRequest {
  new_username: string;
}

export interface ChangeUsernameResponse {
  old_username: string;
  new_username: string;
}

export interface AdminDisposableEmailPolicyResponse {
  enabled: boolean;
  effective_in_current_env: boolean;
  last_updated_by?: string | null;
  last_updated_at?: string | null;
}

export interface UpdateAdminDisposableEmailPolicyRequest {
  enabled: boolean;
}

export interface AdminPremiumCodeUsage {
  id: number;
  premium_key_id: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AdminPremiumCode {
  id: number;
  secret_code: string;
  valid_until?: string | null;
  limit_usage?: number | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
  key_usage?: AdminPremiumCodeUsage[];
}

export interface AdminPremiumCodesResponse {
  keys: AdminPremiumCode[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  sort: string;
  order_by: string;
}

export interface AdminGeneratePremiumCodeRequest {
  valid_until: string;
  limit_usage: number;
  is_bulk?: boolean;
  amount?: number;
}

export interface AdminGeneratePremiumCodeBulkResponse {
  is_bulk: boolean;
  total: number;
  items: AdminPremiumCode[];
}

export interface AdminSendPremiumCodeEmailRequest {
  user_id?: string;
  recipient_email?: string;
  recipient_name?: string;
  note?: string;
}

export interface AdminSendPremiumCodeEmailResponse {
  premium_key_id: number;
  recipient_email: string;
  recipient_name: string;
  delivered_secret: string;
  sent_at: string;
}

export interface AdminUserResponse {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  updated_at: string;
  is_premium: boolean;
  is_locked: boolean;
  locked_at?: string | null;
  locked_reason?: string;
  role: string;
  premium_revoke_type?: string;
  premium_revoked_at?: string | null;
  premium_revoked_by?: string | null;
  premium_revoked_reason?: string;
  premium_reactivated_at?: string | null;
  premium_reactivated_by?: string | null;
  premium_reactivated_reason?: string;
}

export interface AdminUsersListResponse {
  users: AdminUserResponse[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AdminRevokePremiumAccessRequest {
  reason: string;
  revoke_type: "temporary" | "permanent";
}

export interface AdminReactivatePremiumAccessRequest {
  reason: string;
  override_permanent?: boolean;
}

export interface AdminPremiumStatusMutationResponse {
  user_id: string;
  is_premium: boolean;
  role: string;
  premium_revoke_type?: string;
  premium_revoked_at?: string | null;
  premium_reactivated_at?: string | null;
  premium_revoked_reason?: string;
  premium_reactivated_reason?: string;
}

export interface AdminPremiumStatusEventResponse {
  id: number;
  user_id: string;
  action: "revoke" | "reactivate" | string;
  old_status: string;
  new_status: string;
  old_role: string;
  new_role: string;
  revoke_type?: string;
  reason: string;
  changed_by?: string | null;
  changed_role: string;
  created_at: string;
}

export interface AdminPremiumStatusEventsListResponse {
  user_id: string;
  total: number;
  items: AdminPremiumStatusEventResponse[];
}

export interface EmailChangeEligibilityResponse {
  eligible: boolean;
  days_remaining: number;
  message: string;
  reason?: string;
  retry_after_days?: number;
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

export interface ResendOTPResponse {
  cooldown_seconds?: number;
  cooldown_remaining_seconds?: number;
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
 * Use authenticated fetch wrapper for protected endpoints.
 * This automatically attaches CSRF token on mutating methods.
 */
async function fetchProtected(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const { fetchWithAuth } = await import("./fetch-wrapper");
  return fetchWithAuth(input, init);
}

/**
 * Login user with email/username and password
 * 🔐 If TOTP is enabled, returns pending_auth_token (NO JWT cookies yet!)
 * 🔐 If TOTP is disabled, tokens are set as HTTP-Only cookies
 */
export async function login(
  credentials: LoginRequest
): Promise<APIResponse<LoginResult>> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Send cookies with request
    body: JSON.stringify(credentials),
  });

  const data: APIResponse<LoginResult> = await response.json();

  if (!response.ok) {
    // Handle validation errors (from validator.go) or standard errors
    const errorMessage = getErrorMessage(data);
    throw new Error(errorMessage);
  }

  // Refresh CSRF token only when authentication is fully completed.
  if (data.data && !requiresTOTP(data.data) && !requiresEmailOTP(data.data)) {
    const { refreshCSRFToken } = await import("./fetch-wrapper");
    await refreshCSRFToken();
  }

  return data;
}

/**
 * Start Google OAuth flow and return provider authorization URL.
 */
export async function startGoogleOAuth(): Promise<
  APIResponse<GoogleOAuthStartResponse>
>;
export async function startGoogleOAuth(
  request: GoogleOAuthStartRequest
): Promise<APIResponse<GoogleOAuthStartResponse>>;
export async function startGoogleOAuth(
  request?: GoogleOAuthStartRequest
): Promise<APIResponse<GoogleOAuthStartResponse>> {
  const response = await fetch(`${API_URL}/auth/oauth/google/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      intent: request?.intent || "login",
    }),
  });

  const data: APIResponse<GoogleOAuthStartResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Failed to start Google OAuth");
  }
  return data;
}

/**
 * Complete Google OAuth callback and continue with existing login step-2 flow.
 */
export async function completeGoogleOAuthCallback(
  request: GoogleOAuthCallbackRequest
): Promise<APIResponse<LoginResult>> {
  const response = await fetch(`${API_URL}/auth/oauth/google/callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  const data: APIResponse<LoginResult> = await response.json();
  if (!response.ok) {
    throw new Error(
      getErrorMessage(data) || "Google OAuth callback verification failed"
    );
  }

  if (data.data && !requiresTOTP(data.data) && !requiresEmailOTP(data.data)) {
    const { refreshCSRFToken } = await import("./fetch-wrapper");
    await refreshCSRFToken();
  }

  return data;
}

/**
 * Update user profile
 * @param userData 
 * @returns 
 */
export async function updateProfile(
  userData: UpdateProfileRequest
): Promise<APIResponse<UserProfile>> {
  const response = await fetchProtected(`${API_URL}/auth/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data: APIResponse<UserProfile> = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Update profile failed");
  }

  return data;
}

/**
 * Upload user avatar image (multipart/form-data)
 */
export async function uploadProfileAvatar(
  file: File
): Promise<APIResponse<UploadAvatarResponse>> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetchProtected(`${API_URL}/auth/profile/avatar`, {
    method: "POST",
    body: formData,
  });

  const data: APIResponse<UploadAvatarResponse> = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Avatar upload failed");
  }

  return data;
}

/**
 * Start email-first signup by sending OTP to email.
 */
export async function signupStart(
  request: SignupStartRequest
): Promise<APIResponse<SignupStartResponse>> {
  const response = await fetch(`${API_URL}/auth/signup/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  const data: APIResponse<SignupStartResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Failed to start signup");
  }
  return data;
}

/**
 * Resend OTP for pending signup challenge.
 */
export async function signupResendOTP(
  request: SignupResendOTPRequest
): Promise<APIResponse<ResendOTPResponse>> {
  const response = await fetch(`${API_URL}/auth/signup/resend-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  const data: APIResponse<ResendOTPResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Failed to resend signup OTP");
  }
  return data;
}

/**
 * Verify signup OTP and receive one-time signup token.
 */
export async function signupVerifyOTP(
  request: SignupVerifyOTPRequest
): Promise<APIResponse<SignupVerifyOTPResponse>> {
  const response = await fetch(`${API_URL}/auth/signup/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  const data: APIResponse<SignupVerifyOTPResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Failed to verify signup OTP");
  }
  return data;
}

/**
 * Complete signup profile after OTP verification.
 */
export async function signupComplete(
  request: SignupCompleteRequest
): Promise<APIResponse<SignupCompleteResponse>> {
  const response = await fetch(`${API_URL}/auth/signup/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  const data: APIResponse<SignupCompleteResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data) || "Failed to complete signup");
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
 * Redeem premium code for authenticated user
 */
export async function redeemPremiumCode(
  payload: RedeemPremiumCodeRequest
): Promise<APIResponse<RedeemPremiumCodeResponse>> {
  const response = await fetchProtected(`${API_URL}/auth/redeem-premium-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

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
 * Validate password reset token
 */
export async function validateResetToken(
  token: string
): Promise<APIResponse<null>> {
  const response = await fetch(
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
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

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
  const { getCSRFToken, refreshCSRFToken } = await import("./fetch-wrapper");

  const sendRefreshRequest = async (csrfToken?: string): Promise<Response> => {
    const headers = new Headers({
      "Content-Type": "application/json",
    });

    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }

    return fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      headers,
      credentials: "include", // ✅ Send refresh_token cookie
    });
  };

  let token = await getCSRFToken();
  let response = await sendRefreshRequest(token);

  if (response.status === 403) {
    let looksLikeCSRFError = false;

    try {
      const errorData = (await response.clone().json()) as APIResponse<unknown>;
      looksLikeCSRFError =
        errorData.message?.includes("CSRF") ||
        Object.values(errorData.error || {}).some((value) =>
          String(value).includes("CSRF"),
        );
    } catch {
      looksLikeCSRFError = false;
    }

    if (looksLikeCSRFError) {
      await refreshCSRFToken();
      token = await getCSRFToken();
      response = await sendRefreshRequest(token);
    }
  }

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

  const response = await fetchProtected(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  let data: APIResponse<LogoutResponse> | null = null;
  try {
    data = (await response.json()) as APIResponse<LogoutResponse>;
  } catch {
    data = null;
  }

  // Clear CSRF token regardless of response
  clearCSRFToken();

  if (response.ok) {
    return (
      data ?? {
        success: true,
        data: { message: "Logout successful" },
        message: "Logout successful",
        error: null,
      }
    );
  }

  // Make logout idempotent on client side:
  // if session/token already invalid, still treat as successful logout.
  if (response.status === 401 || response.status === 403) {
    const message = (data?.message || "").toLowerCase();
    const errorText = Object.values(data?.error || {}).join(" ").toLowerCase();
    if (
      message.includes("session") ||
      message.includes("token") ||
      message.includes("unauthorized") ||
      errorText.includes("session") ||
      errorText.includes("token") ||
      errorText.includes("auth")
    ) {
      return {
        success: true,
        data: { message: "Already logged out" },
        message: "Already logged out",
        error: null,
      };
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || "Logout failed");
  }

  return (
    data ?? {
      success: true,
      data: { message: "Logout successful" },
      message: "Logout successful",
      error: null,
    }
  );
}

/**
 * Save user data to localStorage (user profile only, NOT tokens)
 * ⚠️ Tokens are stored in HTTP-Only cookies - NEVER in localStorage
 */
export function saveUserData(user: LoginResponse["user"]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event(USER_STORAGE_UPDATED_EVENT));
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
    window.dispatchEvent(new Event(USER_STORAGE_UPDATED_EVENT));
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
  const response = await fetchProtected(`${API_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result: APIResponse<null> = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to change password");
  }

  return result;
}

/**
 * Check whether current user can change email right now.
 */
export async function checkEmailChangeEligibility(): Promise<
  APIResponse<EmailChangeEligibilityResponse>
> {
  const response = await fetch(`${API_URL}/auth/check-email-change-eligibility`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const result: APIResponse<EmailChangeEligibilityResponse> =
    await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to check eligibility");
  }

  return result;
}

/**
 * Request email change for authenticated user.
 */
export async function changeEmail(
  data: ChangeEmailRequest
): Promise<APIResponse<string>> {
  const response = await fetchProtected(`${API_URL}/auth/change-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result: APIResponse<string> = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to change email");
  }

  return result;
}

/**
 * Check whether current user can change username right now.
 */
export async function checkUsernameChangeEligibility(): Promise<
  APIResponse<null>
> {
  const response = await fetch(`${API_URL}/auth/username/check-eligibility`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const result: APIResponse<null> = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to check eligibility");
  }

  return result;
}

/**
 * Request username change for authenticated user.
 */
export async function changeUsername(
  data: ChangeUsernameRequest
): Promise<APIResponse<ChangeUsernameResponse>> {
  const response = await fetchProtected(`${API_URL}/auth/username/change`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result: APIResponse<ChangeUsernameResponse> = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to change username");
  }

  return result;
}

/**
 * Get disposable email policy (admin only).
 */
export async function getAdminDisposableEmailPolicy(): Promise<
  APIResponse<AdminDisposableEmailPolicyResponse>
> {
  const response = await fetch(`${API_URL}/auth/admin/security/disposable-email`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const result: APIResponse<AdminDisposableEmailPolicyResponse> =
    await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to get admin policy");
  }

  return result;
}

/**
 * Update disposable email policy (admin only).
 */
export async function updateAdminDisposableEmailPolicy(
  data: UpdateAdminDisposableEmailPolicyRequest
): Promise<APIResponse<AdminDisposableEmailPolicyResponse>> {
  const response = await fetchProtected(
    `${API_URL}/auth/admin/security/disposable-email`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const result: APIResponse<AdminDisposableEmailPolicyResponse> =
    await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to update admin policy");
  }

  return result;
}

/**
 * Get paginated premium codes (admin only).
 */
export async function getAdminPremiumCodes(params?: {
  page?: number;
  limit?: number;
  sort?: string;
  order_by?: "asc" | "desc";
}): Promise<APIResponse<AdminPremiumCodesResponse>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.sort) query.set("sort", params.sort);
  if (params?.order_by) query.set("order_by", params.order_by);

  const suffix = query.toString();
  const response = await fetch(
    `${API_URL}/auth/admin/premium-codes${suffix ? `?${suffix}` : ""}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  const result: APIResponse<AdminPremiumCodesResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to get premium codes");
  }

  return result;
}

/**
 * Generate premium code(s) (admin only).
 */
export async function generateAdminPremiumCodes(
  data: AdminGeneratePremiumCodeRequest
): Promise<APIResponse<AdminPremiumCode | AdminGeneratePremiumCodeBulkResponse>> {
  const response = await fetchProtected(`${API_URL}/auth/admin/premium-codes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result: APIResponse<AdminPremiumCode | AdminGeneratePremiumCodeBulkResponse> =
    await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to generate premium code");
  }

  return result;
}

/**
 * Get admin user by ID.
 */
export async function getAdminUserById(userId: string): Promise<APIResponse<AdminUserResponse>> {
  const response = await fetch(`${API_URL}/auth/admin/users/${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const result: APIResponse<AdminUserResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to get user");
  }

  return result;
}

/**
 * Get paginated admin users list.
 */
export async function getAdminUsers(params?: {
  page?: number;
  limit?: number;
  sort?: string;
  order_by?: "asc" | "desc";
}): Promise<APIResponse<AdminUsersListResponse>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.sort) query.set("sort", params.sort);
  if (params?.order_by) query.set("order_by", params.order_by);

  const suffix = query.toString();
  const response = await fetch(
    `${API_URL}/auth/admin/users${suffix ? `?${suffix}` : ""}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  const result: APIResponse<AdminUsersListResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to get admin users");
  }

  return result;
}

/**
 * Revoke premium access for user (admin only).
 */
export async function revokeAdminUserPremiumAccess(
  userId: string,
  payload: AdminRevokePremiumAccessRequest
): Promise<APIResponse<AdminPremiumStatusMutationResponse>> {
  const response = await fetchProtected(
    `${API_URL}/auth/admin/users/${encodeURIComponent(userId)}/revoke-premium`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const result: APIResponse<AdminPremiumStatusMutationResponse> =
    await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to revoke premium access");
  }

  return result;
}

/**
 * Reactivate premium access for user (admin only).
 */
export async function reactivateAdminUserPremiumAccess(
  userId: string,
  payload: AdminReactivatePremiumAccessRequest
): Promise<APIResponse<AdminPremiumStatusMutationResponse>> {
  const response = await fetchProtected(
    `${API_URL}/auth/admin/users/${encodeURIComponent(userId)}/reactivate-premium`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const result: APIResponse<AdminPremiumStatusMutationResponse> =
    await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to reactivate premium access");
  }

  return result;
}

/**
 * Get premium status events for user (admin only).
 */
export async function getAdminUserPremiumStatusEvents(
  userId: string,
  params?: { limit?: number }
): Promise<APIResponse<AdminPremiumStatusEventsListResponse>> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", String(params.limit));

  const suffix = query.toString();
  const response = await fetch(
    `${API_URL}/auth/admin/users/${encodeURIComponent(userId)}/premium-status-events${suffix ? `?${suffix}` : ""}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  const result: APIResponse<AdminPremiumStatusEventsListResponse> =
    await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to get premium status events");
  }

  return result;
}

/**
 * Send premium code by email (admin only).
 */
export async function sendAdminPremiumCodeEmail(
  premiumCodeId: number,
  payload: AdminSendPremiumCodeEmailRequest
): Promise<APIResponse<AdminSendPremiumCodeEmailResponse>> {
  const response = await fetchProtected(
    `${API_URL}/auth/admin/premium-codes/${premiumCodeId}/send-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const result: APIResponse<AdminSendPremiumCodeEmailResponse> =
    await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to send premium code email");
  }

  return result;
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
export async function checkAuth(): Promise<{ isAuthenticated: boolean; error?: string }> {
  try {
    // Call a protected endpoint to verify cookie validity
    const response = await fetch(`${API_URL}/auth/me`, {
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

export interface VerifyLoginEmailOTPRequest {
  challenge_token: string;
  otp_code: string;
}

export interface ResendLoginEmailOTPRequest {
  challenge_token: string;
}

export async function verifyTOTPLogin(
  request: VerifyTOTPLoginRequest
): Promise<APIResponse<LoginResponse>> {
  const response = await fetch(`${API_URL}/auth/verify-totp-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ✅ Receive cookies after successful TOTP
    body: JSON.stringify(request),
  });

  const result: APIResponse<LoginResponse> = await response.json();

  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "TOTP verification failed");
  }

  // Refresh CSRF token after successful TOTP login
  const { refreshCSRFToken } = await import("./fetch-wrapper");
  await refreshCSRFToken();

  return result;
}

/**
 * Verify login email OTP challenge and complete login session.
 */
export async function verifyLoginEmailOTP(
  request: VerifyLoginEmailOTPRequest
): Promise<APIResponse<LoginResult>> {
  const response = await fetch(`${API_URL}/auth/login/email-otp/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  const result: APIResponse<LoginResult> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Email OTP verification failed");
  }

  if (result.data && !requiresTOTP(result.data) && !requiresEmailOTP(result.data)) {
    const { refreshCSRFToken } = await import("./fetch-wrapper");
    await refreshCSRFToken();
  }

  return result;
}

/**
 * Resend login email OTP challenge code.
 */
export async function resendLoginEmailOTP(
  request: ResendLoginEmailOTPRequest
): Promise<APIResponse<ResendOTPResponse>> {
  const response = await fetch(`${API_URL}/auth/login/email-otp/resend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(request),
  });

  const result: APIResponse<ResendOTPResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to resend login OTP");
  }

  return result;
}

/**
 * Setup TOTP (Two-Factor Authentication)
 * 🔐 Generates QR code and recovery codes
 */
export async function setupTOTP(): Promise<APIResponse<TOTPSetupResponse>> {
  const response = await fetchProtected(`${API_URL}/auth/totp/setup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

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
  const response = await fetchProtected(`${API_URL}/auth/totp/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ totp_code }),
  });

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
  const response = await fetchProtected(`${API_URL}/auth/totp/disable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      password,
      totp_code: totpCode,
    }),
  });

  const result: APIResponse<{ message: string }> = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to disable TOTP");
  }

  return result;
}
