"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  AlertTriangle,
  Copy,
  Check,
  Key,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  refreshAPIKey,
  APIKeyResponse,
  APIKeyRefreshResponse,
} from "@/lib/api/api-keys";
import { toast } from "sonner";

interface RefreshAPIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: APIKeyResponse;
  onSuccess?: () => void;
}

export function RefreshAPIKeyDialog({
  open,
  onOpenChange,
  apiKey,
  onSuccess,
}: RefreshAPIKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [refreshedKey, setRefreshedKey] =
    useState<APIKeyRefreshResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await refreshAPIKey(apiKey.id);

      if (response.success && response.data) {
        setRefreshedKey(response.data);
        toast.success("API key regenerated successfully");
        onSuccess?.();
      } else {
        toast.error(response.message || "Failed to regenerate API key");
      }
    } catch (error) {
      console.error("Error regenerating API key:", error);
      toast.error("Failed to regenerate API key");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = async () => {
    if (refreshedKey?.secret.full_api_key) {
      await navigator.clipboard.writeText(refreshedKey.secret.full_api_key);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setRefreshedKey(null);
    setCopied(false);
    onOpenChange(false);
  };

  // Success view - showing the new key
  if (refreshedKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Key className="h-5 w-5 text-green-500" />
              </div>
              <DialogTitle>New API Key Generated!</DialogTitle>
            </div>
            <DialogDescription>
              Your API key has been regenerated. Make sure to copy it now.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Warning */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-500">
                  {refreshedKey.secret.warning}
                </p>
                <p className="text-xs text-muted-foreground">
                  The old key has been invalidated and will no longer work.
                </p>
              </div>
            </div>

            {/* Key display */}
            <div className="space-y-2">
              <Label>New API Key</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2.5 rounded-md font-mono break-all border">
                  {refreshedKey.secret.full_api_key}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyKey}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Key info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{refreshedKey.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Expires In</p>
                <p className="font-medium">{refreshedKey.secret.expires_in}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose} className="w-full sm:w-auto">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Confirmation view
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <RefreshCw className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle>Regenerate API Key</DialogTitle>
          </div>
          <DialogDescription>
            Generate a new secret for this API key?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-500">
                This will invalidate the current key
              </p>
              <p className="text-xs text-muted-foreground">
                Any applications using the current key will need to be updated
                with the new key.
              </p>
            </div>
          </div>

          {/* Key info */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{apiKey.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Current Key Preview
              </p>
              <code className="text-sm bg-muted px-2 py-0.5 rounded font-mono">
                {apiKey.key_preview}
              </code>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleRefresh} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Regenerate Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
