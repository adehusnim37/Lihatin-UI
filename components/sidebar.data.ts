import {
  IconApi,
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconHistoryToggle,
  IconLifebuoy,
  IconShieldCheck,
  IconSparkles,
  IconShield,
  IconUnlink,
  IconUsers,
} from "@tabler/icons-react";

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
  navAdmin: [
    {
      title: "Premium Codes",
      url: "/main/admin/premium-codes",
      icon: IconShieldCheck,
      children: [
        {
          title: "Usage",
          url: "/main/admin/premium-codes",
          icon: IconShieldCheck,
        },
        {
          title: "Generate",
          url: "/main/admin/premium-codes/generate",
          icon: IconSparkles,
        },
      ],
    },
    {
      title: "Admin Security Policy",
      url: "/main/admin/security-policy",
      icon: IconShield,
    },
    {
      title: "Premium Access",
      url: "/main/admin/premium-access",
      icon: IconUsers,
      children: [
        {
          title: "Manage Users",
          url: "/main/admin/premium-access",
          icon: IconUsers,
        },
      ],
    },
    {
      title: "Support Tickets",
      url: "/main/admin/support-tickets",
      icon: IconLifebuoy,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/support",
      icon: IconLifebuoy,
    },
    {
      title: "Get Help",
      url: "/main/help",
      icon: IconHelp,
    },
  ],
}
