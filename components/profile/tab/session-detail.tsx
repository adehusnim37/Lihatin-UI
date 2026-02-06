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
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
  IconShield,
  IconWorld,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  const [isOpen, setIsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Helper to parse user agent (reused logic for consistency)
  const parseUserAgent = (userAgent: string) => {
    const ua = userAgent.toLowerCase();

    // Detect browser
    let browser = "Unknown Browser";
    let BrowserIcon = IconWorld;
    if (ua.includes("chrome")) {
      browser = "Chrome";
      BrowserIcon = IconBrandChrome;
    } else if (ua.includes("firefox")) {
      browser = "Firefox";
      BrowserIcon = IconBrandFirefox;
    } else if (ua.includes("safari")) {
      browser = "Safari";
      BrowserIcon = IconBrandSafari;
    } else if (ua.includes("edge")) {
      browser = "Edge";
      BrowserIcon = IconBrandEdge;
    }

    // Detect device
    const isMobile =
      ua.includes("mobile") || ua.includes("android") || ua.includes("iphone");
    const DeviceIcon = isMobile ? IconDeviceMobile : IconDeviceDesktop;

    // Detect OS (simple detection)
    let os = "Unknown OS";
    if (ua.includes("win")) os = "Windows";
    else if (ua.includes("mac")) os = "macOS";
    else if (ua.includes("linux")) os = "Linux";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("ios") || ua.includes("iphone")) os = "iOS";

    return { browser, isMobile, os, BrowserIcon, DeviceIcon };
  };

  const { browser, isMobile, os, BrowserIcon, DeviceIcon } = parseUserAgent(
    attempt.user_agent,
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-6 pb-6 pl-6 pr-3 -pt-6">
          {/* Header Status Section */}
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 bg-muted/20 rounded-lg border border-border/50">
            <div
              className={cn(
                "p-3 rounded-full ring-4 ring-background",
                attempt.success
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
              )}
            >
              {attempt.success ? (
                <IconCheck className="w-8 h-8" />
              ) : (
                <IconX className="w-8 h-8" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {attempt.success ? "Login Successful" : "Login Failed"}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
                <IconClock className="w-3.5 h-3.5" />
                {format(new Date(attempt.created_at), "PPP 'at' pp")}
              </p>
            </div>
          </div>

          {/* Device Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <IconDeviceDesktop className="h-4 w-4" /> Device Details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg bg-card space-y-1">
                <div className="text-xs text-muted-foreground">Browser</div>
                <div className="text-sm font-medium flex items-center gap-2">
                  <BrowserIcon className="h-4 w-4 text-primary" />
                  {browser}
                </div>
              </div>
              <div className="p-3 border rounded-lg bg-card space-y-1">
                <div className="text-xs text-muted-foreground">OS & Device</div>
                <div className="text-sm font-medium flex items-center gap-2">
                  <DeviceIcon className="h-4 w-4 text-primary" />
                  {os}
                </div>
              </div>
            </div>
          </div>

          {/* Network Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <IconMapPin className="h-4 w-4" /> Network
            </h4>
            <div className="p-3 border rounded-lg bg-card flex items-center justify-between group">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">IP Address</div>
                <code className="text-sm font-mono">{attempt.ip_address}</code>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() =>
                  copyToClipboard(attempt.ip_address, "IP Address")
                }
              >
                {copiedField === "IP Address" ? (
                  <IconCheckCopied className="h-4 w-4 text-green-600" />
                ) : (
                  <IconCopy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy IP</span>
              </Button>
            </div>
          </div>

          {/* Security Context */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <IconShield className="h-4 w-4" /> Security Context
            </h4>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg bg-card space-y-1">
                <div className="text-xs text-muted-foreground">
                  Account Identifier
                </div>
                <div className="text-sm font-medium flex items-center gap-2">
                  <IconUser className="h-4 w-4 text-primary" />
                  {attempt.email_or_username}
                </div>
              </div>

              {!attempt.success && attempt.fail_reason && (
                <div className="p-4 border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 rounded-lg space-y-1">
                  <div className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <IconAlertCircle className="h-3.5 w-3.5" />
                    Failure Reason
                  </div>
                  <div className="text-sm text-red-800 dark:text-red-300">
                    {attempt.fail_reason}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technical Details Collapsible */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <IconShield className="h-4 w-4" /> Detailed Information
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
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
                    <IconCheckCopied className="h-3 w-3 text-green-600" />
                  ) : (
                    <IconCopy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <code className="block p-3 bg-muted rounded-md border text-xs font-mono break-all text-muted-foreground">
                {attempt.user_agent}
              </code>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Attempt ID</div>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-muted-foreground">
                  {attempt.id}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(attempt.id, "Attempt ID")}
                >
                  {copiedField === "Attempt ID" ? (
                    <IconCheckCopied className="h-3 w-3 text-green-600" />
                  ) : (
                    <IconCopy className="h-3 w-3" />
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
