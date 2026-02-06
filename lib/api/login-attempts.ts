import { getWithAuth } from "./fetch-wrapper";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

// ==================== Types ====================

export interface LoginAttempt {
  id: string;
  email_or_username: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  fail_reason?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface LoginAttemptsPaginationParams {
  page?: number;
  limit?: number;
  sort?:
    | "created_at"
    | "updated_at"
    | "email_or_username"
    | "ip_address"
    | "success";
  order_by?: "asc" | "desc";
}

export interface LoginAttemptsFilterParams {
  success?: boolean;
  id?: string;
  search?: string;
  username_or_email?: string;
  ip_address?: string;
  from_date?: string; // RFC3339 format
  to_date?: string; // RFC3339 format
}

export interface LoginAttemptsQueryParams
  extends LoginAttemptsPaginationParams, LoginAttemptsFilterParams {}

export interface LoginAttemptsResponse {
  attempts: LoginAttempt[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface LoginStatsResponse {
  stats: {
    total_attempts: number;
    successful_attempts: number;
    failed_attempts: number;
    success_rate: number;
    last_successful_login?: string;
  };
  email_or_username: string;
  days: number;
  period_start?: string;
  period_end?: string;
}

export interface RecentActivityResponse {
  total_attempts: number;
  successful_attempts: number;
  failed_attempts: number;
  unique_ips: number;
  hours: number;
  since: string;
  period_start: string;
  period_end: string;
}

export interface HourlyAttempt {
  hour: number;
  total_count: number;
  success_count: number;
  failed_count: number;
}

export interface AttemptsByHourResponse {
  attempts_by_hour: HourlyAttempt[];
  days: number;
}

export interface TopFailedIP {
  ip_address: string;
  failed_count: number;
  last_attempt: string;
}

export interface TopFailedIPsResponse {
  top_failed_ips: TopFailedIP[];
  limit: number;
}

export interface SuspiciousActivity {
  ip_address: string;
  failed_count: number;
  last_attempt: string;
  emails_attempted: number;
  risk_level: "critical" | "high" | "medium";
}

export interface SuspiciousActivityResponse {
  suspicious_activity: SuspiciousActivity[];
}

// ==================== Helper Functions ====================

const buildQueryString = (params: Record<string, any>): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

// ==================== API Functions ====================

/**
 * Get paginated login attempts with filters
 * Users: See only their own attempts
 * Admins: See all attempts (use admin endpoint)
 */
export async function getLoginAttempts(
  params?: LoginAttemptsQueryParams,
): Promise<LoginAttemptsResponse> {
  const queryString = params ? buildQueryString(params) : "";
  const response = await getWithAuth(
    `${API_URL}/auth/login-attempts${queryString}`,
  );
  const json = await response.json();
  return json.data;
}

/**
 * Get paginated login attempts (admin endpoint)
 * Admin only: See all login attempts system-wide
 */
export async function getLoginAttemptsAdmin(
  params?: LoginAttemptsQueryParams,
): Promise<LoginAttemptsResponse> {
  const queryString = params ? buildQueryString(params) : "";
  const response = await getWithAuth(
    `${API_URL}/auth/admin/login-attempts${queryString}`,
  );
  const json = await response.json();
  return json.data;
}

/**
 * Get single login attempt by ID
 * Users: Can only access their own attempts
 * Admins: Can access any attempt
 */
export async function getLoginAttemptById(
  id: string,
  isAdmin = false,
): Promise<LoginAttempt> {
  const endpoint = isAdmin
    ? `${API_URL}/auth/admin/login-attempts/${id}`
    : `${API_URL}/auth/login-attempts/${id}`;
  const response = await getWithAuth(endpoint);
  const json = await response.json();
  return json.data;
}

/**
 * Get login statistics for a user
 * @param emailOrUsername - User email or username
 * @param days - Number of days to analyze (e.g., 7, 30)
 * @param isAdmin - Whether to use admin endpoint
 */
export async function getLoginStats(
  emailOrUsername: string,
  days: number,
  isAdmin = false,
): Promise<LoginStatsResponse> {
  const endpoint = isAdmin
    ? `${API_URL}/auth/admin/login-attempts/stats/${encodeURIComponent(emailOrUsername)}/${days}`
    : `${API_URL}/auth/login-attempts/stats/${encodeURIComponent(emailOrUsername)}/${days}`;
  const response = await getWithAuth(endpoint);
  const json = await response.json();
  return json.data;
}

/**
 * Get recent activity summary (last 24 hours)
 * Users: See only their own activity
 * Admins: See system-wide activity
 */
export async function getRecentActivity(
  isAdmin = false,
): Promise<RecentActivityResponse> {
  const endpoint = isAdmin
    ? `${API_URL}/auth/admin/login-attempts/recent-activity`
    : `${API_URL}/auth/login-attempts/recent-activity`;
  const response = await getWithAuth(endpoint);
  const json = await response.json();
  return json.data;
}

/**
 * Get login attempts grouped by hour of day (last 7 days)
 * Users: See only their own attempts
 * Admins: See all attempts
 */
export async function getAttemptsByHour(
  isAdmin = false,
): Promise<AttemptsByHourResponse> {
  const endpoint = isAdmin
    ? `${API_URL}/auth/admin/login-attempts/attempts-by-hour`
    : `${API_URL}/auth/login-attempts/attempts-by-hour`;
  const response = await getWithAuth(endpoint);
  const json = await response.json();
  return json.data;
}

/**
 * Get top IP addresses with most failed login attempts
 * Admin only
 */
export async function getTopFailedIPs(): Promise<TopFailedIPsResponse> {
  const response = await getWithAuth(
    `${API_URL}/auth/admin/login-attempts/top-failed-ips`,
  );
  const json = await response.json();
  return json.data;
}

/**
 * Get suspicious login patterns (>5 failed attempts in last hour)
 * Admin only
 */
export async function getSuspiciousActivity(): Promise<SuspiciousActivityResponse> {
  const response = await getWithAuth(
    `${API_URL}/auth/admin/login-attempts/suspicious-activity`,
  );
  const json = await response.json();
  return json.data;
}

// ==================== Utility Functions ====================

/**
 * Format date to RFC3339 for API queries
 * @param date - Date object or ISO string
 */
export function formatDateForAPI(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toISOString();
}

/**
 * Get date range for common periods
 */
export function getDateRange(
  period: "today" | "yesterday" | "week" | "month" | "custom",
  customStart?: Date,
  customEnd?: Date,
) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case "today":
      return {
        from_date: formatDateForAPI(today),
        to_date: formatDateForAPI(now),
      };
    case "yesterday":
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return {
        from_date: formatDateForAPI(yesterday),
        to_date: formatDateForAPI(yesterdayEnd),
      };
    case "week":
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return {
        from_date: formatDateForAPI(weekAgo),
        to_date: formatDateForAPI(now),
      };
    case "month":
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return {
        from_date: formatDateForAPI(monthAgo),
        to_date: formatDateForAPI(now),
      };
    case "custom":
      if (!customStart || !customEnd) {
        throw new Error("Custom date range requires both start and end dates");
      }
      return {
        from_date: formatDateForAPI(customStart),
        to_date: formatDateForAPI(customEnd),
      };
    default:
      return {};
  }
}

/**
 * Get risk level color for badges
 */
export function getRiskLevelColor(
  riskLevel: "critical" | "high" | "medium",
): string {
  switch (riskLevel) {
    case "critical":
      return "destructive";
    case "high":
      return "warning";
    case "medium":
      return "secondary";
    default:
      return "default";
  }
}

/**
 * Format success rate for display
 */
export function formatSuccessRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}
