import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusBadgeTone = "success" | "info" | "warning" | "neutral" | "danger";

const toneClassNameMap: Record<StatusBadgeTone, string> = {
  success:
    "border-none bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5",
  info: "border-none bg-blue-600/10 text-blue-600 focus-visible:ring-blue-600/20 focus-visible:outline-none dark:bg-blue-400/10 dark:text-blue-400 dark:focus-visible:ring-blue-400/40 [a&]:hover:bg-blue-600/5 dark:[a&]:hover:bg-blue-400/5",
  warning:
    "border-none bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 focus-visible:outline-none dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40 [a&]:hover:bg-amber-600/5 dark:[a&]:hover:bg-amber-400/5",
  neutral:
    "border-none bg-slate-500/10 text-slate-500 focus-visible:ring-slate-500/20 focus-visible:outline-none dark:bg-slate-400/10 dark:text-slate-400 dark:focus-visible:ring-slate-400/40 [a&]:hover:bg-slate-500/5 dark:[a&]:hover:bg-slate-400/5",
  danger:
    "border-none bg-red-600/10 text-red-600 focus-visible:ring-red-600/20 focus-visible:outline-none dark:bg-red-400/10 dark:text-red-400 dark:focus-visible:ring-red-400/40 [a&]:hover:bg-red-600/5 dark:[a&]:hover:bg-red-400/5",
};

const toneDotClassMap: Record<StatusBadgeTone, string> = {
  success: "bg-green-600 dark:bg-green-400",
  info: "bg-blue-600 dark:bg-blue-400",
  warning: "bg-amber-600 dark:bg-amber-400",
  neutral: "bg-slate-500 dark:bg-slate-400",
  danger: "bg-red-600 dark:bg-red-400",
};

type BadgeProps = React.ComponentProps<typeof Badge>;

export type StatusBadgeProps = Omit<BadgeProps, "variant"> & {
  tone?: StatusBadgeTone;
  withIcon?: boolean;
};

export function StatusBadge({
  tone = "neutral",
  withIcon = true,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full font-medium tracking-normal",
        toneClassNameMap[tone],
        className
      )}
      {...props}
    >
      {withIcon ? (
        <span
          className={cn("size-1.5 rounded-full", toneDotClassMap[tone])}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </Badge>
  );
}
