"use client";

import * as React from "react";
import { IconCalendarClock } from "@tabler/icons-react";
import { format, isSameDay, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  disablePast?: boolean;
}

export function DateTimePicker({
  date,
  setDate,
  disablePast = false,
}: DateTimePickerProps) {
  const now = new Date();

  function handleDateSelect(newDate: Date | undefined) {
    if (newDate) {
      if (date) {
        // Preserve time if date was already selected
        newDate.setHours(date.getHours(), date.getMinutes());
      }
      setDate(newDate);
    } else {
      setDate(undefined);
    }
  }

  function handleTimeChange(type: "hour" | "minute", value: string) {
    if (!date) return;
    const newDate = new Date(date);
    if (type === "hour") {
      newDate.setHours(parseInt(value, 10));
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(value, 10));
    }
    setDate(newDate);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full pl-3 text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          {date ? (
            format(date, "MM/dd/yyyy HH:mm")
          ) : (
            <span>MM/DD/YYYY HH:mm</span>
          )}
          <IconCalendarClock className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={disablePast ? { before: startOfDay(now) } : undefined}
            initialFocus
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <ScrollArea className="w-64 sm:w-auto h-72 sm:h-full">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 24 }, (_, i) => i)
                  .reverse()
                  .map((hour) => {
                    const isToday = date && isSameDay(date, now);
                    const isDisabled =
                      disablePast && isToday && hour < now.getHours();
                    return (
                      <Button
                        key={hour}
                        size="icon"
                        variant={
                          date && date.getHours() === hour ? "default" : "ghost"
                        }
                        className="sm:w-full shrink-0 aspect-square"
                        onClick={() =>
                          handleTimeChange("hour", hour.toString())
                        }
                        disabled={!!isDisabled}
                      >
                        {hour}
                      </Button>
                    );
                  })}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto h-72 sm:h-full">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => {
                  const isToday = date && isSameDay(date, now);
                  const isSameHour = date && date.getHours() === now.getHours();
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
                        date && date.getMinutes() === minute
                          ? "default"
                          : "ghost"
                      }
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() =>
                        handleTimeChange("minute", minute.toString())
                      }
                      disabled={!!isDisabled}
                    >
                      {minute.toString().padStart(2, "0")}
                    </Button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
