"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"

import { NavMain } from "@/components/navbar/nav-main"
import { NavSecondary } from "@/components/navbar/nav-secondary"
import { NavUser } from "@/components/navbar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SidebarData } from "@/components/sidebar.data"
import { getUserData, saveUserData } from "@/lib/api/auth"

const USER_STORAGE_UPDATED_EVENT = "user-storage-updated"


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const role = React.useSyncExternalStore(
    subscribeToUserStorage,
    readRoleFromStorage,
    () => null
  )
  const isAdmin = role === "admin" || role === "super_admin"

  React.useEffect(() => {
    let active = true

    const syncUserFromAPI = async () => {
      try {
        const response = await getUserData()
        if (!active || !response.success || !response.data?.user) {
          return
        }
        saveUserData(response.data.user)
      } catch {
        // Silent fallback to storage snapshot.
      }
    }

    void syncUserFromAPI()
    const handleFocus = () => {
      void syncUserFromAPI()
    }
    window.addEventListener("focus", handleFocus)

    return () => {
      active = false
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/main">
                <Image
                  src="/logo.svg"
                  alt="Lihatin Logo"
                  width={24}
                  height={24}
                  className="inline-block mr-2 rounded"
                />
                <span className="text-base font-semibold">Lihatin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={SidebarData.navMain} />
        {isAdmin && SidebarData.navAdmin.length > 0 && (
          <NavMain
            items={SidebarData.navAdmin}
            label="Admin"
            showQuickCreate={false}
          />
        )}
        <NavSecondary items={SidebarData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}

const readRoleFromStorage = (): string | null => {
  if (typeof window === "undefined") {
    return null
  }

  const raw = localStorage.getItem("user")
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as { role?: string }
    if (!parsed.role) {
      return null
    }
    const normalized = parsed.role.trim().toLowerCase()
    return normalized || null
  } catch {
    return null
  }
}

const subscribeToUserStorage = (onStoreChange: () => void) => {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handler = () => onStoreChange()
  window.addEventListener("storage", handler)
  window.addEventListener("focus", handler)
  window.addEventListener(USER_STORAGE_UPDATED_EVENT, handler)

  return () => {
    window.removeEventListener("storage", handler)
    window.removeEventListener("focus", handler)
    window.removeEventListener(USER_STORAGE_UPDATED_EVENT, handler)
  }
}
