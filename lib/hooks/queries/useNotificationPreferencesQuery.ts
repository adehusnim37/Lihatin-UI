import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type UpdateNotificationPreferences,
} from "@/lib/api/notifications";

export const notificationPreferenceKeys = {
  all: ["notification-preferences"] as const,
  detail: () => [...notificationPreferenceKeys.all, "detail"] as const,
};

export function useNotificationPreferencesQuery() {
  return useQuery({
    queryKey: notificationPreferenceKeys.detail(),
    queryFn: getNotificationPreferences,
  });
}

export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateNotificationPreferences) =>
      updateNotificationPreferences(payload),
    onSuccess: (response) => {
      queryClient.setQueryData(
        notificationPreferenceKeys.detail(),
        response,
      );
    },
  });
}
