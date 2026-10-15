import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SectionCardsProps {
  totalLinks?: number;
  activeLinks?: number;
  totalClicks?: number;
  clicksLast24h?: number;
  clicksLast7d?: number;
  uniqueVisitors?: number;
  totalLogs?: number;
  recentActivityCount?: number;
  isLoading?: boolean;
}

export function SectionCards({
  totalLinks = 0,
  activeLinks = 0,
  totalClicks = 0,
  clicksLast24h = 0,
  uniqueVisitors = 0,
  totalLogs = 0,
  recentActivityCount = 0,
  isLoading = false,
}: SectionCardsProps) {
  const stats = [
    {
      label: "Total Links",
      value: totalLinks,
      detail: `${activeLinks.toLocaleString()} active links`,
      description: "Total short links created",
    },
    {
      label: "Total Clicks",
      value: totalClicks,
      detail: `${clicksLast24h.toLocaleString()} in the last 24h`,
      description: `${uniqueVisitors.toLocaleString()} unique visitors`,
    },
    {
      label: "Activity Logs",
      value: totalLogs,
      detail: "All-time API activity",
      description: "System-wide request logs",
    },
    {
      label: "Recent Activity",
      value: recentActivityCount,
      detail: "Security events · Last 7d",
      description: "Login attempts monitored",
    },
  ];

  return (
    <section
      aria-label="Dashboard statistics"
      className="grid min-w-0 grid-cols-1 gap-3 px-4 min-[360px]:grid-cols-2 lg:px-6 @5xl/main:grid-cols-4"
    >
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="min-w-0 justify-between gap-4 px-4 py-4 shadow-none sm:px-5 sm:py-5"
        >
          {isLoading ? (
            <div
              role="status"
              aria-label={`Loading ${stat.label.toLowerCase()}`}
              className="space-y-3"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-sm text-muted-foreground">{stat.label}</h2>
                <p className="text-2xl font-semibold leading-tight tracking-tight tabular-nums [overflow-wrap:anywhere] sm:text-3xl">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium leading-5 sm:text-sm">{stat.detail}</p>
                <p className="text-xs leading-5 text-muted-foreground">{stat.description}</p>
              </div>
            </>
          )}
        </Card>
      ))}
    </section>
  );
}
