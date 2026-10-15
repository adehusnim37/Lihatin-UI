import { fetchWithAuth } from "@/lib/api/fetch-wrapper";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

export interface NotificationPreferences {
  security_alerts_email: boolean;
  weekly_summary_email: boolean;
  promotional_email: boolean;
  weekly_summary_opt_in_at?: string;
  promotional_opt_in_at?: string;
}

export interface UpdateNotificationPreferences {
  weekly_summary_email?: boolean;
  promotional_email?: boolean;
}

export interface InAppAnnouncement {
  id: string;
  title: string;
  body: string;
  href: string;
}

/** One announcement in the signed-in user's notification inbox. */
export interface InAppInboxItem {
  id: string;
  title: string;
  body: string;
  href: string;
  is_read: boolean;
  read_at?: string | null;
  start_at?: string | null;
  ends_at?: string | null;
  created_at: string;
}

export interface InAppInbox {
  announcements: InAppInboxItem[];
  unread_count: number;
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface InAppUnreadCount {
  unread_count: number;
}

export interface MarkAllReadResult {
  marked_count: number;
}

interface APIResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  error?: Record<string, string> | null;
}

async function parseResponse<T>(response: Response): Promise<APIResponse<T>> {
  const result = (await response.json()) as APIResponse<T>;
  if (!response.ok || !result.success || !result.data) {
    const detail = result.error ? Object.values(result.error).filter(Boolean).join(", ") : "";
    throw new Error(detail || result.message || "Notification request failed");
  }
  return result;
}

/**
 * Like `parseResponse`, but returns the unwrapped `data` payload. Prefer this
 * for newer call sites so hooks and components never reach into an envelope.
 * A missing `data` payload resolves to `fallback` when provided, which is how
 * genuinely empty pages are represented.
 */
async function unwrapResponse<T>(
  response: Response,
  fallback?: T,
  errorMessage = "Notification request failed",
): Promise<T> {
  const result = (await response.json()) as APIResponse<T>;
  if (!response.ok || !result.success || (!result.data && fallback === undefined)) {
    const detail = result.error ? Object.values(result.error).filter(Boolean).join(", ") : "";
    throw new Error(detail || result.message || errorMessage);
  }
  return (result.data ?? fallback) as T;
}

export async function getNotificationPreferences() {
  const response = await fetchWithAuth(`${API_URL}/notifications/preferences`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return parseResponse<NotificationPreferences>(response);
}

export async function updateNotificationPreferences(payload: UpdateNotificationPreferences) {
  const response = await fetchWithAuth(`${API_URL}/notifications/preferences`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<NotificationPreferences>(response);
}

export async function getPendingInAppAnnouncements() {
  const response = await fetchWithAuth(`${API_URL}/notifications/in-app`, {
    method: "GET",
  });
  return parseResponse<InAppAnnouncement[]>(response);
}

export async function markInAppAnnouncementRead(id: string) {
  const response = await fetchWithAuth(
    `${API_URL}/notifications/in-app/${encodeURIComponent(id)}/read`,
    { method: "POST" },
  );
  return parseResponse<{ id: string }>(response);
}

/** Dismisses every announcement currently visible to the account. */
export async function markAllInAppAnnouncementsRead() {
  const response = await fetchWithAuth(`${API_URL}/notifications/in-app/read-all`, {
    method: "POST",
  });
  return unwrapResponse<MarkAllReadResult>(response);
}

/** Clears the account's read state so the announcement surfaces again. */
export async function markInAppAnnouncementUnread(id: string) {
  const response = await fetchWithAuth(
    `${API_URL}/notifications/in-app/${encodeURIComponent(id)}/unread`,
    { method: "POST" },
  );
  return unwrapResponse<{ id: string }>(response);
}

/**
 * Paginated inbox that keeps read announcements listed so users can revisit
 * them. A page with zero announcements is normalized to an empty page, because
 * the API responds with `data: null` in that case.
 */
export async function getInAppAnnouncementInbox(page = 1, limit = 20) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await fetchWithAuth(
    `${API_URL}/notifications/in-app/inbox?${params.toString()}`,
    { method: "GET" },
  );
  return unwrapResponse<InAppInbox>(
    response,
    {
      announcements: [],
      unread_count: 0,
      page,
      limit,
      total: 0,
      total_pages: 1,
    },
    "Inbox request failed",
  );
}

export async function getInAppAnnouncementUnreadCount() {
  const response = await fetchWithAuth(`${API_URL}/notifications/in-app/unread-count`, {
    method: "GET",
  });
  return unwrapResponse<InAppUnreadCount>(response);
}
