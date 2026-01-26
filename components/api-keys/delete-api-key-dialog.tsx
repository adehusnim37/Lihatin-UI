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
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import { revokeAPIKey, APIKeyResponse } from "@/lib/api/api-keys";
import { toast } from "sonner";

interface DeleteAPIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: APIKeyResponse;
  onSuccess?: () => void;
}

export function DeleteAPIKeyDialog({
  open,
  onOpenChange,
  apiKey,
  onSuccess,
}: DeleteAPIKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await revokeAPIKey(apiKey.id);

      if (response.success) {
        toast.success("API key deleted successfully");
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(response.message || "Failed to delete API key");
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete API Key</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete this API key?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                This action cannot be undone
              </p>
              <p className="text-xs text-muted-foreground">
                Any applications using this API key will immediately lose
                access.
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
              <p className="text-xs text-muted-foreground">Key Preview</p>
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
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
