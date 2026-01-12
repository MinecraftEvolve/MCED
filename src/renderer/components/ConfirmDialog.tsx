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
          iconBg: "bg-red-500/10 border-red-500/20",
          iconColor: "text-red-500",
          titleColor: "text-red-500",
          buttonBg: "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/20",
        };
      case "warning":
        return {
          iconBg: "bg-amber-500/10 border-amber-500/20",
          iconColor: "text-amber-500",
          titleColor: "text-amber-500",
          buttonBg: "bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/20",
        };
      case "success":
        return {
          iconBg: "bg-green-500/10 border-green-500/20",
          iconColor: "text-green-500",
          titleColor: "text-green-500",
          buttonBg: "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/20",
        };
      case "info":
      default:
        return {
          iconBg: "bg-blue-500/10 border-blue-500/20",
          iconColor: "text-blue-500",
          titleColor: "text-blue-500",
          buttonBg: "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20",
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10001]" 
      onClick={onClose}
    >
      <div 
        className="bg-background border border-border rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full ${styles.iconBg} border-2 flex items-center justify-center mb-4 ${styles.iconColor}`}>
            {icon || getDefaultIcon()}
          </div>
          <h3 className={`text-xl font-bold mb-2 ${styles.titleColor}`}>
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">{message}</p>
          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => { onConfirm(); onClose(); }} 
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-all font-medium ${styles.buttonBg}`}
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
      case "success": return "bg-green-500/90 text-white border-green-600";
      case "error": return "bg-red-500/90 text-white border-red-600";
      case "info": default: return "bg-blue-500/90 text-white border-blue-600";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success": return <CheckCircle size={20} />;
      case "error": return <XCircle size={20} />;
      case "info": default: return <Info size={20} />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[10002] animate-in slide-in-from-top-2 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border ${getTypeStyles()} min-w-[300px]`}>
        {getIcon()}
        <span className="flex-1 font-medium">{message}</span>
        <button 
          onClick={onClose} 
          className="hover:bg-white/20 rounded p-1 transition-colors"
        >
          <XCircle size={16} />
        </button>
      </div>
    </div>
  );
}
