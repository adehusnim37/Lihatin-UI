"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MousePointerClick, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { CounterInput } from "@/components/ui/counter-input";

const clickLimitSchema = z.object({
  enabled: z.boolean().default(false),
  limit: z.number().min(1, "Limit must be at least 1").optional(),
});

type ClickLimitFormValues = z.infer<typeof clickLimitSchema>;

interface UpdateClickLimitDialogProps {
  shortCode: string;
  currentLimit?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (
    code: string,
    data: { click_limit: number | null }
  ) => Promise<any>;
}

export function UpdateClickLimitDialog({
  shortCode,
  currentLimit,
  open,
  onOpenChange,
  onUpdate,
}: UpdateClickLimitDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ClickLimitFormValues>({
    resolver: zodResolver(clickLimitSchema),
    defaultValues: {
      enabled: !!(currentLimit && currentLimit > 0),
      limit: currentLimit && currentLimit > 0 ? currentLimit : 100,
    },
  });

  const isEnabled = form.watch("enabled");

  const onSubmit = async (data: ClickLimitFormValues) => {
    setIsLoading(true);
    try {
      // If enabled, send the limit. If disabled, send 0 (or null if backend prefers).
      // Based on UI logic (limit > 0), sending 0 likely means no limit.
      // API Interface allows null. Let's send 0 to align with "clickLimit > 0" check, or null.
      // Let's assume sending 0 removes the limit.
      const payload = data.enabled && data.limit ? data.limit : 0;
      await onUpdate(shortCode, { click_limit: payload });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MousePointerClick className="h-5 w-5" />
            Set Click Limit
          </DialogTitle>
          <DialogDescription>
            Limit the number of times this link can be visited.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Limit</FormLabel>
                    <FormDescription>
                      Restrict access after a specific number of clicks.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isEnabled && (
              <FormField
                control={form.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel>Maximum Clicks</FormLabel>
                      <span className="text-xs text-muted-foreground">
                        Target limit
                      </span>
                    </div>
                    <FormControl>
                      <CounterInput
                        min={1}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      Link will expire or show error after reaching this count.
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
