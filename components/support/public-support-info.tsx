import Link from "next/link";
import {
  IconArrowRight,
  IconClock,
  IconMail,
  IconPointFilled,
  IconShieldLock,
  IconTicket,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PublicSupportInfoCard({
  title,
  introLabel,
  introTitle,
  introDescription,
  introPoints,
  ctaLabel,
  ctaHref,
  note,
  className,
}: {
  title?: string;
  introLabel?: string;
  introTitle?: string;
  introDescription?: string;
  introPoints?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  note?: string;
  className?: string;
}) {
  return (
    <Card className={["min-w-0 shadow-sm xl:min-h-[760px]", className].filter(Boolean).join(" ")}>
      <CardHeader className="">
        <CardTitle className="text-2xl">
          {title || (introTitle || introDescription || ctaLabel ? "Support Guide" : "Support Info")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex h-full flex-col space-y-5 px-5 pb-5 pt-0">
        {(introTitle || introDescription || (ctaLabel && ctaHref)) && (
          <div className="rounded-2xl border bg-gradient-to-br from-muted/30 via-background to-background p-5">
            {introLabel ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {introLabel}
              </p>
            ) : null}
            {introTitle ? <p className="mt-2 text-lg font-semibold text-foreground">{introTitle}</p> : null}
            {introDescription ? <p className="mt-3 text-sm leading-7 text-muted-foreground">{introDescription}</p> : null}
            {introPoints?.length ? (
              <div className="mt-4 space-y-2.5">
                {introPoints.map((point) => (
                  <div key={point} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <IconPointFilled className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
                    <p className="leading-6">{point}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {ctaLabel && ctaHref ? (
              <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
                <Link href={ctaHref}>
                  {ctaLabel}
                  <IconArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Support Info</p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 rounded-xl border bg-background px-4 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <IconClock className="h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estimated Response</p>
                <p className="mt-0.5 text-sm font-semibold">Within 24 hours (business day)</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border bg-background px-4 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <IconTicket className="h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Support Hours</p>
                <p className="mt-0.5 text-sm font-semibold">Mon - Fri, 09:00 - 18:00 WIB</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border bg-background px-4 py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <IconMail className="h-[18px] w-[18px]" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email Fallback</p>
                <p className="mt-0.5 text-sm font-semibold">support@lihat.in</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto rounded-2xl border bg-muted/20 px-4 py-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconShieldLock className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Security Note</p>
              <p className="mt-1 text-sm leading-6 text-foreground/80">
                {note || "Support team will never ask your password or OTP code in chat."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
