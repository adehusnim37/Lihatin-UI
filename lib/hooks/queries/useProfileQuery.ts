import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changeEmail,
  checkEmailChangeEligibility,
  getProfile,
  updateProfile,
  type ChangeEmailRequest,
  type UpdateProfileRequest,
} from "@/lib/api/auth";

export const profileKeys = {
  all: ["profile"] as const,
  detail: () => [...profileKeys.all, "detail"] as const,
  emailEligibility: () => [...profileKeys.all, "email-eligibility"] as const,
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
