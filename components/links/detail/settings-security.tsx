"use client";

import { useState } from "react";
import { format } from "date-fns";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Switch } from "@/components/ui/switch"; // For enable/disable

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
    .regex(/^\d+$/, "Numbers only"),
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
  expiresAt,
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
    } catch (error) {
      // Toast handled by hook usually
    }
  };

  const handleRemove = async () => {
    try {
      await removeMutation.mutateAsync(shortCode);
      form.reset({ passcode: "" });
      toast.success("Passcode removed");
    } catch (error) {}
  };

  const hasPasscode = !!currentPasscode && currentPasscode !== "0";

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
          <div className="space-y-4 rounded-lg border p-4 bg-background">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Set 6-Digit PIN</h4>
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
                      <FormControl>
                        <InputOTP maxLength={6} {...field}>
                          <InputOTPGroup>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <InputOTPSlot key={i} index={i} />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateMutation.isPending}
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
