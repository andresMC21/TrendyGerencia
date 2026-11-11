import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { TransactionStatus } from '../lib/api';
export function TransactionSteps({ status, celebrate = false }: { status: TransactionStatus; celebrate?: boolean }) {
 const previous = useRef(status);
 const [confetti, setConfetti] = useState(false);
 useEffect(() => {
   const completed = previous.current !== 'COMPLETED' && status === 'COMPLETED';
   previous.current = status;
   if (!celebrate || !completed || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
   setConfetti(true);
   const timer = window.setTimeout(() => setConfetti(false), 1400);
   return () => window.clearTimeout(timer);
 }, [status, celebrate]);
 const cancelled = status === 'CANCELLED';
 const current = status === 'COMPLETED' ? 2 : status === 'AGREED_POINT' ? 1 : 0;
 return <div className="transaction-steps"><div className="steps-track" aria-hidden="true"><i style={{ transform: `scaleX(${current / 2})` }} /></div><ol aria-label="Estado de la transacci?n">{['Pendiente', 'Punto acordado', cancelled ? 'Cancelada' : 'Completada'].map((label, i) => <li key={label} className={i <= current && !cancelled ? 'is-reached' : ''} aria-current={(cancelled ? i === 2 : i === current) ? 'step' : undefined}><span aria-hidden="true">{i === 2 && status === 'COMPLETED' ? <svg className="completion-check" viewBox="0 0 24 24"><path d="m5 12 4 4 10-10" /></svg> : cancelled && i === 2 ? '?' : i + 1}</span>{label}</li>)}</ol>{confetti && <div className="tx-confetti" aria-hidden="true">{Array.from({length: 18}, (_, i) => <i key={i} style={{ '--dx': `${(i % 9 - 4) * 26}px`, '--dy': `${-50 - (i % 5) * 22}px`, '--turn': `${i * 83}deg` } as CSSProperties} />)}</div>}</div>;
}
