import { fetchWithAuth } from "@/lib/api/fetch-wrapper";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";
const ANNOUNCEMENT_URL = `${API_URL}/auth/admin/in-app-announcements`;

export type InAppAnnouncementStatus = "draft" | "published" | "archived";

export interface AdminInAppAnnouncement {
  id: string;
  title: string;
  body: string;
  href: string;
  status: InAppAnnouncementStatus;
  start_at?: string | null;
  ends_at?: string | null;
  published_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  /**
   * Number of accounts that already dismissed this announcement.
   * Always present on list responses; falls back to 0 when a payload omits it.
   */
  read_count?: number;
}

export interface AdminInAppAnnouncementList {
  announcements: AdminInAppAnnouncement[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  status_counts: Record<string, number>;
}

export interface AnnouncementPayload {
  title: string;
  body: string;
  href?: string;
  start_at?: string | null;
  ends_at?: string | null;
}

/** One account's interaction with an announcement, shown in the admin audience view. */
export interface AnnouncementReader {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string;
  is_read: boolean;
  read_at?: string | null;
  first_seen_at: string;
}

export interface AnnouncementAudience {
  read_count: number;
  unread_count: number;
  total_users: number;
  readers: AnnouncementReader[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  status: string;
}

export interface CreateAnnouncementPayload extends AnnouncementPayload {
  status: InAppAnnouncementStatus;
  published_at?: string | null;
}

interface APIResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  error?: Record<string, string> | null;
}

async function request<T>(url: string, init?: RequestInit, allowEmptyData = false): Promise<T> {
  const response = await fetchWithAuth(url, init);
  const result = (await response.json()) as APIResponse<T>;
  if (!response.ok || !result.success || (!allowEmptyData && !result.data)) {
    const detail = result.error ? Object.values(result.error).filter(Boolean).join(", ") : "";
    throw new Error(detail || result.message || "Announcement request failed");
  }
  return result.data as T;
}

export function getAdminInAppAnnouncements(page = 1, limit = 20, status = "") {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) {
    params.set("status", status);
  }
  return request<AdminInAppAnnouncementList>(`${ANNOUNCEMENT_URL}?${params.toString()}`);
}

export function getAdminInAppAnnouncement(id: string) {
  return request<AdminInAppAnnouncement>(`${ANNOUNCEMENT_URL}/${encodeURIComponent(id)}`);
}

export function createAdminInAppAnnouncement(payload: CreateAnnouncementPayload) {
  return request<AdminInAppAnnouncement>(ANNOUNCEMENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateAdminInAppAnnouncement(id: string, payload: AnnouncementPayload) {
  return request<AdminInAppAnnouncement>(`${ANNOUNCEMENT_URL}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function publishAdminInAppAnnouncement(id: string) {
  return request<AdminInAppAnnouncement>(
    `${ANNOUNCEMENT_URL}/${encodeURIComponent(id)}/publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );
}

export function archiveAdminInAppAnnouncement(id: string) {
  return request<{ id: string }>(`${ANNOUNCEMENT_URL}/${encodeURIComponent(id)}/archive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

export function deleteAdminInAppAnnouncement(id: string) {
  return request<AdminInAppAnnouncement>(`${ANNOUNCEMENT_URL}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/**
 * Lists the accounts that dismissed an announcement (or have a pending record
 * when `status` is "unread"), alongside the reach totals.
 */
export function getAdminInAppAnnouncementAudience(
  id: string,
  status: "read" | "unread" = "read",
  page = 1,
  limit = 20,
) {
  const params = new URLSearchParams({
    status,
    page: String(page),
    limit: String(limit),
  });
  return request<AnnouncementAudience>(
    `${ANNOUNCEMENT_URL}/${encodeURIComponent(id)}/audience?${params.toString()}`,
  );
}
