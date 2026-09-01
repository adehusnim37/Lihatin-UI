import {
  IconClock,
  IconInfoCircle,
  IconMail,
  IconShieldLock,
  IconTicket,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PublicSupportInfoCard({
  className,
}: {
  className?: string;
}) {
  const items = [
    {
      icon: IconClock,
      label: "Estimated response",
      value: "Within one business day",
    },
    {
      icon: IconTicket,
      label: "Support hours",
      value: "Mon–Fri, 09:00–18:00 WIB",
    },
    {
      icon: IconMail,
      label: "Support email",
      value: "support@lihat.in",
    },
    {
      icon: IconShieldLock,
      label: "Secure access",
      value: "Links and OTP go only to the ticket email",
    },
  ];

  return (
    <Card
      className={[
        "min-w-0 gap-4 border-primary/20 bg-primary/[0.03] py-5 shadow-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CardHeader className="gap-1.5 px-5">
        <Badge
          variant="outline"
          className="mb-1 border-primary/25 bg-primary/5 text-primary"
        >
          <IconInfoCircle />
          Good to know
        </Badge>
        <CardTitle className="text-base">Support information</CardTitle>
        <CardDescription>
          What to expect when contacting the support team.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-x-6 gap-y-4 px-5 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="flex min-w-0 items-start gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 text-sm">
                <p className="text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 font-medium leading-5">{item.value}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
