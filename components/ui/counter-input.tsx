"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CounterInputProps {
  id?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function CounterInput({
  id,
  value = 0,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  className,
}: CounterInputProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange?.(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange?.(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    if (!isNaN(newValue)) {
      if (newValue >= min && newValue <= max) {
        onChange?.(newValue);
      }
    } else if (e.target.value === "") {
      // Handle empty input if needed, typically we might want to keep it derived or allow temporary empty state
      // For strictly numeric counter, we might just ignore or set to min
    }
  };

  return (
    <div
      className={cn(
        "flex h-10 w-full items-stretch overflow-hidden rounded-lg border bg-background shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        className
      )}
      role="group"
      aria-label="Number stepper"
    >
      <button
        className="grid w-11 shrink-0 place-items-center border-r text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
        onClick={(e) => {
          e.preventDefault();
          handleDecrement();
        }}
        disabled={value <= min}
        type="button"
      >
        <Minus className="size-4" />
        <span className="sr-only">Decrease</span>
      </button>
      <div className="min-w-0 flex-1">
        <Input
          id={id}
          type="number"
          value={value}
          onChange={handleChange}
          className="h-full rounded-none border-0 bg-transparent text-center shadow-none [appearance:textfield] focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          min={min}
          max={max}
          step={step}
          inputMode="numeric"
        />
      </div>
      <button
        className="grid w-11 shrink-0 place-items-center border-l text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
        onClick={(e) => {
          e.preventDefault();
          handleIncrement();
        }}
        disabled={value >= max}
        type="button"
      >
        <Plus className="size-4" />
        <span className="sr-only">Increase</span>
      </button>
    </div>
  );
}
