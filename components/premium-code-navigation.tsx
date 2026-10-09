import Link from "next/link";
import { cn } from "@/lib/utils";

export function PremiumCodeNavigation({ active }: { active: "usage" | "generate" }) {
  return (
    <nav aria-label="Premium codes" className="flex gap-1 border-b">
      {(
        [
          ["usage", "Usage", "/main/admin/premium-codes"],
          ["generate", "Generate", "/main/admin/premium-codes/generate"],
        ] as const
      ).map(([value, label, href]) => (
        <Link
          key={value}
          href={href}
          aria-current={active === value ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center border-b-2 px-4 text-sm font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            active === value
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
