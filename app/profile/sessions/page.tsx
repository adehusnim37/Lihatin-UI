"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import SessionTab from "@/components/profile/tab/session";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SessionsPage() {
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
      <SidebarInset className="min-w-0">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
          <header className="space-y-1">
            <Link href="/profile/me?tab=security" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back to Security
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sessions</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Review where your account is signed in and check recent sign-in activity.
            </p>
          </header>
          <SessionTab />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
