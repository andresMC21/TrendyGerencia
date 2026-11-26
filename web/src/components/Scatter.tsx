import { useEffect, useRef } from 'react';

const ICONS = ['camara', 'planta', 'libros', 'audifonos', 'guitarra', 'lampara', 'chaqueta', 'zapatos', 'silla', 'bici'];

/**
 * Objetos tenues de fondo (prototipo de Publicar/Editar): se reparten en el espacio
 * libre a la derecha del formulario, sin tocar ninguna tarjeta.
 */
export function Scatter({ deps = [] }: { deps?: unknown[] }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    const sec = el?.parentElement;
    if (!el || !sec) return;
    const place = () => {
      el.innerHTML = '';
      const R0 = sec.getBoundingClientRect();
      const W = R0.width;
      const H = sec.scrollHeight;
      const pad = 18;
      const obs = Array.from(sec.querySelectorAll<HTMLElement>('.ficha,.prev .lbl,.prev .card,.prev .box,.back'))
        .filter((e) => e.offsetParent)
        .map((e) => { const r = e.getBoundingClientRect(); return { x: r.left - R0.left - pad, y: r.top - R0.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 }; });
      const f = sec.querySelector<HTMLElement>('.ficha');
      if (f && f.offsetParent && W >= 900) { const r = f.getBoundingClientRect(); obs.push({ x: -1e4, y: -1e4, w: r.right - R0.left + pad + 1e4, h: 2e5 }); }
      let seed = 7;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const hit = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      const put: { x: number; y: number; w: number; h: number }[] = [];
      const imgs: HTMLImageElement[] = [];
      const G = W < 700 ? 70 : 78;
      let k = 0;
      for (let t = 0; t < 4000; t++) {
        const ic = ICONS[k % ICONS.length];
        const w = ic === 'bici' ? 80 : 32 + Math.floor(rnd() * 16);
        const h = w * (ic === 'bici' ? 0.6 : 1);
        const r = { x: 8 + rnd() * (W - w - 16), y: 8 + rnd() * (H - h - 20), w, h };
        if (obs.some((o) => hit(r, o)) || put.some((o) => hit({ x: r.x - G, y: r.y - G, w: r.w + G * 2, h: r.h + G * 2 }, o))) continue;
        put.push(r);
        k++;
        const im = new Image();
        im.src = `/img/${ic}.webp`;
        im.alt = '';
        im.style.cssText = `left:${r.x}px;top:${r.y}px;width:${w}px;transform:rotate(${Math.round(rnd() * 24 - 12)}deg)`;
        el.appendChild(im);
        imgs.push(im);
      }
      // El último de abajo sube un poco y busca el lugar más alejado de los demás.
      let i = -1, m = -1;
      put.forEach((r, j) => { if (r.y + r.h > m) { m = r.y + r.h; i = j; } });
      if (i >= 0) {
        const r = put[i];
        const ny = Math.min(r.y, H - r.h - 90);
        let best: number | null = null, bd = -1;
        for (let x = 8; x < W - r.w - 8; x += 12) {
          const c = { ...r, x, y: ny };
          if (obs.some((o) => hit(c, o))) continue;
          const d = Math.min(...put.filter((_, j) => j !== i).map((o) => Math.hypot(o.x + o.w / 2 - x - r.w / 2, o.y + o.h / 2 - ny - r.h / 2)));
          if (d > bd) { bd = d; best = x; }
        }
        if (best !== null) { r.x = best; r.y = ny; imgs[i].style.left = `${best}px`; imgs[i].style.top = `${ny}px`; }
        const near = new Set(put.map((o, j) => (j !== i && Math.hypot(o.x + o.w / 2 - r.x - r.w / 2, o.y + o.h / 2 - r.y - r.h / 2) < 320 ? imgs[j].src.split('/').pop()!.replace('.webp', '') : null)));
        const alt = ['planta', 'libros', 'camara', 'lampara', 'silla', 'chaqueta', 'guitarra', 'zapatos'].find((n) => !near.has(n));
        if (alt) { imgs[i].src = `/img/${alt}.webp`; imgs[i].style.width = `${Math.min(r.w, 46)}px`; }
      }
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(place));
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(t); t = setTimeout(place, 150); };
    window.addEventListener('resize', onResize);
    const late = setTimeout(place, 400);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); clearTimeout(late); window.removeEventListener('resize', onResize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <div className="scatter" ref={box} aria-hidden="true" />;
}
