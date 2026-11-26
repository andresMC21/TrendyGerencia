import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { SAFE_POINTS } from '../lib/safePoints';
import { MAP_COMPASS, MAP_DEFS, MAP_LAYERS } from './mapLayers';

/** Posición de cada punto seguro sobre el mapa dibujado (viewBox 600 × 560). */
const POS: Record<string, [number, number, string]> = {
  'cai-granada': [282, 132, 'CAI Granada'],
  'cc-chipichape': [318, 58, 'Chipichape'],
  'cai-san-fernando': [312, 300, 'CAI San Fernando'],
  'cai-ciudad-jardin': [395, 430, 'CAI Ciudad Jardín'],
  'estacion-mio-universidades': [262, 480, 'MIO Universidades'],
};
const BASE = { x: 0, y: 0, w: 600, h: 560 };

/**
 * Mapa de Cali del prototipo con los puntos seguros: se puede acercar, alejar,
 * arrastrar y hacer zoom con la rueda; al elegir un punto lo enfoca.
 */
export function SafeMap({ value, onPick, readOnly = false }: { value: string; onPick?: (id: string) => void; readOnly?: boolean }) {
  const svg = useRef<SVGSVGElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [vb, setVb] = useState(BASE);
  const [ease, setEase] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; id: string } | null>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const animate = (next: typeof BASE) => { setEase(true); setVb(next); window.setTimeout(() => setEase(false), 450); };
  const zoom = (f: number, cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2, smooth = true) => {
    const w = Math.min(600, Math.max(180, vb.w * f));
    const h = (w * 560) / 600;
    const next = { x: cx - ((cx - vb.x) * w) / vb.w, y: cy - ((cy - vb.y) * h) / vb.h, w, h };
    if (smooth) animate(next); else setVb(next);
  };
  useEffect(() => {
    const p = POS[value];
    if (!p) return;
    setVb((cur) => {
      const w = Math.min(cur.w, 360);
      const h = (w * 560) / 600;
      return { x: p[0] - w / 2, y: p[1] - h / 2, w, h };
    });
    setEase(true);
    const t = window.setTimeout(() => setEase(false), 450);
    return () => window.clearTimeout(t);
  }, [value]);
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      setVb((cur) => {
        const f = e.deltaY > 0 ? 1.12 : 0.89;
        const cx = cur.x + ((e.clientX - r.left) / r.width) * cur.w;
        const cy = cur.y + ((e.clientY - r.top) / r.height) * cur.h;
        const w = Math.min(600, Math.max(180, cur.w * f));
        const h = (w * 560) / 600;
        return { x: cx - ((cx - cur.x) * w) / cur.w, y: cy - ((cy - cur.y) * h) / cur.h, w, h };
      });
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);

  const k = (vb.w / 600).toFixed(3);
  return (
    <div className={`mapbox${drag.current ? ' grab' : ''}`} ref={box}>
      <svg
        ref={svg}
        id="map"
        className={ease ? 'ease' : undefined}
        viewBox={`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`}
        role="img"
        aria-label="Mapa de Cali con los puntos seguros"
        onPointerDown={(e) => { if ((e.target as Element).closest('.pin')) return; drag.current = { x: e.clientX, y: e.clientY, vx: vb.x, vy: vb.y }; svg.current?.setPointerCapture(e.pointerId); box.current?.classList.add('grab'); }}
        onPointerMove={(e) => { const d = drag.current; if (!d || !svg.current) return; const r = svg.current.getBoundingClientRect(); const kk = vb.w / r.width; setVb((c) => ({ ...c, x: d.vx - (e.clientX - d.x) * kk, y: d.vy - (e.clientY - d.y) * kk })); }}
        onPointerUp={() => { drag.current = null; box.current?.classList.remove('grab'); }}
      >
        <defs dangerouslySetInnerHTML={{ __html: MAP_DEFS.replace(/^<defs>|<\/defs>$/g, '') }} />
        <g>
          <g dangerouslySetInnerHTML={{ __html: MAP_LAYERS }} />
          <g>
            {SAFE_POINTS.map((sp) => {
              const p = POS[sp.id];
              if (!p) return null;
              return (
                <g key={sp.id} className={`pin${value === sp.id ? ' on' : ''}`} transform={`translate(${p[0]} ${p[1]})`} style={{ '--k': k } as CSSProperties}
                  tabIndex={readOnly ? -1 : 0} role="button" aria-label={sp.name}
                  onClick={() => !readOnly && onPick?.(sp.id)}
                  onKeyDown={(e) => { if (!readOnly && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPick?.(sp.id); } }}
                  onMouseEnter={(e) => { const r = (e.currentTarget as Element).getBoundingClientRect(); const b = box.current!.getBoundingClientRect(); setTip({ x: r.left - b.left + r.width / 2, y: r.top - b.top, id: sp.id }); }}
                  onMouseLeave={() => setTip(null)}>
                  <circle className="halo" r="16" />
                  <path d="M0 0 C-9 -10 -9 -22 0 -24 C9 -22 9 -10 0 0Z" className="drop" />
                  <circle cy="-15" r="3.5" className="hole" />
                  <text y="16" className="plab">{p[2]}</text>
                </g>
              );
            })}
          </g>
        </g>
        <g dangerouslySetInnerHTML={{ __html: MAP_COMPASS }} />
      </svg>
      <div className="mapctl">
        <button type="button" aria-label="Acercar" onClick={() => zoom(0.7)}>+</button>
        <button type="button" aria-label="Alejar" onClick={() => zoom(1 / 0.7)}>−</button>
        <button type="button" aria-label="Ver todo" onClick={() => animate(BASE)}>⤢</button>
      </div>
      {tip && (() => { const sp = SAFE_POINTS.find((s) => s.id === tip.id)!; return <div className="maptip" style={{ left: tip.x, top: tip.y }}><b>{sp.name}</b><small>{sp.address}</small></div>; })()}
    </div>
  );
}
