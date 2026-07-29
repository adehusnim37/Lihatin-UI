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

interface APIResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  error?: Record<string, string> | null;
}

async function parseResponse<T>(response: Response): Promise<APIResponse<T>> {
  const result = (await response.json()) as APIResponse<T>;
  if (!response.ok || !result.success || !result.data) {
    const detail = result.error
      ? Object.values(result.error).filter(Boolean).join(", ")
      : "";
    throw new Error(detail || result.message || "Notification request failed");
  }
  return result;
}

export async function getNotificationPreferences() {
  const response = await fetchWithAuth(`${API_URL}/notifications/preferences`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return parseResponse<NotificationPreferences>(response);
}

export async function updateNotificationPreferences(
  payload: UpdateNotificationPreferences,
) {
  const response = await fetchWithAuth(`${API_URL}/notifications/preferences`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<NotificationPreferences>(response);
}
