"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ChangeEmailModal from "../modal/changeEmail";
import ChangeUsernameModal from "../modal/changeUsername";
import type { AuthProfileData } from "@/lib/api/auth";

export function ProfileGeneralTab({
  user,
  onEmailChanged,
  onUsernameChanged,
  onSaveName,
}: {
  user: AuthProfileData["user"];
  onEmailChanged?: () => void;
  onUsernameChanged?: () => void;
  onSaveName?: (firstName: string, lastName: string) => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [isSavingNames, setIsSavingNames] = useState(false);
  const [isChangeUsernameOpen, setIsChangeUsernameOpen] = useState(false);
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);

  const hasNameChanged =
    firstName.trim() !== user?.first_name || lastName.trim() !== user?.last_name;

  const handleSaveName = async () => {
    if (!hasNameChanged || !onSaveName) return;
    setIsSavingNames(true);
    try {
      await onSaveName(firstName.trim(), lastName.trim());
    } catch (error) {
      toast.error("Profile could not be saved", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSavingNames(false);
    }
  };

  return (
    <TabsContent value="general" className="min-w-0">
      <Card className="min-w-0 gap-5 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Personal information</CardTitle>
          <CardDescription>
            Manage how your name and contact details appear on your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 space-y-6">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveName();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  autoComplete="given-name"
                  disabled={isSavingNames}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  autoComplete="family-name"
                  disabled={isSavingNames}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="text-xs text-muted-foreground">
                {hasNameChanged ? "You have unsaved changes." : "Your profile is up to date."}
              </p>
              <div className="flex items-center gap-2">
                {hasNameChanged && (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSavingNames}
                    onClick={() => {
                      setFirstName(user.first_name || "");
                      setLastName(user.last_name || "");
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={!hasNameChanged || isSavingNames}>
                  {isSavingNames && <Loader2 className="size-4 animate-spin" />}
                  {isSavingNames ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          </form>
          <Separator />
          <section aria-labelledby="profile-contact-heading" className="space-y-4">
            <div>
              <h3 id="profile-contact-heading" className="text-sm font-semibold">
                Sign-in details
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Manage the username and email you use for your account.
              </p>
            </div>
            <dl className="divide-y">
              <div className="flex min-w-0 items-center justify-between gap-3 py-3">
                <div className="min-w-0 space-y-1">
                  <dt className="text-xs text-muted-foreground">Username</dt>
                  <dd className="text-sm font-medium [overflow-wrap:anywhere]">@{user.username}</dd>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Change username"
                  onClick={() => setIsChangeUsernameOpen(true)}
                >
                  Change
                </Button>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-3 py-3">
                <div className="min-w-0 space-y-1">
                  <dt className="text-xs text-muted-foreground">Email address</dt>
                  <dd className="text-sm font-medium [overflow-wrap:anywhere]">{user.email}</dd>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Change email address"
                  onClick={() => setIsChangeEmailOpen(true)}
                >
                  Change
                </Button>
              </div>
            </dl>
          </section>
          <section aria-labelledby="profile-account-heading" className="border-t pt-5">
            <h3 id="profile-account-heading" className="mb-3 text-sm font-semibold">
              Account information
            </h3>
            <dl className="text-sm">
              <div className="min-w-0 space-y-1">
                <dt className="text-xs text-muted-foreground">Account ID</dt>
                <dd className="font-mono text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]">
                  {user.id}
                </dd>
              </div>
            </dl>
          </section>
        </CardContent>
      </Card>

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
