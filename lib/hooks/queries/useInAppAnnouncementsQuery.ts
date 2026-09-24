import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPendingInAppAnnouncements,
  markInAppAnnouncementRead,
} from "@/lib/api/notifications";

const announcementKey = (userID: string) => ["in-app-announcements", userID] as const;

export function useInAppAnnouncements(userID?: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: announcementKey(userID ?? ""),
    queryFn: getPendingInAppAnnouncements,
    enabled: Boolean(userID),
  });
  const markRead = useMutation({
    mutationFn: markInAppAnnouncementRead,
    onSuccess: (_response, id) => {
      queryClient.setQueryData(
        announcementKey(userID ?? ""),
        (current: typeof query.data) =>
          current?.data
            ? { ...current, data: current.data.filter((item) => item.id !== id) }
            : current,
      );
    },
  });
  return { query, markRead };
}
