import { useEffect, useRef, useState } from 'react';
import type { ToastAction } from '../lib/toast';

/** Aviso flotante del prototipo: aparece abajo, se va solo y puede traer una acción (p. ej. Deshacer). */
export function Toast() {
  const [toast, setToast] = useState<{ message: string; action?: ToastAction; id: number } | null>(null);
  const [on, setOn] = useState(false);
  const sequence = useRef(0);
  useEffect(() => {
    const receive = (event: Event) => {
      const d = (event as CustomEvent<string | { message: string; action?: ToastAction }>).detail;
      const v = typeof d === 'string' ? { message: d } : d;
      setToast({ ...v, id: ++sequence.current });
      setOn(true);
    };
    window.addEventListener('trendy:toast', receive);
    return () => window.removeEventListener('trendy:toast', receive);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setOn(false), toast.action ? 5000 : 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);
  return (
    <div className={`toast${on ? ' on' : ''}`} role="status" aria-live="polite">
      {toast?.message}
      {toast?.action && on && (
        <button type="button" onClick={() => { toast.action?.run(); setOn(false); }}>{toast.action.label}</button>
      )}
    </div>
  );
}
