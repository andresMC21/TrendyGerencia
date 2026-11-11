import { useEffect, useRef, useState } from 'react';
export function notify(message: string) { window.dispatchEvent(new CustomEvent('trendy:toast', { detail: message })); }
export function Toast() {
 const [toast, setToast] = useState<{message: string; id: number} | null>(null);
 const sequence = useRef(0);
 useEffect(() => { const receive = (event: Event) => setToast({ message: (event as CustomEvent<string>).detail, id: ++sequence.current }); window.addEventListener('trendy:toast', receive); return () => window.removeEventListener('trendy:toast', receive); }, []);
 useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 3000); return () => window.clearTimeout(timer); }, [toast]);
 return <div className="toast-region" aria-live="polite" aria-atomic="true">{toast && <div key={toast.id} className="toast"><span>{toast.message}</span><button type="button" aria-label="Cerrar aviso" onClick={() => setToast(null)}>×</button></div>}</div>;
}
