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

export interface SupportOTPChallengeResponse {
  challenge_token: string;
  cooldown_seconds: number;
}

export interface SupportAccessResponse {
  access_token: string;
  expires_in_seconds: number;
  ticket: TrackSupportTicketResponse;
}

export interface SupportAttachmentResponse {
  id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
}

export interface SupportMessageResponse {
  id: string;
  ticket_id: string;
  sender_type: "public" | "user" | "admin" | "system";
  sender_user_id?: string | null;
  sender_email?: string | null;
  body: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  attachments?: SupportAttachmentResponse[];
}

export interface SupportConversationResponse {
  ticket_code: string;
  ticket_id: string;
  category: SupportCategory;
  subject: string;
  status: SupportTicketStatus;
  created_at: string;
  updated_at: string;
  messages: SupportMessageResponse[];
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
  updated_at: string;
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

export interface UserListSupportTicketsResponse {
  items: AdminSupportTicketItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export async function createSupportTicket(
  payload: CreateSupportTicketRequest,
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

export async function requestSupportAccessOTP(payload: {
  ticket: string;
  email: string;
  captcha_token: string;
}): Promise<APIResponse<SupportOTPChallengeResponse>> {
  const response = await fetch(`${API_URL}/support/access/request-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result: APIResponse<SupportOTPChallengeResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to request verification code");
  }

  return result;
}

export async function resendSupportAccessOTP(payload: {
  challenge_token: string;
  captcha_token: string;
}): Promise<APIResponse<SupportOTPChallengeResponse>> {
  const response = await fetch(`${API_URL}/support/access/resend-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result: APIResponse<SupportOTPChallengeResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to resend verification code");
  }

  return result;
}

export async function verifySupportAccessOTP(payload: {
  challenge_token: string;
  otp_code: string;
}): Promise<APIResponse<SupportAccessResponse>> {
  const response = await fetch(`${API_URL}/support/access/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result: APIResponse<SupportAccessResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to verify code");
  }

  return result;
}

export async function verifySupportAccessCode(payload: {
  ticket: string;
  email: string;
  code: string;
}): Promise<APIResponse<SupportAccessResponse>> {
  const response = await fetch(`${API_URL}/support/access/verify-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const result: APIResponse<SupportAccessResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to verify access code");
  }

  return result;
}

export async function listPublicSupportConversation(params: {
  ticket: string;
  email: string;
  accessToken: string;
}): Promise<APIResponse<SupportConversationResponse>> {
  const query = new URLSearchParams({
    email: params.email,
    access_token: params.accessToken,
  });

  const response = await fetch(
    `${API_URL}/support/tickets/${encodeURIComponent(params.ticket)}/messages?${query.toString()}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const result: APIResponse<SupportConversationResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to load conversation");
  }

  return result;
}

export async function sendPublicSupportMessage(
  params: { ticket: string; email: string; accessToken: string },
  payload: { body?: string; attachments?: File[] },
): Promise<APIResponse<SupportMessageResponse>> {
  const formData = new FormData();
  formData.set("email", params.email);
  formData.set("access_token", params.accessToken);
  if (payload.body && payload.body.trim()) {
    formData.set("body", payload.body.trim());
  }

  for (const file of payload.attachments || []) {
    formData.append("attachments", file);
  }

  const response = await fetch(
    `${API_URL}/support/tickets/${encodeURIComponent(params.ticket)}/messages`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    },
  );

  const result: APIResponse<SupportMessageResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to send message");
  }

  return result;
}

export function getPublicSupportAttachmentURL(params: {
  ticket: string;
  email: string;
  accessToken: string;
  attachmentID: string;
}): string {
  const query = new URLSearchParams({
    email: params.email,
    access_token: params.accessToken,
  });

  return `${API_URL}/support/tickets/${encodeURIComponent(params.ticket)}/attachments/${encodeURIComponent(params.attachmentID)}?${query.toString()}`;
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
  const response = await fetchWithAuth(
    `${API_URL}/auth/admin/support/tickets${suffix ? `?${suffix}` : ""}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const result: APIResponse<AdminListSupportTicketsResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to get support tickets");
  }

  return result;
}

export async function getAdminSupportTicket(
  id: string,
): Promise<APIResponse<AdminSupportTicketDetailResponse>> {
  const response = await fetchWithAuth(
    `${API_URL}/auth/admin/support/tickets/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const result: APIResponse<AdminSupportTicketDetailResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to get support ticket");
  }

  return result;
}

export async function updateAdminSupportTicket(
  id: string,
  payload: AdminUpdateSupportTicketRequest,
): Promise<APIResponse<AdminUpdateSupportTicketResponse>> {
  const response = await fetchWithAuth(
    `${API_URL}/auth/admin/support/tickets/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const result: APIResponse<AdminUpdateSupportTicketResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to update support ticket");
  }

  return result;
}

export async function getAdminSupportConversation(
  id: string,
): Promise<APIResponse<SupportConversationResponse>> {
  const response = await fetchWithAuth(
    `${API_URL}/auth/admin/support/tickets/${encodeURIComponent(id)}/messages`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const result: APIResponse<SupportConversationResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to get support conversation");
  }

  return result;
}

export async function sendAdminSupportMessage(
  id: string,
  payload: { body?: string; attachments?: File[]; is_internal?: boolean },
): Promise<APIResponse<SupportMessageResponse>> {
  const formData = new FormData();
  if (payload.body && payload.body.trim()) {
    formData.set("body", payload.body.trim());
  }
  if (payload.is_internal) {
    formData.set("is_internal", "true");
  }
  for (const file of payload.attachments || []) {
    formData.append("attachments", file);
  }

  const response = await fetchWithAuth(`${API_URL}/auth/admin/support/tickets/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    body: formData,
  });

  const result: APIResponse<SupportMessageResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to send support message");
  }

  return result;
}

export function getAdminSupportAttachmentURL(attachmentID: string): string {
  return `${API_URL}/auth/admin/support/attachments/${encodeURIComponent(attachmentID)}`;
}

export async function listUserSupportTickets(params?: {
  page?: number;
  limit?: number;
}): Promise<APIResponse<UserListSupportTicketsResponse>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const response = await fetchWithAuth(
    `${API_URL}/auth/support/tickets${query.toString() ? `?${query.toString()}` : ""}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const result: APIResponse<UserListSupportTicketsResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to get support tickets");
  }

  return result;
}

export async function getUserSupportConversation(
  id: string,
): Promise<APIResponse<SupportConversationResponse>> {
  const response = await fetchWithAuth(
    `${API_URL}/auth/support/tickets/${encodeURIComponent(id)}/messages`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const result: APIResponse<SupportConversationResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to get support conversation");
  }

  return result;
}

export async function sendUserSupportMessage(
  id: string,
  payload: { body?: string; attachments?: File[] },
): Promise<APIResponse<SupportMessageResponse>> {
  const formData = new FormData();
  if (payload.body && payload.body.trim()) {
    formData.set("body", payload.body.trim());
  }
  for (const file of payload.attachments || []) {
    formData.append("attachments", file);
  }

  const response = await fetchWithAuth(`${API_URL}/auth/support/tickets/${encodeURIComponent(id)}/messages`, {
    method: "POST",
    body: formData,
  });

  const result: APIResponse<SupportMessageResponse> = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(result) || "Failed to send support message");
  }

  return result;
}

export function getUserSupportAttachmentURL(attachmentID: string): string {
  return `${API_URL}/auth/support/attachments/${encodeURIComponent(attachmentID)}`;
}
