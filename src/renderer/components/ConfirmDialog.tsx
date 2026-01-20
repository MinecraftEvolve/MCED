import React from "react";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
  icon,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          iconBg: "bg-red-500/10 border-2 border-red-500/20 rounded-2xl",
          iconColor: "text-red-500",
          titleColor: "text-red-500",
          buttonBg:
            "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/20 rounded-xl",
        };
      case "warning":
        return {
          iconBg: "bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl",
          iconColor: "text-amber-500",
          titleColor: "text-amber-500",
          buttonBg:
            "bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/20 rounded-xl",
        };
      case "success":
        return {
          iconBg: "bg-green-500/10 border-2 border-green-500/20 rounded-2xl",
          iconColor: "text-green-500",
          titleColor: "text-green-500",
          buttonBg:
            "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/20 rounded-xl",
        };
      case "info":
      default:
        return {
          iconBg: "bg-primary/10 border-2 border-primary/20 rounded-2xl",
          iconColor: "text-primary",
          titleColor: "text-primary",
          buttonBg:
            "bg-gradient-to-br from-primary to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-primary/20 rounded-xl",
        };
    }
  };

  const getDefaultIcon = () => {
    switch (type) {
      case "danger":
        return <XCircle size={32} />;
      case "warning":
        return <AlertTriangle size={32} />;
      case "success":
        return <CheckCircle size={32} />;
      case "info":
      default:
        return <Info size={32} />;
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[10001] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-card border-2 border-primary/30 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-20 h-20 ${styles.iconBg} shadow-lg flex items-center justify-center mb-6 ${styles.iconColor}`}
          >
            {icon || getDefaultIcon()}
          </div>
          <h3 className={`text-2xl font-bold mb-3 ${styles.titleColor}`}>{title}</h3>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{message}</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-all font-semibold border-2 border-border hover:border-primary/30 hover:scale-105"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-5 py-3 text-white transition-all font-semibold hover:scale-105 ${styles.buttonBg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToastProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
}

export function Toast({ isOpen, onClose, message, type = "info", duration = 3000 }: ToastProps) {
  React.useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-500/90 text-white border-green-600";
      case "error":
        return "bg-red-500/90 text-white border-red-600";
      case "info":
      default:
        return "bg-blue-500/90 text-white border-blue-600";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} />;
      case "error":
        return <XCircle size={20} />;
      case "info":
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[10002] animate-in slide-in-from-top-2 duration-300">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border ${getTypeStyles()} min-w-[300px]`}
      >
        {getIcon()}
        <span className="flex-1 font-medium">{message}</span>
        <button onClick={onClose} className="hover:bg-white/20 rounded p-1 transition-colors">
          <XCircle size={16} />
        </button>
      </div>
    </div>
  );
}
