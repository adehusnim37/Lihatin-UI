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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { Separator } from "@/components/ui/separator";
import { useEffect } from "react";
import { useCreateLink } from "@/lib/hooks/queries/useLinksQuery";
import { hasRepeatedConsecutiveDigits } from "@/lib/validators/passcode";
import { LinkOptions } from "./link-options";
import { ShortLinkCutTransition } from "./short-link-cut-transition";

const FRONTEND_BASE_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

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
    .refine((val) => !val || !hasRepeatedConsecutiveDigits(val), {
      message: "Passcode cannot contain 4 or more repeated digits in a row",
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
        .optional(),
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

export type FormValues = z.infer<typeof formSchema>;

export default function CreateLink() {
  const formId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [expandedOptions, setExpandedOptions] = React.useState<Record<string, boolean>>({});
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [pendingData, setPendingData] = React.useState<FormValues | null>(null);
  const [cutTransition, setCutTransition] = React.useState<{
    count: number;
    phase: "cutting" | "success";
    resultUrl?: string;
    sourceUrl: string;
  } | null>(null);

  const createLinkMutation = useCreateLink();

  const form = useForm<FormValues>({
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

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = form;

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
        enable_stats: link.enable_stats,
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

    setCutTransition({
      count: data.links.length,
      phase: "cutting",
      sourceUrl: data.links[0]?.original_url || "",
    });

    createLinkMutation.mutate(requestData, {
      onSuccess: (createdLink) => {
        setCutTransition((current) =>
          current
            ? {
                count: data.links.length,
                phase: "success",
                resultUrl:
                  data.links.length === 1 && createdLink?.short_code
                    ? `${FRONTEND_BASE_URL}/${createdLink.short_code}`
                    : undefined,
                sourceUrl: data.links[0]?.original_url || "",
              }
            : null,
        );
        setOpen(false);
        setExpandedOptions({});
        reset();
      },
      onError: () => {
        setCutTransition(null);
      },
    });
    setShowConfirmDialog(false);
    setPendingData(null);
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-1/2 size-4" />
            Create New Link
          </Button>
        </DialogTrigger>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-w-xl">
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
            <DialogHeader className="shrink-0 border-b px-5 py-5 pr-12 text-left sm:px-6 sm:pr-12">
              <DialogTitle className="text-xl">Create a short link</DialogTitle>
              <DialogDescription>
                Start with a destination URL and a name for your link.
              </DialogDescription>
            </DialogHeader>

            <form
              id={`${formId}-create-link-form`}
              onSubmit={handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain [&>*]:shrink-0 px-5 py-5 sm:px-6"
            >
              <Controller
                control={control}
                name="is_bulky"
                render={({ field }) => (
                  <Field
                    orientation="horizontal"
                    className="flex flex-row items-center justify-between gap-4 rounded-lg bg-muted/40 p-3"
                  >
                    <div className="space-y-0.5">
                      <FieldLabel htmlFor={`${formId}-bulk`} className="text-sm">
                        Create multiple links
                      </FieldLabel>
                      <FieldDescription>Up to 3 links in one batch.</FieldDescription>
                      {fields.length > 1 && (
                        <p id={`${formId}-bulk-help`} className="text-xs text-muted-foreground">
                          Remove extra links to return to single-link mode.
                        </p>
                      )}
                    </div>
                    <Switch
                      id={`${formId}-bulk`}
                      checked={field.value}
                      disabled={fields.length > 1}
                      aria-describedby={fields.length > 1 ? `${formId}-bulk-help` : undefined}
                      onCheckedChange={field.onChange}
                    />
                  </Field>
                )}
              />

              <div className="min-w-0">
                <div className="">
                  <FieldGroup>
                    {fields.map((field, index) => (
                      <FieldSet key={field.id} className="min-w-0 gap-5">
                        {isBulky && (
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Link #{index + 1}</h4>
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                aria-label={`Remove link ${index + 1}`}
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        )}

                        <Field>
                          <FieldLabel htmlFor={`${formId}-${index}-original_url`}>
                            Destination URL
                          </FieldLabel>
                          <Input
                            type="url"
                            inputMode="url"
                            autoCapitalize="none"
                            placeholder="https://example.com"
                            id={`${formId}-${index}-original_url`}
                            aria-invalid={!!errors.links?.[index]?.original_url}
                            aria-describedby={
                              errors.links?.[index]?.original_url
                                ? `${formId}-${index}-original_url-error`
                                : undefined
                            }
                            {...register(`links.${index}.original_url`)}
                          />
                          <FieldError
                            id={`${formId}-${index}-original_url-error`}
                            errors={[errors.links?.[index]?.original_url]}
                          />
                        </Field>

                        <Field>
                          <FieldLabel htmlFor={`${formId}-${index}-title`}>Title</FieldLabel>
                          <Input
                            placeholder="e.g. Summer campaign"
                            id={`${formId}-${index}-title`}
                            aria-invalid={!!errors.links?.[index]?.title}
                            aria-describedby={
                              errors.links?.[index]?.title
                                ? `${formId}-${index}-title-error`
                                : undefined
                            }
                            {...register(`links.${index}.title`)}
                          />
                          <FieldError
                            id={`${formId}-${index}-title-error`}
                            errors={[errors.links?.[index]?.title]}
                          />
                        </Field>

                        <Collapsible
                          open={
                            expandedOptions[field.id] ||
                            Boolean(
                              errors.links?.[index]?.custom_code ||
                              errors.links?.[index]?.passcode ||
                              errors.links?.[index]?.limit ||
                              errors.links?.[index]?.expires_at ||
                              errors.links?.[index]?.description,
                            )
                          }
                          onOpenChange={(value) =>
                            setExpandedOptions((current) => ({ ...current, [field.id]: value }))
                          }
                          className="min-w-0 w-full border-t pt-4"
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              className="group h-auto min-h-11 w-full justify-between px-0 text-left hover:bg-transparent has-[>svg]:px-0"
                            >
                              <span className="min-w-0">
                                <span className="block">Link options</span>
                                <span className="mt-1 block whitespace-normal text-sm font-normal leading-6 text-muted-foreground">
                                  Optional settings — open only what you need
                                </span>
                              </span>
                              <ChevronDown
                                aria-hidden="true"
                                className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                              />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-4">
                            <LinkOptions
                              form={form}
                              index={index}
                              prefix={`${formId}-${index}`}
                              baseURL={FRONTEND_BASE_URL}
                            />
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
                  <Plus className="mr-2 size-4" />
                  Add Another Link
                </Button>
              )}
            </form>

            <DialogFooter className="shrink-0 flex-row justify-end gap-3 border-t bg-background px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  disabled={createLinkMutation.isPending}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                form={`${formId}-create-link-form`}
                className="flex-1 sm:flex-none"
                disabled={createLinkMutation.isPending}
              >
                {createLinkMutation.isPending ? "Creating..." : "Create Link"}
                {isBulky && `s (${fields.length})`}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Creation Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="z-[70] w-[min(94vw,760px)] max-h-[85vh] overflow-hidden p-0">
          <AlertDialogHeader className="border-b px-5 py-4 sm:px-6">
            <AlertDialogTitle className="text-xl">Confirm Bulk Creation</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 px-5 py-4 sm:px-6">
                <p className="leading-relaxed text-sm sm:text-base">
                  You are about to create{" "}
                  <span className="font-semibold text-foreground">
                    {pendingData?.links.length} links
                  </span>{" "}
                  at once. Please review the details below:
                </p>
                <div className="max-h-[40vh] overflow-y-auto rounded-lg border bg-muted/20 p-3">
                  <ul className="space-y-2">
                    {pendingData?.links.map((link, index) => (
                      <li key={index} className="rounded-md border bg-background p-3">
                        <p className="text-sm font-semibold break-words">
                          {link.title || `Untitled #${index + 1}`}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground break-all">
                          {link.original_url || "No URL"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  Do you want to proceed with creating these links?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-t px-5 py-4 sm:px-6">
            <AlertDialogCancel className="w-full sm:w-auto" onClick={() => setPendingData(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full sm:w-auto"
              onClick={() => pendingData && handleConfirmedSubmit(pendingData)}
            >
              Create {pendingData?.links.length} Links
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {cutTransition && (
        <ShortLinkCutTransition
          count={cutTransition.count}
          onFinish={() => setCutTransition(null)}
          open
          phase={cutTransition.phase}
          resultUrl={cutTransition.resultUrl}
          sourceUrl={cutTransition.sourceUrl}
        />
      )}
    </>
  );
}
