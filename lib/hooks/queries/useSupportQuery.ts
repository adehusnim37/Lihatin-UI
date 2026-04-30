"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSupportTicket,
  getAdminSupportConversation,
  getAdminSupportTicket,
  getUserSupportConversation,
  listAdminSupportTickets,
  listPublicSupportConversation,
  listUserSupportTickets,
  requestSupportAccessOTP,
  resendSupportAccessOTP,
  sendAdminSupportMessage,
  sendPublicSupportMessage,
  sendUserSupportMessage,
  trackSupportTicket,
  updateAdminSupportTicket,
  verifySupportAccessCode,
  verifySupportAccessOTP,
  type AdminSupportTicketDetailResponse,
  type AdminSupportTicketItem,
  type AdminUpdateSupportTicketRequest,
  type CreateSupportTicketRequest,
  type CreateSupportTicketResponse,
  type SupportAccessResponse,
  type SupportCategory,
  type SupportConversationResponse,
  type SupportMessageResponse,
  type SupportOTPChallengeResponse,
  type SupportPriority,
  type SupportTicketStatus,
  type TrackSupportTicketResponse,
  type UserListSupportTicketsResponse,
} from "@/lib/api/support";

type AdminTicketListParams = {
  status?: SupportTicketStatus | "all";
  category?: SupportCategory | "all";
  priority?: SupportPriority | "all";
  page?: number;
  limit?: number;
  search?: string;
  email?: string;
};

type UserTicketListParams = {
  page?: number;
  limit?: number;
};

type PublicConversationParams = {
  ticket: string;
  email: string;
  accessToken: string;
};

type PublicSendMessageVariables = {
  params: PublicConversationParams;
  payload: {
    body?: string;
    attachments?: File[];
  };
};

type SupportTicketUpdateVariables = {
  id: string;
  payload: AdminUpdateSupportTicketRequest;
};

type SupportSendMessageVariables = {
  id: string;
  payload: {
    body?: string;
    attachments?: File[];
    is_internal?: boolean;
  };
};

const ensureSuccess = <TData,>(
  response: { success: boolean; data?: TData | null; message?: string },
  fallbackMessage: string,
): TData => {
  if (!response.success || response.data == null) {
    throw new Error(response.message || fallbackMessage);
  }

  return response.data;
};

export const supportKeys = {
  all: ["support"] as const,
  public: () => [...supportKeys.all, "public"] as const,
  publicTrack: (ticket: string, email: string) =>
    [...supportKeys.public(), "track", { ticket, email }] as const,
  publicConversation: (
    ticket: string,
    email: string,
    accessToken: string,
  ) =>
    [
      ...supportKeys.public(),
      "conversation",
      { ticket, email, accessToken },
    ] as const,
  admin: () => [...supportKeys.all, "admin"] as const,
  adminTickets: () => [...supportKeys.admin(), "tickets"] as const,
  adminTicketList: (params: AdminTicketListParams) =>
    [...supportKeys.adminTickets(), "list", params] as const,
  adminTicketDetail: (id: string) =>
    [...supportKeys.adminTickets(), "detail", id] as const,
  adminConversation: (id: string) =>
    [...supportKeys.adminTickets(), "conversation", id] as const,
  user: () => [...supportKeys.all, "user"] as const,
  userTickets: () => [...supportKeys.user(), "tickets"] as const,
  userTicketList: (params: UserTicketListParams) =>
    [...supportKeys.userTickets(), "list", params] as const,
  userConversation: (id: string) =>
    [...supportKeys.userTickets(), "conversation", id] as const,
};

export function useCreateSupportTicketMutation() {
  return useMutation({
    mutationFn: async (
      payload: CreateSupportTicketRequest,
    ): Promise<CreateSupportTicketResponse> => {
      const response = await createSupportTicket(payload);
      return ensureSuccess(response, "Failed to submit support ticket");
    },
  });
}

export function useTrackSupportTicketMutation() {
  return useMutation({
    mutationFn: async (payload: {
      ticket: string;
      email: string;
    }): Promise<TrackSupportTicketResponse> => {
      const response = await trackSupportTicket(payload);
      return ensureSuccess(response, "Failed to track ticket");
    },
  });
}

export function useRequestSupportAccessOTPMutation() {
  return useMutation({
    mutationFn: async (payload: {
      ticket: string;
      email: string;
      captcha_token: string;
    }): Promise<SupportOTPChallengeResponse> => {
      const response = await requestSupportAccessOTP(payload);
      return ensureSuccess(
        response,
        "Failed to request verification code",
      );
    },
  });
}

export function useResendSupportAccessOTPMutation() {
  return useMutation({
    mutationFn: async (payload: {
      challenge_token: string;
      captcha_token: string;
    }): Promise<SupportOTPChallengeResponse> => {
      const response = await resendSupportAccessOTP(payload);
      return ensureSuccess(response, "Failed to resend verification code");
    },
  });
}

export function useVerifySupportAccessOTPMutation() {
  return useMutation({
    mutationFn: async (payload: {
      challenge_token: string;
      otp_code: string;
    }): Promise<SupportAccessResponse> => {
      const response = await verifySupportAccessOTP(payload);
      return ensureSuccess(response, "Failed to verify code");
    },
  });
}

export function useVerifySupportAccessCodeMutation() {
  return useMutation({
    mutationFn: async (payload: {
      ticket: string;
      email: string;
      code: string;
    }): Promise<SupportAccessResponse> => {
      const response = await verifySupportAccessCode(payload);
      return ensureSuccess(response, "Failed to verify access code");
    },
  });
}

export function usePublicSupportConversationQuery(
  params: PublicConversationParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: supportKeys.publicConversation(
      params.ticket,
      params.email,
      params.accessToken,
    ),
    queryFn: async (): Promise<SupportConversationResponse> => {
      const response = await listPublicSupportConversation(params);
      return ensureSuccess(response, "Failed to load conversation");
    },
    enabled:
      enabled &&
      Boolean(params.ticket && params.email && params.accessToken),
  });
}

export function useSendPublicSupportMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      params,
      payload,
    }: PublicSendMessageVariables): Promise<SupportMessageResponse> => {
      const response = await sendPublicSupportMessage(params, payload);
      return ensureSuccess(response, "Failed to send message");
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: supportKeys.publicConversation(
          variables.params.ticket,
          variables.params.email,
          variables.params.accessToken,
        ),
      });
    },
  });
}

export function useAdminSupportTicketsQuery(
  params: AdminTicketListParams,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: supportKeys.adminTicketList(params),
    queryFn: async (): Promise<{
      items: AdminSupportTicketItem[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    }> => {
      const response = await listAdminSupportTickets(params);
      return ensureSuccess(response, "Failed to get support tickets");
    },
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminSupportTicketDetailQuery(
  id: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: supportKeys.adminTicketDetail(id),
    queryFn: async (): Promise<AdminSupportTicketDetailResponse> => {
      const response = await getAdminSupportTicket(id);
      return ensureSuccess(response, "Failed to get support ticket");
    },
    enabled: enabled && Boolean(id),
  });
}

export function useAdminSupportConversationQuery(
  id: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: supportKeys.adminConversation(id),
    queryFn: async (): Promise<SupportConversationResponse> => {
      const response = await getAdminSupportConversation(id);
      return ensureSuccess(response, "Failed to get support conversation");
    },
    enabled: enabled && Boolean(id),
  });
}

export function useUpdateAdminSupportTicketMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: SupportTicketUpdateVariables): Promise<{
      ticket_code: string;
      status: SupportTicketStatus;
      admin_notes?: string | null;
      resolved_at?: string | null;
      action_applied?: string;
    }> => {
      const response = await updateAdminSupportTicket(id, payload);
      return ensureSuccess(response, "Failed to update support ticket");
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: supportKeys.adminTickets(),
        }),
        queryClient.invalidateQueries({
          queryKey: supportKeys.adminTicketDetail(variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: supportKeys.adminConversation(variables.id),
        }),
      ]);
    },
  });
}

export function useSendAdminSupportMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: SupportSendMessageVariables): Promise<SupportMessageResponse> => {
      const response = await sendAdminSupportMessage(id, payload);
      return ensureSuccess(response, "Failed to send support message");
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: supportKeys.adminConversation(variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: supportKeys.adminTickets(),
        }),
      ]);
    },
  });
}

export function useUserSupportTicketsQuery(
  params: UserTicketListParams,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: supportKeys.userTicketList(params),
    queryFn: async (): Promise<UserListSupportTicketsResponse> => {
      const response = await listUserSupportTickets(params);
      return ensureSuccess(response, "Failed to get support tickets");
    },
    enabled,
  });
}

export function useUserSupportConversationQuery(
  id: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: supportKeys.userConversation(id),
    queryFn: async (): Promise<SupportConversationResponse> => {
      const response = await getUserSupportConversation(id);
      return ensureSuccess(response, "Failed to get support conversation");
    },
    enabled: enabled && Boolean(id),
  });
}

export function useSendUserSupportMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: SupportSendMessageVariables): Promise<SupportMessageResponse> => {
      const response = await sendUserSupportMessage(id, payload);
      return ensureSuccess(response, "Failed to send support message");
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: supportKeys.userConversation(variables.id),
        }),
        queryClient.invalidateQueries({
          queryKey: supportKeys.userTickets(),
        }),
      ]);
    },
  });
}
