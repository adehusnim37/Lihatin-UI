import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { TabsContent } from "@radix-ui/react-tabs";
import { IconChevronDown, IconKey, IconShield } from "@tabler/icons-react";
import { Label } from "recharts";
import ChangePasswordDialog from "../changePassword";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function ProfileSecurityTab() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSessionOpen, setIsSessionOpen] = useState(false);

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const ProfileAuth = {
    last_ip: "212/58.246.79",
    last_login_at: "2024-06-10T14:23:45Z",
    last_logout_at: "2024-06-10T16:45:30Z",
  }
 
  return (
    <TabsContent value="security" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>
            Manage your password and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <IconKey className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Change Password</p>
                  <p className="text-xs text-muted-foreground">
                    Last changed 30 days ago
                  </p>
                </div>
              </div>
              <ChangePasswordDialog />
            </div>
          </div>
          {/* Collapsible Last Login Session */}
          <div className="space-y-2">
            <Label>Last Login Session</Label>
            <Collapsible
              open={isSessionOpen}
              onOpenChange={setIsSessionOpen}
              className="space-y-2"
            >
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3 flex-1">
                  <IconShield className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Session Information</p>
                    <p className="text-xs text-muted-foreground">
                      Click to view details
                    </p>
                  </div>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <IconChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isSessionOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="space-y-2">
                <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Last IP Address
                    </span>
                    <span className="text-sm font-medium font-mono">
                      {ProfileAuth.last_ip}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Last Login
                    </span>
                    <span className="text-sm font-medium">
                      {formatDateTime(ProfileAuth.last_login_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Last Logout
                    </span>
                    <span className="text-sm font-medium">
                      {formatDateTime(ProfileAuth.last_logout_at)}
                    </span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          <div className="space-y-2">
            <Label>Two-Factor Authentication</Label>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <IconShield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">2FA Status</p>
                  <p className="text-xs text-muted-foreground">Not enabled</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
