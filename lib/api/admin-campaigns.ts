import { fetchWithAuth } from "@/lib/api/fetch-wrapper";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";
const CAMPAIGN_URL = `${API_URL}/auth/admin/promotional-campaigns`;

export type PromotionalCampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "completed"
  | "cancelled"
  | "failed";

export type PromotionalDeliveryStatus =
  | "pending"
  | "sending"
  | "sent"
  | "failed"
  | "skipped";

export interface AdminPromotionalCampaign {
  id: string;
  name: string;
  subject: string;
  preheader?: string;
  body: string;
  image_url?: string;
  image_alt?: string;
  cta_label?: string;
  cta_url?: string;
  status: PromotionalCampaignStatus;
  scheduled_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_by: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminPromotionalCampaignList {
  campaigns: AdminPromotionalCampaign[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface AdminPromotionalDelivery {
  id: string;
  user_id: string;
  email: string;
  status: PromotionalDeliveryStatus;
  error_message?: string;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPromotionalDeliveryList {
  deliveries: AdminPromotionalDelivery[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  status?: string;
}

export interface CampaignPayload {
  name: string;
  subject: string;
  preheader?: string;
  body: string;
  image_url?: string;
  image_alt?: string;
  cta_label?: string;
  cta_url?: string;
}

interface APIResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  error?: Record<string, string> | null;
}

async function request<T>(
  url: string,
  init?: RequestInit,
  allowEmptyData = false,
): Promise<T> {
  const response = await fetchWithAuth(url, init);
  const result = (await response.json()) as APIResponse<T>;
  if (!response.ok || !result.success || (!allowEmptyData && !result.data)) {
    const detail = result.error
      ? Object.values(result.error).filter(Boolean).join(", ")
      : "";
    throw new Error(detail || result.message || "Campaign request failed");
  }
  return result.data as T;
}

export function getAdminCampaigns(page = 1, limit = 20) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return request<AdminPromotionalCampaignList>(
    `${CAMPAIGN_URL}?${params.toString()}`,
  );
}

export function getAdminCampaign(id: string) {
  return request<AdminPromotionalCampaign>(
    `${CAMPAIGN_URL}/${encodeURIComponent(id)}`,
  );
}

export function createAdminCampaign(payload: CampaignPayload) {
  return request<AdminPromotionalCampaign>(CAMPAIGN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export interface CampaignImageUpload {
  image_url: string;
  object_key: string;
}

export function uploadAdminCampaignImage(file: File) {
  const form = new FormData();
  form.append("image", file);
  return request<CampaignImageUpload>(`${CAMPAIGN_URL}/image`, {
    method: "POST",
    body: form,
  });
}

export function updateAdminCampaign(
  id: string,
  payload: Partial<CampaignPayload>,
) {
  return request<AdminPromotionalCampaign>(
    `${CAMPAIGN_URL}/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export function scheduleAdminCampaign(id: string, scheduledAt?: string) {
  return request<AdminPromotionalCampaign>(
    `${CAMPAIGN_URL}/${encodeURIComponent(id)}/schedule`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        scheduledAt ? { scheduled_at: scheduledAt } : {},
      ),
    },
  );
}

export function cancelAdminCampaign(id: string) {
  return request<AdminPromotionalCampaign>(
    `${CAMPAIGN_URL}/${encodeURIComponent(id)}/cancel`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );
}

export function deleteAdminCampaign(id: string) {
  return request<null>(
    `${CAMPAIGN_URL}/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    true,
  );
}

export function getAdminCampaignDeliveries(
  campaignId: string,
  page = 1,
  limit = 20,
  status = "",
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) {
    params.set("status", status);
  }
  return request<AdminPromotionalDeliveryList>(
    `${CAMPAIGN_URL}/${encodeURIComponent(campaignId)}/deliveries?${params.toString()}`,
  );
}
