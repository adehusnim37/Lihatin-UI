"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface DeactivateLinkProps {
  shortCode: string;
  onDeactivate: (code: string) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeactivateLink({
  shortCode,
  onDeactivate,
  open,
  onOpenChange,
}: DeactivateLinkProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDeactivate = async () => {
    setIsLoading(true);
    try {
      await onDeactivate(shortCode);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to deactivate link:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate Link</DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate this link? The link will no
            longer redirect visitors to the original URL.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDeactivate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deactivating...
              </>
            ) : (
              "Deactivate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
