import { useRef, useState, type CSSProperties } from 'react';

type Props = { on: boolean; onToggle: () => void; label: string; controls?: string; large?: boolean; disabled?: boolean };

/** A real pull gesture, with the same action available by click, Enter, or Space. */
export function PullLamp({ on, onToggle, label, controls, large = false, disabled = false }: Props) {
  const [pull, setPull] = useState(0);
  const start = useRef<number | null>(null);
  const distance = useRef(0);
  const lastDrag = useRef(0);
  const reset = () => { start.current = null; distance.current = 0; setPull(0); };
  return (
    <button type="button" className={`pull-lamp${on ? ' is-lit' : ''}${large ? ' pull-lamp--large' : ''}`}
      aria-label={label} aria-pressed={on} aria-controls={controls} title={label} disabled={disabled}
      style={{ '--pull': `${pull}px` } as CSSProperties}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        start.current = event.clientY;
        distance.current = 0;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (start.current === null) return;
        distance.current = Math.min(64, Math.max(0, event.clientY - start.current));
        setPull(distance.current);
      }}
      onPointerUp={(event) => {
        if (start.current === null) return;
        if (distance.current >= 18) { lastDrag.current = Date.now(); onToggle(); }
        reset();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={reset} onLostPointerCapture={reset}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (!event.repeat) onToggle();
        }
      }}
      onClick={(event) => { if (event.detail === 0 || Date.now() - lastDrag.current > 400) onToggle(); }}>
      <svg className="lamp-drawing" viewBox="0 0 100 110" aria-hidden="true">
        <path className="lamp-beam" d="M24 55 4 108h92L76 55Z" />
        <path className="lamp-stem" d="M50 2v20" />
        <path className="lamp-shade" d="M33 22h34l16 34H17Z" />
        <ellipse className="lamp-bulb" cx="50" cy="56" rx="26" ry="5" />
      </svg>
      <span className="lamp-cord" aria-hidden="true"><span /></span>
    </button>
  );
}
