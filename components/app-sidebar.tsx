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


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavSecondary items={SidebarData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
