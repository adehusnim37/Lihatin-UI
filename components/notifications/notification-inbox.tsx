"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { AnnouncementReaderDialog } from "@/components/notifications/announcement-reader-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type { InAppInboxItem } from "@/lib/api/notifications";
import {
  useInAppAnnouncementInbox,
  useInAppAnnouncementUnreadCount,
} from "@/lib/hooks/queries/useInAppAnnouncementsQuery";
import { cn } from "@/lib/utils";

const PAGE_LIMIT = 10;

export function NotificationInbox() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<InAppInboxItem | null>(null);
  const inbox = useInAppAnnouncementInbox(user?.id, page, PAGE_LIMIT);
  const unread = useInAppAnnouncementUnreadCount(user?.id);
  const data = inbox.query.data;
  const announcements = data?.announcements ?? [];
  const unreadCount = unread.data?.unread_count ?? data?.unread_count ?? 0;
  const busy =
    inbox.markRead.isPending || inbox.markUnread.isPending || inbox.markAllRead.isPending;

  const updateRead = async (announcement: InAppInboxItem, isRead: boolean) => {
    try {
      await (isRead ? inbox.markRead : inbox.markUnread).mutateAsync(announcement.id);
    } catch (error) {
      toast.error("Could not update this notification", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };
  const openAnnouncement = (announcement: InAppInboxItem) => {
    setOpen(false);
    setSelected(announcement);
    setDetailOpen(true);
    if (!announcement.is_read) void updateRead(announcement, true);
  };
  const openLink = (announcement: InAppInboxItem) => {
    setOpen(false);
    setDetailOpen(false);
    if (!announcement.is_read) void updateRead(announcement, true);
    if (/^https?:\/\//i.test(announcement.href))
      window.open(announcement.href, "_blank", "noopener,noreferrer");
    else router.push(announcement.href);
  };
  const markAll = async () => {
    try {
      const result = await inbox.markAllRead.mutateAsync();
      toast.success(
        result.marked_count
          ? `Marked ${result.marked_count} notifications as read`
          : "Everything is already read",
      );
    } catch (error) {
      toast.error("Could not mark all as read", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            title="Notifications"
          >
            <Bell className="size-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center px-1 text-[10px] leading-none tabular-nums"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={10}
          collisionPadding={12}
          className="flex max-h-[min(38rem,var(--radix-popover-content-available-height))] w-[min(25rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl p-0"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-4">
            <div>
              <h2 className="text-sm font-semibold">Notifications</h2>
              <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
                {unreadCount ? `${unreadCount} unread` : "You're all caught up"}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy || unreadCount === 0}
              onClick={() => void markAll()}
            >
              {inbox.markAllRead.isPending ? (
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <CheckCheck className="size-4" />
              )}
              Read all
            </Button>
          </div>
          <div className="min-h-0 max-h-[min(24rem,55dvh)] overflow-y-auto overscroll-y-contain">
            {inbox.query.isLoading || inbox.query.isPlaceholderData ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : inbox.query.isError ? (
              <div className="p-7 text-center">
                <p className="text-sm font-medium">Notifications could not be loaded</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {inbox.query.error.message || "Please try again."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => void inbox.query.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : announcements.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto size-7 text-muted-foreground" />
                <p className="mt-4 text-sm font-medium">No notifications yet</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Product updates will appear here. Read messages stay available to revisit.
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {announcements.map((announcement) => (
                  <li
                    key={announcement.id}
                    className={cn("group", !announcement.is_read && "bg-primary/5")}
                  >
                    <button
                      type="button"
                      onClick={() => openAnnouncement(announcement)}
                      className="flex w-full items-start gap-3 px-4 pt-4 pb-2 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      aria-label={`Open ${announcement.title}${announcement.is_read ? "" : ", unread"}`}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                          announcement.is_read
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/15 text-primary-ink",
                        )}
                      >
                        <BellRing className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-3">
                          <span
                            className={cn(
                              "break-words text-sm leading-5",
                              announcement.is_read ? "font-medium" : "font-semibold",
                            )}
                          >
                            {announcement.title}
                          </span>
                          {!announcement.is_read && (
                            <span
                              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary-ink"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <span className="mt-1 block line-clamp-2 break-words text-xs leading-5 text-muted-foreground">
                          {announcement.body}
                        </span>
                      </span>
                    </button>
                    <div className="flex items-center justify-between gap-2 pr-3 pb-3 pl-15">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <button
                          type="button"
                          className="inline-flex min-h-9 max-md:min-h-11 items-center gap-1 text-xs font-medium text-primary-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          disabled={busy}
                          onClick={() =>
                            announcement.is_read
                              ? openAnnouncement(announcement)
                              : void updateRead(announcement, true)
                          }
                        >
                          {announcement.is_read ? (
                            <RotateCcw className="size-3" />
                          ) : (
                            <CheckCheck className="size-3" />
                          )}
                          {announcement.is_read ? "Read again" : "Mark read"}
                        </button>
                        <time
                          className="text-[11px] text-muted-foreground"
                          dateTime={announcement.read_at || announcement.created_at}
                        >
                          {announcement.is_read && announcement.read_at
                            ? `Read ${formatRelative(announcement.read_at)}`
                            : formatRelative(announcement.created_at)}
                        </time>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-9 shrink-0 max-md:size-11"
                            aria-label={`More actions for ${announcement.title}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={busy}
                            onSelect={() => void updateRead(announcement, !announcement.is_read)}
                          >
                            <CheckCheck className="size-4" />
                            Mark as {announcement.is_read ? "unread" : "read"}
                          </DropdownMenuItem>
                          {announcement.href?.trim() && (
                            <DropdownMenuItem onSelect={() => openLink(announcement)}>
                              <ExternalLink className="size-4" />
                              Open link
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {(data?.total_pages ?? 0) > 1 && (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {data?.total_pages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={page <= 1 || inbox.query.isFetching}
                  onClick={() => setPage((current) => current - 1)}
                  aria-label="Newer notifications"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={page >= (data?.total_pages ?? 1) || inbox.query.isFetching}
                  onClick={() => setPage((current) => current + 1)}
                  aria-label="Older notifications"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <AnnouncementReaderDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        title={selected?.title}
        body={selected?.body}
        href={selected?.href}
        onDone={() => setDetailOpen(false)}
        onOpenLink={() => selected && openLink(selected)}
      />
    </>
  );
}

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}
