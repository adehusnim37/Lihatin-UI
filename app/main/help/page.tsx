"use client";

import {
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  FileText,
  ExternalLink,
  ChevronRight,
  Search,
  Video,
  Zap,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

const helpCategories = [
  {
    title: "Getting Started",
    description: "Learn the basics of creating and managing short links",
    icon: Zap,
    color: "bg-green-500/10 text-green-500",
    articles: [
      "Create your first link",
      "Understanding analytics",
      "Custom short codes",
    ],
  },
  {
    title: "Link Management",
    description: "Everything about managing your shortened URLs",
    icon: FileText,
    color: "bg-blue-500/10 text-blue-500",
    articles: ["Bulk link creation", "Edit & delete links", "Link expiration"],
  },
  {
    title: "API & Integrations",
    description: "Connect Lihatin with your tools and workflows",
    icon: Book,
    color: "bg-purple-500/10 text-purple-500",
    articles: ["API authentication", "Webhook setup", "Rate limits"],
  },
  {
    title: "Account & Billing",
    description: "Manage your account settings and subscription",
    icon: MessageCircle,
    color: "bg-amber-500/10 text-amber-500",
    articles: ["Change password", "Update profile", "Billing FAQ"],
  },
];

const popularArticles = [
  "How to create a short link with custom alias",
  "Setting up password protection for links",
  "Understanding click analytics and reports",
  "Configuring webhook notifications",
  "Bulk import links from CSV",
];

export default function HelpPage() {
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
        <div className="flex flex-1 flex-col gap-6 p-6 max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 py-8">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10">
                <HelpCircle className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">How can we help you?</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Search our knowledge base or browse categories below
            </p>

            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto mt-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for help articles..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Help Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {helpCategories.map((category) => (
              <div
                key={category.title}
                className="rounded-xl border bg-card p-6 hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${category.color}`}>
                    <category.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description}
                    </p>
                    <ul className="mt-3 space-y-1">
                      {category.articles.map((article) => (
                        <li
                          key={article}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronRight className="h-3 w-3" />
                          {article}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Popular Articles */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Popular Articles
            </h2>
            <ul className="space-y-3">
              {popularArticles.map((article) => (
                <li
                  key={article}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <span className="group-hover:text-primary transition-colors">
                    {article}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <MessageCircle className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <h3 className="font-semibold">Live Chat</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Chat with our support team
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Available 9 AM - 6 PM WIB
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-full bg-green-500/10">
                  <Mail className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <h3 className="font-semibold">Email Support</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get help via email
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                support@lihat.in
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-full bg-purple-500/10">
                  <Video className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <h3 className="font-semibold">Video Tutorials</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Learn with video guides
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                YouTube Channel
              </p>
            </div>
          </div>

          {/* Documentation Link */}
          <div className="rounded-xl border bg-gradient-to-r from-primary/5 to-primary/10 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Book className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Developer Documentation</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete API reference and integration guides
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-background transition-colors">
                View Docs
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <p className="text-center text-sm text-muted-foreground">
            🚧 Knowledge base & live chat coming soon
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
