"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react";

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
import QuickCreateLinkDialog from "./modal/quick-create-link-dialog";

type NavItem = {
  title: string;
  url?: string;
  icon?: Icon;
  children?: NavItem[];
};

export function NavMain({
  items,
  label,
  showQuickCreate = true,
}: {
  items: NavItem[];
  label?: string;
  showQuickCreate?: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
              <QuickCreateLinkDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          {items.map((item) => {
            const children = item.children ?? [];
            const hasChildren = children.length > 0;
            const isAnyChildActive = hasChildren
              ? children.some((child) =>
                  isRouteActive(pathname, child.url, { exact: true })
                )
              : false;
            const isActive = hasChildren
              ? isAnyChildActive || isRouteActive(pathname, item.url, { exact: true })
              : isRouteActive(pathname, item.url);

            return (
              <SidebarMenuItem key={item.title}>
                {item.url ? (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                )}
                {hasChildren && (
                  <SidebarMenuSub>
                    {children.map((child) => {
                      const isChildActive = isRouteActive(pathname, child.url, {
                        exact: true,
                      });

                      return (
                        <SidebarMenuSubItem key={`${item.title}-${child.title}`}>
                          {child.url ? (
                            <SidebarMenuSubButton
                              asChild
                              isActive={isChildActive}
                            >
                              <Link href={child.url}>
                                {child.icon && <child.icon />}
                                <span>{child.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          ) : (
                            <SidebarMenuSubButton isActive={isChildActive}>
                              {child.icon && <child.icon />}
                              <span>{child.title}</span>
                            </SidebarMenuSubButton>
                          )}
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
  options?: { exact?: boolean }
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
