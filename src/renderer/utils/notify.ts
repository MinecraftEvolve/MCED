type NotifyFn = (type: "success" | "error" | "warning" | "info", title: string, message: string, duration?: number) => void;

let _notify: NotifyFn | null = null;

export function registerNotifyFn(fn: NotifyFn) {
  _notify = fn;
}

const fire = (type: Parameters<NotifyFn>[0], title: string, message: string, duration = 4000) =>
  _notify?.(type, title, message, duration);

export const notifySuccess = (title: string, message: string, duration?: number) => fire("success", title, message, duration);
export const notifyError   = (title: string, message: string, duration?: number) => fire("error",   title, message, duration);
export const notifyWarning = (title: string, message: string, duration?: number) => fire("warning", title, message, duration);
export const notifyInfo    = (title: string, message: string, duration?: number) => fire("info",    title, message, duration);
