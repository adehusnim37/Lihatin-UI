import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  if (isLoading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-3 sm:gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card gap-3 py-4 sm:gap-6 sm:py-6">
            <CardHeader className="px-3 sm:px-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-4 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-3 sm:gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card gap-3 py-4 sm:gap-6 sm:py-6">
        <CardHeader className="px-3 sm:px-6">
          <h2 className="text-sm text-muted-foreground">Total Links</h2>
          <CardTitle
            as="div"
            className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            {totalLinks.toLocaleString()}
          </CardTitle>
          <CardAction className="col-start-1 row-start-3 sm:col-start-2 sm:row-start-1">
            <Badge variant="outline">
              {activeLinks > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {activeLinks} Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 px-3 text-xs sm:gap-1.5 sm:px-6 sm:text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {activeLinks} active short links
          </div>
          <div className="text-muted-foreground">Total short links created</div>
        </CardFooter>
      </Card>
      <Card className="@container/card gap-3 py-4 sm:gap-6 sm:py-6">
        <CardHeader className="px-3 sm:px-6">
          <h2 className="text-sm text-muted-foreground">Total Clicks</h2>
          <CardTitle
            as="div"
            className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            {totalClicks.toLocaleString()}
          </CardTitle>
          <CardAction className="col-start-1 row-start-3 sm:col-start-2 sm:row-start-1">
            <Badge variant="outline">
              {clicksLast24h > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {clicksLast24h} today
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 px-3 text-xs sm:gap-1.5 sm:px-6 sm:text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {clicksLast24h} clicks in last 24h{" "}
            {clicksLast24h > 0 && <IconTrendingUp className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {uniqueVisitors.toLocaleString()} unique visitors
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card gap-3 py-4 sm:gap-6 sm:py-6">
        <CardHeader className="px-3 sm:px-6">
          <h2 className="text-sm text-muted-foreground">Activity Logs</h2>
          <CardTitle
            as="div"
            className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            {totalLogs.toLocaleString()}
          </CardTitle>
          <CardAction className="col-start-1 row-start-3 sm:col-start-2 sm:row-start-1">
            <Badge variant="outline">
              <IconTrendingUp />
              All Time
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 px-3 text-xs sm:gap-1.5 sm:px-6 sm:text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Total API activity tracked</div>
          <div className="text-muted-foreground">System-wide request logs</div>
        </CardFooter>
      </Card>
      <Card className="@container/card gap-3 py-4 sm:gap-6 sm:py-6">
        <CardHeader className="px-3 sm:px-6">
          <h2 className="text-sm text-muted-foreground">Recent Activity</h2>
          <CardTitle
            as="div"
            className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
          >
            {recentActivityCount.toLocaleString()}
          </CardTitle>
          <CardAction className="col-start-1 row-start-3 sm:col-start-2 sm:row-start-1">
            <Badge variant="outline">
              <IconTrendingUp />
              Last 7d
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 px-3 text-xs sm:gap-1.5 sm:px-6 sm:text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Recent security events</div>
          <div className="text-muted-foreground">Login attempts monitored</div>
        </CardFooter>
      </Card>
    </div>
  );
}
