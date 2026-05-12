"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"

import { useAuth } from "@/app/context/AuthContext"
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const role = normalizeRole(user?.role)
  const isAdmin = role === "admin" || role === "super_admin"

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

const normalizeRole = (role?: string): string | null => {
  if (!role) {
    return null
  }

  const normalized = role.trim().toLowerCase()
  return normalized || null
}
