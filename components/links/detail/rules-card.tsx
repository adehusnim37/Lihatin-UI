"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Clock, Globe, Settings, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdateExpirationDialog } from "@/components/links/detail/update-expiration";
import { DetailLink } from "@/lib/api/shortlinks"; // Assuming type location

interface RulesCardProps {
  shortCode: string;
  expiresAt: string | null;
  detail?: DetailLink;
  onUpdateExpiration: (
    code: string,
    data: { expires_at: string | null }
  ) => Promise<void>;
  className?: string; // Allow passing height classes
}

export function RulesCard({
  shortCode,
  expiresAt,
  detail,
  onUpdateExpiration,
  className,
}: RulesCardProps) {
  const [showExpiryDialog, setShowExpiryDialog] = useState(false);

  return (
    <Card className={className}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Rules</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => setShowExpiryDialog(true)}
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Expiration Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> Expiration
          </div>
          <div className="text-right">
            {expiresAt ? (
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium">
                  {format(new Date(expiresAt), "MMM d, yyyy")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(expiresAt), "HH:mm")}
                </span>
              </div>
            ) : (
              <Badge
                variant="outline"
                className="text-muted-foreground font-normal"
              >
                Never
              </Badge>
            )}
          </div>
        </div>

        {/* Custom Domain */}
        <div className="flex items-center justify-between border-t border-dashed pt-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" /> Domain
          </div>
          {detail?.custom_domain ? (
            <span
              className="text-sm font-medium text-blue-600 truncate max-w-[120px]"
              title={detail.custom_domain}
            >
              {detail.custom_domain}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground/60 italic flex items-center gap-1">
              Default
            </span>
          )}
        </div>

        <UpdateExpirationDialog
          open={showExpiryDialog}
          onOpenChange={setShowExpiryDialog}
          shortCode={shortCode}
          currentExpiration={expiresAt}
          onUpdate={onUpdateExpiration}
        />
      </CardContent>
    </Card>
  );
}
