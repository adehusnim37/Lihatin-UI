"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconChevronRight, IconCirclePlusFilled } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/components/sidebar.data";
import { cn } from "@/lib/utils";
import QuickCreateLinkDialog from "./modal/quick-create-link-dialog";

export function NavMain({
  items,
  label,
  showQuickCreate = true,
}: {
  items: NavItem[];
  label?: string;
  showQuickCreate?: boolean;
}) {  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
        {showQuickCreate && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                tooltip="Quick Create"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                onClick={() => setIsDialogOpen(true)}
              >
                <IconCirclePlusFilled />
                <span>Quick Create</span>
              </SidebarMenuButton>
              <QuickCreateLinkDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          {items.map((item) => {
            const children = item.children ?? [];
            const hasChildren = children.length > 0;
            const isAnyChildActive = hasChildren
              ? children.some((child) => isRouteActive(pathname, child.url, { exact: true }))
              : false;
            const isActive = hasChildren
              ? isAnyChildActive || isRouteActive(pathname, item.url, { exact: true })
              : isRouteActive(pathname, item.url);
            // Groups holding the active route always stay expanded so the current
            // page is never hidden behind a collapsed parent.
            const isCollapsed = hasChildren && collapsed[item.title] === true && !isAnyChildActive;

            return (
              <SidebarMenuItem key={item.title}>
                <div className="flex items-center gap-1">
                  <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {hasChildren && (
                    <button
                      type="button"
                      aria-expanded={!isCollapsed}
                      aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${item.title}`}
                      onClick={() =>
                        setCollapsed((current) => ({
                          ...current,
                          [item.title]: !current[item.title],
                        }))
                      }
                      className="text-sidebar-foreground/70 ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 flex size-6 shrink-0 items-center justify-center rounded-md outline-none transition-transform"
                    >
                      <IconChevronRight
                        className={cn(
                          "size-4 transition-transform duration-200",
                          !isCollapsed && "rotate-90",
                        )}
                      />
                    </button>
                  )}
                </div>
                {hasChildren && !isCollapsed && (
                  <SidebarMenuSub>
                    {children.map((child) => {
                      const isChildActive = isRouteActive(pathname, child.url, {
                        exact: true,
                      });

                      return (
                        <SidebarMenuSubItem key={`${item.title}-${child.title}`}>
                          <SidebarMenuSubButton asChild isActive={isChildActive}>
                            <Link href={child.url}>
                              {child.icon && <child.icon />}
                              <span>{child.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function isRouteActive(
  pathname: string | null,
  url?: string,
  options?: { exact?: boolean },
): boolean {
  if (!pathname || !url) {
    return false;
  }

  const exact = options?.exact ?? false;
  if (exact) {
    return pathname === url;
  }

  if (url === "/main") {
    return pathname === url;
  }

  return pathname === url || pathname.startsWith(`${url}/`);
}
