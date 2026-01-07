"use client";

import {
  History,
  MousePointerClick,
  Link2,
  Shield,
  Settings,
  User,
  Filter,
  Calendar,
  Download,
} from "lucide-react";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type ActivityType =
  | "click"
  | "create"
  | "update"
  | "delete"
  | "login"
  | "settings";

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: string;
}

const mockActivities: Activity[] = [
  {
    id: "1",
    type: "click",
    title: "Link clicked",
    description: "lihat.in/demo was accessed",
    timestamp: "2 minutes ago",
    metadata: "Chrome • Jakarta, ID",
  },
  {
    id: "2",
    type: "create",
    title: "Link created",
    description: "New short link: lihat.in/promo2024",
    timestamp: "15 minutes ago",
  },
  {
    id: "3",
    type: "click",
    title: "Link clicked",
    description: "lihat.in/portfolio was accessed",
    timestamp: "1 hour ago",
    metadata: "Safari • Singapore",
  },
  {
    id: "4",
    type: "settings",
    title: "Settings updated",
    description: "Changed notification preferences",
    timestamp: "3 hours ago",
  },
  {
    id: "5",
    type: "update",
    title: "Link updated",
    description: "Modified destination for lihat.in/shop",
    timestamp: "5 hours ago",
  },
  {
    id: "6",
    type: "login",
    title: "New login",
    description: "Logged in from new device",
    timestamp: "Yesterday",
    metadata: "MacBook Pro • Chrome",
  },
  {
    id: "7",
    type: "delete",
    title: "Link deleted",
    description: "Removed lihat.in/old-promo",
    timestamp: "2 days ago",
  },
  {
    id: "8",
    type: "create",
    title: "Bulk links created",
    description: "Created 5 new short links",
    timestamp: "3 days ago",
  },
];

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case "click":
      return <MousePointerClick className="h-4 w-4" />;
    case "create":
      return <Link2 className="h-4 w-4" />;
    case "update":
      return <Link2 className="h-4 w-4" />;
    case "delete":
      return <Link2 className="h-4 w-4" />;
    case "login":
      return <User className="h-4 w-4" />;
    case "settings":
      return <Settings className="h-4 w-4" />;
    default:
      return <History className="h-4 w-4" />;
  }
};

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case "click":
      return "bg-blue-500/10 text-blue-500";
    case "create":
      return "bg-green-500/10 text-green-500";
    case "update":
      return "bg-amber-500/10 text-amber-500";
    case "delete":
      return "bg-red-500/10 text-red-500";
    case "login":
      return "bg-purple-500/10 text-purple-500";
    case "settings":
      return "bg-gray-500/10 text-gray-500";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function HistoryActivityPage() {
  const [filter, setFilter] = useState<"all" | ActivityType>("all");

  const filteredActivities =
    filter === "all"
      ? mockActivities
      : mockActivities.filter((a) => a.type === filter);

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
        <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <History className="h-6 w-6 text-primary" />
              </div>
              History & Activity
            </h1>
            <p className="text-muted-foreground">
              Track all actions and events in your account.
            </p>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
                {[
                  { value: "all", label: "All" },
                  { value: "click", label: "Clicks" },
                  { value: "create", label: "Created" },
                  { value: "update", label: "Updated" },
                  { value: "login", label: "Logins" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value as typeof filter)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      filter === option.value
                        ? "bg-background shadow-sm font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted transition-colors text-sm">
                <Calendar className="h-4 w-4" />
                Date Range
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted transition-colors text-sm">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Events",
                value: "1,234",
                icon: History,
                color: "text-primary",
              },
              {
                label: "Link Clicks",
                value: "892",
                icon: MousePointerClick,
                color: "text-blue-500",
              },
              {
                label: "Links Created",
                value: "47",
                icon: Link2,
                color: "text-green-500",
              },
              {
                label: "Security Events",
                value: "12",
                icon: Shield,
                color: "text-amber-500",
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-sm">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Activity Timeline */}
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Recent Activity</h2>
            </div>

            <div className="divide-y">
              {filteredActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`p-2 rounded-lg ${getActivityColor(
                      activity.type
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{activity.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {activity.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    {activity.metadata && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.metadata}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredActivities.length === 0 && (
              <div className="p-8 text-center">
                <History className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No activities found</p>
              </div>
            )}
          </div>

          {/* Load More */}
          <div className="text-center">
            <button className="px-6 py-2 rounded-lg border hover:bg-muted transition-colors text-sm">
              Load More Activities
            </button>
          </div>

          {/* Coming Soon Notice */}
          <p className="text-center text-sm text-muted-foreground">
            🚧 Real-time activity tracking coming soon
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
