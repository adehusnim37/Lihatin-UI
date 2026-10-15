"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Camera, Eye, Loader2 } from "lucide-react";
import type { AuthProfileData } from "@/lib/api/auth";

export function ProfileOverview({
  user,
  avatarURL,
  verified,
  premium,
  uploading,
  joined,
  onUpload,
  onViewPhoto,
  onRedeem,
}: {
  user: AuthProfileData["user"];
  avatarURL: string;
  verified: boolean;
  premium: boolean;
  uploading: boolean;
  joined: string;
  onUpload: () => void;
  onViewPhoto: () => void;
  onRedeem: () => void;
}) {
  const name = `${user.first_name} ${user.last_name}`.trim() || user.username;
  return (
    <section aria-label="Account overview" className="min-w-0 rounded-xl border bg-muted/20 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
        <div className="flex min-w-0 flex-1 basis-72 items-center gap-4">
          <Avatar className="size-16 shrink-0 sm:size-18">
            <AvatarImage src={avatarURL} alt={name} />
            <AvatarFallback className="text-xl">
              {`${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase() ||
                user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-2">
            <h2 className="text-xl font-semibold tracking-tight [overflow-wrap:anywhere]">
              {name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
                @{user.username}
              </span>
              <StatusBadge tone={verified ? "success" : "warning"} withIcon={false}>
                {verified ? "Email verified" : "Email unverified"}
              </StatusBadge>
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                {premium ? "Premium" : "Free"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Member since {joined}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled={uploading} onClick={onUpload}>
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Camera className="size-4" />
              )}
              {uploading ? "Uploading…" : "Change photo"}
            </Button>
            {avatarURL && (
              <Button variant="ghost" size="sm" onClick={onViewPhoto}>
                <Eye className="size-4" />
                View photo
              </Button>
            )}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            JPG, PNG, WEBP or GIF · up to 5 MB
          </p>
        </div>
      </div>
      {!premium && (
        <Button className="mt-4" size="sm" variant="ghost" onClick={onRedeem}>
          Redeem premium code
        </Button>
      )}
    </section>
  );
}
