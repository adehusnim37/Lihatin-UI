"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconCircleCheck, IconLinkOff } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function UnsubscribedContent() {
  const searchParams = useSearchParams();
  const succeeded = searchParams.get("status") === "success";
  const category = searchParams.get("category");
  const categoryLabel =
    category === "weekly_summary"
      ? "weekly analytics summaries"
      : "promotional emails";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {succeeded ? (
            <IconCircleCheck className="mx-auto size-10 text-emerald-600" />
          ) : (
            <IconLinkOff className="mx-auto size-10 text-muted-foreground" />
          )}
          <CardTitle>
            {succeeded ? "You’re unsubscribed" : "Invalid unsubscribe link"}
          </CardTitle>
          <CardDescription>
            {succeeded
              ? `You will no longer receive ${categoryLabel}. Essential account and security emails will continue.`
              : "This link is invalid. Sign in to manage your email preferences."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/profile/me?tab=notifications">
              Manage notification preferences
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

export default function UnsubscribedPage() {
  return (
    <Suspense>
      <UnsubscribedContent />
    </Suspense>
  );
}
