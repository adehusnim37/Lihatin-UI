"use client";

import { useState, type ReactNode } from "react";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import {
  BarChart3,
  CalendarClock,
  ChevronDown,
  FileText,
  Flag,
  Hash,
  Link2,
  LockKeyhole,
  MousePointer2,
  PanelsTopLeft,
  Radio,
  Search,
  Signpost,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DateTimePicker24hForm } from "@/components/ui/datepickerhour";
import type { FormValues } from "./create";

type Group = "address" | "access" | "tracking" | "description";

function OptionField({
  id,
  title,
  hint,
  icon: Icon,
  error,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  icon: LucideIcon;
  error?: { message?: string };
  children: ReactNode;
}) {
  return (
    <Field className="min-w-0 gap-3">
      <FieldLabel htmlFor={id}>
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        {title}
      </FieldLabel>
      {children}
      <FieldDescription id={`${id}-hint`} className="text-sm leading-6">
        {hint}
      </FieldDescription>
      <FieldError id={`${id}-error`} errors={[error]} />
    </Field>
  );
}

function OptionGroup({
  name,
  title,
  summary,
  icon: Icon,
  active,
  onChange,
  children,
}: {
  name: Group;
  title: string;
  summary: string;
  icon: LucideIcon;
  active: Group | null;
  onChange: (group: Group | null) => void;
  children: ReactNode;
}) {
  return (
    <Collapsible
      className="min-w-0 w-full"
      open={active === name}
      onOpenChange={(open) => onChange(open ? name : null)}
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="group h-auto min-h-11 w-full justify-start gap-3 rounded-md px-0 py-3 text-left has-[>svg]:px-0"
        >
          <Icon className="size-5 shrink-0 self-start text-primary-ink" aria-hidden="true" />
          <span className="min-w-0 flex-1 whitespace-normal">
            <span className="block text-sm font-medium">{title}</span>
            <span className="mt-1 block text-sm font-normal leading-6 text-muted-foreground [overflow-wrap:anywhere]">
              {summary}
            </span>
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-5 pb-5 pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export function LinkOptions({
  form,
  index,
  prefix,
  baseURL,
}: {
  form: UseFormReturn<FormValues>;
  index: number;
  prefix: string;
  baseURL: string;
}) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form;
  const values = useWatch({ control, name: `links.${index}` });
  const [selected, setSelected] = useState<Group | null>(null);
  const error = errors.links?.[index];
  const errorGroup: Group | null = error?.custom_code
    ? "address"
    : error?.passcode || error?.limit || error?.expires_at
      ? "access"
      : error?.description
        ? "description"
        : null;
  const active = errorGroup ?? selected;
  const id = (field: string) => `${prefix}-${field}`;
  const describedBy = (field: string) => `${id(field)}-hint ${id(field)}-error`;
  const accessSummary =
    [
      values?.passcode && "Passcode set",
      values?.limit && `${values.limit.toLocaleString()} clicks max`,
      values?.expires_at && "Expiration set",
    ]
      .filter(Boolean)
      .join(" · ") || "Open to everyone, with no expiration or click limit";
  const tags = values?.tags;
  const tagCount = Object.values(tags ?? {}).filter(Boolean).length;
  const campaignFields = [
    {
      key: "utm_source",
      title: "Source",
      icon: Signpost,
      placeholder: "instagram",
      hint: "Where you share the link, such as instagram or newsletter.",
    },
    {
      key: "utm_medium",
      title: "Channel",
      icon: Radio,
      placeholder: "social",
      hint: "The type of traffic, such as social, email, or paid ads.",
    },
    {
      key: "utm_campaign",
      title: "Campaign name",
      icon: Flag,
      placeholder: "summer_sale",
      hint: "A shared name to group links from the same campaign.",
    },
    {
      key: "utm_term",
      title: "Search keyword",
      icon: Search,
      placeholder: "running_shoes",
      hint: "Optional: the paid search keyword associated with this link.",
    },
    {
      key: "utm_content",
      title: "Content variation",
      icon: PanelsTopLeft,
      placeholder: "header_banner",
      hint: "Optional: distinguish placements or versions, such as header_banner.",
    },
  ] as const;
  const campaignField = (item: (typeof campaignFields)[number]) => (
    <OptionField
      key={item.key}
      id={id(item.key)}
      title={item.title}
      icon={item.icon}
      hint={item.hint}
    >
      <Input
        id={id(item.key)}
        placeholder={`e.g. ${item.placeholder}`}
        aria-describedby={describedBy(item.key)}
        {...register(`links.${index}.tags.${item.key}`)}
      />
    </OptionField>
  );

  return (
    <div className="divide-y">
      <OptionGroup
        name="address"
        title="Customize the address"
        summary={
          values?.custom_code
            ? `${baseURL}/${values.custom_code}`
            : "Choose a memorable ending for your short link"
        }
        icon={Link2}
        active={active}
        onChange={setSelected}
      >
        <OptionField
          id={id("custom_code")}
          title="Custom code"
          icon={Hash}
          hint="The part after the slash. Leave it empty and we’ll generate a code for you."
          error={error?.custom_code}
        >
          <Input
            id={id("custom_code")}
            autoCapitalize="none"
            autoComplete="off"
            placeholder="summer-sale"
            aria-invalid={!!error?.custom_code}
            aria-describedby={describedBy("custom_code")}
            {...register(`links.${index}.custom_code`)}
          />
        </OptionField>
        <div className="rounded-md bg-muted/40 p-3 text-sm leading-6 [overflow-wrap:anywhere]">
          <span className="text-muted-foreground">Your short link</span>
          <p className="mt-1 font-medium">
            {baseURL}/{values?.custom_code || "auto-generated-code"}
          </p>
        </div>
      </OptionGroup>

      <OptionGroup
        name="access"
        title="Control access"
        summary={accessSummary}
        icon={LockKeyhole}
        active={active}
        onChange={setSelected}
      >
        <OptionField
          id={id("passcode")}
          title="Visitor passcode"
          icon={LockKeyhole}
          hint="Visitors must enter these 6 digits to open the link. Avoid 4 repeated digits in a row; leave empty for public access."
          error={error?.passcode}
        >
          <Input
            id={id("passcode")}
            inputMode="numeric"
            type="text"
            autoComplete="off"
            maxLength={6}
            placeholder="6 digits"
            aria-invalid={!!error?.passcode}
            aria-describedby={describedBy("passcode")}
            {...register(`links.${index}.passcode`)}
            onChange={(event) =>
              setValue(
                `links.${index}.passcode`,
                event.target.value.replace(/\D/g, "").slice(0, 6),
                { shouldDirty: true, shouldValidate: !!error?.passcode },
              )
            }
          />
        </OptionField>
        <OptionField
          id={id("expires")}
          title="Expiration date"
          icon={CalendarClock}
          hint="Choose when the link stops opening. Leave empty to keep it available."
          error={error?.expires_at}
        >
          <Controller
            control={control}
            name={`links.${index}.expires_at`}
            render={({ field }) => (
              <DateTimePicker24hForm
                id={id("expires")}
                ariaLabel="Expiration date"
                disablePast
                value={field.value ? new Date(field.value) : undefined}
                onChange={(value) => field.onChange(value?.toISOString() ?? "")}
              />
            )}
          />
        </OptionField>
        {values?.expires_at && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setValue(`links.${index}.expires_at`, "", { shouldDirty: true })}
          >
            Remove expiration date
          </Button>
        )}
        <OptionField
          id={id("limit")}
          title="Maximum clicks"
          icon={MousePointer2}
          hint="Stop opening the link after this many clicks (up to 1,000,000). Leave empty for unlimited clicks."
          error={error?.limit}
        >
          <Controller
            control={control}
            name={`links.${index}.limit`}
            render={({ field }) => (
              <Input
                id={id("limit")}
                inputMode="numeric"
                placeholder="Unlimited"
                value={field.value ? field.value.toLocaleString("en-US") : ""}
                aria-invalid={!!error?.limit}
                aria-describedby={describedBy("limit")}
                onBlur={field.onBlur}
                ref={field.ref}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "");
                  field.onChange(digits ? Math.min(Number(digits), 1000000) : undefined);
                }}
              />
            )}
          />
        </OptionField>
      </OptionGroup>

      <OptionGroup
        name="tracking"
        title="Analytics & campaigns"
        summary={`${values?.enable_stats ? "Click tracking on" : "Click tracking off"}${tagCount ? ` · ${tagCount} campaign tags` : " · No campaign tags"}`}
        icon={BarChart3}
        active={active}
        onChange={setSelected}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <FieldLabel htmlFor={id("stats")}>
              <BarChart3 className="size-4 text-muted-foreground" aria-hidden="true" />
              Track clicks
            </FieldLabel>
            <p id={`${id("stats")}-hint`} className="text-sm leading-6 text-muted-foreground">
              Record clicks for this link’s analytics. Enabled by default.
            </p>
          </div>
          <Controller
            control={control}
            name={`links.${index}.enable_stats`}
            render={({ field }) => (
              <Switch
                id={id("stats")}
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-describedby={`${id("stats")}-hint`}
              />
            )}
          />
        </div>
        <div className="space-y-1 border-t pt-4">
          <h4 className="text-sm font-medium">Campaign tags (UTM)</h4>
          <p className="text-sm leading-6 text-muted-foreground">
            Label the source, channel, and campaign to identify your traffic. Skip these for
            everyday sharing.
          </p>
        </div>
        {campaignFields.slice(0, 3).map(campaignField)}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" className="group w-full justify-between px-0">
              More campaign details
              <ChevronDown
                className="size-4 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-5 pt-4">
            {campaignFields.slice(3).map(campaignField)}
          </CollapsibleContent>
        </Collapsible>
      </OptionGroup>

      <OptionGroup
        name="description"
        title="Add a description"
        summary={values?.description ? "Description added" : "Give this link a little more context"}
        icon={FileText}
        active={active}
        onChange={setSelected}
      >
        <OptionField
          id={id("description")}
          title="Description"
          icon={FileText}
          hint="Add context for this link. Optional; use 5–2,000 characters when filled in."
          error={error?.description}
        >
          <textarea
            id={id("description")}
            rows={3}
            maxLength={2000}
            placeholder="e.g. Landing page for the summer campaign"
            aria-invalid={!!error?.description}
            aria-describedby={describedBy("description")}
            className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
            {...register(`links.${index}.description`)}
          />
        </OptionField>
      </OptionGroup>
    </div>
  );
}
