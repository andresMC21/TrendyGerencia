import type { CSSProperties } from 'react';

/** Estante de la vitrina con objetos dibujados. */
export function Shelf({ items }: { items: [string, number, number, number][] }) {
  return (
    <div className="shelf" aria-hidden="true">
      <div className="plank" />
      {items.map(([f, l, w, r]) => (
        <img key={f + l} src={`/img/${f}.webp`} alt="" style={{ left: `${l}%`, width: w, '--r': `${r}deg` } as CSSProperties} />
      ))}
    </div>
  );
}
