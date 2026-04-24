// Login Attempts Query Hook

import { useQuery } from "@tanstack/react-query";
import {
  getLoginAttempts,
  type LoginAttemptsResponse,
  getLoginAttemptsAdmin,
  LoginAttemptsQueryParams,
  getRecentActivity,
  type RecentActivityResponse,
  getAttemptsByHour,
  type AttemptsByHourResponse,
  getLoginAttemptById,
  getLoginStats,
  getTopFailedIPs,
  getSuspiciousActivity,
} from "@/lib/api/login-attempts";

// Query keys for cache management
export const loginAttemptsKeys = {
  all: ["login-attempts"] as const,

  list: (params: LoginAttemptsQueryParams, isAdmin: boolean) =>
    [...loginAttemptsKeys.all, "list", params, isAdmin],

  detail: (id: string, isAdmin: boolean) => [...loginAttemptsKeys.all, "detail", id, isAdmin],

  stats: (email_or_username: string, days: number, isAdmin: boolean) => [...loginAttemptsKeys.all, "stats", email_or_username, days, isAdmin],

  recentActivity: (isAdmin: boolean) => [...loginAttemptsKeys.all, "recent-activity", isAdmin],

  attemptsByHour: (isAdmin: boolean) => [...loginAttemptsKeys.all, "attempts-by-hour", isAdmin],

  topFailedIPs: (isAdmin: boolean) => [...loginAttemptsKeys.all, "top-failed-ips", isAdmin],

  suspiciousActivity : (isAdmin: boolean) => [...loginAttemptsKeys.all, "suspicious-activity", isAdmin],
};

const EMPTY_RECENT_ACTIVITY: RecentActivityResponse = {
  total_attempts: 0,
  successful_attempts: 0,
  failed_attempts: 0,
  unique_ips: 0,
  hours: 24,
  since: "",
  period_start: "",
  period_end: "",
};

const EMPTY_ATTEMPTS_BY_HOUR: AttemptsByHourResponse = {
  attempts_by_hour: [],
  days: 0,
};

// Fetch login attempts with pagination and filters
export function useLoginAttemptsQuery(
  params: LoginAttemptsQueryParams
) {
  return useQuery<LoginAttemptsResponse>({
    queryKey: loginAttemptsKeys.list(params, false),
    queryFn: () => getLoginAttempts(params),
  });
}

// Fetch admin login attempts with pagination and filters
export function useAdminLoginAttemptsQuery(
  params: LoginAttemptsQueryParams,
  isAdmin: boolean
) {
  return useQuery<LoginAttemptsResponse>({
    queryKey: loginAttemptsKeys.list(params, isAdmin),
    queryFn: () => getLoginAttemptsAdmin(params),
    enabled: isAdmin, // Add condition to enable only for admin users
  });
}

// Fetch detailed login attempt by ID
export function useLoginAttemptDetailQuery(
  id: string,
  isAdmin = false
) {
  return useQuery({
    queryKey: loginAttemptsKeys.detail(id, isAdmin),
    queryFn: () => getLoginAttemptById(id, isAdmin),
    enabled: !!id, // Only run if id is provided
  });
}

// Fetch login statistics for a user
export function useLoginStatsQuery(
  emailOrUsername: string,
  days: number,
  isAdmin = false
) {
  return useQuery({
    queryKey: loginAttemptsKeys.stats(emailOrUsername, days, isAdmin),
    queryFn: () => getLoginStats(emailOrUsername, days, isAdmin),
    enabled: !!emailOrUsername, // Only run if emailOrUsername is provided
  });
}

// Fetch recent activity summary
export function useRecentActivityQuery(
  isAdmin = false
) {
  return useQuery<RecentActivityResponse>({
    queryKey: loginAttemptsKeys.recentActivity(isAdmin),
    queryFn: async () => {
      const result = await getRecentActivity(isAdmin);
      return result ?? EMPTY_RECENT_ACTIVITY;
    },
  });
}

// Fetch login attempts grouped by hour
export function useAttemptsByHourQuery(
  isAdmin = false
) {
  return useQuery<AttemptsByHourResponse>({
    queryKey: loginAttemptsKeys.attemptsByHour(isAdmin),
    queryFn: async () => {
      const result = await getAttemptsByHour(isAdmin);
      return result ?? EMPTY_ATTEMPTS_BY_HOUR;
    },
  });
}

// Additional hooks for top failed IPs and suspicious activity can be added similarly
export function useTopFailedIPsQuery(
  isAdmin = false
) {
  return useQuery({
    queryKey: loginAttemptsKeys.topFailedIPs(isAdmin),
    queryFn: () => getTopFailedIPs(),
    enabled: isAdmin, // Only run for admin users
  });
}

// Fetch suspicious activity data
export function useSuspiciousActivityQuery(
  isAdmin = false
) {
  return useQuery({
    queryKey: loginAttemptsKeys.suspiciousActivity(isAdmin),
    queryFn: () => getSuspiciousActivity(),
    enabled: isAdmin, // Only run for admin users
  });
}
