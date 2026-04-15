import { IconApi, IconChartBar, IconDashboard,  IconHistoryToggle,IconUnlink } from "@tabler/icons-react";

export const SidebarData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/main",
      icon: IconDashboard,
    },
    {
      title: "Links",
      url: "/main/links",
      icon: IconUnlink,
    },
    {
      title: "Analytics",
      url: "/main/analytics",
      icon: IconChartBar,
    },
    {
      title: "History & Activity",
      url: "/main/history-activity",
      icon: IconHistoryToggle,
    },
    {
      title: "API & Integrations",
      url: "/main/api-integrations",
      icon: IconApi,
    },
  ],
  navSecondary: [
    // {
    //   title: "Settings",
    //   url: "/main/settings",
    //   icon: IconSettings,
    // },
    // {
    //   title: "Get Help",
    //   url: "/main/help",
    //   icon: IconHelp,
    // },
  ],
}