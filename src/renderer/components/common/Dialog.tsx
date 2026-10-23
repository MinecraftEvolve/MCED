import React, { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    full: "max-w-[95vw]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <div
        className={`relative flex w-full max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-2xl shadow-black/30 ${sizeClasses[size]}`}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/20 bg-card/80 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-foreground"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "info",
}) => {
  if (!isOpen) return null;

  const variantClasses = {
    danger: "bg-red-600 hover:bg-red-500 text-white",
    warning: "bg-amber-500 hover:bg-amber-400 text-white",
    info: "bg-primary hover:bg-primary/90 text-primary-foreground",
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} size="sm" closeOnBackdrop={false}>
      <div className="p-6">
        <p className="mb-6 text-foreground">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-primary/20 bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-secondary/80"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-lg shadow-black/10 transition-colors duration-200 ${variantClasses[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Dialog>
  );
};
