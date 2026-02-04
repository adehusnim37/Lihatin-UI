"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconCalendarClock } from "@tabler/icons-react";
import { format, isSameDay, isBefore, startOfDay } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const FormSchema = z.object({
  time: z.date({
    message: "A date and time is required.",
  }),
});

interface DateTimePicker24hFormProps {
  disablePast?: boolean;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
}

export function DateTimePicker24hForm({
  disablePast = false,
  value,
  onChange,
}: DateTimePicker24hFormProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    values: value ? { time: value } : undefined,
  });

  const now = new Date();

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast.success(`Selected date and time: ${format(data.time, "PPPP HH:mm")}`);
  }

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      const currentTime = value || new Date();
      const newDate = new Date(date);
      newDate.setHours(currentTime.getHours());
      newDate.setMinutes(currentTime.getMinutes());
      form.setValue("time", newDate);
      onChange?.(newDate);
    }
  }

  function handleTimeChange(type: "hour" | "minute", val: string) {
    const currentDate = value || new Date();
    const newDate = new Date(currentDate);

    if (type === "hour") {
      const hour = parseInt(val, 10);
      newDate.setHours(hour);
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(val, 10));
    }

    form.setValue("time", newDate);
    onChange?.(newDate);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "MM/dd/yyyy HH:mm")
                      ) : (
                        <span>MM/DD/YYYY HH:mm</span>
                      )}
                      <IconCalendarClock className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="sm:flex">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={handleDateSelect}
                      disabled={
                        disablePast ? { before: startOfDay(now) } : undefined
                      }
                      initialFocus
                    />
                    <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                      <ScrollArea className="w-64 h-[200px] sm:w-auto sm:h-[300px] overflow-y-auto">
                        <div className="flex sm:flex-col p-2" style={{ minHeight: 'fit-content' }}>
                          {Array.from({ length: 24 }, (_, i) => i)
                            .reverse()
                            .map((hour) => {
                              const isToday =
                                field.value && isSameDay(field.value, now);
                              const isDisabled =
                                disablePast && isToday && hour < now.getHours();
                              return (
                                <Button
                                  key={hour}
                                  size="icon"
                                  variant={
                                    field.value &&
                                    field.value.getHours() === hour
                                      ? "default"
                                      : "ghost"
                                  }
                                  className="sm:w-full shrink-0 aspect-square"
                                  onClick={() =>
                                    handleTimeChange("hour", hour.toString())
                                  }
                                  disabled={isDisabled}
                                >
                                  {hour}
                                </Button>
                              );
                            })}
                        </div>
                        <ScrollBar
                          orientation="horizontal"
                          className="sm:hidden"
                        />
                        <ScrollBar
                          orientation="vertical"
                          className="hidden sm:block"
                        />
                      </ScrollArea>
                      <ScrollArea className="w-64 h-[200px] sm:w-auto sm:h-[300px] overflow-y-auto">
                        <div className="flex sm:flex-col p-2" style={{ minHeight: 'fit-content' }}>
                          {Array.from({ length: 12 }, (_, i) => i * 5).map(
                            (minute) => {
                              const isToday =
                                field.value && isSameDay(field.value, now);
                              const isSameHour =
                                field.value &&
                                field.value.getHours() === now.getHours();
                              const isDisabled =
                                disablePast &&
                                isToday &&
                                isSameHour &&
                                minute <= now.getMinutes();
                              return (
                                <Button
                                  key={minute}
                                  size="icon"
                                  variant={
                                    field.value &&
                                    field.value.getMinutes() === minute
                                      ? "default"
                                      : "ghost"
                                  }
                                  className="sm:w-full shrink-0 aspect-square"
                                  onClick={() =>
                                    handleTimeChange(
                                      "minute",
                                      minute.toString()
                                    )
                                  }
                                  disabled={isDisabled}
                                >
                                  {minute.toString().padStart(2, "0")}
                                </Button>
                              );
                            }
                          )}
                        </div>
                        <ScrollBar
                          orientation="horizontal"
                          className="sm:hidden"
                        />
                        <ScrollBar
                          orientation="vertical"
                          className="hidden sm:block"
                        />
                      </ScrollArea>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
