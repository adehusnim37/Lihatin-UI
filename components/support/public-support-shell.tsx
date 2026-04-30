import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function PublicSupportShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Lihatin" width={40} height={40} />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Public Access</p>
                <h1 className="text-2xl font-semibold">{title}</h1>
                {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </div>
        </header>

        {children}

        <div className="text-center text-xs text-muted-foreground">
          Keep ticket code private. Support team will never ask your OTP or password.
        </div>
      </div>
    </div>
  );
}
