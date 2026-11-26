export type ToastAction = { label: string; run: () => void };
export function notify(message: string, action?: ToastAction) {
  window.dispatchEvent(new CustomEvent('trendy:toast', { detail: { message, action } }));
}
