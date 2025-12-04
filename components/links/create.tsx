"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { z } from "zod";

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

const linkSchema = z.object({
  original_url: z.string().url({ message: "Please enter a valid URL" }),
  title: z.string().min(1, { message: "Title is required" }),
  custom_code: z.string().optional(),
  description: z.string().optional(),
  passcode: z.string().optional(),
  expires_at: z.string().optional(), // Using string for datetime-local input
});

const formSchema = z.object({
  is_bulky: z.boolean(),
  links: z
    .array(linkSchema)
    .min(1, { message: "At least one link is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateLink() {
  const [open, setOpen] = React.useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
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
    console.log(JSON.stringify(data, null, 2));
    // Here you would typically call your API
    setOpen(false);
    reset();
  }

  // Reset links array when toggling bulk mode to ensure clean state if needed,
  // or just keep it. For now, we'll ensure at least one item exists.
  React.useEffect(() => {
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
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>
          <Plus className="mr-1/2 h-4 w-4" />
          Create New Link
        </Button>
      </DrawerTrigger>
      <DrawerContent className="flex flex-col">
        <div className="mx-auto w-full max-w-xl flex-grow flex flex-col">
          <DrawerHeader>
            <DrawerTitle>Create New Link</DrawerTitle>
            <DrawerDescription>
              Add a new short link to your dashboard.
            </DrawerDescription>
          </DrawerHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 flex-grow flex flex-col p-4 overflow-hidden"
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
                    <FieldLabel className="text-base">Bulk Creation</FieldLabel>
                    <FieldDescription>
                      Enable to add multiple links at once.
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
                          <FieldLabel>Custom Code (Optional)</FieldLabel>
                          <Input
                            placeholder="my-link"
                            {...register(`links.${index}.custom_code`)}
                          />
                          <FieldError
                            errors={[errors.links?.[index]?.custom_code]}
                          />
                        </Field>

                        <Field>
                          <FieldLabel>Passcode (Optional)</FieldLabel>
                          <Input
                            placeholder="123456"
                            {...register(`links.${index}.passcode`)}
                            maxLength={6}
                          />
                          <FieldError
                            errors={[errors.links?.[index]?.passcode]}
                          />
                        </Field>
                      </div>

                      <Field>
                        <FieldLabel>Expires At (Optional)</FieldLabel>
                        <DateTimePicker24hForm />
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

            {isBulky && (
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

            <DrawerFooter className="flex-row justify-end gap-2">
              <DrawerClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DrawerClose>
              <Button type="submit">Create Link{isBulky && "s"}</Button>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
