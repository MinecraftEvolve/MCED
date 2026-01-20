/**
 * Notification utility to replace all alert() calls
 * Provides consistent, themed notifications instead of browser alerts
 */
import { useNotify } from "../components/common/Notifications";

/**
 * Show success notification
 */
export const notifySuccess = (title: string, message: string, duration?: number) => {
  const { success } = useNotify();
  success(title, message, duration);
};

/**
 * Show error notification
 */
export const notifyError = (title: string, message: string, duration?: number) => {
  const { error } = useNotify();
  error(title, message, duration);
};

/**
 * Show warning notification
 */
export const notifyWarning = (title: string, message: string, duration?: number) => {
  const { warning } = useNotify();
  warning(title, message, duration);
};

/**
 * Show info notification
 */
export const notifyInfo = (title: string, message: string, duration?: number) => {
  const { info } = useNotify();
  info(title, message, duration);
};

/**
 * Simple alert replacement for quick messages
 */
export const notify = (title: string, message: string, duration = 3000) => {
  notifyInfo(title, message, duration);
};
