/**
 * API Keys API
 * 🔑 Functions to manage API keys
 */

import { number } from "zod";
import {
  getWithAuth,
  postWithAuth,
  putWithAuth,
  deleteWithAuth,
} from "./fetch-wrapper";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

// Request types
export interface CreateAPIKeyRequest {
  name: string;
  expires_at?: string;
  permissions?: ("read" | "write" | "delete" | "update")[];
  blocked_ips?: string[];
  allowed_ips?: string[];
  limit_usage?: number;
  is_active?: boolean;
}

export interface UpdateAPIKeyRequest {
  name?: string;
  expires_at?: string;
  permissions?: ("read" | "write" | "delete" | "update")[];
  is_active?: boolean;
  blocked_ips?: string[];
  allowed_ips?: string[];
  limit_usage?: number;
}

// Response types
export interface CreateAPIKeyResponse {
  id: string;
  name: string;
  created_at: string;
  expires_at?: string;
  permissions: string[];
  blocked_ips?: string[];
  allowed_ips?: string[];
  limit_usage?: number;
  usage_count: number;
  is_active: boolean;
  key: string; // Full API key - only shown once!
  warning: string;
}

export interface APIKeyResponse {
  id: string;
  name: string;
  key_preview: string;
  last_used_at?: string;
  expires_at?: string;
  limit_usage?: number;
  usage_count: number;
  last_ip_used?: string;
  is_active: boolean;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

// API response wrapper
export interface APIResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  error?: Record<string, string> | null;
}

// Refresh response types
export interface APIKeySecretInfo {
  full_api_key: string;
  warning: string;
  format: string;
  expires_in: string;
}

export interface APIKeyUsageInfo {
  last_used_at?: string;
  last_ip_used?: string;
  is_regenerated: boolean;
  previous_usage_reset: boolean;
}

export interface APIKeyRefreshResponse {
  id: string;
  name: string;
  key_preview: string;
  is_active: boolean;
  expires_at?: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
  secret: APIKeySecretInfo;
  usage: APIKeyUsageInfo;
}

// Usage/Activity log types
export interface ActivityLogResponse {
  id: string;
  level: string;
  message: string;
  username?: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  browser_info?: string;
  action?: string;
  route?: string;
  method?: string;
  status_code?: number;
  request_body?: string;
  request_headers?: string;
  query_params?: string;
  route_params?: string;
  response_body?: string;
  response_time?: number;
  created_at: string;
  updated_at: string;
}

export interface APIKeyActivityLogResponse {
  id: string;
  api_key?: string;
  user_id?: string;
  activity_log: ActivityLogResponse;
}

export interface APIKeyBasicInfo {
  id: string;
  name: string;
  key_preview: string;
  is_active: boolean;
  created_at: string;
}

export interface APIKeyActivityLogsResponse {
  activity_logs: APIKeyActivityLogResponse[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  api_key_info: APIKeyBasicInfo;
}

// APIKeyStatsResponse represents statistics about API keys
export interface APIKeyStatsResponse {
  TotalKeys: number;
  ActiveKeys: number;
  ExpiredKeys: number;
  TotalUsage: number;
  MostUsedKey?: APIKeyUsage | null;
  LastUsedKey?: APIKeyLastUsed | null;
}

// APIKeyUsage represents information about the most used key
export interface APIKeyUsage {
  Name: string;
  UsageCount: number;
}

// APIKeyLastUsed represents information about the last used key
export interface APIKeyLastUsed {
  Name: string;
  LastUsedAt?: Date;
}

/**
 * Create a new API key
 */
export async function createAPIKey(
  data: CreateAPIKeyRequest,
): Promise<APIResponse<CreateAPIKeyResponse>> {
  const response = await postWithAuth(`${API_URL}/api-keys/`, data);
  return response.json();
}

/**
 * Get all API keys for current user
 */
export async function getAPIKeys(): Promise<APIResponse<APIKeyResponse[]>> {
  const response = await getWithAuth(`${API_URL}/api-keys/`);
  return response.json();
}

/**
 * Get a single API key by ID
 */
export async function getAPIKey(
  id: string,
): Promise<APIResponse<APIKeyResponse>> {
  const response = await getWithAuth(`${API_URL}/api-keys/${id}`);
  return response.json();
}

/**
 * Update an API key
 */
export async function updateAPIKey(
  id: string,
  data: UpdateAPIKeyRequest,
): Promise<APIResponse<APIKeyResponse>> {
  const response = await putWithAuth(`${API_URL}/api-keys/${id}`, data);
  return response.json();
}

/**
 * Delete/revoke an API key
 */
export async function revokeAPIKey(
  id: string,
): Promise<APIResponse<{ message: string }>> {
  const response = await deleteWithAuth(`${API_URL}/api-keys/${id}`);
  return response.json();
}

/**
 * Activate an API key
 */
export async function activateAPIKey(
  id: string,
): Promise<APIResponse<APIKeyResponse>> {
  const response = await postWithAuth(`${API_URL}/api-keys/${id}/activate`, {});
  return response.json();
}

/**
 * Deactivate an API key
 */
export async function deactivateAPIKey(
  id: string,
): Promise<APIResponse<APIKeyResponse>> {
  const response = await postWithAuth(
    `${API_URL}/api-keys/${id}/deactivate`,
    {},
  );
  return response.json();
}

/**
 * Refresh/regenerate an API key (generates new secret)
 */
export async function refreshAPIKey(
  id: string,
): Promise<APIResponse<APIKeyRefreshResponse>> {
  const response = await postWithAuth(`${API_URL}/api-keys/${id}/refresh`, {});
  return response.json();
}

/**
 * Get API key usage/activity logs
 */
export async function getAPIKeyUsage(
  id: string,
  page: number = 1,
  limit: number = 10,
): Promise<APIResponse<APIKeyActivityLogsResponse>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  const response = await getWithAuth(
    `${API_URL}/api-keys/${id}/usage?${params}`,
  );
  return response.json();
}

/**
 * Get API key usage statistics/summary
 */
export async function getAPIKeyUsageStats(): Promise<
  APIResponse<APIKeyStatsResponse>
> {
  const response = await getWithAuth(`${API_URL}/api-keys/stats`);
  return response.json();
}
