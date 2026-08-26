import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeUsername,
  changeEmail,
  checkUsernameChangeEligibility,
  checkEmailChangeEligibility,
  getProfile,
  listSessions,
  revokeAllSessions,
  revokeDevice,
  revokeSession,
  updateProfile,
  type ChangeEmailRequest,
  type ChangeUsernameRequest,
  type UpdateProfileRequest,
} from "@/lib/api/auth";

export const profileKeys = {
  all: ["profile"] as const,
  detail: () => [...profileKeys.all, "detail"] as const,
  emailEligibility: () => [...profileKeys.all, "email-eligibility"] as const,
  usernameEligibility: () =>
    [...profileKeys.all, "username-eligibility"] as const,
};

export function useProfileQuery() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: async () => {
      const response = await getProfile();
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch profile");
      }
      return response;
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfileRequest) => {
      const response = await updateProfile(payload);
      if (!response.success) {
        throw new Error(response.message || "Failed to update profile");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
}

/**
 * Revokes all sessions for a given device fingerprint. Used by the "Sign out
 * of this device" action in the security tab.
 */
export function useRevokeDeviceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deviceId: string) => {
      const response = await revokeDevice(deviceId);
      if (!response.success) {
        throw new Error(response.message || "Failed to revoke device");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
}

export function useEmailChangeEligibilityQuery(enabled: boolean) {
  return useQuery({
    queryKey: profileKeys.emailEligibility(),
    queryFn: async () => {
      const response = await checkEmailChangeEligibility();
      if (!response.success) {
        throw new Error(response.message || "Failed to check eligibility");
      }
      return response;
    },
    enabled,
  });
}

export function useChangeEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ChangeEmailRequest) => {
      const response = await changeEmail(payload);
      if (!response.success) {
        throw new Error(response.message || "Failed to change email");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
      queryClient.invalidateQueries({ queryKey: profileKeys.emailEligibility() });
    },
  });
}

export function useUsernameChangeEligibilityQuery(enabled: boolean) {
  return useQuery({
    queryKey: profileKeys.usernameEligibility(),
    queryFn: async () => {
      const response = await checkUsernameChangeEligibility();
      if (!response.success) {
        throw new Error(response.message || "Failed to check eligibility");
      }
      return response;
    },
    enabled,
  });
}

export function useChangeUsernameMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ChangeUsernameRequest) => {
      const response = await changeUsername(payload);
      if (!response.success) {
        throw new Error(response.message || "Failed to change username");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
      queryClient.invalidateQueries({
        queryKey: profileKeys.usernameEligibility(),
      });
    },
  });
}

export const sessionKeys = {
  all: ["sessions"] as const,
  list: () => [...sessionKeys.all, "list"] as const,
};

export function useSessionsQuery() {
  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: async () => {
      const response = await listSessions();
      if (!response.success) {
        throw new Error(response.message || "Failed to list sessions");
      }
      return response;
    },
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await revokeSession(sessionId);
      if (!response.success) {
        throw new Error(response.message || "Failed to revoke session");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
}

export function useRevokeAllSessionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await revokeAllSessions();
      if (!response.success) {
        throw new Error(response.message || "Failed to revoke all sessions");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() });
    },
  });
}
