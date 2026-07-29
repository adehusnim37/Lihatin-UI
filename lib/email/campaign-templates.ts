import type { CampaignPayload } from "@/lib/api/admin-campaigns";

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  payload: CampaignPayload;
}

export const campaignTemplates: CampaignTemplate[] = [
  {
    id: "premium_launch",
    name: "Premium promotion",
    description: "Introduce Premium benefits with a dashboard call to action.",
    payload: {
      name: "Premium promotion",
      subject: "Get more from every link with Lihatin Premium",
      preheader: "Deeper analytics, higher limits, and priority support.",
      body: "Your links already connect people to what matters. Lihatin Premium helps you understand what happens next.\n\nUnlock deeper analytics, higher usage limits, and priority support—all in one upgrade.",
      cta_label: "Explore Premium",
      cta_url: "https://lihat.in/main",
    },
  },
  {
    id: "feature_announcement",
    name: "Feature announcement",
    description: "Announce a product improvement and invite users to try it.",
    payload: {
      name: "Feature announcement",
      subject: "A new way to do more with your Lihatin links",
      preheader: "See what’s new and start using it today.",
      body: "We’ve added a new improvement to make managing and understanding your links easier.\n\nSign in to explore the latest experience and put the new capability to work.",
      cta_label: "See what’s new",
      cta_url: "https://lihat.in/main",
    },
  },
  {
    id: "analytics_insight",
    name: "Analytics reminder",
    description: "Bring users back to review their link performance.",
    payload: {
      name: "Analytics reminder",
      subject: "Your links have a story to tell",
      preheader: "Review clicks, visitors, and your strongest-performing links.",
      body: "Every click is a useful signal. Your Lihatin analytics can help you understand which links attract attention and where your visitors come from.\n\nTake a moment to review your latest performance.",
      cta_label: "View analytics",
      cta_url: "https://lihat.in/main/analytics",
    },
  },
  {
    id: "reengagement",
    name: "Re-engagement",
    description: "Encourage inactive users to create and share another link.",
    payload: {
      name: "Re-engagement campaign",
      subject: "Ready to create your next short link?",
      preheader: "Your Lihatin workspace is ready when you are.",
      body: "It’s been a little while since your last visit. Whenever you have something new to share, Lihatin is ready to turn it into a clean, manageable short link.\n\nCome back and create your next link in seconds.",
      cta_label: "Create a link",
      cta_url: "https://lihat.in/main/links",
    },
  },
];
