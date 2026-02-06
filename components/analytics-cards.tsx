import { IconDeviceDesktop, IconDeviceMobile, IconWorld, IconExternalLink } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

interface TopItem {
  [key: string]: string | number;
}

interface AnalyticsCardsProps {
  topCountries?: Array<{ country: string; count: number }>;
  topDevices?: Array<{ device: string; count: number }>;
  topReferrers?: Array<{ host: string; count: number }>;
  isLoading?: boolean;
  variant?: "grid" | "stack"; // grid for full-width, stack for vertical layout
}

export function AnalyticsCards({
  topCountries = [],
  topDevices = [],
  topReferrers = [],
  isLoading = false,
  variant = "grid",
}: AnalyticsCardsProps) {
  // Calculate totals for percentage
  const totalCountries = topCountries.reduce((sum, item) => sum + item.count, 0);
  const totalDevices = topDevices.reduce((sum, item) => sum + item.count, 0);
  const totalReferrers = topReferrers.reduce((sum, item) => sum + item.count, 0);

  const containerClass = variant === "stack" 
    ? "space-y-4" 
    : "grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3";

  if (isLoading) {
    return (
      <div className={containerClass}>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {/* Top Countries */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconWorld className="size-4" />
            Top Countries
          </CardTitle>
          <CardDescription className="text-xs">Traffic by location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCountries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              topCountries.slice(0, 5).map((item, index) => {
                const percentage = totalCountries > 0 ? (item.count / totalCountries) * 100 : 0;
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{item.country}</span>
                      <span className="text-muted-foreground text-xs ml-2 flex-shrink-0">
                        {item.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Devices */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconDeviceDesktop className="size-4" />
            Top Devices
          </CardTitle>
          <CardDescription className="text-xs">Traffic by device</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topDevices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              topDevices.slice(0, 5).map((item, index) => {
                const percentage = totalDevices > 0 ? (item.count / totalDevices) * 100 : 0;
                const Icon = item.device === "Desktop" ? IconDeviceDesktop : IconDeviceMobile;
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium truncate">
                        <Icon className="size-3.5 flex-shrink-0" />
                        {item.device}
                      </span>
                      <span className="text-muted-foreground text-xs ml-2 flex-shrink-0">
                        {item.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Referrers */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconExternalLink className="size-4" />
            Top Referrers
          </CardTitle>
          <CardDescription className="text-xs">Traffic sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topReferrers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              topReferrers.slice(0, 5).map((item, index) => {
                const percentage = totalReferrers > 0 ? (item.count / totalReferrers) * 100 : 0;
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm gap-2">
                      <span className="font-medium truncate flex-1 min-w-0">{item.host}</span>
                      <span className="text-muted-foreground text-xs flex-shrink-0">
                        {item.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
