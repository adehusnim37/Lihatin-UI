"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { Separator } from "@/components/ui/separator";
import { DateTimePicker24hForm } from "../ui/datepickerhour";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "../ui/badge";
import { useEffect } from "react";
import { useCreateLink } from "@/lib/hooks/queries/useLinksQuery";
import { IconInfoCircle } from "@tabler/icons-react";

const linkSchema = z.object({
  original_url: z.url({ message: "Please enter a valid URL" }),
  title: z
    .string()
    .min(5, { message: "Title must be at least 5 characters long" })
    .max(100, { message: "Title must be at most 100 characters long" }),

  // SOLUSI: Jangan optional(), tapi izinkan string kosong
  custom_code: z.string().or(z.literal("")),

  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters long" })
    .max(2000, { message: "Description must be at most 2000 characters long" })
    .or(z.literal("")), // <--- INI FIX-NYA (Allow empty string)

  passcode: z
    .string()
    .refine((val) => !val || (val.length === 6 && /^\d{6}$/.test(val)), {
      message: "Passcode must be exactly 6 digits",
    })
    .or(z.literal("")), // Tambahkan ini biar aman kalau string kosong

  expires_at: z.string().or(z.literal("")), // Aman buat datetime-local
  limit: z
    .union([z.number(), z.nan()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || Number.isNaN(val) || val === 0) {
        return undefined;
      }
      return val;
    })
    .pipe(
      z
        .number()
        .min(1, { message: "Limit must be at least 1" })
        .max(1000000, { message: "Limit must be at most 1,000,000" })
        .optional()
    ),
  enable_stats: z.boolean(),
  tags: z
    .object({
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
      utm_term: z.string().optional(),
      utm_content: z.string().optional(),
    })
    .optional(),
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
          enable_stats: true,
          limit: undefined,
          tags: {
            utm_source: "",
            utm_medium: "",
            utm_campaign: "",
            utm_term: "",
            utm_content: "",
          },
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
        limit: link.limit && link.limit > 0 ? link.limit : undefined,
        tags: {
          utm_source: link.tags?.utm_source || undefined,
          utm_medium: link.tags?.utm_medium || undefined,
          utm_campaign: link.tags?.utm_campaign || undefined,
          utm_term: link.tags?.utm_term || undefined,
          utm_content: link.tags?.utm_content || undefined,
        },
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
        limit: undefined,
        enable_stats: true,
        tags: {
          utm_source: "",
          utm_medium: "",
          utm_campaign: "",
          utm_term: "",
          utm_content: "",
        },
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
                          <Tooltip>
                            <FieldLabel>
                              Click Limit (Optional)
                              <TooltipTrigger asChild>
                                <IconInfoCircle className="h-4 w-4 ml-1 inline-block" />
                              </TooltipTrigger>
                            </FieldLabel>
                            <TooltipContent sideOffset={4} align="start">
                              <p>
                                Set the maximum number of clicks allowed for
                                this link. Leave empty for unlimited clicks.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                          <Controller
                            control={control}
                            name={`links.${index}.limit`}
                            render={({ field }) => (
                              <Input
                                placeholder="Leave empty for unlimited"
                                inputMode="numeric"
                                value={
                                  field.value
                                    ? field.value.toLocaleString("en-US")
                                    : ""
                                }
                                onChange={(e) => {
                                  // Remove all non-digit characters
                                  const rawValue = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  // Convert to number or undefined if empty
                                  const numValue = rawValue
                                    ? parseInt(rawValue, 10)
                                    : undefined;
                                  // Limit to max 1,000,000
                                  if (numValue && numValue > 1000000) {
                                    field.onChange(1000000);
                                  } else {
                                    field.onChange(numValue);
                                  }
                                }}
                              />
                            )}
                          />
                          <FieldError errors={[errors.links?.[index]?.limit]} />
                        </Field>

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

                        <Field
                          orientation="horizontal"
                          className="flex flex-row items-center justify-between rounded-lg border p-4"
                        >
                          <div className="space-y-0.5">
                            <Tooltip>
                              <FieldLabel>
                                Enable Statistics
                                <TooltipTrigger asChild>
                                  <IconInfoCircle className="h-4 w-4" />
                                </TooltipTrigger>
                              </FieldLabel>
                              <TooltipContent sideOffset={1} align="start">
                                <p>
                                  What is statistics? Statistics is a feature
                                  that tracks the number of clicks on a link. If
                                  disabled, the link will not be tracked.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Controller
                            control={control}
                            name={`links.${index}.enable_stats`}
                            render={({ field }) => (
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />
                        </Field>

                        <Collapsible className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <FieldLabel>UTM Tags (Advanced)</FieldLabel>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-9 p-0"
                              >
                                <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                                <span className="sr-only">Toggle</span>
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent className="pt-4 grid grid-cols-2 gap-4">
                            <Field>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200 mb-2"
                              >
                                UTM Source
                              </Badge>
                              <Input
                                placeholder="e.g. instagram"
                                {...register(`links.${index}.tags.utm_source`)}
                              />
                            </Field>
                            <Field>
                              <Badge
                                variant="outline"
                                className="bg-purple-50 text-purple-700 border-purple-200 mb-2"
                              >
                                UTM Medium
                              </Badge>
                              <Input
                                placeholder="e.g. social"
                                {...register(`links.${index}.tags.utm_medium`)}
                              />
                            </Field>
                            <Field>
                              <Badge
                                variant="outline"
                                className="bg-pink-50 text-pink-700 border-pink-200 mb-2"
                              >
                                UTM Campaign
                              </Badge>
                              <Input
                                placeholder="e.g. summer_sale"
                                {...register(
                                  `links.${index}.tags.utm_campaign`
                                )}
                              />
                            </Field>
                            <Field>
                              <Badge
                                variant="outline"
                                className="bg-indigo-50 text-indigo-700 border-indigo-200 mb-2"
                              >
                                UTM Term
                              </Badge>
                              <Input
                                placeholder="e.g. running_shoes"
                                {...register(`links.${index}.tags.utm_term`)}
                              />
                            </Field>
                            <Field className="col-span-2">
                              <Badge
                                variant="outline"
                                className="bg-orange-50 text-orange-700 border-orange-200 mb-2"
                              >
                                UTM Content
                              </Badge>
                              <Input
                                placeholder="e.g. banner_top"
                                {...register(`links.${index}.tags.utm_content`)}
                              />
                            </Field>
                          </CollapsibleContent>
                        </Collapsible>

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
                      limit: undefined,
                      expires_at: "",
                      enable_stats: true,
                      tags: {
                        utm_source: "",
                        utm_medium: "",
                        utm_campaign: "",
                        utm_term: "",
                        utm_content: "",
                      },
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
