"use client";

import { BarChart3, TrendingUp, Users, MousePointerClick } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AnalyticsPage() {
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
                  <BarChart3 className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl font-bold">Analytics</h1>
              <p className="text-muted-foreground max-w-md">
                Track your link performance, click statistics, and visitor
                insights.
              </p>

              {/* Preview Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg mx-auto">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <MousePointerClick className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Total Clicks</p>
                  <p className="text-2xl font-bold">--</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Unique Visitors
                  </p>
                  <p className="text-2xl font-bold">--</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <TrendingUp className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Growth</p>
                  <p className="text-2xl font-bold">--</p>
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
