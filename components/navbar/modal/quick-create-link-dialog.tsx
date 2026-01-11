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
import { useCreateLink } from "@/lib/hooks/queries/useLinksQuery";

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
  const [passcode, setPasscode] = useState<string>("");

  const createLinkMutation = useCreateLink();

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setLinkName("");
      setLinkURL("");
      setPasscode("");
    }
  }, [open]);

  const handleCreateLink = async () => {
    // Build request in correct format: { is_bulky: boolean, links: [...] }
    const requestData = {
      is_bulky: false,
      links: [
        {
          original_url: linkURL,
          title: linkName,
          passcode: passcode || undefined,
        },
      ],
    };

    createLinkMutation.mutate(requestData);
    onOpenChange(false);
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="123456"
              value={passcode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPasscode(value);
              }}
              maxLength={6}
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
            disabled={createLinkMutation.isPending || !linkName || !linkURL}
          >
            {createLinkMutation.isPending ? (
              <Loader2 className="animate-spin mr-2" />
            ) : null}
            Create Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
