// src/components/ui/Tooltip.tsx
import React, { 
  useState, 
  useEffect, 
  useRef, 
  useCallback,
  useMemo 
} from "react";
import { cn } from "../../lib/cn";
import { createPortal } from "react-dom";

export type TooltipPosition = 
  | "top" 
  | "bottom" 
  | "left" 
  | "right"
  | "top-start"
  | "top-end"
  | "bottom-start"
  | "bottom-end"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end";

export type TooltipTrigger = "hover" | "click" | "focus" | "manual";

export type TooltipVariant = 
  | "default"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "dark";

export interface TooltipProps {
  /** The content to show in the tooltip */
  content: React.ReactNode;
  
  /** The element that triggers the tooltip */
  children: React.ReactNode;
  
  /** Position of the tooltip relative to the trigger */
  position?: TooltipPosition;
  
  /** How the tooltip is triggered */
  trigger?: TooltipTrigger;
  
  /** Delay in milliseconds before showing the tooltip */
  delay?: number;
  
  /** Delay in milliseconds before hiding the tooltip */
  hideDelay?: number;
  
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  
  /** Maximum width of the tooltip */
  maxWidth?: number;
  
  /** Additional CSS class for the tooltip */
  className?: string;
  
  /** Additional CSS class for the tooltip content */
  contentClassName?: string;
  
  /** Tooltip variant for different styling */
  variant?: TooltipVariant;
  
  /** Whether to show an arrow/pointer */
  showArrow?: boolean;
  
  /** Whether the tooltip should close when clicking outside */
  closeOnClickOutside?: boolean;
  
  /** Whether the tooltip should close when pressing Escape */
  closeOnEsc?: boolean;
  
  /** Custom offset from the trigger element */
  offset?: number;
  
  /** Callback when tooltip is shown */
  onShow?: () => void;
  
  /** Callback when tooltip is hidden */
  onHide?: () => void;
  
  /** Whether to use a portal for rendering (default true for better z-index management) */
  usePortal?: boolean;
  
  /** Portal container element */
  portalContainer?: HTMLElement;
  
  /** Whether the tooltip is initially open */
  defaultOpen?: boolean;
  
  /** Whether the tooltip is controlled externally */
  open?: boolean;
  
  /** Callback for controlled open state */
  onOpenChange?: (open: boolean) => void;
  
  /** ID for accessibility */
  id?: string;
}

// Variant styles mapping
const variantStyles: Record<TooltipVariant, string> = {
  default: "bg-slate-900 text-white",
  info: "bg-blue-600 text-white",
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-600 text-white",
  error: "bg-red-600 text-white",
  dark: "bg-gray-900 text-white",
};

// Position offset calculations
const getPositionStyles = (
  position: TooltipPosition,
  triggerRect: DOMRect,
  offset: number,
  arrowSize: number = 8
): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  
  switch (position) {
    case "top":
      styles.left = triggerRect.left + triggerRect.width / 2 + scrollX;
      styles.top = triggerRect.top - offset + scrollY;
      styles.transform = "translateX(-50%) translateY(-100%)";
      break;
      
    case "top-start":
      styles.left = triggerRect.left + scrollX;
      styles.top = triggerRect.top - offset + scrollY;
      styles.transform = "translateY(-100%)";
      break;
      
    case "top-end":
      styles.left = triggerRect.right + scrollX;
      styles.top = triggerRect.top - offset + scrollY;
      styles.transform = "translateX(-100%) translateY(-100%)";
      break;
      
    case "bottom":
      styles.left = triggerRect.left + triggerRect.width / 2 + scrollX;
      styles.top = triggerRect.bottom + offset + scrollY;
      styles.transform = "translateX(-50%)";
      break;
      
    case "bottom-start":
      styles.left = triggerRect.left + scrollX;
      styles.top = triggerRect.bottom + offset + scrollY;
      styles.transform = "translateY(0)";
      break;
      
    case "bottom-end":
      styles.left = triggerRect.right + scrollX;
      styles.top = triggerRect.bottom + offset + scrollY;
      styles.transform = "translateX(-100%)";
      break;
      
    case "left":
      styles.left = triggerRect.left - offset + scrollX;
      styles.top = triggerRect.top + triggerRect.height / 2 + scrollY;
      styles.transform = "translateX(-100%) translateY(-50%)";
      break;
      
    case "left-start":
      styles.left = triggerRect.left - offset + scrollX;
      styles.top = triggerRect.top + scrollY;
      styles.transform = "translateX(-100%)";
      break;
      
    case "left-end":
      styles.left = triggerRect.left - offset + scrollX;
      styles.top = triggerRect.bottom + scrollY;
      styles.transform = "translateX(-100%) translateY(-100%)";
      break;
      
    case "right":
      styles.left = triggerRect.right + offset + scrollX;
      styles.top = triggerRect.top + triggerRect.height / 2 + scrollY;
      styles.transform = "translateY(-50%)";
      break;
      
    case "right-start":
      styles.left = triggerRect.right + offset + scrollX;
      styles.top = triggerRect.top + scrollY;
      break;
      
    case "right-end":
      styles.left = triggerRect.right + offset + scrollX;
      styles.top = triggerRect.bottom + scrollY;
      styles.transform = "translateY(-100%)";
      break;
  }
  
  return styles;
};

// Arrow position styles
const getArrowStyles = (position: TooltipPosition): { className: string; style: React.CSSProperties } => {
  const baseStyle = "absolute w-2 h-2 bg-inherit transform rotate-45";
  
  switch (position) {
    case "top":
    case "top-start":
    case "top-end":
      return {
        className: cn(baseStyle, "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"),
        style: {}
      };
      
    case "bottom":
    case "bottom-start":
    case "bottom-end":
      return {
        className: cn(baseStyle, "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"),
        style: {}
      };
      
    case "left":
    case "left-start":
    case "left-end":
      return {
        className: cn(baseStyle, "right-0 top-1/2 -translate-y-1/2 translate-x-1/2"),
        style: {}
      };
      
    case "right":
    case "right-start":
    case "right-end":
      return {
        className: cn(baseStyle, "left-0 top-1/2 -translate-y-1/2 -translate-x-1/2"),
        style: {}
      };
  }
};

/**
 * A customizable tooltip component with support for multiple positions, triggers, and variants.
 * Fully accessible with proper ARIA attributes and keyboard navigation.
 */
const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  trigger = "hover",
  delay = 100,
  hideDelay = 100,
  disabled = false,
  maxWidth = 200,
  className,
  contentClassName,
  variant = "default",
  showArrow = true,
  closeOnClickOutside = true,
  closeOnEsc = true,
  offset = 8,
  onShow,
  onHide,
  usePortal = true,
  portalContainer,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  id: propId,
}) => {
  // Generate a unique ID for accessibility
  const generatedId = useMemo(() => 
    propId || `tooltip-${Math.random().toString(36).substr(2, 9)}`,
    [propId]
  );
  
  // State
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Refs
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const clickOutsideHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  
  // Derived state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : isOpen;
  
  // Calculate position
  const [positionStyles, setPositionStyles] = useState<React.CSSProperties>({});
  const arrowStyles = getArrowStyles(position);
  
  // Update position when open changes
  useEffect(() => {
    if (open && triggerRef.current) {
      updatePosition();
      
      // Add resize listener
      const handleResize = () => updatePosition();
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleResize, true);
      
      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleResize, true);
      };
    }
  }, [open, position, offset]);
  
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const styles = getPositionStyles(position, triggerRect, offset);
    setPositionStyles(styles);
  }, [position, offset]);
  
  // Show tooltip
  const showTooltip = useCallback(() => {
    if (disabled) return;
    
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = undefined;
    }
    
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }
    
    showTimeoutRef.current = setTimeout(() => {
      if (!isControlled) {
        setIsOpen(true);
      }
      onOpenChange?.(true);
      setIsMounted(true);
      
      // Small delay for mount before showing
      setTimeout(() => {
        setIsVisible(true);
        onShow?.();
      }, 10);
      
      // Focus tooltip for accessibility
      setTimeout(() => {
        tooltipRef.current?.setAttribute("aria-hidden", "false");
      }, 50);
    }, delay);
  }, [disabled, delay, isControlled, onOpenChange, onShow]);
  
  // Hide tooltip
  const hideTooltip = useCallback(() => {
    // Clear any pending show timeout
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = undefined;
    }
    
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      
      // Wait for fade out animation
      setTimeout(() => {
        if (!isControlled) {
          setIsOpen(false);
        }
        onOpenChange?.(false);
        setIsMounted(false);
        onHide?.();
        
        // Return focus to trigger
        triggerRef.current?.focus();
      }, 150);
    }, hideDelay);
  }, [hideDelay, isControlled, onOpenChange, onHide]);
  
  // Toggle tooltip
  const toggleTooltip = useCallback(() => {
    if (open) {
      hideTooltip();
    } else {
      showTooltip();
    }
  }, [open, showTooltip, hideTooltip]);
  
  // Handle click outside
  useEffect(() => {
    if (!open || !closeOnClickOutside) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node) &&
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target as Node)
      ) {
        hideTooltip();
      }
    };
    
    clickOutsideHandlerRef.current = handleClickOutside;
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clickOutsideHandlerRef.current = null;
    };
  }, [open, closeOnClickOutside, hideTooltip]);
  
  // Handle Escape key
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hideTooltip();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, closeOnEsc, hideTooltip]);
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (clickOutsideHandlerRef.current) {
        document.removeEventListener("mousedown", clickOutsideHandlerRef.current);
      }
    };
  }, []);
  
  // Event handlers for trigger
  const handleMouseEnter = useCallback(() => {
    if (trigger === "hover") showTooltip();
  }, [trigger, showTooltip]);
  
  const handleMouseLeave = useCallback(() => {
    if (trigger === "hover") hideTooltip();
  }, [trigger, hideTooltip]);
  
  const handleFocus = useCallback(() => {
    if (trigger === "focus") showTooltip();
  }, [trigger, showTooltip]);
  
  const handleBlur = useCallback(() => {
    if (trigger === "focus") hideTooltip();
  }, [trigger, hideTooltip]);
  
  const handleClick = useCallback(() => {
    if (trigger === "click") toggleTooltip();
  }, [trigger, toggleTooltip]);
  
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (trigger === "click") toggleTooltip();
    }
    
    if (event.key === "Escape" && open) {
      hideTooltip();
    }
  }, [trigger, toggleTooltip, open, hideTooltip]);
  
  // Render tooltip content
  const renderTooltipContent = () => {
    if (!isMounted) return null;
    
    const tooltipContent = (
      <div
        ref={tooltipRef}
        id={generatedId}
        role="tooltip"
        aria-hidden={!isVisible}
        className={cn(
          "fixed z-[9999] pointer-events-none",
          "transition-all duration-150 ease-out",
          isVisible 
            ? "opacity-100 scale-100" 
            : "opacity-0 scale-95",
          className
        )}
        style={{
          ...positionStyles,
          maxWidth: `${maxWidth}px`,
        }}
      >
        <div
          className={cn(
            "relative rounded-lg px-3 py-2 text-sm font-normal",
            "shadow-lg ring-1 ring-black/5",
            variantStyles[variant],
            contentClassName
          )}
        >
          {content}
          {showArrow && (
            <div
              className={arrowStyles.className}
              style={arrowStyles.style}
            />
          )}
        </div>
      </div>
    );
    
    if (usePortal) {
      const container = portalContainer || document.body;
      return createPortal(tooltipContent, container);
    }
    
    return tooltipContent;
  };
  
  // Clone trigger element to add props
  const triggerElement = (
    <div
      ref={triggerRef}
      className="inline-flex"
      aria-describedby={open ? generatedId : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={trigger === "focus" || trigger === "click" ? 0 : undefined}
      role={trigger === "click" ? "button" : undefined}
      aria-expanded={trigger === "click" ? open : undefined}
      aria-haspopup={trigger === "click" ? "dialog" : undefined}
    >
      {children}
    </div>
  );
  
  return (
    <>
      {triggerElement}
      {renderTooltipContent()}
    </>
  );
};

// Helper component for simple usage
export interface SimpleTooltipProps extends Omit<TooltipProps, 'children'> {
  children: React.ReactNode;
}

export const SimpleTooltip: React.FC<SimpleTooltipProps> = (props) => (
  <Tooltip {...props} />
);

// Hook for using tooltip programmatically
export function useTooltip({
  position = "top",
  variant = "default",
  delay = 100,
  hideDelay = 100,
  showArrow = true,
  offset = 8,
}: Partial<TooltipProps> = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  
  const show = useCallback((content: React.ReactNode, target: HTMLElement) => {
    setContent(content);
    setTargetRect(target.getBoundingClientRect());
    setIsOpen(true);
  }, []);
  
  const hide = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  const TooltipRenderer = useCallback(() => {
    if (!isOpen || !targetRect) return null;
    
    const positionStyles = getPositionStyles(position, targetRect, offset);
    const arrowStyles = getArrowStyles(position);
    
    return createPortal(
      <div
        className={cn(
          "fixed z-[9999]",
          "animate-in fade-in duration-200"
        )}
        style={positionStyles}
      >
        <div
          className={cn(
            "relative rounded-lg px-3 py-2 text-sm font-normal",
            "shadow-lg ring-1 ring-black/5",
            variantStyles[variant]
          )}
          style={{ maxWidth: 200 }}
        >
          {content}
          {showArrow && (
            <div
              className={arrowStyles.className}
              style={arrowStyles.style}
            />
          )}
        </div>
      </div>,
      document.body
    );
  }, [isOpen, targetRect, position, variant, offset, showArrow, content]);
  
  return {
    show,
    hide,
    isOpen,
    TooltipRenderer,
  };
}

export default Tooltip;