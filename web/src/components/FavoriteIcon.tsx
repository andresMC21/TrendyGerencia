import { useState, type CSSProperties } from 'react';

export function FavoriteIcon({ active }: { active: boolean }) {
  const [previous, setPrevious] = useState(active);
  const [burst, setBurst] = useState(0);
  if (previous !== active) {
    setPrevious(active);
    if (active) setBurst(n => n + 1);
  }
  return (
    <span className={`favorite-icon${active ? ' is-active' : ''}${burst > 0 ? ' has-burst' : ''}`} aria-hidden="true">
      <svg key={burst} viewBox="0 0 24 24">
        <path d="M12 21 3.5 12.5C-3 5 6-1 12 6 18-1 27 5 20.5 12.5Z" />
        <path className="heart-fill" d="M12 21 3.5 12.5C-3 5 6-1 12 6 18-1 27 5 20.5 12.5Z" />
      </svg>
      {active && burst > 0 && <span key={`burst-${burst}`} className="heart-particles">
        {Array.from({ length: 7 }, (_, i) => <i key={i} style={{ '--angle': `${i * 360 / 7}deg` } as CSSProperties} />)}
      </span>}
    </span>
  );
}
