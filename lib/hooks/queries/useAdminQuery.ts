import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAdminUsers,
  getAdminDisposableEmailPolicy,
  updateAdminDisposableEmailPolicy,
  getAdminPremiumCodes,
  sendAdminPremiumCodeEmail,
  revokeAdminUserPremiumAccess,
  reactivateAdminUserPremiumAccess,
  getAdminUserPremiumStatusEvents,
  validateResetToken,
  type AdminUsersListResponse,
  type AdminDisposableEmailPolicyResponse,
  type AdminPremiumCodesResponse,
  type AdminPremiumStatusEventsListResponse,
  type AdminPremiumStatusMutationResponse,
  type UpdateAdminDisposableEmailPolicyRequest,
  type AdminRevokePremiumAccessRequest,
  type AdminReactivatePremiumAccessRequest,
  type AdminSendPremiumCodeEmailRequest,
  type AdminSendPremiumCodeEmailResponse,
} from "@/lib/api/auth";

export const adminKeys = {
  all: ["admin"] as const,
  users: {
    all: () => [...adminKeys.all, "users"] as const,
    list: (page?: number, limit?: number) =>
      [...adminKeys.all, "users", "list", page, limit] as const,
  },
  disposableEmailPolicy: () =>
    [...adminKeys.all, "disposable-email-policy"] as const,
  premiumCodes: {
    all: () => [...adminKeys.all, "premium-codes"] as const,
    list: (page?: number, limit?: number) =>
      [...adminKeys.all, "premium-codes", "list", page, limit] as const,
  },
  premiumStatusEvents: (userId: string) =>
    [...adminKeys.all, "premium-status-events", userId] as const,
};

export function useAdminUsersQuery(page = 1, limit = 20) {
  return useQuery({
    queryKey: adminKeys.users.list(page, limit),
    queryFn: async () => {
      const response = await getAdminUsers({ page, limit, sort: "created_at", order_by: "desc" });
      if (!response.success) throw new Error(response.message || "Failed to load users");
      return response.data as AdminUsersListResponse;
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminDisposableEmailPolicyQuery() {
  return useQuery({
    queryKey: adminKeys.disposableEmailPolicy(),
    queryFn: async () => {
      const response = await getAdminDisposableEmailPolicy();
      return response.data as AdminDisposableEmailPolicyResponse;
    },
  });
}

export function useUpdateAdminDisposableEmailPolicyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateAdminDisposableEmailPolicyRequest) => {
      const response = await updateAdminDisposableEmailPolicy(payload);
      return response.data as AdminDisposableEmailPolicyResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(adminKeys.disposableEmailPolicy(), data);
      toast.success("Policy updated", {
        description: data.enabled
          ? "Disposable email protection is now enabled."
          : "Disposable email protection is now disabled.",
      });
    },
    onError: (error) => {
      toast.error("Failed to update policy", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });
}

export function useAdminPremiumCodesQuery(page = 1, limit = 10) {
  return useQuery({
    queryKey: adminKeys.premiumCodes.list(page, limit),
    queryFn: async () => {
      const response = await getAdminPremiumCodes({ page, limit, sort: "created_at", order_by: "desc" });
      if (!response.success) throw new Error(response.message || "Failed to load premium codes");
      return response.data as AdminPremiumCodesResponse;
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminPremiumStatusEventsQuery(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: adminKeys.premiumStatusEvents(userId),
    queryFn: async () => {
      const response = await getAdminUserPremiumStatusEvents(userId, { limit: 25 });
      return response.data as AdminPremiumStatusEventsListResponse;
    },
    enabled,
  });
}

export function useRevokeAdminUserPremiumMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string;
      payload: AdminRevokePremiumAccessRequest;
    }) => {
      const response = await revokeAdminUserPremiumAccess(userId, payload);
      return response.data as AdminPremiumStatusMutationResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users.all() });
      toast.success("Premium revoked", {
        description: "User downgraded to regular role.",
      });
    },
    onError: (error) => {
      toast.error("Failed to revoke premium", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });
}

export function useReactivateAdminUserPremiumMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string;
      payload: AdminReactivatePremiumAccessRequest;
    }) => {
      const response = await reactivateAdminUserPremiumAccess(userId, payload);
      return response.data as AdminPremiumStatusMutationResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users.all() });
      toast.success("Premium reactivated", {
        description: "User premium access is active again.",
      });
    },
    onError: (error) => {
      toast.error("Failed to reactivate premium", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });
}

export function useSendAdminPremiumCodeEmailMutation() {
  return useMutation({
    mutationFn: async ({
      premiumCodeId,
      payload,
    }: {
      premiumCodeId: number;
      payload: AdminSendPremiumCodeEmailRequest;
    }) => {
      const response = await sendAdminPremiumCodeEmail(premiumCodeId, payload);
      return response.data as AdminSendPremiumCodeEmailResponse;
    },
    onSuccess: (data) => {
      toast.success("Secret code sent", {
        description: `Email delivered to ${data.recipient_email}.`,
      });
    },
    onError: (error) => {
      toast.error("Failed to send secret code", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });
}

export function useCheckShortCodeQuery(shortCode: string) {
  return useQuery({
    queryKey: ["short-code", "check", shortCode] as const,
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";
      const response = await fetch(`${apiUrl}/short/check/${shortCode}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) return "valid" as const;
      if (response.status === 404) return "not_found" as const;
      if (response.status === 401) return "needs_passcode" as const;
      return "valid" as const;
    },
    enabled: Boolean(shortCode),
    retry: false,
  });
}

export function useValidateResetTokenQuery(token: string | null) {
  return useQuery({
    queryKey: ["auth", "validate-reset-token", token] as const,
    queryFn: async () => {
      const response = await validateResetToken(token!);
      return response.success;
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });
}
