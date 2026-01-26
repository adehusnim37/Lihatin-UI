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
import { Loader2, Pencil } from "lucide-react";
import {
  updateAPIKey,
  APIKeyResponse,
  UpdateAPIKeyRequest,
} from "@/lib/api/api-keys";
import { toast } from "sonner";

const editAPIKeySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  permissions: z
    .array(z.enum(["read", "write", "delete", "update"]))
    .min(1, "Select at least one permission"),
  limit_usage: z.number().min(0).optional().nullable(),
});

type FormData = z.infer<typeof editAPIKeySchema>;

interface EditAPIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: APIKeyResponse;
  onSuccess?: () => void;
}

const PERMISSIONS = [
  { id: "read", label: "Read", description: "View data" },
  { id: "write", label: "Write", description: "Create data" },
  { id: "update", label: "Update", description: "Modify data" },
  { id: "delete", label: "Delete", description: "Remove data" },
] as const;

export function EditAPIKeyDialog({
  open,
  onOpenChange,
  apiKey,
  onSuccess,
}: EditAPIKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(editAPIKeySchema),
    defaultValues: {
      name: apiKey.name,
      permissions: apiKey.permissions as (
        | "read"
        | "write"
        | "delete"
        | "update"
      )[],
      limit_usage: apiKey.limit_usage ?? null,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const updateData: UpdateAPIKeyRequest = {
        name: data.name,
        permissions: data.permissions,
        limit_usage: data.limit_usage ?? undefined,
      };

      const response = await updateAPIKey(apiKey.id, updateData);

      if (response.success) {
        toast.success("API key updated successfully");
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(response.message || "Failed to update API key");
      }
    } catch (error) {
      console.error("Error updating API key:", error);
      toast.error("Failed to update API key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Pencil className="h-5 w-5 text-blue-500" />
            </div>
            <DialogTitle>Edit API Key</DialogTitle>
          </div>
          <DialogDescription>
            Update the settings for this API key.
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
