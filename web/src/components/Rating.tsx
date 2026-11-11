import { useEffect, useId, useRef, useState } from 'react';
export function Rating({ value, count }: { value: number; count: number }) {
 const rating = Math.max(0, Math.min(5, value));
 const [display, setDisplay] = useState(0);
 const ref = useRef<HTMLSpanElement>(null);
 const id = useId().replace(/:/g, '');
 useEffect(() => {
   let frame = 0;
   const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
   const show = () => { cancelAnimationFrame(frame); setDisplay(rating); };
   reduced.addEventListener('change', show);
   const observer = new IntersectionObserver(entries => {
     if (!entries.some(entry => entry.isIntersecting)) return;
     observer.disconnect();
     if (reduced.matches) { show(); return; }
     const start = performance.now();
     const tick = (now: number) => { const progress = Math.min(1, (now - start) / 750); setDisplay(rating * (1 - (1 - progress) ** 3)); if (progress < 1) frame = requestAnimationFrame(tick); };
     frame = requestAnimationFrame(tick);
   });
   if (ref.current) observer.observe(ref.current);
   return () => { observer.disconnect(); cancelAnimationFrame(frame); reduced.removeEventListener('change', show); };
 }, [rating]);
 return <span ref={ref} className="rating" role="img" aria-label={`${rating.toFixed(1)} de 5 estrellas · ${count} ${count === 1 ? 'reseña' : 'reseñas'}`}><span className="rating-stars" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <svg key={i} viewBox="0 0 24 24"><defs><clipPath id={`${id}-${i}`}><rect width={24 * Math.max(0, Math.min(1, rating - i))} height="24" /></clipPath></defs><path className="star-base" d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z" /><path clipPath={`url(#${id}-${i})`} d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z" /></svg>)}</span><span aria-hidden="true">{display.toFixed(1)} · {count} {count === 1 ? 'reseña' : 'reseñas'}</span></span>;
}
