import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
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
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Links</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalLinks.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {activeLinks > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {activeLinks} Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {activeLinks} active short links
          </div>
          <div className="text-muted-foreground">
            Total short links created
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Clicks</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalClicks.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {clicksLast24h > 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {clicksLast24h} today
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {clicksLast24h} clicks in last 24h {clicksLast24h > 0 && <IconTrendingUp className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {uniqueVisitors.toLocaleString()} unique visitors
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Activity Logs</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalLogs.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              All Time
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total API activity tracked
          </div>
          <div className="text-muted-foreground">System-wide request logs</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Recent Activity</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {recentActivityCount.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Last 7d
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Recent security events
          </div>
          <div className="text-muted-foreground">Login attempts monitored</div>
        </CardFooter>
      </Card>
    </div>
  )
}
