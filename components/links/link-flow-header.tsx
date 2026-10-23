import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function LinkFlowHeader({ helpHref = "/support/new" }: { helpHref?: string }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
      <Link
        href="/"
        aria-label="Lihat.in home"
        className="inline-flex items-center gap-2.5 rounded-md font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Image src="/logo.svg" alt="" width={32} height={32} className="rounded-md" priority />
        <span>Lihat.in</span>
      </Link>
      <div className="flex items-center gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link href={helpHref}>Get help</Link>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
