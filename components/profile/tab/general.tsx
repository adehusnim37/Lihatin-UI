"use client";

import { useState, useEffect } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  IconUser, IconMail, IconCalendar, IconShield, IconPencil, IconCheck, IconX, IconAt,
} from "@tabler/icons-react";
import ChangeEmailModal from "../modal/changeEmail";
import ChangeUsernameModal from "../modal/changeUsername";
import type { AuthProfileData } from "@/lib/api/auth";

export function ProfileGeneralTab({
  user,
  formatDate,
  onEmailChanged,
  onUsernameChanged,
  onSaveName,
}: {
  user: AuthProfileData["user"];
  formatDate: (dateString: string) => string;
  onEmailChanged?: () => void;
  onUsernameChanged?: () => void;
  onSaveName?: (firstName: string, lastName: string) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [isSavingNames, setIsSavingNames] = useState(false);
  const [isChangeUsernameOpen, setIsChangeUsernameOpen] = useState(false);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);

  useEffect(() => {
    setFirstName(user?.first_name || "");
    setLastName(user?.last_name || "");
  }, [user?.first_name, user?.last_name]);

  const hasNameChanged = firstName !== user?.first_name || lastName !== user?.last_name;

  const handleSaveName = async () => {
    if (!hasNameChanged || !onSaveName) return;
    setIsSavingNames(true);
    try {
      await onSaveName(firstName.trim(), lastName.trim());
    } finally {
      setIsSavingNames(false);
    }
  };

  return (
    <TabsContent value="general" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="flex items-center gap-1.5">
                  <IconUser className="h-3.5 w-3.5 text-muted-foreground" />
                  First Name
                </Label>
                <Input
                  id="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="flex items-center gap-1.5">
                  <IconUser className="h-3.5 w-3.5 text-muted-foreground" />
                  Last Name
                </Label>
                <Input
                  id="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <IconAt className="h-3.5 w-3.5 text-muted-foreground" />
                Username
              </Label>
              <div className="flex items-center gap-2">
                <Input value={user.username} disabled readOnly className="flex-1" />
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => setIsChangeUsernameOpen(true)}>
                  <IconPencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <IconMail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address
              </Label>
              <div className="flex items-center gap-2">
                <Input value={user.email} disabled readOnly className="flex-1" />
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => setIsChangeEmailOpen(true)}>
                  <IconPencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {hasNameChanged && (
              <>
                <Separator />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFirstName(user?.first_name || "");
                      setLastName(user?.last_name || "");
                    }}
                  >
                    <IconX className="mr-1.5 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveName} disabled={isSavingNames}>
                    <IconCheck className="mr-1.5 h-4 w-4" />
                    {isSavingNames ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>View your account status and details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <IconCalendar className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Joined</p>
                  <p className="text-xs text-muted-foreground">{formatDate(user.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <IconShield className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Account ID</p>
                  <p className="text-xs text-muted-foreground font-mono">{user.id}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChangeUsernameModal
        currentUsername={user.username}
        onUsernameChanged={onUsernameChanged}
        open={isChangeUsernameOpen}
        onOpenChange={setIsChangeUsernameOpen}
      />
      <ChangeEmailModal
        currentEmail={user.email}
        onEmailChanged={onEmailChanged}
        open={isChangeEmailOpen}
        onOpenChange={setIsChangeEmailOpen}
      />
    </TabsContent>
  );
}
