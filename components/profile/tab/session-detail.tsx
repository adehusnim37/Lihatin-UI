"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  IconCheck,
  IconX,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconBrandChrome,
  IconBrandFirefox,
  IconBrandSafari,
  IconBrandEdge,
  IconMapPin,
  IconClock,
  IconAlertCircle,
  IconUser,
  IconCopy,
  IconCheck as IconCheckCopied,
  IconShield,
  IconWorld,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SessionDetailProps {
  attempt: {
    id: string;
    success: boolean;
    ip_address: string;
    user_agent: string;
    created_at: string;
    fail_reason?: string;
    email_or_username: string;
  };
}

export function SessionDetail({ attempt }: SessionDetailProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Helper to parse user agent (reused logic for consistency)
  const parseUserAgent = (userAgent: string) => {
    const ua = userAgent.toLowerCase();

    // Detect browser
    let browser = "Unknown Browser";
    let BrowserIcon = IconWorld;
    if (ua.includes("edg")) {
      browser = "Edge";
      BrowserIcon = IconBrandEdge;
    } else if (ua.includes("chrome")) {
      browser = "Chrome";
      BrowserIcon = IconBrandChrome;
    } else if (ua.includes("firefox")) {
      browser = "Firefox";
      BrowserIcon = IconBrandFirefox;
    } else if (ua.includes("safari")) {
      browser = "Safari";
      BrowserIcon = IconBrandSafari;
    }

    // Detect device
    const isMobile =
      ua.includes("mobile") || ua.includes("android") || ua.includes("iphone");
    const DeviceIcon = isMobile ? IconDeviceMobile : IconDeviceDesktop;

    // Detect OS (simple detection)
    let os = "Unknown OS";
    if (ua.includes("android")) os = "Android";
    else if (
      ua.includes("ios") ||
      ua.includes("iphone") ||
      ua.includes("ipad")
    )
      os = "iOS";
    else if (ua.includes("win")) os = "Windows";
    else if (ua.includes("mac")) os = "macOS";
    else if (ua.includes("linux")) os = "Linux";

    return { browser, os, BrowserIcon, DeviceIcon };
  };

  const { browser, os, BrowserIcon, DeviceIcon } = parseUserAgent(
    attempt.user_agent,
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-5 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
          {/* Header Status Section */}
          <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/20 p-4 text-left sm:flex-col sm:items-center sm:justify-center sm:py-6 sm:text-center">
            <div
              className={cn(
                "shrink-0 rounded-full p-2.5 ring-4 ring-background sm:p-3",
                attempt.success
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
              )}
            >
              {attempt.success ? (
                <IconCheck className="size-6 sm:size-8" />
              ) : (
                <IconX className="size-6 sm:size-8" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold sm:text-lg">
                {attempt.success ? "Login Successful" : "Login Failed"}
              </h3>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground sm:items-center sm:justify-center">
                <IconClock className="mt-0.5 size-3.5 shrink-0 sm:mt-0" />
                {format(new Date(attempt.created_at), "PPP 'at' pp")}
              </p>
            </div>
          </div>

          {/* Device Information */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <IconDeviceDesktop className="size-4" /> Device Details
            </h4>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              <div className="min-w-0 space-y-1 rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">Browser</div>
                <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                  <BrowserIcon className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{browser}</span>
                </div>
              </div>
              <div className="min-w-0 space-y-1 rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">OS & Device</div>
                <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                  <DeviceIcon className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{os}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Network Information */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <IconMapPin className="size-4" /> Network
            </h4>
            <div className="group flex min-w-0 items-center justify-between gap-3 rounded-lg border bg-card p-3">
              <div className="min-w-0 space-y-1">
                <div className="text-xs text-muted-foreground">IP Address</div>
                <code className="block break-all font-mono text-sm">
                  {attempt.ip_address}
                </code>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                onClick={() =>
                  copyToClipboard(attempt.ip_address, "IP Address")
                }
              >
                {copiedField === "IP Address" ? (
                  <IconCheckCopied className="size-4 text-green-600" />
                ) : (
                  <IconCopy className="size-4" />
                )}
                <span className="sr-only">Copy IP</span>
              </Button>
            </div>
          </div>

          {/* Security Context */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <IconShield className="size-4" /> Security Context
            </h4>
            <div className="space-y-3">
              <div className="min-w-0 space-y-1 rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">
                  Account Identifier
                </div>
                <div className="flex min-w-0 items-start gap-2 text-sm font-medium">
                  <IconUser className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="min-w-0 break-all">
                    {attempt.email_or_username}
                  </span>
                </div>
              </div>

              {!attempt.success && attempt.fail_reason && (
                <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                    <IconAlertCircle className="size-3.5 shrink-0" />
                    Failure Reason
                  </div>
                  <div className="break-words text-sm text-red-800 dark:text-red-300">
                    {attempt.fail_reason}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technical Details Collapsible */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <IconShield className="size-4" /> Detailed Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  User Agent String
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() =>
                    copyToClipboard(attempt.user_agent, "User Agent")
                  }
                >
                  {copiedField === "User Agent" ? (
                    <IconCheckCopied className="size-3 text-green-600" />
                  ) : (
                    <IconCopy className="size-3" />
                  )}
                </Button>
              </div>
              <code className="block break-all rounded-md border bg-muted p-3 font-mono text-xs text-muted-foreground">
                {attempt.user_agent}
              </code>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Attempt ID</div>
              <div className="flex min-w-0 items-start gap-2">
                <code className="min-w-0 flex-1 break-all rounded bg-muted px-1.5 py-1 font-mono text-xs text-muted-foreground">
                  {attempt.id}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  onClick={() => copyToClipboard(attempt.id, "Attempt ID")}
                >
                  {copiedField === "Attempt ID" ? (
                    <IconCheckCopied className="size-3 text-green-600" />
                  ) : (
                    <IconCopy className="size-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
