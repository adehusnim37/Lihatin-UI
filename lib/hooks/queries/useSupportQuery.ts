"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  supportKeys,
  refreshAdminSupportTicket,
  refreshUserSupportTicket,
} from "@/lib/support/query-cache";
export { supportKeys } from "@/lib/support/query-cache";

import {
  createSupportTicket,
  requestAdminRecoveryOTP,
  requestSupportRecoveryOTP,
  verifySupportRecoveryOTP,
  type SupportRecoveryTarget,
  approveSupportCredentialReset,
  type ApproveSupportCredentialResetRequest,
  getAdminSupportConversation,
  getAdminSupportTicket,
  getUserSupportConversation,
  listAdminSupportTickets,
  listPublicSupportConversation,
  listUserSupportTickets,
  requestSupportAccessOTP,
  resendSupportAccessOTP,
  revokePublicSupportAccess,
  sendAdminSupportMessage,
  sendPublicSupportMessage,
  sendUserSupportMessage,
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

const ensureSuccess = <TData>(
  response: { success: boolean; data?: TData | null; message?: string },
  fallbackMessage: string,
): TData => {
  if (!response.success || response.data == null) {
    throw new Error(response.message || fallbackMessage);
  }

  return response.data;
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

export function useRequestSupportAccessOTPMutation() {
  return useMutation({
    mutationFn: async (payload: {
      ticket: string;
      email: string;
      captcha_token: string;
    }): Promise<SupportOTPChallengeResponse> => {
      const response = await requestSupportAccessOTP(payload);
      return ensureSuccess(response, "Failed to request verification code");
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
    queryKey: supportKeys.publicConversation(params.ticket),
    queryFn: async ({ signal }): Promise<SupportConversationResponse> => {
      const response = await listPublicSupportConversation(params, signal);
      return ensureSuccess(response, "Failed to load conversation");
    },
    enabled: enabled && Boolean(params.ticket),
    refetchInterval: (query) => conversationRecoveryInterval(query.state.data),
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
        queryKey: supportKeys.publicConversation(variables.params.ticket),
      });
    },
  });
}

export function useRevokePublicSupportAccessMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticket: string) => revokePublicSupportAccess(ticket),
    onMutate: (ticket: string) =>
      queryClient.cancelQueries({
        queryKey: supportKeys.publicConversation(ticket),
        exact: true,
      }),
    onSuccess: (_data, ticket) => {
      queryClient.removeQueries({
        queryKey: supportKeys.publicConversation(ticket),
        exact: true,
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
    queryFn: async ({
      signal,
    }): Promise<{
      items: AdminSupportTicketItem[];
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    }> => {
      const response = await listAdminSupportTickets(params, signal);
      return ensureSuccess(response, "Failed to get support tickets");
    },
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminSupportTicketDetailQuery(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: supportKeys.adminTicketDetail(id),
    queryFn: async ({ signal }): Promise<AdminSupportTicketDetailResponse> => {
      const response = await getAdminSupportTicket(id, signal);
      return ensureSuccess(response, "Failed to get support ticket");
    },
    enabled: enabled && Boolean(id),
    refetchInterval: (query) => {
      const ticket = query.state.data;
      const expiresAt = Date.parse(ticket?.recovery_verification_expires_at ?? "");
      const verifiedAt = Date.parse(ticket?.requester_verified_at ?? "");
      const requestedAt = Date.parse(ticket?.recovery_verification_requested_at ?? "");
      return ticket?.status === "in_progress" &&
        !ticket.credential_reset &&
        expiresAt > Date.now() &&
        !(verifiedAt >= requestedAt)
        ? 10_000
        : false;
    },
  });
}

export function useAdminSupportConversationQuery(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: supportKeys.adminConversation(id),
    queryFn: async ({ signal }): Promise<SupportConversationResponse> => {
      const response = await getAdminSupportConversation(id, signal);
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
    onSuccess: (_data, variables) => refreshAdminSupportTicket(queryClient, variables.id),
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
    onSuccess: (_data, variables) => refreshAdminSupportTicket(queryClient, variables.id),
  });
}

export function useUserSupportTicketsQuery(params: UserTicketListParams, enabled: boolean = true) {
  return useQuery({
    queryKey: supportKeys.userTicketList(params),
    queryFn: async ({ signal }): Promise<UserListSupportTicketsResponse> => {
      const response = await listUserSupportTickets(params, signal);
      return ensureSuccess(response, "Failed to get support tickets");
    },
    enabled,
  });
}

export function useUserSupportConversationQuery(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: supportKeys.userConversation(id),
    queryFn: async ({ signal }): Promise<SupportConversationResponse> => {
      const response = await getUserSupportConversation(id, signal);
      return ensureSuccess(response, "Failed to get support conversation");
    },
    enabled: enabled && Boolean(id),
    refetchInterval: (query) => conversationRecoveryInterval(query.state.data),
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
    onSuccess: (_data, variables) => refreshUserSupportTicket(queryClient, variables.id),
  });
}

export function useApproveSupportCredentialResetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: ApproveSupportCredentialResetRequest;
    }) => {
      const response = await approveSupportCredentialReset(id, payload);
      return ensureSuccess(response, "Recovery approval failed");
    },
    onSuccess: (_data, variables) => refreshAdminSupportTicket(queryClient, variables.id),
  });
}

// Refresh only an active recovery conversation awaiting the requester proof.
function conversationRecoveryInterval(conversation?: SupportConversationResponse): number | false {
  if (conversation?.category !== "lost_2fa" || conversation.status !== "in_progress") return false;
  const verifiedAt = Date.parse(conversation.recovery_verification?.verified_at ?? "");
  return verifiedAt > Date.now() - 24 * 60 * 60 * 1000 ? false : 15_000;
}

export function useRequestAdminRecoveryOTPMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      ensureSuccess(await requestAdminRecoveryOTP(id), "Recovery email could not be sent"),
    onSuccess: (_data, id) => refreshAdminSupportTicket(queryClient, id),
  });
}

export function useSupportRecoveryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ target, code }: { target: SupportRecoveryTarget; code?: string }) => {
      return code === undefined
        ? ensureSuccess(await requestSupportRecoveryOTP(target), "Recovery email could not be sent")
        : ensureSuccess(
            await verifySupportRecoveryOTP(target, code),
            "Recovery verification failed",
          );
    },
    onSuccess: (_data, { target }) =>
      target.access === "public"
        ? queryClient.invalidateQueries({
            queryKey: supportKeys.publicConversation(target.ticket),
            exact: true,
          })
        : refreshUserSupportTicket(queryClient, target.id),
  });
}
