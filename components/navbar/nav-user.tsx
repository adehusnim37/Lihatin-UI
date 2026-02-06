"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  IconDeviceDesktop,
  IconDotsVertical,
  IconLogout,
  IconSettings,
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

export function NavUser() {
  const { isMobile } = useSidebar()
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)

  const router = useRouter()
  const auth = useAuth()

  // Load user data from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        // ignore parse error
      }
    }
  }, [])

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
