import React from "react";
import { cn } from "../../lib/cn";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "outline";

type BadgeSize = "sm" | "md" | "lg";

export type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  variant?: BadgeVariant;
  size?: BadgeSize; // ✅ FIX: supports size="sm"
};

export default function Badge({
  children,
  className,
  variant = "default",
  size = "md",
}: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full font-medium border";

  const sizes: Record<BadgeSize, string> = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  const variants: Record<BadgeVariant, string> = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    outline: "bg-white text-slate-700 border-slate-300",
  };

  return (
    <span className={cn(base, sizes[size], variants[variant], className)}>
      {children}
    </span>
  );
}
