"use client";

import * as React from "react";
import { IconCalendarClock } from "@tabler/icons-react";
import { format, isSameDay, startOfDay } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DateTimePicker24hFormProps {
  disablePast?: boolean;
  disableBefore?: Date;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabledPast2Dates?: boolean;
}

export function DateTimePicker24hForm(props: DateTimePicker24hFormProps) {
  const {
    disablePast = false,
    disableBefore,
    value,
    onChange,
    disabledPast2Dates = false,
  } = props;
  const hasExternalValue = Object.prototype.hasOwnProperty.call(props, "value");
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<Date | undefined>(value);
  const hours = React.useMemo(() => Array.from({ length: 24 }, (_, i) => i).reverse(), []);
  const now = new Date();
  const selectedValue = hasExternalValue ? value : internalValue;

  React.useEffect(() => {
    if (!hasExternalValue) return;
    setInternalValue(value);
  }, [hasExternalValue, value]);

  const commitValue = (nextDate: Date | undefined) => {
    if (!hasExternalValue) {
      setInternalValue(nextDate);
    }
    onChange?.(nextDate);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      commitValue(undefined);
      return;
    }

    const sourceTime = selectedValue ?? disableBefore ?? now;
    const nextDate = new Date(selectedDate);
    nextDate.setHours(sourceTime.getHours());
    nextDate.setMinutes(sourceTime.getMinutes());
    nextDate.setSeconds(sourceTime.getSeconds());
    nextDate.setMilliseconds(0);

    commitValue(nextDate);
  };

  const handleTimeChange = (type: "hour" | "minute", nextValue: string) => {
    const sourceDate = selectedValue ?? disableBefore ?? now;
    const nextDate = new Date(sourceDate);

    if (type === "hour") {
      nextDate.setHours(parseInt(nextValue, 10));
    } else {
      nextDate.setMinutes(parseInt(nextValue, 10));
    }

    nextDate.setSeconds(sourceDate.getSeconds());
    nextDate.setMilliseconds(0);
    commitValue(nextDate);
  };

  const isHourDisabled = (hour: number) => {
    if (!selectedValue) {
      return false;
    }

    const isToday = isSameDay(selectedValue, now);
    const isPastTodayHour = disablePast && isToday && hour < now.getHours();

    const sameAsDisableBeforeDay =
      disabledPast2Dates &&
      Boolean(disableBefore) &&
      disableBefore &&
      isSameDay(selectedValue, disableBefore);
    const beforeDisableHour = sameAsDisableBeforeDay && hour < disableBefore.getHours();

    return Boolean(isPastTodayHour || beforeDisableHour);
  };

  const isMinuteDisabled = (minute: number) => {
    if (!selectedValue) {
      return false;
    }

    const isToday = isSameDay(selectedValue, now);
    const isCurrentHour = selectedValue.getHours() === now.getHours();
    const isPastTodayMinute =
      disablePast && isToday && isCurrentHour && minute <= now.getMinutes();

    const sameAsDisableBeforeDay =
      disabledPast2Dates &&
      Boolean(disableBefore) &&
      disableBefore &&
      isSameDay(selectedValue, disableBefore);
    const disableBeforeHour = disableBefore?.getHours();
    const disableBeforeMinute = disableBefore?.getMinutes();
    const sameHourAsDisableBefore =
      sameAsDisableBeforeDay && disableBeforeHour !== undefined && selectedValue.getHours() === disableBeforeHour;
    const beforeDisableMinute =
      sameHourAsDisableBefore && disableBeforeMinute !== undefined && minute <= disableBeforeMinute;

    return Boolean(isPastTodayMinute || beforeDisableMinute);
  };

  return (
    <div>
      <Popover modal={true} open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
            "w-full justify-start text-left font-normal",
            !selectedValue && "text-muted-foreground"
          )}
        >
          <IconCalendarClock className="mr-2 size-4" />
          {selectedValue ? format(selectedValue, "dd/MM/yyyy HH:mm") : <span>DD/MM/YYYY HH:mm</span>}
        </Button>
      </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="sm:flex">
            <Calendar
              mode="single"
              selected={selectedValue}
              onSelect={handleDateSelect}
              disabled={
                disablePast
                  ? { before: startOfDay(now) }
                  : disableBefore
                    ? { before: startOfDay(disableBefore) }
                    : undefined
              }
              autoFocus
            />
            <div className="flex flex-col divide-y sm:h-[300px] sm:flex-row sm:divide-x sm:divide-y-0">
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex p-2 sm:flex-col">
                  {hours.map((hour) => (
                    <Button
                      key={hour}
                      type="button"
                      size="icon"
                      variant={selectedValue && selectedValue.getHours() === hour ? "default" : "ghost"}
                      className="aspect-square shrink-0 sm:w-full"
                      onClick={() => handleTimeChange("hour", String(hour))}
                      disabled={isHourDisabled(hour)}
                    >
                      {hour.toString().padStart(2, "0")}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>

              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex p-2 sm:flex-col">
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                    <Button
                      key={minute}
                      type="button"
                      size="icon"
                      variant={selectedValue && selectedValue.getMinutes() === minute ? "default" : "ghost"}
                      className="aspect-square shrink-0 sm:w-full"
                      onClick={() => handleTimeChange("minute", String(minute))}
                      disabled={isMinuteDisabled(minute)}
                    >
                      {minute.toString().padStart(2, "0")}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
