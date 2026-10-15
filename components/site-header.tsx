"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationInbox } from "@/components/notifications/notification-inbox";

export function SiteHeader() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter((segment) => segment !== "");

  const breadcrumbs = React.useMemo(() => {
    const items = [
      {
        label: "Dashboard",
        href: "/main",
        active: segments.length === 0 || (segments.length === 1 && segments[0] === "main"),
      },
    ];

    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`; // Always update path first

      if (segment === "profile" && segments[index + 1] === "me") return;
      if (segment === "main") return; // Skip display for 'main' as it is hardcoded

      const isLast = index === segments.length - 1;
      const labels: Record<string, string> = {
        admin: "Admin",
        links: "Links",
        analytics: "Analytics",
        "history-activity": "History & Activity",
        "api-integrations": "API & Integrations",
        support: "Support Inbox",
        users: "Users",
        "premium-codes": "Premium Codes",
        generate: "Generate",
        notifications: "Notifications",
        "in-app-notifications": "In-app",
        "email-campaigns": "Email Campaigns",
        "support-tickets": "Support Tickets",
        "security-policy": "Security Policy",
        settings: "Settings",
        profile: "Profile",
        me: "Profile",
        help: "Get Help",
      };
      const label = labels[segment] ?? segment;

      items.push({
        label,
        href: currentPath,
        active: isLast,
      });
    });

    return items;
  }, [segments]);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="min-w-0 flex-nowrap">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.href}>
                <BreadcrumbItem className={item.active ? "min-w-0" : "hidden md:block"}>
                  {item.active ? (
                    <BreadcrumbPage className="block truncate" title={item.label}>
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator className="hidden md:block" />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <NotificationInbox />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
