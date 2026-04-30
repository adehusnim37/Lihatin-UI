"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconArrowRight, IconKey, IconLifebuoy, IconPointFilled } from "@tabler/icons-react";

import { PublicSupportShell } from "@/components/support/public-support-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPublicSupportConversationURL } from "@/lib/support/public-access";
import { getSupportReasonFromSearch } from "@/lib/support/public-support";

function SupportChooserContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) {
      return;
    }

    const ticket = (searchParams.get("ticket") || "").trim().toUpperCase();
    const email = (searchParams.get("email") || "").trim();
    const code = (searchParams.get("code") || "").trim();
    const reason = getSupportReasonFromSearch(searchParams.get("reason"));

    if (ticket && email && code) {
      redirectedRef.current = true;
      router.replace(buildPublicSupportConversationURL(ticket, email, code));
      return;
    }

    if (ticket || email || code) {
      redirectedRef.current = true;
      const params = new URLSearchParams();
      if (ticket) params.set("ticket", ticket);
      if (email) params.set("email", email);
      if (code) params.set("code", code);
      router.replace(`/support/access${params.toString() ? `?${params.toString()}` : ""}`);
      return;
    }

    if (reason) {
      redirectedRef.current = true;
      const params = new URLSearchParams({ reason });
      if (email) {
        params.set("email", email);
      }
      router.replace(`/support/new?${params.toString()}`);
    }
  }, [router, searchParams]);

  return (
    <PublicSupportShell
      title="Lihatin Support"
      description="Choose what you need first, then continue with focused flow."
    >
      <div className="grid auto-rows-fr gap-6 lg:grid-cols-2">
        <Card className="flex h-full flex-col shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">New Request</p>
            <CardTitle className="flex items-center gap-2">
              <IconLifebuoy className="h-5 w-5" />
              Submit New Ticket
            </CardTitle>
            <CardDescription className="font-semibold text-foreground/80">
              Report new problem, billing issue, feature request, or account access issue.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6">
            <div className="space-y-2.5 rounded-2xl border bg-muted/20 p-4">
              {[
                "Create brand-new support request with ticket code sent to your email.",
                "Best for account issues, billing, bugs, or feature requests.",
                "No login needed.",
              ].map((point) => (
                <div key={point} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <IconPointFilled className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="leading-6">{point}</p>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/support/new">
                  Start New Ticket
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Existing Request</p>
            <CardTitle className="flex items-center gap-2">
              <IconKey className="h-5 w-5" />
              Open Existing Ticket
            </CardTitle>
            <CardDescription className="font-semibold text-foreground/80">
              Track ticket status, verify access code or OTP, then continue to secure conversation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-6">
            <div className="space-y-2.5 rounded-2xl border bg-muted/20 p-4">
              {[
                "Reopen conversation with ticket code plus access code or OTP.",
                "See status and continue file/message thread securely.",
                "Best when support already emailed you.",
              ].map((point) => (
                <div key={point} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <IconPointFilled className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="leading-6">{point}</p>
                </div>
              ))}
            </div>
            <div className="pt-2">
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/support/access">
                  Open Existing Ticket
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicSupportShell>
  );
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
          Loading support page...
        </div>
      }
    >
      <SupportChooserContent />
    </Suspense>
  );
}
