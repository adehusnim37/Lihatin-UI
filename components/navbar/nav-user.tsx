"use client"

import { useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import {
  IconDeviceDesktop,
  IconDotsVertical,
  IconLogout,
  IconShield,
  IconUserCircle,
} from "@tabler/icons-react"
import { toast } from "sonner"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/app/context/AuthContext"

interface UserData {
  id: string
  username: string
  first_name: string
  last_name: string
  email: string
  avatar: string
  role: string
}

const USER_STORAGE_UPDATED_EVENT = "user-storage-updated"

let cachedUserRaw: string | null = null
let cachedUserSnapshot: UserData | null = null

const readUserFromStorage = (): UserData | null => {
  if (typeof window === "undefined") {
    return null
  }

  const savedUser = localStorage.getItem("user")
  if (savedUser === cachedUserRaw) {
    return cachedUserSnapshot
  }

  cachedUserRaw = savedUser

  if (!savedUser) {
    cachedUserSnapshot = null
    return null
  }

  try {
    cachedUserSnapshot = JSON.parse(savedUser) as UserData
    return cachedUserSnapshot
  } catch {
    cachedUserSnapshot = null
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

export function NavUser() {
  const { isMobile } = useSidebar()
  const [isLoading, setIsLoading] = useState(false)
  const user = useSyncExternalStore(
    subscribeToUserStorage,
    readUserFromStorage,
    () => null
  )

  const router = useRouter()
  const auth = useAuth()

  // Get display name and initials
  const displayName = user ? `${user.first_name} ${user.last_name}` : "User"
  const initials = user 
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() 
    : "U"

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await auth.logout()
      // Toast will show before page reload
      toast.success('Logged out', { description: 'You have been logged out.' })
      // AuthContext.logout will force reload to /auth/login
    } catch (err) {
      console.error('Logout error:', err)
      toast.error('Logout failed', { description: 'Please try again.' })
      // AuthContext.logout handles fallback reload
    }
    // No finally block needed - page will reload
  }

  const handleProfilePage = () => {
    router.push('/profile/me')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user?.avatar} alt={displayName} />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user?.email || "Loading..."}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.avatar} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.email || "Loading..."}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleProfilePage}>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconShield />
                MFA/2FA
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/profile/me?tab=session')}>
                <IconDeviceDesktop />
                Session
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
