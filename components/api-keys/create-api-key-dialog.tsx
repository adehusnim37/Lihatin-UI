"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Key,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  Ban,
} from "lucide-react";
import { createAPIKey, CreateAPIKeyResponse } from "@/lib/api/api-keys";
import { toast } from "sonner";

// Validation schema
const createAPIKeySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  permissions: z
    .array(z.enum(["read", "write", "delete", "update"]))
    .min(1, "Select at least one permission"),
  limit_usage: z.number().min(0).optional().nullable(),
  ip_mode: z.enum(["none", "allowlist", "blocklist"]),
  ip_list: z.string().optional(),
});

type FormData = z.infer<typeof createAPIKeySchema>;

interface CreateAPIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PERMISSIONS = [
  { id: "read", label: "Read", description: "View data" },
  { id: "write", label: "Write", description: "Create data" },
  { id: "update", label: "Update", description: "Modify data" },
  { id: "delete", label: "Delete", description: "Remove data" },
] as const;

export function CreateAPIKeyDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateAPIKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreateAPIKeyResponse | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(createAPIKeySchema),
    defaultValues: {
      name: "",
      permissions: ["read"],
      limit_usage: null,
      ip_mode: "none",
      ip_list: "",
    },
  });

  const handleCopyKey = async () => {
    if (createdKey?.key) {
      await navigator.clipboard.writeText(createdKey.key);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    if (createdKey) {
      // Reset form and state when closing after success
      form.reset();
      setCreatedKey(null);
      setCopied(false);
    }
    onOpenChange(false);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Parse IPs from comma-separated string based on mode
      const parsedIPs = data.ip_list
        ? data.ip_list
            .split(",")
            .map((ip) => ip.trim())
            .filter(Boolean)
        : undefined;

      const response = await createAPIKey({
        name: data.name,
        permissions: data.permissions,
        limit_usage: data.limit_usage ?? undefined,
        blocked_ips: data.ip_mode === "blocklist" ? parsedIPs : undefined,
        allowed_ips: data.ip_mode === "allowlist" ? parsedIPs : undefined,
        is_active: true,
      });

      if (response.success && response.data) {
        setCreatedKey(response.data);
        toast.success("API key created successfully!");
        onSuccess?.();
      } else {
        toast.error(response.message || "Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Failed to create API key");
    } finally {
      setIsLoading(false);
    }
  };

  // Success view - showing the created key
  if (createdKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Key className="h-5 w-5 text-green-500" />
              </div>
              <DialogTitle>API Key Created!</DialogTitle>
            </div>
            <DialogDescription>
              Your API key has been created successfully. Make sure to copy it
              now.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Warning */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-500">
                  {createdKey.warning}
                </p>
                <p className="text-xs text-muted-foreground">
                  Store this key securely. You won&apos;t be able to see it
                  again.
                </p>
              </div>
            </div>

            {/* Key display */}
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2.5 rounded-md font-mono break-all border">
                  {createdKey.key}
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
                <p className="font-medium">{createdKey.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Permissions</p>
                <p className="font-medium capitalize">
                  {createdKey.permissions.join(", ")}
                </p>
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

  // Form view
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Key className="h-5 w-5 text-amber-500" />
            </div>
            <DialogTitle>Create API Key</DialogTitle>
          </div>
          <DialogDescription>
            Generate a new API key to access the Lihatin API.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="My API Key"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <Label>Permissions *</Label>
            <div className="grid grid-cols-2 gap-3">
              {PERMISSIONS.map((permission) => (
                <label
                  key={permission.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <Checkbox
                    checked={form.watch("permissions").includes(permission.id)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues("permissions");
                      if (checked) {
                        form.setValue("permissions", [
                          ...current,
                          permission.id,
                        ]);
                      } else {
                        form.setValue(
                          "permissions",
                          current.filter((p) => p !== permission.id),
                        );
                      }
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">{permission.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {permission.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {form.formState.errors.permissions && (
              <p className="text-xs text-destructive">
                {form.formState.errors.permissions.message}
              </p>
            )}
          </div>

          {/* Usage Limit */}
          <div className="space-y-2">
            <Label htmlFor="limit_usage">Usage Limit (optional)</Label>
            <Input
              id="limit_usage"
              type="number"
              min={0}
              placeholder="Unlimited"
              {...form.register("limit_usage", {
                setValueAs: (v) => (v === "" ? null : parseInt(v, 10)),
              })}
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of API calls. Leave empty for unlimited.
            </p>
          </div>

          {/* IP Restrictions */}
          <div className="space-y-3">
            <Label>IP Restrictions (optional)</Label>
            <Tabs
              value={form.watch("ip_mode")}
              onValueChange={(value) =>
                form.setValue(
                  "ip_mode",
                  value as "none" | "allowlist" | "blocklist",
                )
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="none" className="text-xs">
                  No Restriction
                </TabsTrigger>
                <TabsTrigger value="allowlist" className="text-xs gap-1">
                  <Shield className="h-3 w-3" />
                  Allow List
                </TabsTrigger>
                <TabsTrigger value="blocklist" className="text-xs gap-1">
                  <Ban className="h-3 w-3" />
                  Block List
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {form.watch("ip_mode") !== "none" && (
              <div className="space-y-2 pt-2">
                <Input
                  id="ip_list"
                  placeholder="192.168.1.1, 10.0.0.1"
                  {...form.register("ip_list")}
                />
                <p className="text-xs text-muted-foreground">
                  {form.watch("ip_mode") === "allowlist"
                    ? "Only these IPs can use this API key."
                    : "These IPs will be blocked from using this API key."}
                </p>
              </div>
            )}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create API Key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
