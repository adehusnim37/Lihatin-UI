"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getAllLogs,
  getLogsByUsername,
  getLogsByShortLink,
  getLogsWithFilter,
  getLogCounts,
  type LogsResponse,
  type LogFilterParams,
  type LogCountsResponse,
} from "@/lib/api/logs";

// Query keys for cache management
export const logsKeys = {
  all: ["logs"] as const,
  list: (page: number, limit: number, sort: string, orderBy: string) =>
    [...logsKeys.all, "list", { page, limit, sort, orderBy }] as const,
  byUsername: (username: string, page: number, limit: number) =>
    [...logsKeys.all, "username", username, { page, limit }] as const,
  byShortLink: (code: string, page: number, limit: number) =>
    [...logsKeys.all, "short-link", code, { page, limit }] as const,
  filtered: (filters: LogFilterParams) =>
    [...logsKeys.all, "filter", filters] as const,
  counts: () => [...logsKeys.all, "counts"] as const,
};

// Fetch all activity logs with pagination
export function useActivityLogs(
  page: number = 1,
  limit: number = 20,
  sort: string = "created_at",
  orderBy: "asc" | "desc" = "desc",
) {
  return useQuery<LogsResponse>({
    queryKey: logsKeys.list(page, limit, sort, orderBy),
    queryFn: () => getAllLogs(page, limit, sort, orderBy),
    placeholderData: keepPreviousData,
  });
}

// Fetch logs by username
export function useLogsByUsername(
  username: string,
  page: number = 1,
  limit: number = 20,
) {
  return useQuery<LogsResponse>({
    queryKey: logsKeys.byUsername(username, page, limit),
    queryFn: () => getLogsByUsername(username, page, limit),
    placeholderData: keepPreviousData,
    enabled: !!username,
  });
}

// Fetch logs for a specific short link
export function useShortLinkLogs(
  code: string,
  page: number = 1,
  limit: number = 10,
) {
  return useQuery<LogsResponse>({
    queryKey: logsKeys.byShortLink(code, page, limit),
    queryFn: () => getLogsByShortLink(code, page, limit),
    placeholderData: keepPreviousData,
    enabled: !!code,
  });
}

// Fetch logs with advanced filtering
export function useLogsWithFilter(filters: LogFilterParams) {
  return useQuery<LogsResponse>({
    queryKey: logsKeys.filtered(filters),
    queryFn: () => getLogsWithFilter(filters),
    placeholderData: keepPreviousData,
  });
}

// Fetch log counts by method type
export function useLogCounts() {
  return useQuery<LogCountsResponse>({
    queryKey: logsKeys.counts(),
    queryFn: () => getLogCounts(),
    staleTime: 30000, // Cache for 30 seconds
  });
}

// Fetch single log by ID
export function useLogById(id: string) {
  return useQuery({
    queryKey: [...logsKeys.all, "detail", id] as const,
    queryFn: () => import("@/lib/api/logs").then(m => m.getLogById(id)),
    enabled: !!id,
  });
}
