"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import QuickCreateLinkDialog from "./modal/quick-create-link-dialog";

const USER_STORAGE_UPDATED_EVENT = "user-storage-updated";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
    adminOnly?: boolean;
  }[];
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const pathname = usePathname();
  const role = useSyncExternalStore(
    subscribeToUserStorage,
    readRoleFromStorage,
    () => null
  );
  const isAdmin = role === "admin" || role === "super_admin";
  const visibleItems = items.filter((item) => !item.adminOnly || isAdmin);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
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
        <SidebarMenu>
          {visibleItems.map((item) => {
            const isActive = pathname === item.url || 
              (item.url !== "/main" && pathname?.startsWith(item.url));
            
            return (
              <SidebarMenuItem key={item.title}>
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
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

const readRoleFromStorage = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { role?: string };
    return normalizeRole(parsed.role ?? null);
  } catch {
    return null;
  }
};

const subscribeToUserStorage = (onStoreChange: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener("focus", handler);
  window.addEventListener(USER_STORAGE_UPDATED_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("focus", handler);
    window.removeEventListener(USER_STORAGE_UPDATED_EVENT, handler);
  };
};

const normalizeRole = (role: string | null | undefined): string | null => {
  if (!role) {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  return normalized || null;
};
