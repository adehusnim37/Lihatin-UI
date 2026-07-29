"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconMailOff } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/v1";

function UnsubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const category = searchParams.get("category");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const categoryLabel =
    category === "weekly_summary"
      ? "weekly analytics summaries"
      : "promotional emails";

  const unsubscribe = async () => {
    if (!token) {
      setError("This unsubscribe link is invalid.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/notifications/unsubscribe?token=${encodeURIComponent(token)}`,
        { method: "POST" },
      );
      if (!response.ok) {
        throw new Error("The unsubscribe link is invalid or expired.");
      }
      router.replace(
        `/email-preferences/unsubscribed?status=success&category=${encodeURIComponent(category || "promotional")}`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to unsubscribe. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <IconMailOff className="mx-auto size-10 text-muted-foreground" />
          <CardTitle>Unsubscribe from email?</CardTitle>
          <CardDescription>
            Confirm that you no longer want to receive {categoryLabel}.
            Essential account and security emails will continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : null}
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            variant="destructive"
            className="w-full"
            disabled={isSubmitting || !token}
            onClick={() => void unsubscribe()}
          >
            {isSubmitting ? "Unsubscribing…" : "Confirm unsubscribe"}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Keep my subscription</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}
