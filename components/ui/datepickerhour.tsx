"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconCalendarClock } from "@tabler/icons-react";
import { format, isSameDay, startOfDay } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const FormSchema = z.object({
  time: z.date({
    message: "A date and time is required.",
  }),
});

interface DateTimePicker24hFormProps {
  disablePast?: boolean;
  disableBefore?: Date;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabledPast2Dates?: boolean;
}

export function DateTimePicker24hForm({
  disablePast = false,
  disableBefore,
  value,
  onChange,
  disabledPast2Dates = false,
}: DateTimePicker24hFormProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    values: value ? { time: value } : undefined,
  });

  const now = new Date();

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
      <div className="space-y-5">
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy HH:mm")
                      ) : (
                        <span>DD/MM/YYYY HH:mm</span>
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
                        disablePast 
                          ? { before: startOfDay(now) }
                          : disableBefore
                          ? { before: startOfDay(disableBefore) }
                          : undefined
                      }
                      initialFocus
                    />
                    <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                      <div 
                        tabIndex={0}
                        className="w-64 h-[200px] sm:w-auto sm:h-[300px] overflow-y-auto overflow-x-auto sm:overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full focus:outline-none"
                      >
                        <div className="flex sm:flex-col p-2">
                          {Array.from({ length: 24 }, (_, i) => i)
                            .reverse()
                            .map((hour) => {
                              const isToday =
                                field.value && isSameDay(field.value, now);
                              const isDisabled =
                                disablePast && isToday && hour < now.getHours();
                              
                              // Disable hours before the disableBefore time on the same day
                              const isSameAsDisableBefore = 
                                disabledPast2Dates && 
                                disableBefore && 
                                field.value && 
                                isSameDay(field.value, disableBefore);
                              const isBeforeDisableHour = 
                                isSameAsDisableBefore && hour < disableBefore.getHours();
                              
                              return (
                                <Button
                                  key={hour}
                                  type="button"
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
                                  disabled={isDisabled || isBeforeDisableHour}
                                >
                                  {hour}
                                </Button>
                              );
                            })}
                        </div>
                      </div>
                      <div 
                        tabIndex={0}
                        className="w-64 h-[200px] sm:w-auto sm:h-[300px] overflow-y-auto overflow-x-auto sm:overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full focus:outline-none"
                      >
                        <div className="flex sm:flex-col p-2">
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
                              
                              // Disable minutes before the disableBefore time on the same day and hour
                              const isSameAsDisableBefore = 
                                disabledPast2Dates && 
                                disableBefore && 
                                field.value && 
                                isSameDay(field.value, disableBefore);
                              const isSameHourAsDisable = 
                                isSameAsDisableBefore && 
                                field.value.getHours() === disableBefore.getHours();
                              const isBeforeDisableMinute = 
                                isSameHourAsDisable && minute <= disableBefore.getMinutes();
                              
                              return (
                                <Button
                                  key={minute}
                                  type="button"
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
                                  disabled={isDisabled || isBeforeDisableMinute}
                                >
                                  {minute.toString().padStart(2, "0")}
                                </Button>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}
