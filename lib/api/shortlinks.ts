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
}

export interface DetailLink {
  id: string;
  passcode: number | null;
  enable_stats: boolean;
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
}

// Request body for creating short links (single or bulk)
export interface CreateShortLinkRequest {
  is_bulky: boolean;
  links: ShortLinkData[];
}

export interface UpdateShortLinkRequest {
  title?: string;
  description?: string;
  is_active?: boolean;
  expires_at?: string;
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
export async function getShortLinkStats(
  code: string
): Promise<{ success: boolean; data: any; message: string }> {
  const response = await getWithAuth(
    `${API_URL}/users/me/shorts/${code}/stats`
  );
  return response.json();
}
