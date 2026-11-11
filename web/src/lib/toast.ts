export function notify(message: string) { window.dispatchEvent(new CustomEvent('trendy:toast', { detail: message })); }
