import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getInAppAnnouncementInbox,
  getInAppAnnouncementUnreadCount,
  getPendingInAppAnnouncements,
  markAllInAppAnnouncementsRead,
  markInAppAnnouncementRead,
  markInAppAnnouncementUnread,
  type InAppInbox,
  type InAppUnreadCount,
} from "@/lib/api/notifications";

const announcementKey = (userID: string) => ["in-app-announcements", userID] as const;

export const inAppAnnouncementKeys = {
  pending: (userID: string) => [...announcementKey(userID), "pending"] as const,
  inbox: (userID: string, page: number, limit: number) =>
    [...announcementKey(userID), "inbox", page, limit] as const,
  unreadCount: (userID: string) => [...announcementKey(userID), "unread-count"] as const,
};

/** Removes an item from the cached pending queue so the popup advances. */
function dropFromPending(
  queryClient: ReturnType<typeof useQueryClient>,
  userID: string | undefined,
  id: string,
) {
  if (!userID) return;
  queryClient.setQueryData(
    inAppAnnouncementKeys.pending(userID),
    (current: { data?: { id: string }[] } | undefined) =>
      current?.data ? { ...current, data: current.data.filter((item) => item.id !== id) } : current,
  );
}

/**
 * Pending (never-dismissed) announcements. Drives the dashboard auto-popup.
 */
export function useInAppAnnouncements(userID?: string) {
  const queryClient = useQueryClient();
  const key = inAppAnnouncementKeys.pending(userID ?? "");

  const query = useQuery({
    queryKey: key,
    queryFn: getPendingInAppAnnouncements,
    enabled: Boolean(userID),
  });

  const markRead = useMutation({
    mutationFn: markInAppAnnouncementRead,
    onSuccess: (_response, id) => {
      dropFromPending(queryClient, userID, id);
      if (userID) {
        void queryClient.invalidateQueries({ queryKey: announcementKey(userID) });
      }
    },
  });

  return { query, markRead };
}

/**
 * Paginated inbox that keeps read announcements listed, so the header bell can
 * show history and let users read an item again.
 */
export function useInAppAnnouncementInbox(userID?: string, page = 1, limit = 20) {
  const queryClient = useQueryClient();
  const key = inAppAnnouncementKeys.inbox(userID ?? "", page, limit);

  const query = useQuery({
    queryKey: key,
    queryFn: () => getInAppAnnouncementInbox(page, limit),
    enabled: Boolean(userID),
    placeholderData: (previous) => previous,
  });

  /** Mirrors a read-state change into the cached inbox and the badge. */
  const patchReadState = (id: string, isRead: boolean) => {
    if (!userID) return;
    const target = queryClient
      .getQueryData<InAppInbox>(key)
      ?.announcements.find((item) => item.id === id);
    const delta = target && target.is_read !== isRead ? (isRead ? -1 : 1) : 0;
    const readAt = isRead ? new Date().toISOString() : null;
    queryClient.setQueriesData<InAppInbox>(
      { queryKey: [...announcementKey(userID), "inbox"] },
      (current) => {
        if (!current) return current;
        return {
          ...current,
          unread_count: Math.max(current.unread_count + delta, 0),
          announcements: current.announcements.map((item) =>
            item.id === id ? { ...item, is_read: isRead, read_at: readAt } : item,
          ),
        };
      },
    );
    queryClient.setQueryData<InAppUnreadCount>(
      inAppAnnouncementKeys.unreadCount(userID),
      (current) =>
        current ? { unread_count: Math.max(current.unread_count + delta, 0) } : current,
    );
    void queryClient.invalidateQueries({
      queryKey: inAppAnnouncementKeys.unreadCount(userID),
    });
    void queryClient.invalidateQueries({ queryKey: ["admin", "in-app-announcements"] });
  };
  const markRead = useMutation({
    mutationFn: markInAppAnnouncementRead,
    onSuccess: (_response, id) => {
      patchReadState(id, true);
      dropFromPending(queryClient, userID, id);
    },
  });

  const markUnread = useMutation({
    mutationFn: markInAppAnnouncementUnread,
    onSuccess: (_response, id) => {
      patchReadState(id, false);
      // The announcement re-enters the popup queue, so refetch it.
      if (userID) {
        void queryClient.invalidateQueries({
          queryKey: inAppAnnouncementKeys.pending(userID),
        });
      }
    },
  });

  const markAllRead = useMutation({
    mutationFn: markAllInAppAnnouncementsRead,
    onSuccess: () => {
      if (!userID) return;
      queryClient.setQueriesData<InAppInbox>(
        { queryKey: [...announcementKey(userID), "inbox"] },
        (current) =>
          current
            ? {
                ...current,
                unread_count: 0,
                announcements: current.announcements.map((item) => ({
                  ...item,
                  is_read: true,
                  read_at: item.read_at ?? new Date().toISOString(),
                })),
              }
            : current,
      );
      queryClient.setQueryData<InAppUnreadCount>(inAppAnnouncementKeys.unreadCount(userID), {
        unread_count: 0,
      });
      void queryClient.invalidateQueries({ queryKey: [...announcementKey(userID), "inbox"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "in-app-announcements"] });
      void queryClient.invalidateQueries({
        queryKey: inAppAnnouncementKeys.unreadCount(userID),
      });
      void queryClient.invalidateQueries({
        queryKey: inAppAnnouncementKeys.pending(userID),
      });
    },
  });

  return { query, markRead, markUnread, markAllRead };
}

/** Unread badge count for the header bell. */
export function useInAppAnnouncementUnreadCount(userID?: string) {
  return useQuery({
    queryKey: inAppAnnouncementKeys.unreadCount(userID ?? ""),
    queryFn: getInAppAnnouncementUnreadCount,
    enabled: Boolean(userID),
  });
}
