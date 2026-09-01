import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function PublicSupportShell({
  title,
  description,
  children,
  centered = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  centered?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50/70">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/support" className="flex min-w-0 items-center gap-2.5">
            <Image src="/logo.svg" alt="Lihatin" width={32} height={32} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Lihatin Support</p>
              <p className="text-xs text-muted-foreground">
                Public help center
              </p>
            </div>
          </Link>

          <nav
            className="flex items-center gap-1"
            aria-label="Support navigation"
          >
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/support/new">New ticket</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/support/access">Track ticket</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div
          className={
            centered ? "mx-auto mb-7 max-w-xl text-center" : "mb-7 max-w-2xl"
          }
        >
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Customer support
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        {children}
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Keep your ticket code private.</p>
          <p>
            Lihatin Support will never ask for your password or OTP in chat.
          </p>
        </div>
      </footer>
    </div>
  );
}
