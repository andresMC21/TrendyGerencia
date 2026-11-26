/** Etiqueta amarilla de precio que cuelga de las tarjetas (prototipo). */
export function PriceTag({ price, className = 'tag', big = false }: { price: number | null | undefined; className?: string; big?: boolean }) {
  const p = price === null || price === undefined ? null : Number(price);
  let main = '$—';
  let sub = '';
  let size = 14;
  if (p !== null && !Number.isNaN(p)) {
    if (p === 0) { main = 'Gratis'; size = 11; }
    else if (p >= 1_000_000) { main = `$${(p / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })}`; sub = 'MILL.'; }
    else if (p >= 1000) { main = `$${Math.round(p / 1000)}`; sub = 'MIL'; }
    else { main = `$${p}`; }
  }
  if (main.length > 5) size = 11;
  return (
    <svg className={className} width={big ? 74 : 50} height={big ? 114 : 78} viewBox="0 0 58 92" aria-hidden="true">
      <path d="M29 0 L29 22" stroke="currentColor" style={{ color: 'var(--ink)' }} strokeWidth="1.5" />
      <path d="M8 30 L29 18 L50 30 L50 88 L8 88 Z" fill="#FCBF49" stroke="#003049" strokeWidth="2" />
      <circle cx="29" cy="30" r="4" fill="#fff" stroke="#003049" strokeWidth="1.5" />
      <text x="29" y="60" textAnchor="middle" fontFamily="Young Serif, serif" fontSize={size} fill="#003049">{main}</text>
      <text x="29" y="76" textAnchor="middle" fontFamily="Schibsted Grotesk" fontSize="9" fontWeight="700" fill="#003049">{sub}</text>
    </svg>
  );
}

export const Heart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>
);
