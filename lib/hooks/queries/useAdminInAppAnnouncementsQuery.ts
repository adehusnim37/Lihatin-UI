import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveAdminInAppAnnouncement,
  createAdminInAppAnnouncement,
  deleteAdminInAppAnnouncement,
  getAdminInAppAnnouncement,
  getAdminInAppAnnouncementAudience,
  getAdminInAppAnnouncements,
  publishAdminInAppAnnouncement,
  updateAdminInAppAnnouncement,
  type AnnouncementPayload,
  type CreateAnnouncementPayload,
} from "@/lib/api/admin-in-app-announcements";

export const adminAnnouncementKeys = {
  all: ["admin", "in-app-announcements"] as const,
  list: (page: number, limit: number, status: string) =>
    [...adminAnnouncementKeys.all, "list", page, limit, status] as const,
  detail: (id: string) => [...adminAnnouncementKeys.all, "detail", id] as const,
  audience: (id: string, status: string, page: number, limit: number) =>
    [...adminAnnouncementKeys.all, "audience", id, status, page, limit] as const,
};

export function useAdminInAppAnnouncementsQuery(
  page: number,
  limit: number,
  status: string,
  enabled = true,
) {
  return useQuery({
    queryKey: adminAnnouncementKeys.list(page, limit, status),
    queryFn: () => getAdminInAppAnnouncements(page, limit, status),
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function useAdminInAppAnnouncementQuery(id: string, enabled: boolean) {
  return useQuery({
    queryKey: adminAnnouncementKeys.detail(id),
    queryFn: () => getAdminInAppAnnouncement(id),
    enabled: enabled && Boolean(id),
  });
}

/** Accounts that dismissed an announcement, with reach totals. */
export function useAdminInAppAnnouncementAudienceQuery(
  id: string,
  status: "read" | "unread",
  page: number,
  limit: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: adminAnnouncementKeys.audience(id, status, page, limit),
    queryFn: () => getAdminInAppAnnouncementAudience(id, status, page, limit),
    enabled: enabled && Boolean(id),
    placeholderData: (previous) => previous,
  });
}

function useAnnouncementMutationInvalidation() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: adminAnnouncementKeys.all });
    if (id) {
      void queryClient.invalidateQueries({
        queryKey: adminAnnouncementKeys.detail(id),
      });
    }
  };
}

export function useCreateAdminInAppAnnouncementMutation() {
  const invalidate = useAnnouncementMutationInvalidation();
  return useMutation({
    mutationFn: (payload: CreateAnnouncementPayload) => createAdminInAppAnnouncement(payload),
    onSuccess: (announcement) => invalidate(announcement.id),
  });
}

export function useUpdateAdminInAppAnnouncementMutation() {
  const invalidate = useAnnouncementMutationInvalidation();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AnnouncementPayload }) =>
      updateAdminInAppAnnouncement(id, payload),
    onSuccess: (announcement) => invalidate(announcement.id),
  });
}

export function usePublishAdminInAppAnnouncementMutation() {
  const invalidate = useAnnouncementMutationInvalidation();
  return useMutation({
    mutationFn: (id: string) => publishAdminInAppAnnouncement(id),
    onSuccess: (announcement) => invalidate(announcement.id),
  });
}

export function useArchiveAdminInAppAnnouncementMutation() {
  const invalidate = useAnnouncementMutationInvalidation();
  return useMutation({
    mutationFn: (id: string) => archiveAdminInAppAnnouncement(id),
    onSuccess: (_response, id) => invalidate(id),
  });
}

export function useDeleteAdminInAppAnnouncementMutation() {
  const invalidate = useAnnouncementMutationInvalidation();
  return useMutation({
    mutationFn: (id: string) => deleteAdminInAppAnnouncement(id),
    onSuccess: (_announcement, id) => invalidate(id),
  });
}
