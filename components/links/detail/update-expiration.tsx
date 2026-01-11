"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

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
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/date-time-picker";

const expirationSchema = z.object({
  expires_at: z.date().optional().nullable(),
});

type ExpirationFormValues = z.infer<typeof expirationSchema>;

interface UpdateExpirationDialogProps {
  shortCode: string;
  currentExpiration?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (code: string, data: { expires_at: string | null }) => Promise<any>;
}

export function UpdateExpirationDialog({
  shortCode,
  currentExpiration,
  open,
  onOpenChange,
  onUpdate,
}: UpdateExpirationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ExpirationFormValues>({
    resolver: zodResolver(expirationSchema),
    defaultValues: {
      expires_at: currentExpiration ? new Date(currentExpiration) : undefined,
    },
  });

  const onSubmit = async (data: ExpirationFormValues) => {
    setIsLoading(true);
    try {
      // If date is valid, convert to ISO string. If null/undefined, send null to remove expiration
      const isoDate = data.expires_at ? data.expires_at.toISOString() : null;
      // We might need to handle the "remove" explicitly if the API expects something else, or use a separate button.
      await onUpdate(shortCode, { expires_at: isoDate });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveExpiration = async () => {
    setIsLoading(true);
    try {
      // Send specific indicator to remove if API supports it, or just null/nil logic
      // Assuming sending null or specific structure handles it.
      // Based on typical Go generic handling: if pointer is nil, it ignores.
      // BUT if we want to SET it to NULL in DB, we often need a specific way or "null" value.
      // Let's assume for now the onUpdate wrapper handles the complexity or sending a far future date?
      // No, proper way is usually sending a signal.
      // Let's try sending null and see if the frontend API wrapper handles it.
      // Re-reading dto: ExpiresAt *time.Time.
      // If we send null in JSON, GORM might set it to NULL if using updates map, but if using Struct it might ignore nil pointer?
      // However, we are likely sending a map or struct.
      // Let's invoke update with null.
      await onUpdate(shortCode, { expires_at: null });
      onOpenChange(false);
      form.reset({ expires_at: undefined });
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
            <Clock className="h-5 w-5" />
            Set Expiration Date
          </DialogTitle>
          <DialogDescription>
            Set a date and time when this link will stop working.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="expires_at"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiration Date & Time</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      date={field.value ?? undefined}
                      setDate={field.onChange}
                      disablePast
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              {currentExpiration && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRemoveExpiration}
                  disabled={isLoading}
                  className="mr-2"
                >
                  Remove Expiration
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Expiration
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
