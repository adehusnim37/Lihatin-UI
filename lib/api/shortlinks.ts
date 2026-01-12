/**
 * Short Links API
 * 🔗 Functions to manage short links
 */

import {
  getWithAuth,
  postWithAuth,
  putWithAuth,
  deleteWithAuth,
} from "./fetch-wrapper";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

// Types
export interface ShortLink {
  id: string;
  user_id?: string;
  short_code: string;
  original_url: string;
  title: string;
  description: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  click_count?: number;
  detail?: DetailLink;
  recent_views?: RecentView[];
}

export interface DetailLink {
  id: string;
  passcode: number | null;
  click_limit: number | null;
  current_clicks: number;
  enable_stats: boolean;
  is_banned?: boolean;
  banned_reason?: string;
  banned_by?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  custom_domain?: string;
}

export interface RecentView {
  id: string;
  ip_address: string;
  user_agent: string;
  referer: string;
  country: string;
  city: string;
  clicked_at: string;
}

export interface PaginationMeta {
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
  sort: string;
  order_by: string;
}

// Backend response structure
export interface ShortLinksApiResponse {
  success: boolean;
  data: {
    short_links: ShortLink[];
    total_count: number;
    page: number;
    limit: number;
    total_pages: number;
    sort: string;
    order_by: string;
  };
  message: string;
  error?: Record<string, string>;
}

export interface ShortLinkResponse {
  success: boolean;
  data: ShortLink;
  message: string;
  error?: Record<string, string>;
}

// Single link data structure
export interface ShortLinkData {
  original_url: string;
  custom_code?: string;
  title?: string;
  description?: string;
  expires_at?: string;
  passcode?: string;
  enable_stats?: boolean;
  limit?: number;
  tags?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
}

// Request body for creating short links (single or bulk)
export interface CreateShortLinkRequest {
  is_bulky: boolean;
  link?: ShortLinkData; // For single creation
  links?: ShortLinkData[]; // For bulk creation
}

export interface UpdateShortLinkRequest {
  short_code?: string;
  original_url?: string;
  title?: string;
  description?: string;
  is_active?: boolean;
  expires_at?: string | null;
  passcode?: string | null;
  click_limit?: number | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  custom_domain?: string | null;
  enable_stats?: boolean;
}

/**
 * Get all short links for current user with pagination
 */
export async function getShortLinks(
  page: number = 1,
  limit: number = 10,
  sort: string = "created_at",
  orderBy: string = "desc"
): Promise<ShortLinksApiResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
    order_by: orderBy,
  });

  const response = await getWithAuth(`${API_URL}/users/me/shorts?${params}`);
  return response.json();
}

/**
 * Get a single short link by code
 */
export async function getShortLink(code: string): Promise<ShortLinkResponse> {
  const response = await getWithAuth(`${API_URL}/users/me/shorts/${code}`);
  return response.json();
}

/**
 * Create a new short link (single or bulk)
 */
export async function createShortLink(
  data: CreateShortLinkRequest
): Promise<ShortLinkResponse> {
  // Send with format: { is_bulky: boolean, links: [...] }
  const response = await postWithAuth(`${API_URL}/users/me/shorts`, data);
  return response.json();
}

/**
 * Update an existing short link
 */
export async function updateShortLink(
  code: string,
  data: UpdateShortLinkRequest
): Promise<ShortLinkResponse> {
  const response = await putWithAuth(
    `${API_URL}/users/me/shorts/${code}`,
    data
  );
  return response.json();
}

/**
 * Remove passcode from a short link
 */
export async function removeShortLinkPasscode(
  code: string
): Promise<{ success: boolean; message: string }> {
  const response = await deleteWithAuth(
    `${API_URL}/users/me/shorts/${code}/passcode`
  );
  return response.json();
}

/**
 * Delete a short link
 */
export async function deleteShortLink(
  code: string
): Promise<{ success: boolean; message: string }> {
  const response = await deleteWithAuth(`${API_URL}/users/me/shorts/${code}`);
  return response.json();
}

/**
 * Toggle short link active status
 * Calls the toggle endpoint which auto-toggles based on current DB state
 */
export async function toggleShortLinkStatus(
  code: string
): Promise<ShortLinkResponse> {
  const response = await postWithAuth(
    `${API_URL}/users/me/shorts/${code}/toggle-active-inactive`,
    {}
  );
  return response.json();
}

/**
 * Get short link stats
 */
export interface ClickHistoryItem {
  date: string;
  count: number;
}

export interface ShortLinkStats {
  short: string;
  total_clicks: number;
  unique_visitors: number;
  last_24h: number;
  last_7d: number;
  last_30d: number;
  last_60d: number;
  last_90d: number;
  top_referrers: { host: string; count: number }[];
  top_devices: { device: string; count: number }[];
  top_countries: { country: string; count: number }[];
  click_history: ClickHistoryItem[];
  click_history_hourly: ClickHistoryItem[];
}

export interface ShortLinkStatsResponse {
  success: boolean;
  data: ShortLinkStats;
  message: string;
}

/**
 * Get short link stats
 */
export async function getShortLinkStats(
  code: string
): Promise<ShortLinkStatsResponse> {
  const response = await getWithAuth(
    `${API_URL}/users/me/shorts/${code}/stats`
  );
  return response.json();
}

// Views Interfaces
export interface ViewsData {
  recent_views: RecentView[];
  total_count: number;
  page: number;
  limit: number;
  total_pages: number;
  sort: string;
  order_by: string;
}

export interface ShortLinkViewsResponse {
  success: boolean;
  data: {
    views: ViewsData;
  };
  message: string;
}

/**
 * Get paginated views for a short link
 */
export async function getShortLinkViews(
  code: string,
  page: number = 1,
  limit: number = 10,
  sort: string = "created_at",
  orderBy: string = "desc"
): Promise<ShortLinkViewsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
    order_by: orderBy,
  });

  const response = await getWithAuth(
    `${API_URL}/users/me/shorts/${code}/views?${params}`
  );
  return response.json();
}
