// src/components/ui/LoadingSpinner.tsx
import { cn } from "../../lib/cn";

export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
export type SpinnerVariant = "primary" | "secondary" | "light" | "dark";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  className?: string;
  label?: string;
  fullScreen?: boolean;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: "w-4 h-4 border-2",
  sm: "w-6 h-6 border-2",
  md: "w-8 h-8 border-3",
  lg: "w-12 h-12 border-4",
  xl: "w-16 h-16 border-4",
};

const variantClasses: Record<SpinnerVariant, string> = {
  primary: "border-blue-600 border-t-transparent",
  secondary: "border-slate-600 border-t-transparent",
  light: "border-white border-t-transparent",
  dark: "border-slate-900 border-t-transparent",
};

export default function LoadingSpinner({
  size = "md",
  variant = "primary",
  className,
  label,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <>
      <div
        className={cn(
          "rounded-full animate-spin",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        role="status"
        aria-label={label || "Loading"}
      >
        <span className="sr-only">{label || "Loading..."}</span>
      </div>
      {label && (
        <span className="mt-2 text-sm text-slate-600">{label}</span>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center">
          {spinner}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {spinner}
    </div>
  );
}

// Alternative: Button Spinner (for use inside buttons)
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin",
        className
      )}
    />
  );
}

// Alternative: Page Loader
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <LoadingSpinner size="lg" variant="primary" />
        <p className="mt-4 text-slate-600">Loading, please wait...</p>
      </div>
    </div>
  );
}

// Alternative: Content Loader (for loading sections)
export function ContentLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="py-8 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="md" variant="primary" />
        {text && (
          <p className="mt-3 text-sm text-slate-500">{text}</p>
        )}
      </div>
    </div>
  );
}