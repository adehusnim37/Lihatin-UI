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

interface ActivateLinkProps {
  shortCode: string;
  onActivate: (code: string) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ActivateLink({
  shortCode,
  onActivate,
  open,
  onOpenChange,
}: ActivateLinkProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleActivate = async () => {
    setIsLoading(true);
    try {
      await onActivate(shortCode);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to activate link:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activate Link</DialogTitle>
          <DialogDescription>
            Are you sure you want to activate this link? The link will start
            redirecting visitors to the original URL.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleActivate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activating...
              </>
            ) : (
              "Activate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
