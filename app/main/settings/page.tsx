"use client";

import { Settings, User, Bell, Shield, Palette } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function SettingsPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-primary/10">
                  <Settings className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground max-w-md">
                Customize your account preferences and application settings.
              </p>

              {/* Preview Settings Categories */}
              <div className="grid grid-cols-2 gap-4 mt-8 max-w-md mx-auto">
                <div className="p-4 rounded-lg bg-muted/50 border text-left">
                  <User className="h-5 w-5 text-muted-foreground mb-2" />
                  <p className="font-medium">Profile</p>
                  <p className="text-xs text-muted-foreground">
                    Account details
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border text-left">
                  <Bell className="h-5 w-5 text-muted-foreground mb-2" />
                  <p className="font-medium">Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Email & alerts
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border text-left">
                  <Shield className="h-5 w-5 text-muted-foreground mb-2" />
                  <p className="font-medium">Security</p>
                  <p className="text-xs text-muted-foreground">
                    Password & 2FA
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border text-left">
                  <Palette className="h-5 w-5 text-muted-foreground mb-2" />
                  <p className="font-medium">Appearance</p>
                  <p className="text-xs text-muted-foreground">
                    Theme & display
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-6">
                🚧 Coming Soon
              </p>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
