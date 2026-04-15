"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useRemovePasscode } from "@/lib/hooks/queries/useLinksQuery";
import { hasRepeatedConsecutiveDigits } from "@/lib/validators/passcode";

const passcodeSchema = z.object({
  passcode: z
    .string()
    .length(6, "Passcode must be exactly 6 digits")
    .regex(/^\d+$/, "Passcode must contain only numbers")
    .refine((value) => !hasRepeatedConsecutiveDigits(value), {
      message: "Passcode cannot contain 4 or more repeated digits in a row",
    }),
});

type PasscodeFormValues = z.infer<typeof passcodeSchema>;

interface UpdatePasscodeDialogProps {
  shortCode: string;
  currentPasscode?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (code: string, data: { passcode: string }) => Promise<unknown>;
}

export function UpdatePasscodeDialog({
  shortCode,
  currentPasscode,
  open,
  onOpenChange,
  onUpdate,
}: UpdatePasscodeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const removePasscodeMutation = useRemovePasscode();

  const form = useForm<PasscodeFormValues>({
    resolver: zodResolver(passcodeSchema),
    defaultValues: {
      passcode: currentPasscode || "",
    },
  });

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        form.setFocus("passcode");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, form]);

  const onSubmit = async (data: PasscodeFormValues) => {
    setIsLoading(true);
    try {
      await onUpdate(shortCode, { passcode: data.passcode });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePasscode = async () => {
    setIsLoading(true);
    try {
      await removePasscodeMutation.mutateAsync(shortCode);
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
            <Lock className="h-5 w-5" />
            Set Passcode
          </DialogTitle>
          <DialogDescription>
            Protect your link with a 6-digit numeric passcode. Users will need
            to enter this code to access the link.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="passcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passcode (6 Digits)</FormLabel>
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      autoFocus
                      className="w-full"
                      containerClassName="mx-auto w-full max-w-[21rem] justify-center overflow-hidden"
                    >
                      <InputOTPGroup className="w-full gap-1.5 sm:gap-2">
                        <InputOTPSlot index={0} className="w-auto min-w-0 flex-1 max-w-[2.75rem] h-10 sm:h-11 rounded-md border border-border bg-muted/20 text-base font-semibold" />
                        <InputOTPSlot index={1} className="w-auto min-w-0 flex-1 max-w-[2.75rem] h-10 sm:h-11 rounded-md border border-border bg-muted/20 text-base font-semibold" />
                        <InputOTPSlot index={2} className="w-auto min-w-0 flex-1 max-w-[2.75rem] h-10 sm:h-11 rounded-md border border-border bg-muted/20 text-base font-semibold" />
                        <InputOTPSlot index={3} className="w-auto min-w-0 flex-1 max-w-[2.75rem] h-10 sm:h-11 rounded-md border border-border bg-muted/20 text-base font-semibold" />
                        <InputOTPSlot index={4} className="w-auto min-w-0 flex-1 max-w-[2.75rem] h-10 sm:h-11 rounded-md border border-border bg-muted/20 text-base font-semibold" />
                        <InputOTPSlot index={5} className="w-auto min-w-0 flex-1 max-w-[2.75rem] h-10 sm:h-11 rounded-md border border-border bg-muted/20 text-base font-semibold" />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormDescription>
                    Only numbers are allowed. exactly 6 digits.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              {currentPasscode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRemovePasscode}
                  disabled={isLoading}
                  className="mr-2"
                >
                  Remove Passcode
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Passcode
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
