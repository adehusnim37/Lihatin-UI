import { fetchWithAuth } from "@/lib/api/fetch-wrapper";
import { APIResponse, getErrorMessage } from "@/lib/api/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

export type SupportCategory =
  | "account_locked"
  | "account_deactivated"
  | "email_verification"
  | "lost_2fa"
  | "billing"
  | "bug_report"
  | "feature_request"
  | "other";

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

export type SupportPriority = "low" | "normal" | "high" | "urgent";

export interface CreateSupportTicketRequest {
  email: string;
  category: SupportCategory;
  subject: string;
  description: string;
  captcha_token: string;
}

export interface CreateSupportTicketResponse {
  ticket_code: string;
}

export interface TrackSupportTicketResponse {
  ticket_code: string;
  category: SupportCategory;
  subject: string;
  status: SupportTicketStatus;
  created_at: string;
  resolved_at?: string | null;
}

export interface AdminSupportTicketItem {
  id: string;
  ticket_code: string;
  email: string;
  category: SupportCategory;
  subject: string;
  status: SupportTicketStatus;
  priority: string;
  user_id?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface AdminListSupportTicketsResponse {
  items: AdminSupportTicketItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface AdminSupportTicketDetailResponse {
  id: string;
  ticket_code: string;
  email: string;
  category: SupportCategory;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: string;
  user_id?: string | null;
  admin_notes?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type AdminSupportAction =
  | "unlock_user"
  | "activate_user"
  | "resend_verification"
  | "manual_response";

export interface AdminUpdateSupportTicketRequest {
  status: SupportTicketStatus;
  priority?: SupportPriority;
  admin_notes?: string;
  action?: AdminSupportAction;
}

export interface AdminUpdateSupportTicketResponse {
  ticket_code: string;
  status: SupportTicketStatus;
  admin_notes?: string | null;
  resolved_at?: string | null;
  action_applied?: string;
}

export async function createSupportTicket(
  payload: CreateSupportTicketRequest
): Promise<APIResponse<CreateSupportTicketResponse>> {
  const response = await fetch(`${API_URL}/support/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result: APIResponse<CreateSupportTicketResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to submit support ticket");
  }

  return result;
}

export async function trackSupportTicket(params: {
  ticket: string;
  email: string;
}): Promise<APIResponse<TrackSupportTicketResponse>> {
  const query = new URLSearchParams({
    ticket: params.ticket,
    email: params.email,
  });

  const response = await fetch(`${API_URL}/support/track?${query.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  const result: APIResponse<TrackSupportTicketResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to track ticket");
  }

  return result;
}

export async function listAdminSupportTickets(params?: {
  status?: SupportTicketStatus | "all";
  category?: SupportCategory | "all";
  priority?: SupportPriority | "all";
  page?: number;
  limit?: number;
  search?: string;
  email?: string;
}): Promise<APIResponse<AdminListSupportTicketsResponse>> {
  const query = new URLSearchParams();

  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.category && params.category !== "all")
    query.set("category", params.category);
  if (params?.priority && params.priority !== "all")
    query.set("priority", params.priority);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.email) query.set("email", params.email);

  const suffix = query.toString();
  const response = await fetch(
    `${API_URL}/auth/admin/support/tickets${suffix ? `?${suffix}` : ""}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  const result: APIResponse<AdminListSupportTicketsResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to get support tickets");
  }

  return result;
}

export async function getAdminSupportTicket(
  id: string
): Promise<APIResponse<AdminSupportTicketDetailResponse>> {
  const response = await fetch(
    `${API_URL}/auth/admin/support/tickets/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    }
  );

  const result: APIResponse<AdminSupportTicketDetailResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to get support ticket");
  }

  return result;
}

export async function updateAdminSupportTicket(
  id: string,
  payload: AdminUpdateSupportTicketRequest
): Promise<APIResponse<AdminUpdateSupportTicketResponse>> {
  const response = await fetchWithAuth(
    `${API_URL}/auth/admin/support/tickets/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const result: APIResponse<AdminUpdateSupportTicketResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to update support ticket");
  }

  return result;
}
