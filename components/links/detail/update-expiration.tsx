"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Loader2 } from "lucide-react";

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
  onUpdate: (
    code: string,
    data: { expires_at: string | null },
  ) => Promise<unknown>;
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
      const isoDate = data.expires_at ? data.expires_at.toISOString() : null;
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
            <Clock className="size-5" />
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
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save Expiration
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
