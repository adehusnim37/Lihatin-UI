"use client";

import { useState } from "react";
import {
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { hasRepeatedConsecutiveDigits } from "@/lib/validators/passcode";

import {
  useUpdateLink,
  useRemovePasscode,
} from "@/lib/hooks/queries/useLinksQuery"; // Assuming hooks are available
import { toast } from "sonner";

// Schema
const passcodeSchema = z.object({
  passcode: z
    .string()
    .length(6, "Passcode must be exactly 6 digits")
    .regex(/^\d+$/, "Numbers only")
    .refine((value) => !hasRepeatedConsecutiveDigits(value), {
      message: "Passcode cannot contain 4 or more repeated digits in a row",
    }),
});

interface SettingsSecurityProps {
  shortCode: string;
  currentPasscode?: string | null;
  expiresAt?: string | null;
  className?: string;
}

export function SettingsSecurity({
  shortCode,
  currentPasscode,
  className,
}: SettingsSecurityProps) {
  // We treat this as two separate sections: Passcode and Expiration

  return (
    <PasscodeSection
      shortCode={shortCode}
      currentPasscode={currentPasscode}
      className={className}
    />
  );
}

function PasscodeSection({
  shortCode,
  currentPasscode,
  className,
}: {
  shortCode: string;
  currentPasscode?: string | null;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateLink();
  const removeMutation = useRemovePasscode();

  const form = useForm<z.infer<typeof passcodeSchema>>({
    resolver: zodResolver(passcodeSchema),
    defaultValues: { passcode: currentPasscode || "" },
  });

  const onSubmit = async (values: z.infer<typeof passcodeSchema>) => {
    try {
      await updateMutation.mutateAsync({
        code: shortCode,
        data: { passcode: values.passcode },
      });
      setIsEditing(false);
      toast.success("Passcode updated successfully");
    } catch {
      // Toast handled by hook usually
    }
  };

  const handleRemove = async () => {
    try {
      await removeMutation.mutateAsync(shortCode);
      form.reset({ passcode: "" });
      toast.success("Passcode removed");
    } catch {}
  };

  const hasPasscode = !!currentPasscode && currentPasscode !== "0";
  const passcodeValue = form.watch("passcode");
  const slotClassName =
    "w-auto min-w-0 flex-1 max-w-[2.85rem] h-10 sm:h-12 rounded-md border border-border bg-muted/20 text-base sm:text-lg font-semibold";

  return (
    <Card
      className={cn(
        "h-full flex flex-col relative overflow-hidden group",
        className
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary"
        >
          <path
            d="M35 35V25C35 16.7157 41.7157 10 50 10C58.2843 10 65 16.7157 65 25V35"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <rect
            x="20"
            y="35"
            width="60"
            height="50"
            rx="5"
            fill="currentColor"
            fillOpacity="0.2"
            stroke="currentColor"
            strokeWidth="4"
          />
          <circle cx="50" cy="60" r="8" fill="currentColor" />
        </svg>
      </div>
      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-base">Passcode</CardTitle>
            <CardDescription className="text-xs">
              Restrict access with a PIN.
            </CardDescription>
          </div>
          {hasPasscode && !isEditing && (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-1 rounded-md border border-green-200">
                Active
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col relative z-10">
        {!isEditing ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-2 rounded-lg border border-dashed p-3 bg-muted/30 backdrop-blur-sm transition-all hover:bg-muted/50">
            {hasPasscode ? (
              <>
                <div className="bg-primary/10 p-2 rounded-full mb-0.5">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div className="text-center space-y-1.5 w-full">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-sm font-medium">Link Locked</span>
                  </div>
                  <div className="flex justify-center gap-1 opacity-50">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-foreground"
                      />
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 h-7 text-xs w-full max-w-[110px]"
                  onClick={() => setIsEditing(true)}
                >
                  Change PIN
                </Button>
              </>
            ) : (
              <>
                <div className="bg-muted p-2 rounded-full mb-0.5">
                  <Unlock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-center space-y-0.5 w-full">
                  <p className="text-sm font-medium">Public Access</p>
                  <p className="text-[10px] text-muted-foreground">
                    No restrictions
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-1 h-7 text-xs w-full max-w-[110px]"
                  onClick={() => setIsEditing(true)}
                >
                  Set Passcode
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 rounded-lg border p-4 bg-background shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Set 6-Digit PIN</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Use numbers only. Share this PIN only with trusted users.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsEditing(false)}
              >
                X
              </Button>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="passcode"
                  render={({ field }) => (
                    <FormItem>
                      <div className="rounded-md border bg-muted/40 p-3 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">
                            PIN completeness
                          </span>
                          <span className="font-medium">
                            {passcodeValue.length}/6
                          </span>
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-1.5 rounded-full transition-colors",
                                i < passcodeValue.length
                                  ? "bg-primary"
                                  : "bg-muted-foreground/25"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <FormControl>
                        <InputOTP
                          maxLength={6}
                          {...field}
                          className="w-full"
                          containerClassName="mx-auto w-full max-w-[21rem] justify-center overflow-hidden"
                        >
                          <InputOTPGroup className="w-full gap-1.5 sm:gap-2">
                            <InputOTPSlot index={0} className={slotClassName} />
                            <InputOTPSlot index={1} className={slotClassName} />
                            <InputOTPSlot index={2} className={slotClassName} />
                            <InputOTPSlot index={3} className={slotClassName} />
                            <InputOTPSlot index={4} className={slotClassName} />
                            <InputOTPSlot index={5} className={slotClassName} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground text-center">
                        Tip: avoid repeating digits like 111111.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateMutation.isPending}
                    className="min-w-20"
                  >
                    {updateMutation.isPending && (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    )}
                    Save
                  </Button>
                  {hasPasscode && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemove}
                      disabled={removeMutation.isPending}
                      className="min-w-24"
                    >
                      Remove
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// TODO: Implement ExpirationSection in similar fashion
