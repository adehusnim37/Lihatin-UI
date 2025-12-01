import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface QuickCreateLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickCreateLinkDialog({
  open,
  onOpenChange,
}: QuickCreateLinkDialogProps) {
  const [linkName, setLinkName] = useState("");
  const [linkURL, setLinkURL] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [description, setDescription] = useState("");

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setLinkName("");
      setLinkURL("");
      setPasscode("");
      setDescription("");
    }
  }, [open]);

  const handleCreateLink = async () => {
    setIsSubmitting(true);
    try {
      // Call API to create link
      await createQuickLink({ name: linkName, url: linkURL });
      toast.success("Link Created", {
        description: "Your quick link has been created successfully.",
      });
      onOpenChange(false);
      // Optionally refresh links list or perform other actions
    } catch (error) {
      toast.error("Failed to Create Link", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Quick Link</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new quick link.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 w-full mt-4">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="link-name">Link Name</Label>
            <Input
              id="link-name"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="Enter link name"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <Label htmlFor="link-url">Link URL</Label>
            <Input
              id="link-url"
              value={linkURL}
              onChange={(e) => setLinkURL(e.target.value)}
              placeholder="Enter link URL"
            />
          </div>
          <div className="flex flex-col space-y-1">
            <Label>Passcode (Optional)</Label>
            <Input
              id="link-passcode"
              type="password"
              placeholder="Set a passcode for this link"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-1">
            <p className="text-sm text-muted-foreground">
              Note: Quick links are created instantly but can be edited or
              deleted later from your links dashboard.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreateLink}
            disabled={isSubmitting || !linkName || !linkURL}
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
            Create Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function createQuickLink(arg0: { name: string; url: string }) {
  throw new Error("Function not implemented.");
}
