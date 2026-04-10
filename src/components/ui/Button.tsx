import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
};

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", full, ...props }, ref) => {
    // If you already have .btn + .btn-primary + .btn-ghost in CSS,
    // we keep them. For new variants/sizes, we add tailwind fallback classes.

    const base = "btn";
    const sizeClass =
      size === "sm"
        ? "px-3 py-1.5 text-xs"
        : size === "lg"
        ? "px-5 py-2.5 text-base"
        : "px-4 py-2 text-sm";

    const variantClass =
      variant === "primary"
        ? "btn-primary"
        : variant === "ghost"
        ? "btn-ghost"
        : variant === "outline"
        ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        : "border border-red-600 bg-red-600 text-white hover:bg-red-700";

    return (
      <button
        ref={ref}
        className={cn(base, sizeClass, variantClass, full && "w-full", className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
