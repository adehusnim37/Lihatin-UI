"use client";

import { useMemo } from "react";
import { IconCheck, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  percentage: number;
}

export interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordIndicatorProps {
  password: string;
  showRequirements?: boolean;
  minLength?: number;
  className?: string;
}

export default function PasswordIndicator({
  password,
  showRequirements = true,
  minLength = 8,
  className,
}: PasswordIndicatorProps) {
  const strength = useMemo(() => calculatePasswordStrength(password, minLength), [password, minLength]);
  const requirements = useMemo(() => getPasswordRequirements(password, minLength), [password, minLength]);

  if (!password) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className={cn(
              "font-medium",
              strength.color.split(" ").find((c) => c.startsWith("text-"))
            )}
          >
            {strength.label}
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300 rounded-full", strength.color)}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-2">
          {requirements.map((req, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs transition-colors"
            >
              {req.met ? (
                <IconCheck className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <IconX className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={cn(
                "transition-colors",
                req.met ? "text-green-600" : "text-muted-foreground"
              )}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function calculatePasswordStrength(password: string, minLength: number): PasswordStrength {
  if (!password) {
    return { score: 0, label: "Too weak", color: "bg-red-500 text-red-600", percentage: 0 };
  }

  let score = 0;

  // Length check
  if (password.length >= minLength) score++;
  if (password.length >= 12) score++;

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  // Cap at 4
  const finalScore = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;

  const strengthMap: Record<0 | 1 | 2 | 3 | 4, { label: string; color: string; percentage: number }> = {
    0: { label: "Too weak", color: "bg-red-500 text-red-600", percentage: 20 },
    1: { label: "Weak", color: "bg-orange-500 text-orange-600", percentage: 40 },
    2: { label: "Fair", color: "bg-yellow-500 text-yellow-600", percentage: 60 },
    3: { label: "Good", color: "bg-blue-500 text-blue-600", percentage: 80 },
    4: { label: "Strong", color: "bg-green-500 text-green-600", percentage: 100 },
  };

  return { score: finalScore, ...strengthMap[finalScore] };
}

function getPasswordRequirements(password: string, minLength: number): PasswordRequirement[] {
  return [
    {
      label: `At least ${minLength} characters`,
      met: password.length >= minLength,
    },
    {
      label: "Contains uppercase letter (A-Z)",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter (a-z)",
      met: /[a-z]/.test(password),
    },
    {
      label: "Contains number (0-9)",
      met: /\d/.test(password),
    },
    {
      label: "Contains special character (!@#$%^&*)",
      met: /[^a-zA-Z0-9]/.test(password),
    },
  ];
}

export { calculatePasswordStrength, getPasswordRequirements };