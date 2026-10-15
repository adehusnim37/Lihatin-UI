import {
  IconApi,
  IconBellRinging,
  IconChartBar,
  IconCirclePlus,
  IconDashboard,
  IconHelp,
  IconHistoryToggle,
  IconLifebuoy,
  IconMail,
  IconReceipt,
  IconShield,
  IconTicket,
  IconUnlink,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";

export type NavItem = {
  title: string;
  url: string;
  icon: Icon;
  children?: Omit<NavItem, "children">[];
};

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
    {
      title: "Support Inbox",
      url: "/main/support",
      icon: IconLifebuoy,
    },
  ],
  navAdmin: [
    {
      title: "Users",
      url: "/main/admin/users",
      icon: IconUsers,
      children: [
        {
          title: "List Users",
          url: "/main/admin/users",
          icon: IconUsers,
        },
      ],
    },
    {
      title: "Premium Codes",
      url: "/main/admin/premium-codes",
      icon: IconTicket,
      children: [
        {
          title: "Usage",
          url: "/main/admin/premium-codes",
          icon: IconReceipt,
        },
        {
          title: "Generate",
          url: "/main/admin/premium-codes/generate",
          icon: IconCirclePlus,
        },
      ],
    },
    {
      title: "Notifications",
      url: "/main/admin/in-app-notifications",
      icon: IconBellRinging,
      children: [
        {
          title: "In-app",
          url: "/main/admin/in-app-notifications",
          icon: IconBellRinging,
        },
        {
          title: "Email Campaigns",
          url: "/main/admin/email-campaigns",
          icon: IconMail,
        },
      ],
    },
    {
      title: "Support Tickets",
      url: "/main/admin/support-tickets",
      icon: IconLifebuoy,
    },
    {
      title: "Admin Security Policy",
      url: "/main/admin/security-policy",
      icon: IconShield,
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
};