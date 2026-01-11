"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CounterInputProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function CounterInput({
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
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={(e) => {
          e.preventDefault();
          handleDecrement();
        }}
        disabled={value <= min}
        type="button"
      >
        <Minus className="h-4 w-4" />
        <span className="sr-only">Decrease</span>
      </Button>
      <div className="flex-1">
        <Input
          type="number"
          value={value}
          onChange={handleChange}
          className="h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          min={min}
          max={max}
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={(e) => {
          e.preventDefault();
          handleIncrement();
        }}
        disabled={value >= max}
        type="button"
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only">Increase</span>
      </Button>
    </div>
  );
}
