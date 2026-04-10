// src/components/ui/Modal.tsx
import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/cn';
import { X } from 'lucide-react';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Callback when modal is closed */
  onClose: () => void;
  
  /** Modal title */
  title?: string;
  
  /** Modal content */
  children: React.ReactNode;
  
  /** Size of the modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /** Whether to show close button */
  showCloseButton?: boolean;
  
  /** Whether clicking outside closes the modal */
  closeOnOverlayClick?: boolean;
  
  /** Whether pressing Escape closes the modal */
  closeOnEsc?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Additional CSS classes for overlay */
  overlayClassName?: string;
  
  /** Additional CSS classes for content */
  contentClassName?: string;
  
  /** Whether to show overlay */
  showOverlay?: boolean;
  
  /** Whether modal is centered */
  centered?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className,
  overlayClassName,
  contentClassName,
  showOverlay = true,
  centered = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEsc, onClose]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (
      closeOnOverlayClick &&
      modalRef.current &&
      !modalRef.current.contains(event.target as Node) &&
      contentRef.current &&
      !contentRef.current.contains(event.target as Node)
    ) {
      onClose();
    }
  };

  // Focus trap for accessibility
  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements && focusableElements.length > 0) {
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      firstElement.focus();

      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      {showOverlay && (
        <div
          className={cn(
            'fixed inset-0 bg-black/50 transition-opacity',
            'animate-in fade-in duration-300',
            overlayClassName
          )}
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Modal container */}
      <div
        className={cn(
          'fixed inset-0 z-50 overflow-y-auto',
          centered && 'flex items-center justify-center min-h-screen px-4 py-8'
        )}
        onClick={closeOnOverlayClick ? handleOverlayClick : undefined}
      >
        <div
          ref={modalRef}
          className={cn(
            'relative bg-white rounded-2xl shadow-2xl mx-auto',
            'transform transition-all duration-300 ease-out',
            'animate-in fade-in-90 zoom-in-90',
            sizeClasses[size],
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              {title && (
                <h3
                  id="modal-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    'hover:bg-slate-100 active:bg-slate-200',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    !title && 'ml-auto'
                  )}
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div
            ref={contentRef}
            className={cn('p-6', contentClassName)}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Also export as default
export default Modal;

// Helper components for common modal patterns
export const ModalHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('mb-6', className)}>
    {children}
  </div>
);

export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('mb-6', className)}>
    {children}
  </div>
);

export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('flex justify-end gap-3 pt-6 border-t border-slate-200', className)}>
    {children}
  </div>
);

// Hook for managing modal state
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = React.useState(initialState);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}