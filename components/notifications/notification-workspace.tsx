"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  IconBell,
  IconChevronLeft,
  IconChevronRight,
  IconDots,
  IconMail,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function NotificationWorkspaceHeader({
  channel,
  onCreate,
  onRefresh,
  refreshing,
  canCreate,
}: {
  channel: "in-app" | "email";
  onCreate: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  canCreate: boolean;
}) {
  return (
    <div>
      <div className="pb-5 sm:pb-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Notifications</h1>
          {canCreate && (
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={refreshing}
                aria-label="Refresh notifications"
              >
                <IconRefresh
                  className={cn("size-4", refreshing && "animate-spin motion-reduce:animate-none")}
                />
              </Button>
              <Button
                onClick={onCreate}
                aria-label={channel === "in-app" ? "New announcement" : "New campaign"}
              >
                <IconPlus className="size-4" />
                <span className="sm:hidden">New</span>
                <span className="hidden sm:inline">
                  {channel === "in-app" ? "New announcement" : "New campaign"}
                </span>
              </Button>
            </div>
          )}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {channel === "in-app"
            ? "Share product updates in the dashboard. See who has read them."
            : "Create thoughtful email campaigns. Follow each message from draft to delivery."}
        </p>
      </div>
      <nav aria-label="Notification channels" className="flex gap-6 border-b">
        {(
          [
            {
              id: "in-app",
              label: "In-app",
              href: "/main/admin/in-app-notifications",
              Icon: IconBell,
            },
            {
              id: "email",
              label: "Email campaigns",
              href: "/main/admin/email-campaigns",
              Icon: IconMail,
            },
          ] as const
        ).map(({ id, label, href, Icon }) => (
          <Link
            key={id}
            href={href}
            aria-current={channel === id ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 border-transparent px-1 pb-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              channel === id && "border-foreground text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function NotificationSummary({
  items,
  note,
}: {
  items: { label: string; value: number }[];
  note?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-b py-4 sm:py-5">
      <dl className="grid grid-cols-2 items-center gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-7">
        {items.map(({ label, value }) => (
          <div key={label} className="flex items-baseline gap-2">
            <dd className="order-first text-lg font-semibold tabular-nums">
              {value.toLocaleString()}
            </dd>
            <dt className="text-xs text-muted-foreground">
              {value === 1
                ? ({
                    announcements: "announcement",
                    campaigns: "campaign",
                    drafts: "draft",
                    recipients: "recipient",
                  }[label] ?? label)
                : label}
            </dt>
          </div>
        ))}
      </dl>
      {note && (
        <p className="hidden text-xs leading-5 text-muted-foreground md:block md:ml-auto">{note}</p>
      )}
    </div>
  );
}

export function NotificationPagination({
  page,
  totalPages,
  total,
  busy,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  busy?: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {total.toLocaleString()} {total === 1 ? "result" : "results"}
        <span className="mx-2 text-border">/</span>Page {page} of {Math.max(totalPages, 1)}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || busy}
          onClick={() => onPageChange(page - 1)}
        >
          <IconChevronLeft className="size-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= Math.max(totalPages, 1) || busy}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <IconChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function NotificationRowMenu({
  label,
  disabled,
  children,
}: {
  label: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled} aria-label={`Actions for ${label}`}>
          <IconDots className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NotificationDetailPanel({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-5 py-5 pr-12 sm:px-6">
          <SheetTitle className="break-words text-xl leading-snug">{title}</SheetTitle>
          <SheetDescription className="leading-6">{description}</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-clip p-5 sm:p-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

export function NotificationComposer({
  open,
  onOpenChange,
  title,
  description,
  children,
  preview,
  saving,
  pendingLabel = "Saving…",
  submitLabel,
  onSubmit,
  dirty,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  preview: ReactNode;
  saving: boolean;
  pendingLabel?: string;
  submitLabel: string;
  onSubmit: () => void;
  dirty: boolean;
}) {
  const [tab, setTab] = useState("compose");
  const [discardOpen, setDiscardOpen] = useState(false);
  const requestClose = (next: boolean) => {
    if (saving) return;
    if (!next && dirty) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(next);
  };
  return (
    <>
      <Dialog open={open} onOpenChange={requestClose}>
        <DialogContent
          showCloseButton={!saving}
          className="h-[min(56rem,94dvh)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-clip p-0 sm:max-w-6xl"
        >
          <DialogHeader className="border-b px-5 py-5 pr-12 sm:px-6">
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <DialogDescription className="leading-6">{description}</DialogDescription>
          </DialogHeader>
          <Tabs
            value={tab}
            onValueChange={setTab}
            className="grid min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-clip lg:grid-cols-[1fr_0.9fr] lg:grid-rows-1"
          >
            <TabsList className="mx-5 mt-4 mb-2 w-auto lg:hidden">
              <TabsTrigger value="compose">Compose</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent
              forceMount
              value="compose"
              className="min-h-0 overflow-y-auto overscroll-y-contain p-5 data-[state=inactive]:hidden lg:p-6 lg:data-[state=inactive]:block"
            >
              <div className="grid gap-6">{children}</div>
            </TabsContent>
            <TabsContent
              forceMount
              value="preview"
              className="min-h-0 overflow-y-auto overscroll-y-contain bg-muted/30 p-5 data-[state=inactive]:hidden lg:border-l lg:p-6 lg:data-[state=inactive]:block"
            >
              <div className="mb-5">
                <p className="text-sm font-medium">Live preview</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Updates as you write. Preview links do not send a message.
                </p>
              </div>
              {preview}
            </TabsContent>
          </Tabs>
          <DialogFooter className="flex-row items-center justify-end border-t px-5 py-4 sm:px-6">
            <Button variant="outline" disabled={saving} onClick={() => requestClose(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={onSubmit}>
              {saving ? pendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes have not been saved. Keep editing to finish this message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDiscardOpen(false);
                onOpenChange(false);
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function NotificationEmptyState({
  title,
  description,
  action,
  icon = "bell",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: "bell" | "mail";
}) {
  const Icon = icon === "mail" ? IconMail : IconBell;
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </span>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
