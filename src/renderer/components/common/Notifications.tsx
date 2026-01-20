import React, { createContext, useContext, useState, useCallback } from "react";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

// Utility hook for easy notification usage
export const useNotify = () => {
  const { addNotification } = useNotifications();

  return {
    success: (title: string, message: string, duration?: number) =>
      addNotification({ type: "success", title, message, duration }),
    error: (title: string, message: string, duration?: number) =>
      addNotification({ type: "error", title, message, duration }),
    warning: (title: string, message: string, duration?: number) =>
      addNotification({ type: "warning", title, message, duration }),
    info: (title: string, message: string, duration?: number) =>
      addNotification({ type: "info", title, message, duration }),
  };
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Date.now().toString();
      const fullNotification: Notification = { ...notification, id };

      setNotifications((prev) => [...prev, fullNotification]);

      if (fullNotification.duration && fullNotification.duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, fullNotification.duration);
      }
    },
    [removeNotification]
  );

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Toast notification component
export const ToastNotification: React.FC<Notification> = ({ type, title, message, duration }) => {
  const [isVisible, setIsVisible] = useState(true);

  React.useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  if (!isVisible) return null;

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  const typeStyles = {
    success: "bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-400/30 shadow-xl shadow-green-500/20",
    error: "bg-gradient-to-r from-red-500 to-red-600 border-2 border-red-400/30 shadow-xl shadow-red-500/20",
    warning: "bg-gradient-to-r from-amber-500 to-amber-600 border-2 border-amber-400/30 shadow-xl shadow-amber-500/20",
    info: "bg-gradient-to-r from-primary to-purple-600 border-2 border-primary/30 shadow-xl shadow-primary/20",
  };

  return (
    <div
      className={`
      fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-right duration-300
      ${typeStyles[type]} text-white px-5 py-4 rounded-xl flex items-start gap-3 hover:scale-105 transition-transform
      ${!duration ? "cursor-pointer" : ""}
    `}
    >
      <div className="text-xl font-bold">{icons[type]}</div>
      <div className="flex-1">
        <div className="font-bold text-base">{title}</div>
        <div className="text-sm opacity-95">{message}</div>
      </div>
      {duration && duration > 0 && (
        <button
          onClick={() => setIsVisible(false)}
          className="text-white/70 hover:text-white ml-2 text-xl leading-none hover:bg-white/20 rounded-lg p-1 transition-all"
        >
          ×
        </button>
      )}
    </div>
  );
};
