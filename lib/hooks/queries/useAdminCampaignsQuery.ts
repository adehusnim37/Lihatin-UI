import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelAdminCampaign,
  createAdminCampaign,
  deleteAdminCampaign,
  getAdminCampaign,
  getAdminCampaignDeliveries,
  getAdminCampaigns,
  scheduleAdminCampaign,
  updateAdminCampaign,
  type CampaignPayload,
} from "@/lib/api/admin-campaigns";

export const adminCampaignKeys = {
  all: ["admin", "promotional-campaigns"] as const,
  list: (page: number, limit: number, status = "") =>
    [...adminCampaignKeys.all, "list", page, limit, status] as const,
  detail: (id: string) => [...adminCampaignKeys.all, "detail", id] as const,
  deliveries: (id: string, page: number, limit: number, status: string) =>
    [...adminCampaignKeys.all, "deliveries", id, page, limit, status] as const,
};

export function useAdminCampaignsQuery(page: number, limit: number, enabled = true, status = "") {
  return useQuery({
    queryKey: adminCampaignKeys.list(page, limit, status),
    queryFn: () => getAdminCampaigns(page, limit, status),
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function useAdminCampaignQuery(id: string, enabled: boolean) {
  return useQuery({
    queryKey: adminCampaignKeys.detail(id),
    queryFn: () => getAdminCampaign(id),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminCampaignDeliveriesQuery(
  id: string,
  page: number,
  limit: number,
  status: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: adminCampaignKeys.deliveries(id, page, limit, status),
    queryFn: () => getAdminCampaignDeliveries(id, page, limit, status),
    enabled: enabled && Boolean(id),
    placeholderData: (previous) => previous,
  });
}

function useCampaignMutationInvalidation() {
  const queryClient = useQueryClient();
  // This prefix already includes list, detail and related child queries.
  return () => queryClient.invalidateQueries({ queryKey: adminCampaignKeys.all });
}

export function useCreateAdminCampaignMutation() {
  const invalidate = useCampaignMutationInvalidation();
  return useMutation({
    mutationFn: (payload: CampaignPayload) => createAdminCampaign(payload),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateAdminCampaignMutation() {
  const invalidate = useCampaignMutationInvalidation();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CampaignPayload> }) =>
      updateAdminCampaign(id, payload),
    onSuccess: () => invalidate(),
  });
}

export function useScheduleAdminCampaignMutation() {
  const invalidate = useCampaignMutationInvalidation();
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt?: string }) =>
      scheduleAdminCampaign(id, scheduledAt),
    onSuccess: () => invalidate(),
  });
}

export function useCancelAdminCampaignMutation() {
  const invalidate = useCampaignMutationInvalidation();
  return useMutation({
    mutationFn: (id: string) => cancelAdminCampaign(id),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteAdminCampaignMutation() {
  const invalidate = useCampaignMutationInvalidation();
  return useMutation({
    mutationFn: (id: string) => deleteAdminCampaign(id),
    onSuccess: () => invalidate(),
  });
}
