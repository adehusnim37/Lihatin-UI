"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { Separator } from "@/components/ui/separator";
import { DateTimePicker24hForm } from "../ui/datepickerhour";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useCreateLink } from "@/lib/hooks/queries/useLinksQuery";
import { toast } from "sonner";

const linkSchema = z.object({
  original_url: z.url({ message: "Please enter a valid URL" }),
  title: z
    .string()
    .min(5, { message: "Title must be at least 5 characters long" })
    .max(100, { message: "Title must be at most 100 characters long" }),
  custom_code: z.string().optional(),
  description: z.string().optional(),
  passcode: z
    .string()
    .optional()
    .refine((val) => !val || (val.length === 6 && /^\d{6}$/.test(val)), {
      message: "Passcode must be exactly 6 digits",
    }),
  expires_at: z.string().optional(), // Using string for datetime-local input
});

const formSchema = z.object({
  is_bulky: z.boolean(),
  links: z
    .array(linkSchema)
    .min(1, { message: "At least one link is required" })
    .max(3, { message: "Maximum 3 links are allowed" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateLink() {
  const [open, setOpen] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [pendingData, setPendingData] = React.useState<FormValues | null>(null);

  const createLinkMutation = useCreateLink();

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      is_bulky: false,
      links: [
        {
          original_url: "",
          title: "",
          custom_code: "",
          description: "",
          passcode: "",
          expires_at: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "links",
  });

  const isBulky = watch("is_bulky");

  function onSubmit(data: FormValues) {
    if (data.is_bulky && data.links.length > 1) {
      // Show confirmation dialog for bulk creation
      setPendingData(data);
      setShowConfirmDialog(true);
    } else {
      // Direct submission for single link
      handleConfirmedSubmit(data);
    }
  }

  function handleConfirmedSubmit(data: FormValues) {
    // Build request in correct format: { is_bulky: boolean, links: [...] }
    const requestData = {
      is_bulky: data.is_bulky,
      links: data.links.map((link) => ({
        original_url: link.original_url,
        title: link.title,
        custom_code: link.custom_code || undefined,
        description: link.description || undefined,
        passcode: link.passcode || undefined,
        expires_at: link.expires_at || undefined,
      })),
    };

    createLinkMutation.mutate(requestData);
    setOpen(false);
    setShowConfirmDialog(false);
    setPendingData(null);
    reset();
  }

  // Reset links array when toggling bulk mode to ensure clean state if needed,
  // or just keep it. For now, we'll ensure at least one item exists.
  useEffect(() => {
    if (fields.length === 0) {
      append({
        original_url: "",
        title: "",
        custom_code: "",
        description: "",
        passcode: "",
        expires_at: "",
      });
    }
  }, [fields.length, append]);

  return (
    <>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button>
            <Plus className="mr-1/2 h-4 w-4" />
            Create New Link
          </Button>
        </DrawerTrigger>
        <DrawerContent className="flex flex-col">
          <div className="mx-auto w-full max-w-xl flex-grow flex flex-col overflow-hidden">
            <DrawerHeader>
              <DrawerTitle>Create New Link</DrawerTitle>
              <DrawerDescription>
                Add a new short link to your dashboard.
              </DrawerDescription>
            </DrawerHeader>

            <form
              id="create-link-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6 flex-grow flex flex-col p-4 overflow-hidden min-h-0"
            >
              <Controller
                control={control}
                name="is_bulky"
                render={({ field }) => (
                  <Field
                    orientation="horizontal"
                    className="flex flex-row items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-0.5">
                      <FieldLabel className="text-base">
                        Bulk Creation
                      </FieldLabel>
                      <FieldDescription>
                        Enable to add multiple links at once. (Max 3 links)
                      </FieldDescription>
                    </div>
                    <Switch
                      defaultChecked={field.value}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Field>
                )}
              />

              <div className="flex-grow overflow-y-auto px-3">
                <div className="">
                  <FieldGroup>
                    {fields.map((field, index) => (
                      <FieldSet key={field.id}>
                        {isBulky && (
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">
                              Link #{index + 1}
                            </h4>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        )}

                        <Field>
                          <FieldLabel>Original URL</FieldLabel>
                          <Input
                            placeholder="https://example.com"
                            {...register(`links.${index}.original_url`)}
                          />
                          <FieldError
                            errors={[errors.links?.[index]?.original_url]}
                          />
                        </Field>

                        <Field>
                          <FieldLabel>Title</FieldLabel>
                          <Input
                            placeholder="My Awesome Link"
                            {...register(`links.${index}.title`)}
                          />
                          <FieldError errors={[errors.links?.[index]?.title]} />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                          <Field>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <FieldLabel>Custom Code (Optional)</FieldLabel>
                              </TooltipTrigger>
                              <TooltipContent sideOffset={4} align="start">
                                <p>
                                  It is used to identify the specific link. Eg:{" "}
                                  <code>https://lihat.in/my-link</code>
                                </p>
                              </TooltipContent>
                            </Tooltip>
                            <Input
                              placeholder="my-link"
                              {...register(`links.${index}.custom_code`)}
                            />
                            <FieldError
                              errors={[errors.links?.[index]?.custom_code]}
                            />
                          </Field>

                          <Field>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <FieldLabel>Passcode (Optional)</FieldLabel>
                              </TooltipTrigger>
                              <TooltipContent sideOffset={4} align="start">
                                <p>
                                  It is used to secure the link, so that only
                                  those with the passcode can access it.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                            <Input
                              placeholder="123456"
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              {...register(`links.${index}.passcode`)}
                              onChange={(e) => {
                                const value = e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 6);
                                setValue(`links.${index}.passcode`, value);
                              }}
                            />
                            <FieldError
                              errors={[errors.links?.[index]?.passcode]}
                            />
                          </Field>
                        </div>

                        <Field>
                          <FieldLabel>Expires At (Optional)</FieldLabel>
                          <DateTimePicker24hForm disablePast />
                          <FieldError
                            errors={[errors.links?.[index]?.expires_at]}
                          />
                        </Field>

                        <Field>
                          <FieldLabel>Description (Optional)</FieldLabel>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Add a description..."
                            {...register(`links.${index}.description`)}
                          />
                          <FieldError
                            errors={[errors.links?.[index]?.description]}
                          />
                        </Field>

                        {isBulky && index < fields.length - 1 && <Separator />}
                      </FieldSet>
                    ))}
                  </FieldGroup>
                </div>
              </div>

              {isBulky && fields.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() =>
                    append({
                      original_url: "",
                      title: "",
                      custom_code: "",
                      description: "",
                      passcode: "",
                      expires_at: "",
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Link
                </Button>
              )}
            </form>

            <DrawerFooter className="flex-row justify-end gap-2">
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                form="create-link-form"
                disabled={createLinkMutation.isPending}
              >
                {createLinkMutation.isPending ? "Creating..." : "Create Link"}
                {isBulky && "s"}
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Bulk Creation Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Creation</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to create{" "}
                  <span className="font-semibold text-foreground">
                    {pendingData?.links.length} links
                  </span>{" "}
                  at once. Please review the details below:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {pendingData?.links.map((link, index) => (
                    <li key={index} className="truncate">
                      <span className="font-medium">
                        {link.title || "Untitled"}
                      </span>
                      <span className="text-muted-foreground"> — </span>
                      <span className="text-muted-foreground text-xs">
                        {link.original_url || "No URL"}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground">
                  Do you want to proceed with creating these links?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingData(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingData && handleConfirmedSubmit(pendingData)}
            >
              Create {pendingData?.links.length} Links
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
