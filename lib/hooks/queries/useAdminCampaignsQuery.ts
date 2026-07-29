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
  list: (page: number, limit: number) =>
    [...adminCampaignKeys.all, "list", page, limit] as const,
  detail: (id: string) =>
    [...adminCampaignKeys.all, "detail", id] as const,
  deliveries: (id: string, page: number, limit: number, status: string) =>
    [
      ...adminCampaignKeys.all,
      "deliveries",
      id,
      page,
      limit,
      status,
    ] as const,
};

export function useAdminCampaignsQuery(
  page: number,
  limit: number,
  enabled = true,
) {
  return useQuery({
    queryKey: adminCampaignKeys.list(page, limit),
    queryFn: () => getAdminCampaigns(page, limit),
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
    queryFn: () =>
      getAdminCampaignDeliveries(id, page, limit, status),
    enabled: enabled && Boolean(id),
    placeholderData: (previous) => previous,
  });
}

function useCampaignMutationInvalidation() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: adminCampaignKeys.all });
    if (id) {
      void queryClient.invalidateQueries({
        queryKey: adminCampaignKeys.detail(id),
      });
    }
  };
}

export function useCreateAdminCampaignMutation() {
  const invalidate = useCampaignMutationInvalidation();
  return useMutation({
    mutationFn: (payload: CampaignPayload) =>
      createAdminCampaign(payload),
    onSuccess: (campaign) => invalidate(campaign.id),
  });
}

export function useUpdateAdminCampaignMutation() {
  const invalidate = useCampaignMutationInvalidation();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CampaignPayload>;
    }) => updateAdminCampaign(id, payload),
    onSuccess: (campaign) => invalidate(campaign.id),
  });
}

export function useScheduleAdminCampaignMutation() {
  const invalidate = useCampaignMutationInvalidation();
  return useMutation({
    mutationFn: ({
      id,
      scheduledAt,
    }: {
      id: string;
      scheduledAt?: string;
    }) => scheduleAdminCampaign(id, scheduledAt),
    onSuccess: (campaign) => invalidate(campaign.id),
  });
}

export function useCancelAdminCampaignMutation() {
  const invalidate = useCampaignMutationInvalidation();
  return useMutation({
    mutationFn: (id: string) => cancelAdminCampaign(id),
    onSuccess: (campaign) => invalidate(campaign.id),
  });
}

export function useDeleteAdminCampaignMutation() {
  const invalidate = useCampaignMutationInvalidation();
  return useMutation({
    mutationFn: (id: string) => deleteAdminCampaign(id),
    onSuccess: () => invalidate(),
  });
}
